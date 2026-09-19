# SPEC: Ciclo de Vida de uma Viagem Salva (SmartTrip)

**Documento:** `docs/specs/trip-lifecycle-spec.md`  
**Status:** Aprovado  
**Versão:** 1.0.0  
**Rastreabilidade:** [smarttrip-mestre.md](./smarttrip-mestre.md), [firestore-model.md](./firestore-model.md), [auth-spec.md](./auth-spec.md), [new-trip-journey-spec.md](./new-trip-journey-spec.md) e [itinerary-contract-spec.md](./itinerary-contract-spec.md)  
**Objetivo:** Especificar formalmente o ciclo de vida completo da entidade `Trip` no SmartTrip, cobrindo criação, máquina de estados, operações de leitura, edição, exclusão segura, favoritismo, duplicação, reabertura, controle de titularidade (*ownership*), carimbos temporais, evolução de dados externos com o tempo (*data staleness*), proteção estrita contra acesso cruzado (*anti-IDOR*) e critérios de aceite.

---

## 1. Visão Geral da Entidade `Trip`

Uma viagem (`Trip`) é o artefato central do SmartTrip. Ela agrega o destino normalizado, intervalo de datas, resumo meteorológico e o itinerário estruturado dia a dia (`itinerary`), composto por atividades ancoradas em evidências factuais e refinadas pela curadoria humana.

### 1.1. Localização e Identificação
- **Caminho Físico Firestore:** `/users/{userId}/trips/{tripId}`
- **ID da Viagem (`tripId`):** String alfanumérica única gerada na criação: `trip_${Date.now()}_${nanoId(6)}` (ex: `trip_1726750000_a8f9x2`).
- **Proprietário (`ownerId` / `userId`):** UID do usuário autenticado no Firebase Auth (`request.auth.uid`).

---

## 2. Máquina de Estados e Ciclo de Vida

Uma viagem transita por estados bem definidos durante seu ciclo de vida:

```text
                  ┌──────────────────────┐
                  │      (Criação)       │
                  └──────────┬───────────┘
                             │
                             v
                    ┌─────────────────┐
          ┌────────>│    rascunho     │
          │         └────────┬────────┘
          │                  │ (Completar dados)
          │                  v
          │         ┌─────────────────┐
          │         │  planejamento   │<────────────────┐
          │         └────────┬────────┘                 │
          │                  │ (Confirmar viagem)       │
          │                  v                          │
          │         ┌─────────────────┐                 │ (Reabrir)
          │         │   confirmada    │                 │
          │         └────────┬────────┘                 │
          │                  │ (Chegada da data)        │
          │                  v                          │
          │         ┌─────────────────┐                 │
          │         │  em_andamento   │                 │
          │         └────────┬────────┘                 │
          │                  │ (Passagem do endDate)    │
          │                  v                          │
          │         ┌─────────────────┐                 │
          │         │    concluida    ├─────────────────┤
          │         └────────┬────────┘                 │
          │                  │ (Arquivar)               │
          │                  v                          │
          │         ┌─────────────────┐                 │
          │         │    arquivada    ├─────────────────┘
          │         └────────┬────────┘
          │                  │ (Excluir)
          │                  v
          │         ┌─────────────────┐
          └─────────┤    excluida     │ (Soft Delete / Retenção 30d)
                    └─────────────────┘
```

### 2.1. Definição dos Status Possíveis

| Status | Nome Visual | Descrição | Regras e Permissões |
|---|---|---|---|
| `'rascunho'` | Rascunho | Viagem em fase de estruturação preliminar (dados mínimos salvos sem roteiro finalizado). | Permite edição irrestrita de destino, datas e atividades. Não gera lembretes de viagem. |
| `'planejamento'` | Em Planejamento | Roteiro estruturado pela IA, em fase de revisão, orçamento e curadoria humana. | Permite reordenar atividades, alterar hotéis e horários. Exibida com badge amarelo. |
| `'confirmada'` | Confirmada | Roteiro aprovado pelo usuário com datas fixadas e pronto para execução. | Exibida no card de destaque do Dashboard ("Próxima Viagem"). Permite ajustes pontuais. |
| `'em_andamento'` | Em Andamento | A data atual do usuário está entre a data inicial e final (`startDate <= today <= endDate`). | O app destaca o "Dia Atual" do roteiro e fixa atividades do período no topo. |
| `'concluida'` | Concluída | A data final da viagem já passou (`today > endDate`). | Roteiro congela em modo de consulta/memória. Permite reabrir ou duplicar. |
| `'arquivada'` | Arquivada | Viagem ocultada da listagem principal por decisão do viajante. | Não aparece no Dashboard nem na lista padrão de viagens ativas; acessível via filtro "Arquivadas". |
| `'excluida'` | Lixeira / Excluída | Marcada para exclusão (*soft delete* com carimbo `deletedAt`). | Oculta de todas as telas. Retida por 30 dias para recuperação acidental antes do *purge*. |

