# Modelo de Dados Firestore: SmartTrip (MVP)

**Documento:** `docs/specs/firestore-model.md`  
**Status:** Aprovado  
**Versão:** 1.0.0  
**Rastreabilidade:** [smarttrip-mestre.md](./smarttrip-mestre.md), [ui-spec.md](./ui-spec.md), [firebase-spec.md](./firebase-spec.md) e [auth-spec.md](./auth-spec.md)  
**Objetivo:** Estabelecer a modelagem de dados NoSQL física e conceitual no Cloud Firestore para o MVP do SmartTrip, cobrindo as entidades `users`, `preferences`, `availability`, `trips` e `itineraryItems`, fundamentando a decisão entre coleções raiz versus subcoleções, regras de indexação, consultas previstas, estratégias de exclusão e a matriz de autorização por entidade.

---

## 1. Decisão Arquitetural: Coleção Raiz vs. Subcoleções

No Firestore, a escolha entre coleções raiz (*root collections*) e subcoleções (*subcollections*) determina a escalabilidade, a complexidade das regras de segurança e o isolamento de dados.

### 1.1. Análise Comparativa

| Critério | Coleção Raiz Plana (Ex: `/trips/{tripId}`) | Subcoleções Aninhadas (Ex: `/users/{userId}/trips/{tripId}`) | Decisão no SmartTrip MVP |
|---|---|---|:---:|
| **Isolamento de Segurança** | Requer validação de campo (`resource.data.userId == request.auth.uid`) em cada regra. | **Isolamento no caminho:** A regra pai protege todo o ramo (`match /users/{userId}/{document=**}`). | **Subcoleção** |
| **Listagens e Consultas** | Consultas globais fáceis, mas arriscadas para privacidade sem regras minuciosas. | Consultas naturalmente delimitadas ao usuário logado sem risco de vazamento entre contas. | **Subcoleção** |
| **Controle de Vazamento** | Uma query sem filtro `where("userId", "==")` é rejeitada pelas regras ou expõe dados. | Impossível ler acidentalmente dados de outro usuário via coleção pai. | **Subcoleção** |
| **Custo de Índices Compostos** | Índices globais consomem cotas maiores. | Índices com escopo de coleção (*Collection Scope*) ou *Collection Group* pontual. | **Subcoleção** |
| **Evolução Social (Pós-MVP)** | Pronta para feed público direto. | Pode usar *Collection Group Queries* (`collectionGroup('trips')`) para roteiros públicos. | **Subcoleção** |

### 1.2. Decisão Fundamentada para as Entidades do MVP
1. `/users/{userId}`: **Coleção Raiz**. O identificador do documento é o UID do Firebase Auth (`request.auth.uid`), garantindo unicidade e busca direta $O(1)$.
2. `preferences`: **Documento Embutido** dentro de `/users/{userId}`. Não é uma coleção separada porque tem relação estrita 1:1 com o usuário e é sempre lido junto com o perfil. Desnormalizar ou criar subcoleção adicionaria leituras de rede inúteis.
3. `/users/{userId}/availability/{availabilityId}`: **Subcoleção**. Relação 1:N com ciclo de vida independente (criação, edição e exclusão de períodos de folga).
4. `/users/{userId}/trips/{tripId}`: **Subcoleção**. Relação 1:N com metadados de destino, datas, clima e resumo.
5. `itineraryItems`: **Array de Objetos Estruturados Embutidos** no documento da viagem no MVP (`itinerary: DayPlan[]`).
   - *Justificativa:* Um roteiro de até 7 dias com 3 a 5 atividades por dia gera cerca de 25 a 35 itens. O documento completo ocupa menos de **30 KB** (o limite do Firestore é **1 MB**). Embutir o itinerário elimina a necessidade de fazer 35 leituras de documentos no banco a cada abertura de tela, reduzindo os custos de leitura e a latência em **97%**.

---

## 2. Diagrama de Árvore de Documentos

```text
/users/{userId}                         <-- Documento do Viajante (Perfil + Preferências Embutidas)
   │
   ├── /availability/{availabilityId}   <-- Subcoleção: Períodos de Folga / Férias
   │
   └── /trips/{tripId}                  <-- Subcoleção: Roteiros de Viagem (com itineraryItems embutidos)
```

---

## 3. Especificação Detalhada por Entidade

---

### 3.1. Entidade: `users` (com `preferences` embutido)

- **Caminho:** `/users/{userId}`
- **ID do Documento:** UID emitido pelo Firebase Authentication (ex: `c8X9K...`).
- **Proprietário:** O próprio usuário autenticado (`request.auth.uid == userId`).
- **Campos e Tipagem:**

