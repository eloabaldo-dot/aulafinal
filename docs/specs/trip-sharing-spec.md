# SPEC: Compartilhamento de Roteiros e Comunidade (SmartTrip)

**Documento:** `docs/specs/trip-sharing-spec.md`  
**Status:** Aprovado  
**Versão:** 1.0.0  
**Rastreabilidade:** [smarttrip-mestre.md](./smarttrip-mestre.md), [trip-lifecycle-spec.md](./trip-lifecycle-spec.md), [firestore-model.md](./firestore-model.md) e [auth-spec.md](./auth-spec.md)  
**Objetivo:** Especificar a arquitetura técnica, modelo de permissões, níveis de visibilidade (`private`, `link`, `public`), mecanismos de anonimização e privacidade, a funcionalidade de clonagem e revalidação ("Usar Este Roteiro"), ameaças de segurança (STRIDE/OWASP) e matriz de testes do sistema de compartilhamento de roteiros do SmartTrip.

---

## 1. Níveis de Visibilidade

O compartilhamento de roteiros no SmartTrip é governado por três níveis granulares de visibilidade:

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        Níveis de Visibilidade                          │
├───────────────────┬───────────────────────────┬────────────────────────┤
│     'private'     │          'link'           │        'public'        │
│    (Restrito)     │     (Não Listado)         │     (Galeria Aberta)   │
└───────────────────┴───────────────────────────┴────────────────────────┘
```

---

### 1.1. Comparativo entre os Níveis de Visibilidade

| Requisito / Dimensão | `private` (Privada) | `link` (Compartilhada via Link) | `public` (Comunidade / Feed Público) |
|---|---|---|---|
| **Quem pode descobrir** | Exclusivamente o proprietário. Oculto de qualquer busca ou índice. | Apenas quem possuir a URL com o token seguro (`shareToken`). Não indexado em buscas. | Qualquer pessoa. Indexado na Galeria Pública da Comunidade e por motores de busca (SEO). |
| **Quem pode ler** | Somente o criador autenticado (`request.auth.uid == ownerId`). | Qualquer usuário (autenticado ou visitante anônimo) com a URL completa contendo o token. | Qualquer usuário da internet (leitura irrestrita). |
| **Quem pode editar** | Estritamente o criador da viagem. | Estritamente o criador da viagem (somente leitura para quem recebe o link). | Estritamente o criador da viagem (visitantes possuem apenas leitura). |
| **Necessidade de Login** | **Sim** (autenticação obrigatória). | **Não** (visitantes anônimos podem visualizar o roteiro em modo somente leitura). | **Não** (acesso público universal). |
| **Comportamento do Link** | Links diretos (`/trips/{id}`) acessados por terceiros retornam `404 Not Found` ou `403 Forbidden`. | URL pública estruturada: `/share/{shareToken}`. Token criptográfico de 24+ caracteres. | URL semântica/canônica: `/community/{destinationSlug}/{tripSlug}-{publicId}`. |
| **Campos Pessoais Ocultos** | Nenhum (o criador vê todas as suas anotações e despesas). | **Sanitização Estrita:** e-mail, telefone, notas privadas, passaporte e custos são removidos da resposta. | **Sanitização Estrita:** apenas o nome público do autor (opcional), destino, fotos e itinerário público são visíveis. |
| **Revogação** | N/A (já é privada). | Imediata: ao alterar para `private` ou clicar em *"Revogar Link"*, o `shareToken` é invalidado na hora. | Imediata: ao alterar para `private` ou `link`, a viagem é desindexada instantaneamente da galeria. |
| **Mudança de Visibilidade** | Promovível a `link` ou `public` pelo dono a qualquer momento. | Reversível para `private` ou promovível a `public`. | Reversível para `link` ou `private` pelo dono. |

---

## 2. Sanitização de Dados e Anonimização (Zero PII Leakage)

Ao transitar um roteiro de `private` para `link` ou `public`, o sistema aplica uma **projeção sanitizada estrita**. A visualização pública nunca expõe o documento original do Firestore diretamente.

### 2.1. Lista Negra de Campos (NUNCA Expostos Publicamente)
- `userId` / UID interno do Firebase Auth;
- `userEmail` do autor;
- `userNotes` (anotações livres que possam conter dados pessoais, alergias, telefones ou passaportes);
- `estimatedCost` reais de despesas privadas da família;
- Endereço de hospedagem privada (Airbnb/residência particular de amigos);
- Histórico de revisões e rascunhos.

### 2.2. Projeção Pública Permitida (`PublicTripDTO`)
```typescript
export interface PublicTripDTO {
  id: string; // Token público ou ID mascarado
  destination: {
    name: string;
    country: string;
    latitude: number;
    longitude: number;
  };
  title: string;
  summary: string;
  imageUrl: string;
  totalDays: number;
  authorPublicName?: string;
  authorAvatarUrl?: string;
  publishedAt: string;
  itinerary: Array<{
    dayNumber: number;
    theme: string;
    activities: Array<{
      period: 'manha' | 'tarde' | 'noite';
      timeSlot: string;
      name: string;
      placeId: string;
      rationale: string;
      curatorTip?: string;
    }>;
  }>;
}
```

---

## 3. Função "Usar Este Roteiro" (Fork / Clone Seguro)

A funcionalidade **"Usar Este Roteiro"** permite que qualquer viajante pegue uma viagem compartilhada (seja por link ou galeria pública) e a transforme em sua própria viagem privada personalizada.

```text
[Roteiro Compartilhado de A] ──> (Clique em "Usar Este Roteiro")
                                              │
                                              v
                              [Autenticação / Login Rápido de B]
                                              │
                                              v
                              [Solicitação de Novas Datas]
                                              │
                                              v
                              [Revalidação de Clima & POIs]
                                              │
                                              v
                              [Nova Viagem Privada de B] (sourceTripId: A)