---

## 3. Operações do Ciclo de Vida

---

### 3.1. Criação (Create)
- **Origens Autorizadas:**
  1. Conclusão da jornada assistida "Nova Viagem" (Etapa 9 da SPEC UX).
  2. Salvamento manual de rascunho temporário.
  3. Ação de "Duplicar Viagem Existente".
- **Payload Mínimo Obrigatório:**
  - `id`: `string` único.
  - `userId`: `string` coincidente com `request.auth.uid`.
  - `destination`: Objeto com `name`, `country`, `latitude`, `longitude`.
  - `startDate`, `endDate`: Strings ISO (`YYYY-MM-DD`).
  - `totalDays`: Inteiro entre 1 e 7.
  - `status`: `'rascunho' | 'planejamento' | 'confirmada'`.
  - `isFavorite`: `false` (default).
  - `itinerary`: Array estruturado de dias (`DayPlan[]`).
  - `createdAt`: `serverTimestamp()`.
  - `updatedAt`: `serverTimestamp()`.
- **Invariante:** Nenhuma viagem pode ser persistida no banco com datas invertidas ou sem titularidade.

---

### 3.2. Leitura (Read)
- **Listagem Resumida (`/trips` e `/dashboard`):**
  - Consulta filtrada por `userId` com ordenação padrão:
    - Se houver viagens marcadas como favoritas (`isFavorite == true`), são exibidas no topo (*pinned*);
    - Em seguida, ordenadas por `startDate ASC` (viagens futuras mais próximas primeiro).
  - Filtros de UI disponíveis: *"Todas"*, *"Confirmadas"*, *"Planejamento"*, *"Concluídas"*, *"Arquivadas"*.
- **Leitura Detalhada (`/trips/[id]`):**
  - Recupera o documento completo da subcoleção `/users/{userId}/trips/{tripId}`.
  - O itinerário completo de até 7 dias é carregado de forma atômica no mesmo documento (latência reduzida em 97%).

---

### 3.3. Edição (Update)
- **Campos Editáveis:**
  - `status`: Atualização de ciclo de vida (`'confirmada'`, `'arquivada'`, etc.).
  - `isFavorite`: Toggle booleano rápido.
  - `title` / `notes`: Observações personalizadas.
  - `itinerary`:
    - Adição de nova atividade com horário e localização.
    - Alteração de horário (`time`), período (`period`), título e descrição.
    - Reordenação de atividades dentro do mesmo dia.
    - Exclusão de atividades individuais.
- **Campos Imutáveis:**
  - `id`, `userId`, `createdAt`.
- **Carimbo Obrigatório:** Toda mutação bem-sucedida atualiza `updatedAt: serverTimestamp()`.

---

### 3.4. Exclusão e Confirmação (Delete)
Para mitigar a perda catastrófica de roteiros gerados com esforço do usuário, a exclusão adota a estratégia de **Confirmação Clara com Retenção Provisória**:

1. **Gatilho de UI:** O usuário clica no ícone de lixeira no card ou na página de detalhes da viagem.
2. **Modal de Confirmação Obrigatória:**
   - Título: *"Excluir viagem para [Nome do Destino]?"*
   - Descrição: *"Esta ação removerá o roteiro e todas as atividades planejadas de [Data Início] a [Data Fim]."*
   - Ação de Proteção: Botão perigoso em vermelho *"Sim, Excluir Viagem"*, com foco padrão posicionado em *"Cancelar"*.
3. **Execução de Exclusão (Soft Delete com Purge Automático):**
   - O documento recebe `deletedAt: serverTimestamp()` e `status: 'excluida'`.
   - Um *toast* de feedback é emitido com botão de desfazer: *"Viagem excluída. [Desfazer]"* ativo por **6 segundos**.
   - Se o usuário clicar em "Desfazer", o campo `deletedAt` é removido e o status volta ao anterior.
   - Após o prazo de retenção (30 dias) ou em exclusão definitiva solicitada na lixeira, o documento é purgado definitivamente (*hard delete*).

---

### 3.5. Favorito (Bookmarking / Pinning)
- **Propósito:** Permitir que o viajante destaque roteiros prioritários ou de sonho no topo do painel.
- **Comportamento de Interface:**
  - Ícone de estrela / coração no canto superior do card da viagem.
  - **Atualização Otimista (*Optimistic UI*):** O ícone acende/apaga instantaneamente na tela; a requisição ao Firestore ocorre em segundo plano.
  - Em caso de falha de rede, o estado reverte com toast de erro.
  - Viagens com `isFavorite: true` são fixadas no topo da lista em `/trips`.