| Campo | Tipo | Obrigatório | Descrição |
|---|---|:---:|---|
| `uid` | `string` | Sim | Identificador único emitido pelo Firebase Auth. |
| `email` | `string` | Sim | E-mail do usuário em minúsculas. |
| `displayName` | `string` | Sim | Nome de exibição do viajante. |
| `photoURL` | `string` | Não | URL da foto de perfil. |
| `bio` | `string` | Não | Biografia curta (até 200 caracteres). |
| `role` | `string` | Sim | Papel no sistema (`'user'` ou `'admin'`). Forçado como `'user'` no cadastro. |
| `preferences` | `map` | Sim | Mapa de preferências de viagem para a IA (detalhado abaixo). |
| `createdAt` | `timestamp` | Sim | Carimbo de data/hora de criação no servidor (`serverTimestamp()`). |
| `updatedAt` | `timestamp` | Sim | Carimbo de data/hora da última alteração (`serverTimestamp()`). |

- **Subcampos de `preferences`:**
  - `travelStyle`: `string` (Obrigatório) — `'cultura' | 'natureza' | 'gastronomia' | 'aventura' | 'relaxamento'`
  - `budgetLevel`: `string` (Obrigatório) — `'economico' | 'moderado' | 'luxo'`
  - `pace`: `string` (Obrigatório) — `'tranquilo' | 'moderado' | 'intenso'`
  - `dietaryRestrictions`: `array of string` (Obrigatório) — Ex: `["Vegetariano", "Sem Glúten"]`

- **Exemplo de Documento JSON:**
```json
{
  "uid": "usr_clara_98231",
  "email": "clara.ferreira@smarttrip.com",
  "displayName": "Clara Ferreira",
  "photoURL": "https://images.unsplash.com/photo-1534528741775-53994a69daeb",
  "bio": "Designer apaixonada por cafés e arte contemporânea.",
  "role": "user",
  "preferences": {
    "travelStyle": "cultura",
    "budgetLevel": "moderado",
    "pace": "tranquilo",
    "dietaryRestrictions": ["Vegetariano"]
  },
  "createdAt": "2026-10-01T10:00:00.000Z",
  "updatedAt": "2026-10-01T10:00:00.000Z"
}
```

- **Regras de Leitura e Escrita:**
  - *Leitura:* Permitida apenas se `request.auth.uid == userId`.
  - *Criação:* Permitida apenas se `request.auth.uid == userId && request.resource.data.role == 'user'`.
  - *Atualização:* Permitida apenas se `request.auth.uid == userId && request.resource.data.role == resource.data.role` (impede autoelevação para admin).
- **Índices Esperados:** Índice simples padrão no campo `uid` (automático do Firestore).
- **Estratégia de Exclusão:** Exclusão lógica com flag `deletedAt: timestamp` ou remoção física cascateada via Cloud Function quando a conta for encerrada.
- **Risco de Duplicação:** **Nenhum** (o ID do documento é o UID do Auth, impossibilitando duplicatas).
- **Consultas Previstas:**
  - Busca direta por chave: `doc(db, "users", auth.currentUser.uid)`.

---

### 3.2. Entidade: `availability` (Períodos de Folga)

- **Caminho:** `/users/{userId}/availability/{availabilityId}`
- **ID do Documento:** Hash gerado automaticamente (`auto-generated ID`) ou UUID.
- **Proprietário:** O usuário dono da subcoleção (`request.auth.uid == userId`).
- **Campos e Tipagem:**

| Campo | Tipo | Obrigatório | Descrição |
|---|---|:---:|---|
| `id` | `string` | Sim | Identificador único do documento. |
| `title` | `string` | Sim | Título descritivo da folga (ex: "Férias de Outono"). |
| `startDate` | `string` | Sim | Data inicial em formato ISO 8601 Date (`YYYY-MM-DD`). |
| `endDate` | `string` | Sim | Data final em formato ISO 8601 Date (`YYYY-MM-DD`). |
| `totalDays` | `number` | Sim | Total de dias livres no intervalo (calculado). |
| `createdAt` | `timestamp` | Sim | Carimbo de data/hora do servidor. |
| `updatedAt` | `timestamp` | Sim | Carimbo de data/hora do servidor. |

- **Exemplo de Documento JSON:**
```json
{
  "id": "vac_outono_2026",
  "title": "Férias de Outono",
  "startDate": "2026-10-12",
  "endDate": "2026-10-18",
  "totalDays": 7,
  "createdAt": "2026-10-01T10:15:00.000Z",
  "updatedAt": "2026-10-01T10:15:00.000Z"
}
```

- **Regras de Leitura e Escrita:**
  - *Leitura/Escrita:* Exclusiva se `request.auth.uid == userId`.
  - *Validação de Negócio:* `request.resource.data.endDate >= request.resource.data.startDate`.
- **Índices Esperados:**
  - Índice simples automático em `startDate` ASC.