```

### 3.1. Regras Mandatórias da Clonagem
1. **Criação de Cópia Atômica:**
   - Gera um novo registro com `tripId` exclusivo no escopo do usuário clonador (`/users/{novoUserId}/trips/{newTripId}`).
2. **Novo Dono (*New Ownership*):**
   - O campo `userId` do novo documento passa a ser estritamente o UID do usuário que clicou em clonar.
3. **Inicia Estritamente Privada:**
   - Toda viagem clonada inicia obrigatoriamente com `visibility: 'private'` e `status: 'planejamento'`, independentemente de o original ser público ou link.
4. **Rastreabilidade de Linhagem (`sourceTripId`):**
   - O novo documento registra `sourceTripId: string` e `clonedAt: timestamp` para auditoria e crédito conceitual ao autor original.
5. **Inviolabilidade do Roteiro Original:**
   - A operação é estritamente de leitura no documento de origem; nenhuma alteração, comentário ou métrica é gravada de volta no original durante a clonagem.
6. **Solicitação de Novas Datas:**
   - O modal de clonagem exige que o novo usuário informe suas datas de início (`startDate`) e fim (`endDate`).
   - A duração de dias padrão é herdada do roteiro de origem, mas o usuário pode ajustar (respeitando o limite de 1 a 7 dias do MVP).
7. **Revalidação Mandatória de Clima e Lugares:**
   - **Clima:** A previsão antiga é descartada. O `weatherService` é invocado para obter a previsão atualizada das novas datas. Se forem além do horizonte, define `hasForecast: false` sem inventar clima.
   - **Lugares (POIs):** O `poiService` revalida os `placeId` do itinerário para confirmar que continuam cadastrados e ativos no destino.

---

## 4. Análise de Ameaças e Segurança (STRIDE / OWASP)

| Ameaça | Vetor de Ataque | Mitigação Implementada no SmartTrip |
|---|---|---|
| **IDOR (Insecure Direct Object Reference)** | Atacante altera a URL para `/trips/{id_de_outro_usuario}` tentando ler roteiro privado. | **Isolamento de Subcoleção + Security Rules:** Firestore Rules barram no caminho `/users/{userId}/trips/...` onde `request.auth.uid != userId`. Retorno HTTP 403/404 imediato. |
| **Enumeração de Links Compartilhados** | Bot tenta adivinhar IDs sequenciais de links (ex: `/share/1`, `/share/2`). | **Tokens Criptográficos Aleatórios:** Links de compartilhamento utilizam tokens de 160 bits (URL-safe Base64 ou UUIDv4 criptográfico: `nanoid(24)`), tornando a força bruta computacionalmente inviável ($> 10^{36}$ combinações). |
| **Vazamento de PII em Compartilhamentos** | Proprietário compartilha link e expõe seu e-mail, telefone ou notas confidenciais. | **Projeção de DTO no Servidor:** Endpoint `/api/share/{token}` projeta apenas campos públicos permitidos (`PublicTripDTO`). Dados pessoais nunca trafegam na resposta HTTP. |
| **Acesso após Revogação (Link Zombie)** | Visitante armazena em cache link revogado pelo dono. | **Invalidação Atômica:** Revogar o link regenera ou apaga o `shareToken` no banco. Respostas públicas incluem header `Cache-Control: no-cache, no-store, must-revalidate`. |
| **Envenenamento de Roteiro (Poisoning)** | Visitante envia requisição `PUT /share/{token}` tentando alterar o roteiro compartilhado. | **Imutabilidade Estrita:** A rota `/share` suporta exclusivamente o método HTTP `GET`. Operações de escrita exigem autenticação do proprietário real. |
| **DoS via Clonagem em Massa** | Script malicioso clona o mesmo roteiro 10.000 vezes para sobrecarregar a conta. | **Rate Limiting e Cota:** Máximo de 10 operações de clonagem por usuário por hora via IP e `auth.uid`. |

---

## 5. Regras de Segurança do Firestore para Compartilhamento

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Roteiros privados na subcoleção do usuário
    match /users/{userId}/trips/{tripId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Coleção pública de projeções de compartilhamento (Share Index)
    match /shared_trips/{shareToken} {
      // Leitura permitida publicamente caso a viagem seja 'link' ou 'public'
      allow read: if resource.data.visibility in ['link', 'public'];
      
      // Escrita/Revogação permitida estritamente ao criador original
      allow write: if request.auth != null && request.auth.uid == resource.data.ownerId;
    }
    
    // Galeria da Comunidade (Apenas itinerários marcados explicitamente como 'public')
    match /community_trips/{publicTripId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == resource.data.ownerId;
    }
  }
}
```