---

### 3.6. Duplicação (Clone / Fork)
- **Cenário de Uso:** O usuário já fez um roteiro excelente para Paris ou quer adaptar uma viagem passada para uma nova data com amigos.
- **Regras da Duplicação:**
  1. O sistema lê o documento original `/users/{userId}/trips/{sourceTripId}`.
  2. Gera um novo `tripId` exclusivo (`trip_${Date.now()}_...`).
  3. Mantém: destino, resumo, fotos e todas as atividades do itinerário.
  4. Reseta:
     - `status`: Definido como `'planejamento'`.
     - `isFavorite`: `false`.
     - `createdAt`: `serverTimestamp()` novo.
     - `updatedAt`: `serverTimestamp()` novo.
     - `clonedFromTripId`: ID da viagem original para rastreabilidade de linhagem.
  5. Período: Abre modal sugerindo novas datas de início e fim mantendo a mesma duração de dias.
  6. Redireciona o usuário para `/trips/[newTripId]` em modo de edição.

---

### 3.7. Reabertura de Viagens Concluídas ou Arquivadas
- Viagens com status `'concluida'` ou `'arquivada'` podem ser reabertas clicando em *"Reabrir Viagem para Edição"*.
- **Comportamento:**
  - O status é alterado para `'planejamento'`.
  - `updatedAt` é atualizado.
  - Permite que o viajante adicione novas fotos, atualize anotações de despesas reais ou reorganize os dias.

---

## 4. Relação com `itineraryItems` e Integridade Estrutural

Conforme decidido em [firestore-model.md](./firestore-model.md), o itinerário e suas atividades são armazenados de forma **embutida e atômica**:

```typescript
export interface TripDocument {
  id: string;
  userId: string;
  destination: {
    name: string;
    country: string;
    latitude: number;
    longitude: number;
  };
  imageUrl: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  totalDays: number; // 1 a 7
  status: 'rascunho' | 'planejamento' | 'confirmada' | 'em_andamento' | 'concluida' | 'arquivada' | 'excluida';
  isFavorite: boolean;
  weatherSummary?: {
    avgTempMax: number;
    avgTempMin: number;
    conditions: string;
    fetchedAt: string; // ISO String de quando o clima foi consultado
  };
  itinerary: Array<{
    dayNumber: number;
    date: string;
    theme: string;
    weatherObservation?: {
      condition: string;
      tempLabel: string;
      hasForecast: boolean;
    };
    activities: Array<{
      id: string;
      placeId: string;       // Grounding com POI real
      name: string;
      period: 'manha' | 'tarde' | 'noite';
      timeSlot: string;      // HH:MM
      rationale: string;     // Justificativa concisa
      curatorTip?: string;
    }>;
  }>;
  createdAt: any; // Firestore Timestamp
  updatedAt: any; // Firestore Timestamp
  deletedAt?: any; // Presente apenas em soft-delete
}
```

- **Garantia de Integridade:** Modificações em atividades individuais (adicionar, editar ou remover) são gravadas através de transações ou atualizações atômicas do array `itinerary`, eliminando o risco de atividades órfãs no banco de dados.

---

## 5. Comportamento Quando Dados Externos Envelhecerem (*Data Staleness*)

Roteiros de viagem são criados com semanas ou meses de antecedência. Os dados externos (clima, POIs e preços) possuem tempos de validade diferentes:

### 5.1. Envelhecimento Meteorológico (*Weather Staleness*)
1. **TTL da Previsão do Tempo:** A previsão meteorológica é volátil e tem validade útil máxima de **24 horas** para viagens iminentes, e é inexistente para viagens com mais de 14 dias de antecedência.
2. **Políticas por Janela Temporal:**
   - **Viagem Criada > 14 Dias Antes:** Salva com `hasForecast: false`. Quando faltarem 14 dias para a viagem, o SmartTrip exibe no detalhe da viagem um botão sutil:
     > *"🌤️ Previsão oficial disponível para as suas datas. [Atualizar Previsão]"*.
   - **Viagem com Clima Salvo > 48h:** Se o usuário abrir o roteiro e o carimbo `weatherSummary.fetchedAt` tiver mais de 48 horas, o app oferece atualização em background sem alterar as atividades já organizadas.
   - **Viagem Passada (`today > endDate`):** O clima é congelado permanentemente como registro histórico do dia da viagem; nenhuma consulta externa é disparada.