- **Estratégia de Exclusão:** Remoção física direta (`deleteDoc`).
- **Risco de Duplicação:** Médio se o usuário clicar duas vezes seguidas em salvar. Mitigado no frontend desabilitando o botão de envio durante o estado de salvamento.
- **Consultas Previstas:**
  - `collection(db, "users", userId, "availability").orderBy("startDate", "asc")`.

---

### 3.3. Entidade: `trips` (com `itineraryItems` embutidos)

- **Caminho:** `/users/{userId}/trips/{tripId}`
- **ID do Documento:** ID único gerado (`trip_` + timestamp ou auto-id).
- **Proprietário:** O usuário dono da subcoleção (`request.auth.uid == userId`).
- **Campos e Tipagem:**

| Campo | Tipo | Obrigatório | Descrição |
|---|---|:---:|---|
| `id` | `string` | Sim | Identificador único da viagem. |
| `destination` | `map` | Sim | Dados geográficos do destino. |
| `destination.name` | `string` | Sim | Nome da localidade (ex: "Lisboa"). |
| `destination.country` | `string` | Sim | Nome do país (ex: "Portugal"). |
| `destination.latitude` | `number` | Sim | Latitude obtida via Geocoding. |
| `destination.longitude` | `number` | Sim | Longitude obtida via Geocoding. |
| `imageUrl` | `string` | Sim | URL de foto representativa do destino. |
| `startDate` | `string` | Sim | Data de início em ISO 8601 (`YYYY-MM-DD`). |
| `endDate` | `string` | Sim | Data de término em ISO 8601 (`YYYY-MM-DD`). |
| `totalDays` | `number` | Sim | Quantidade de dias da viagem (máximo 7 no MVP). |
| `status` | `string` | Sim | Estado da viagem: `'confirmada' \| 'rascunho' \| 'concluida'`. |
| `weatherSummary` | `map` | Não | Resumo meteorológico do período. |
| `weatherSummary.avgTempMax` | `number` | Não | Temperatura máxima média (°C). |
| `weatherSummary.avgTempMin` | `number` | Não | Temperatura mínima média (°C). |
| `weatherSummary.conditions` | `string` | Não | Texto descritivo (ex: "Ensolarado"). |
| `itinerary` | `array of map` | Sim | Lista ordenada de dias contendo os `itineraryItems`. |
| `createdAt` | `timestamp` | Sim | Carimbo do servidor de criação. |
| `updatedAt` | `timestamp` | Sim | Carimbo do servidor da última revisão editorial. |

---

### 3.4. Estrutura Embutida de `itineraryItems` (dentro de `itinerary`)

Cada elemento do array `itinerary` representa um dia (`DayPlan`), contendo sua lista de atividades (`itineraryItems`):

```typescript
interface DayPlan {
  dayNumber: number;         // 1 a 7
  date: string;              // "YYYY-MM-DD" ou texto formatado
  theme: string;             // Ex: "Centro Histórico e Baixa"
  activities: ItineraryItem[];
}

interface ItineraryItem {
  id: string;                // ID estável da atividade (ex: "act_101")
  period: 'manha' | 'tarde' | 'noite';
  time: string;              // "09:30"
  title: string;             // Título da atração ou passeio
  description: string;       // Detalhes da atividade
  locationName: string;      // Nome do local / endereço
  estimatedCost?: string;    // Ex: "Gratuito" ou "€15"
  tips?: string;             // Dicas da IA (ex: "Reserve online")
}
```

- **Exemplo de Documento de Viagem JSON:**
```json
{
  "id": "trip_lisboa_2026",
  "destination": {
    "name": "Lisboa",
    "country": "Portugal",
    "latitude": 38.7223,
    "longitude": -9.1393
  },
  "imageUrl": "https://images.unsplash.com/photo-1509840841025-9088ba78a826",
  "startDate": "2026-10-12",
  "endDate": "2026-10-18",
  "totalDays": 7,
  "status": "confirmada",
  "weatherSummary": {
    "avgTempMax": 23,
    "avgTempMin": 15,
    "conditions": "Ensolarado com poucas nuvens"
  },
  "itinerary": [
    {
      "dayNumber": 1,
      "date": "2026-10-12",
      "theme": "Chegada & Centro Histórico",
      "activities": [
        {
          "id": "act_101",
          "period": "manha",
          "time": "09:30",
          "title": "Passeio pela Praça do Comércio",
          "description": "Caminhada beira-rio e subida ao Arco da Augusta.",
          "locationName": "Praça do Comércio, Baixa",
          "estimatedCost": "Gratuito",
          "tips": "Suba ao arco para vista panorâmica."
        }
      ]
    }
  ],
  "createdAt": "2026-10-01T10:30:00.000Z",
  "updatedAt": "2026-10-01T10:30:00.000Z"
}
```

- **Índices Esperados:**
  - Índice Composto Simples na subcoleção `trips`:
    - `startDate` ASC, `createdAt` DESC.