---

## 6. Critérios de Aceite (Acceptance Criteria)

| ID | Regra | Critério de Aceite |
|---|---|---|
| **CA-SHARE-01** | **Visibilidade Privada por Padrão** | Toda viagem gerada ou clonada é criada com `visibility: 'private'`. |
| **CA-SHARE-02** | **Geração de Link Criptográfico** | Transição para `link` gera um `shareToken` de pelo menos 24 caracteres aleatórios seguros. |
| **CA-SHARE-03** | **Acesso Anônimo a Link Compartilhado** | Usuário deslogado consegue visualizar o roteiro no link compartilhado em modo somente leitura. |
| **CA-SHARE-04** | **Anonimização e Blindagem de PII** | Resposta da visualização compartilhada não contém e-mail, notas privadas ou identificadores internos. |
| **CA-SHARE-05** | **Revogação Instantânea** | Alterar visibilidade para `private` invalida o link na hora; acessos subsequentes retornam 404. |
| **CA-SHARE-06** | **Clonagem ("Usar Este Roteiro")** | Gera nova viagem para o usuário logado com `sourceTripId`, mantendo o roteiro original intocado. |
| **CA-SHARE-07** | **Revalidação de Datas e Clima** | A clonagem exige novas datas e consulta previsão do tempo recente para o novo período. |
| **CA-SHARE-08** | **Proteção Anti-IDOR** | Requisições autenticadas de outros usuários a `/users/{id_alheio}/trips/...` são barradas com HTTP 403. |
| **CA-SHARE-09** | **Indexação na Galeria Pública** | Viagens com visibilidade `public` aparecem na listagem da Comunidade; viagens `link` não aparecem. |

---

## 7. Roteiro de Testes Automatizados

### Cenário de Teste 1: Compartilhamento e Revogação de Link
1. Usuário A cria viagem privada.
2. A clica em "Compartilhar" e escolhe a opção "Qualquer pessoa com o link".
3. O sistema gera a URL `/share/tok_abc123...`.
4. Usuário B (não logado) acessa a URL e visualiza o título, fotos e atividades.
5. Verificação: e-mail e anotações pessoais de A não estão presentes no HTML nem no payload JSON.
6. A altera a visibilidade de volta para "Privada".
7. B tenta recarregar a URL do link anterior.
8. Verificação: B recebe HTTP 404 / aviso de roteiro não encontrado ou link revogado.

### Cenário de Teste 2: Fluxo "Usar Este Roteiro"
1. Usuário B acessa roteiro compartilhado por A em Paris.
2. B clica no botão "Usar Este Roteiro".
3. Modal abre solicitando as datas da viagem de B (ex: 2027-04-10 a 2027-04-12).
4. O sistema valida as datas, consulta o clima do período de 2027 e clona as atividades.
5. Nova viagem é salva na conta de B com status `planejamento`, visibilidade `private` e `sourceTripId = tripA.id`.
6. Verificação: o roteiro original de A permanece intacto e inalterado.