### 5.2. Envelhecimento de POIs e Atrações
1. Se uma atração turística mudar de nome ou fechar temporariamente no OpenStreetMap, o roteiro salvo **NUNCA quebra ou desaparece**.
2. O nome oficial e o `placeId` registrados no momento da criação permanecem como fatos imutáveis do roteiro do usuário.
3. Caso o usuário queira editar ou adicionar novas atrações, o `poiService` executa uma busca fresca no momento da edição.

---

## 6. Prevenção de Acesso Cruzado (*Anti-IDOR & Zero Cross-Access*)

A segurança dos roteiros de viagem deve ser inviolável. Um usuário mal-intencionado NUNCA poderá ler, alterar ou excluir viagens de outro viajante, mesmo que conheça o `tripId` alvo.

### 6.1. Defesa em Profundidade em 3 Camadas

#### Camada 1: Isolamento Físico de Caminho no Firestore (Subcoleções)
O caminho do documento é semanticamente atrelado ao usuário:
`/users/{userId}/trips/{tripId}`
Um atacante autenticado com UID `usr_hacker` requisitando `/users/usr_vitima/trips/trip_123` é barrado na raiz da subcoleção pelo Firestore.

#### Camada 2: Regras de Segurança Declarativas do Firestore (*Security Rules*)
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Regra estrita de propriedade na subcoleção trips
    match /users/{userId}/trips/{tripId} {
      
      // Leitura permitida estritamente ao dono autenticado
      allow read: if request.auth != null && request.auth.uid == userId;
      
      // Criação: exige que o auth seja o dono e que o campo userId corresponda
      allow create: if request.auth != null 
                    && request.auth.uid == userId
                    && request.resource.data.userId == userId
                    && request.resource.data.totalDays >= 1
                    && request.resource.data.totalDays <= 7;
      
      // Atualização: apenas o dono, impedindo alteração de userId ou id
      allow update: if request.auth != null 
                    && request.auth.uid == userId
                    && request.resource.data.userId == userId
                    && request.resource.data.id == resource.data.id;
      
      // Exclusão: estritamente o dono
      allow delete: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

#### Camada 3: Sanitização de Cache Local e Storage do Navegador
1. Chaves de cache local e rascunhos em `sessionStorage` e `localStorage` devem ser prefixadas com o UID do usuário ativo:
   `smarttrip_${auth.currentUser.uid}_draft`
2. Ao executar logout (`signOutUser()`), todos os dados em memória e rascunhos locais daquele UID são limpos imediatamente, impedindo que outro usuário no mesmo computador acesse dados residuais.

---

## 7. Critérios de Aceite (Acceptance Criteria)

| ID | Regra | Critério de Aceite |
|---|---|---|
| **CA-TRIP-01** | **Criação com Metadados Completos** | Viagem criada com ID único, `userId` autenticado, status inicial, `isFavorite: false` e timestamps do servidor. |
| **CA-TRIP-02** | **Transições de Status Válidas** | Status transita corretamente conforme máquina de estados (`rascunho` ➔ `planejamento` ➔ `confirmada` ➔ `em_andamento` ➔ `concluida`). |
| **CA-TRIP-03** | **Status Dinâmico Temporal** | Se `startDate <= hoje <= endDate`, a viagem assume automaticamente o badge e tratamento de `em_andamento`. |
| **CA-TRIP-04** | **Edição Editorial Preservando IDs** | Alteração de horários ou títulos atualiza `updatedAt` sem alterar o `placeId` de grounding original. |
| **CA-TRIP-05** | **Exclusão Segura com Confirmação** | Modal de confirmação explícito; acionamento do soft-delete e emissão de toast com botão de "Desfazer" por 6 segundos. |
| **CA-TRIP-06** | **Pinning / Favoritos no Topo** | Viagens marcadas com `isFavorite: true` são fixadas no topo das listagens em `/trips` e `/dashboard`. |
| **CA-TRIP-07** | **Duplicação com Novo ID** | Clonagem gera novo `tripId`, reseta status para `planejamento`, cria novos timestamps e copia o itinerário integral. |
| **CA-TRIP-08** | **Reabertura de Viagens Concluídas** | Viagens concluídas podem ter seu status revertido para `planejamento` para inclusão de anotações ou fotos. |
| **CA-TRIP-09** | **Resiliência a Clima Envelhecido** | Clima com mais de 48h de captura oferece botão de atualização sutil sem quebrar o roteiro nem desorganizar atividades. |
| **CA-TRIP-10** | **Bloqueio Total de Acesso Cruzado** | Tentativa de ler ou alterar documento de outro `userId` resulta em `PERMISSION_DENIED` imediato pelo Firestore Rules. |
| **CA-TRIP-11** | **Isolamento de Cache Multi-Usuário** | Logout limpa chaves de rascunho de sessão atreladas ao UID anterior. |