- **Estratégia de Exclusão:**
  - Remoção física imediata via `deleteDoc(doc(db, "users", userId, "trips", tripId))`.
- **Risco de Duplicação:**
  - Mitigado com chave de idempotência temporária gerada no clique do botão "Gerar Roteiro".
- **Consultas Previstas:**
  1. *Listar viagens futuras ordenadas:*  
     `query(collection(db, "users", userId, "trips"), where("status", "==", "confirmada"), orderBy("startDate", "asc"))`
  2. *Listar todas as viagens:*  
     `query(collection(db, "users", userId, "trips"), orderBy("startDate", "desc"))`
  3. *Obter detalhe de uma viagem:*  
     `doc(db, "users", userId, "trips", tripId)`

---

## 4. Matriz de Autorização por Entidade

A matriz abaixo define rigorosamente quais operações são permitidas e sob quais condições de segurança:

| Entidade | Visitante Anônimo | Usuário Autenticado (Dono) | Outro Usuário Autenticado | Administrador (Admin SDK) |
|---|:---:|:---:|:---:|:---:|
| `users` (Create) | ❌ Negado | ✅ Permitido (Apenas com `role: 'user'`) | ❌ Negado | ✅ Permitido |
| `users` (Read) | ❌ Negado | ✅ Permitido (`auth.uid == userId`) | ❌ Negado | ✅ Permitido |
| `users` (Update) | ❌ Negado | ✅ Permitido (Sem alterar `role`) | ❌ Negado | ✅ Permitido |
| `users` (Delete) | ❌ Negado | ✅ Permitido (`auth.uid == userId`) | ❌ Negado | ✅ Permitido |
| `availability` (CRUD) | ❌ Negado | ✅ Permitido (`auth.uid == userId`) | ❌ Negado | ✅ Permitido |
| `trips` (Create) | ❌ Negado | ✅ Permitido (`auth.uid == userId`) | ❌ Negado | ✅ Permitido |
| `trips` (Read) | ❌ Negado | ✅ Permitido (`auth.uid == userId`) | ❌ Negado | ✅ Permitido |
| `trips` (Update/Edit) | ❌ Negado | ✅ Permitido (`auth.uid == userId`) | ❌ Negado | ✅ Permitido |
| `trips` (Delete) | ❌ Negado | ✅ Permitido (`auth.uid == userId`) | ❌ Negado | ✅ Permitido |

---

## 5. Regras de Segurança Completas (`firestore.rules`)

As regras a seguir implementam formalmente as restrições especificadas na matriz de autorização:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Bloqueio default
    match /{document=**} {
      allow read, write: if false;
    }

    // Helper functions
    function isSignedIn() {
      return request.auth != null;
    }

    function isOwner(userId) {
      return isSignedIn() && request.auth.uid == userId;
    }

    // Coleção Raiz: users
    match /users/{userId} {
      allow read: if isOwner(userId);
      
      // Criação de perfil: deve ser o dono e role obrigatoriamente 'user'
      allow create: if isOwner(userId) 
        && request.resource.data.uid == userId
        && request.resource.data.role == 'user';

      // Atualização: não pode mudar role (anti-autoelevação)
      allow update: if isOwner(userId) 
        && request.resource.data.role == resource.data.role;

      allow delete: if isOwner(userId);

      // Subcoleção: availability (Folgas)
      match /availability/{availabilityId} {
        allow read, write: if isOwner(userId);
      }

      // Subcoleção: trips (Viagens + Itinerários Embutidos)
      match /trips/{tripId} {
        allow read, write: if isOwner(userId);
      }
    }
  }
}
```

---

## 6. Critérios de Aceite Verificáveis da Modelagem (CA-DATA)

- **CA-DATA-001 (Isolamento por Subcoleção):** Todos os documentos de viagens e folgas residem sob `/users/{userId}/...`, tornando impossível qualquer consulta transversal acidental sem uso de `collectionGroup`.
- **CA-DATA-002 (Eficiência de Leitura):** A abertura de um roteiro de 7 dias na tela `/trips/[id]` consome exatamente **1 leitura de documento** no Firestore, pois os `itineraryItems` estão embutidos.
- **CA-DATA-003 (Validação de Datas):** O modelo adota strings no padrão ISO 8601 (`YYYY-MM-DD`) para datas de viagem e `serverTimestamp()` para auditoria, eliminando distorções de fuso horário.
- **CA-DATA-004 (Anti-Autoelevação Comprovada):** A tentativa de mutação do campo `role` via Client SDK é sumariamente rejeitada pela regra `request.resource.data.role == resource.data.role`.
- **CA-DATA-005 (Integridade de Exclusão):** A exclusão de uma viagem remove imediatamente o documento do Firestore, sem deixar itens órfãos desassociados.
