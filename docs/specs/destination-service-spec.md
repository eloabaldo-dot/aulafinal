# SPEC: Serviço de Busca e Normalização de Destinos

**Documento:** `docs/specs/destination-service-spec.md`  
**Status:** Proposto  
**Versão:** 1.0.0  
**Rastreabilidade:** [smarttrip-mestre.md](./smarttrip-mestre.md), [ui-spec.md](./ui-spec.md), [firestore-model.md](./firestore-model.md)  
**Objetivo:** Especificar a arquitetura, regras de negócio, contrato de dados, tratamento de ambiguidades, estratégias de resiliência e testes para o serviço encarregado de **converter texto livre digitado pelo usuário em uma entidade geográfica normalizada** no SmartTrip.

---

## 1. Visão Geral e Arquitetura

O SmartTrip depende da localização exata do destino para calcular:
1. Clima e sazonalidade histórica via APIs meteorológicas;
2. Roteiros e rotas viáveis geradas pelo Google Gemini;
3. Raio máximo de deslocamento em quilômetros configurado no perfil do viajante.

Para evitar que erros de digitação ("Pris" em vez de "Paris"), variações linguísticas ("Londres" vs "London") ou ambiguidades ("Santiago" no Chile vs "Santiago" na Espanha) corrompam o planejamento da IA, o sistema utiliza uma camada de **Normalização Geográfica**.

```mermaid
flowchart TD
    subgraph UI [Interface do Usuário]
        Input[Campo de Busca / Autocomplete]
        Debouncer[Debounce Timer - 350ms]
        AbortCtrl[AbortController - Cancela busca anterior]
    end

    subgraph ServiceLayer [DestinationService (Camada Agnóstica)]
        LRUCache[(Cache LRU em Memória)]
        Sanitizer[Sanitizador de Input]
        RateLimiter[Token Bucket / Throttling]
        AdapterSelector{Provedor Ativo}
    end

    subgraph Providers [Adaptadores de Geocoding]
        OSM[Nominatim / OpenStreetMap Adapter]
        Photon[Photon / Komoot Adapter]
        Google[Google Places Adapter]
        Mock[Mock Destination Adapter]
    end

    subgraph Output [Resultado Normalizado]
        NormalizedResult[NormalizedDestination]
        AmbiguityList[Lista de Candidatos Desambiguados]
    end

    Input -->|Digitação| Debouncer
    Debouncer -->|Query >= 3 chars| Sanitizer
    Sanitizer --> LRUCache
    LRUCache -->|Cache Hit| UI
    LRUCache -->|Cache Miss| RateLimiter
    RateLimiter --> AdapterSelector
    AdapterSelector --> OSM
    AdapterSelector --> Photon
    AdapterSelector --> Google
    AdapterSelector --> Mock
    OSM & Photon & Google & Mock -->|Payload Bruto| Normalizer[Parser de Normalização]
    Normalizer --> NormalizedResult
    Normalizer --> AmbiguityList
    AmbiguityList -->|Exibição no Dropdown| UI
```

---

## 2. Parâmetros de Entrada e Sanitização

### 2.1. Definição da Entrada
A função de busca recebe os seguintes parâmetros:

```typescript
export interface DestinationSearchOptions {
  query: string;
  language?: string;          // Padrão: 'pt-BR'
  limit?: number;             // Padrão: 5 (mín: 1, máx: 10)
  countryCodes?: string[];    // Opcional: filtro por ISO 3166-1 alpha-2 (ex: ['BR', 'FR'])
  signal?: AbortSignal;       // Para cancelamento de requisição ativa
}
```

### 2.2. Regras de Validação de Entrada
1. **Limite Mínimo de Caracteres (`minQueryLength`):**
   - Mínimo de **3 caracteres válidos** (após trim). Exemplos válidos: `"Rio"`, `"Roma"`, `"Foz"`.
   - Entradas com 1 ou 2 caracteres não disparam chamadas para a API externa.
   - Estado de UI para < 3 caracteres: exibe dica sutil: *"Digite pelo menos 3 letras para pesquisar destinos..."*.
2. **Limite Máximo de Caracteres (`maxQueryLength`):**
   - Máximo de **100 caracteres**. Textos mais longos são truncados para evitar ataques de DoS ou estouro de buffer nos provedores.
3. **Sanitização:**
   - Remoção de espaços extras no início e fim (`trim()`).
   - Normalização de espaços múltiplos internos para um único espaço.
   - Remoção de caracteres de controle invisíveis e tags HTML/scripts (`<script>`, emojis ou caracteres maliciosos).

---

## 3. Debounce e Cancelamento de Requisições

### 3.1. Debounce Configurável
- **Intervalo Padrão:** **350ms**.
- **Justificativa:** 350ms é o intervalo ótimo entre a digitação humana média e a percepção de resposta rápida da UI, reduzindo em até 80% o número de requisições redundantes geradas caractere por caractere.

### 3.2. Cancelamento Ativo (`AbortController`)
- Sempre que o usuário digitar um novo caractere antes de a requisição anterior ser concluída:
  - O `AbortController.abort()` da requisição em trânsito é imediatamente disparado.
  - A requisição anterior é cancelada no navegador, prevenindo condições de corrida (*race conditions* em que uma busca mais antiga demorada sobreponha uma busca mais recente).

---

## 4. Contrato Interno Normalizado (Provider-Agnostic)

A aplicação jamais manipula formatos proprietários de fornecedores externos. Todo provedor converte sua resposta bruta no seguinte contrato tipado:

```typescript
/**
 * Tipos de entidades geográficas reconhecidas
 */
export type DestinationType = 
  | 'city'                  // Ex: Paris, Tóquio, São Paulo
  | 'municipality'          // Ex: Gramado, Ilhabela
  | 'state_province'        // Ex: Toscana, Califórnia
  | 'country'               // Ex: Japão, Portugal
  | 'island'                // Ex: Bali, Fernando de Noronha
  | 'national_park'         // Ex: Chapada dos Veadeiros, Yellowstone
  | 'landmark';             // Ex: Torre Eiffel, Cristo Redentor

/**
 * Coordenadas geográficas rigorosamente validadas
 */
export interface GeoCoordinates {
  latitude: number;   // -90 <= latitude <= 90
  longitude: number;  // -180 <= longitude <= 180
}

/**
 * Caixa delimitadora para foco e enquadramento em mapa
 */
export interface BoundingBox {
  south: number;
  north: number;
  west: number;
  east: number;
}

/**
 * Estrutura administrativa decomposta
 */
export interface GeographicAddress {
  city: string;               // Nome da cidade / município principal
  stateOrRegion: string;      // Estado, província ou departamento
  country: string;            // Nome do país traduzido (ex: "França")
  countryCode: string;        // ISO 3166-1 alpha-2 em maiúsculas (ex: "FR", "BR", "JP")
  postalCode?: string;        // Opcional
}

/**
 * Entidade Canônica Normalizada de Destino
 */
export interface NormalizedDestination {
  id: string;                         // Identificador canônico único e determinístico
  name: string;                       // Nome principal (ex: "Paris")
  displayName: string;                // Rótulo completo para UI (ex: "Paris, Île-de-France, França")
  shortName: string;                  // Rótulo compacto (ex: "Paris, FR")
  type: DestinationType;              // Classificação geográfica
  coordinates: GeoCoordinates;        // Latitude / Longitude validadas
  boundingBox?: BoundingBox;          // Delimitação espacial para mapas
  address: GeographicAddress;         // Componentes administrativos
  timezone?: string;                  // Ex: "Europe/Paris", "America/Sao_Paulo"
  sourceProvider: string;             // Ex: "nominatim" | "google_places" | "mock"
  rawPlaceId?: string;                // ID original no provedor para auditoria
}
```

### 4.1. Regras de Geração do `id` Canônico
Para garantir consistência em caches e chaves no Firestore:
- `id` canônico gerado no padrão:  
  `dest_[countryCode]_[slugCity]_[latRounded]_[lngRounded]`  
  *Exemplo:* `dest_fr_paris_48-8566_2-3522`.
- Duas buscas com grafias ligeiramente diferentes que mapeiem para o mesmo ponto geográfico produzirão o mesmo `id` canônico.

---

## 5. Resolução de Ambiguidades e Destinos Múltiplos

### 5.1. O Problema da Ambiguidade
Diversos nomes de cidades são idênticos ou homônimos em locais distintos:
- *"Santiago"* pode ser:
  - Santiago (Região Metropolitana, Chile) 🇨🇱
  - Santiago de Compostela (Galícia, Espanha) 🇪🇸
  - Santiago (Ilha de Santiago, Cabo Verde) 🇨🇻
- *"Springfield"* possui dezenas de cidades nos EUA.

### 5.2. Mecânica de Desambiguação
1. O serviço retorna até 5 candidatos ranqueados por relevância e população.
2. Cada candidato expõe propriedades explícitas de desambiguação na UI:
   - **Título Principal (`name`):** Negrito (ex: **Santiago**).
   - **Subtítulo Geopolítico (`subtitle`):** Região + País + Bandeira (ex: *Região Metropolitana de Santiago, Chile 🇨🇱*).
   - **Tag de Tipo:** Chip discreto (`Cidade`, `Capital`, `Península`).
3. **Seleção Mandatória:** O sistema **nunca supõe ou autocompleta arbitrariamente** um destino ambíguo. O usuário deve clicar ou navegar via teclado (`ArrowDown` + `Enter`) para escolher exatamente a entidade desejada.
4. Ao clicar, o objeto `NormalizedDestination` correspondente é emitido para o formulário de planejamento de viagem.

---

## 6. Destino Inexistente ou Não Localizado

### 6.1. Tratamento Sem Quebra de Fluxo
Quando a busca do usuário não encontrar nenhum resultado geográfico:
- **Status:** Resposta de sucesso (`200 OK`), porém com array de candidatos vazio: `{ destinations: [], total: 0 }`.
- **Tratamento no Client:**
  - Não disparar toasts de erro de servidor.
  - Exibir componente visual de *Empty State*:
    > 🔍 *"Nenhum destino encontrado para '**[termo digitado]**'. Tente buscar pelo nome da cidade, estado ou país."*
  - Exibir atalhos de sugestão para destinos populares:
    > *Sugestões rápidas: [Rio de Janeiro] [Paris] [Tóquio] [Lisboa]*

---

## 7. Timeout e Resiliência

### 7.1. Limite de Tempo de Resposta
- **Timeout Estrito:** **5.000ms (5 segundos)**.
- Implementado via `AbortSignal.timeout(5000)` combinado com o sinal do debounce.

### 7.2. Categorização de Erros

| Código de Erro Interno | Causa Raiz | Mensagem para o Usuário |
|---|---|---|
| `GEO_TIMEOUT` | Servidor externo demorou mais de 5s | *"A busca pelo destino demorou para responder. Verifique sua conexão e tente novamente."* |
| `GEO_RATE_LIMITED` | Provedor retornou HTTP 429 | *"Muitas buscas em sequência. Aguarde um instante..."* |
| `GEO_NETWORK_ERROR` | Falha de conexão / Offline | *"Sem conexão com a internet para localizar destinos."* |
| `GEO_INVALID_INPUT` | Query vazia ou com caracteres inválidos | *"Termo de busca inválido."* |
| `GEO_PROVIDER_UNAVAILABLE`| HTTP 500 / 503 do provedor externo | *"Serviço de mapas temporariamente instável. Tente em alguns minutos."* |

---

## 8. Estratégia de Cache em Duas Camadas

Para otimizar desempenho, evitar cobranças desnecessárias de APIs pagas e respeitar termos de serviços públicos (ex: OSM):

```mermaid
flowchart LR
    Request[Busca: 'roma'] --> L1{L1: Cache Memória LRU}
    L1 -->|Hit (< 1h)| Return[Retorna Resultado]
    L1 -->|Miss| L2{L2: Cache Firestore / LocalStorage}
    L2 -->|Hit (< 7 dias)| Return
    L2 -->|Miss| API[Chamada Provedor Externo]
    API --> SaveL2[Salva L2]
    SaveL2 --> SaveL1[Salva L1]
    SaveL1 --> Return
```

### 8.1. L1: Cache em Memória da Sessão (LRU Cache)
- **Escopo:** Instância do `DestinationService` no cliente.
- **Capacidade:** 100 termos recentes.
- **TTL (Time-to-Live):** 1 hora.
- **Chave de Cache:** `query.trim().toLowerCase() + '_' + language`.
- **Benefício:** Elimina requisições quando o usuário apaga uma letra com Backspace e digita novamente.

### 8.2. L2: Cache Persistente de Destinos Canônicos
- **Escopo:** Armazenamento local / coleção utilitária `/cachedDestinations/{canonicalId}`.
- **TTL:** 30 dias (coordenadas e nomes de cidades são dados de baixíssima volatilidade).

---

## 9. Limite de Requisições (Rate Limiting) e Boas Práticas

### 9.1. Rate Limiting no Cliente
- **Frequência Máxima:** Máximo de 1 requisição a cada 1.000ms quando utilizando provedores públicos como Nominatim (OpenStreetMap).
- **Fila Interna (Throttler):** Se o usuário digitar rapidamente mesmo após o debounce, requisições intermediárias são descartadas, processando apenas a última intenção.
- **User-Agent Identificado:** Quando em ambiente Node/Edge ou chamadas de proxy, enviar obrigatoriamente:  
  `User-Agent: SmartTripApp/1.0 (contato@smarttrip.com)`.

### 9.2. Proteção contra Loop de Digitação
- Desabilita novas chamadas enquanto houver uma chamada em andamento para o mesmo termo idêntico.

---

## 10. Privacidade e Proteção de Dados (LGPD / GDPR)

1. **Isolamento de PII:** O termo de busca geográfico digitado pelo usuário **nunca é acompanhado de identificadores pessoais** (sem `userId`, sem `email`, sem IP associado em payloads externos).
2. **Localização do Usuário (GPS):** O serviço **não solicita nem envia a latitude/longitude do usuário** para serviços de geocoding, a menos que o usuário clique expressamente no botão *"Usar minha localização atual"*.
3. **Logs Seguros:** Erros de geocoding registrados em console ou monitoramento contêm apenas o código de status e o comprimento da string de busca, sem vazar dados cadastrais ou chaves privadas de API.

---

## 11. Interface da Camada de Serviço (`IDestinationProvider`)

Para permitir a troca transparente de provedores (ex: OpenStreetMap/Nominatim no desenvolvimento e Google Places ou Mapbox em produção empresarial), o sistema estabelece o seguinte contrato agnóstico:

```typescript
export interface IDestinationProvider {
  readonly providerName: string;

  /**
   * Busca textual de destinos
   */
  search(query: string, options?: DestinationSearchOptions): Promise<NormalizedDestination[]>;

  /**
   * Geocodificação reversa (coordenadas -> cidade/país)
   */
  reverseGeocode(coordinates: GeoCoordinates, language?: string): Promise<NormalizedDestination | null>;
}
```

### 11.1. Adaptadores Planejados
1. **`MockDestinationProvider`**: Provedor determinístico em memória contendo cidades de teste (Paris, Roma, Tóquio, Santiago, São Paulo) para suítes de testes automatizados sem rede.
2. **`NominatimDestinationProvider`**: Implementação baseada na API do OpenStreetMap com respeito a limites de requisição e cabeçalhos.
3. **`GooglePlacesDestinationProvider`**: Implementação para ambiente de produção de alto volume.

---

## 12. Critérios de Aceite

### CA-GEO-001: Limite Mínimo de Caracteres
- **Dado** que o usuário está no campo de busca de destino;
- **Quando** ele digita apenas 1 ou 2 caracteres (ex: `"Pa"`);
- **Então** nenhuma requisição de rede deve ser disparada;
- **E** a interface deve indicar que são necessárias ao menos 3 letras.

### CA-GEO-002: Debounce de Digitação
- **Dado** que o usuário digita rapidamente `"Florianópolis"`;
- **Quando** ele digita os 13 caracteres em um intervalo inferior a 350ms entre teclas;
- **Então** apenas **uma única requisição** deve ser enviada após o cessar da digitação;
- **E** chamadas intermediárias anteriores devem ter sido canceladas via `AbortController`.

### CA-GEO-003: Normalização de Resposta
- **Dado** que o usuário buscou e selecionou `"Roma"`;
- **Então** o objeto retornado deve conter:
  - `name`: `"Roma"`;
  - `address.country`: `"Itália"`;
  - `address.countryCode`: `"IT"`;
  - `coordinates.latitude`: valor entre `41.8` e `42.0`;
  - `coordinates.longitude`: valor entre `12.4` e `12.6`;
  - `id`: identificador canônico estruturado.

### CA-GEO-004: Resolução de Ambiguidade
- **Dado** que o usuário digita `"Santiago"`;
- **Quando** a busca retornar múltiplos destinos com o mesmo nome principal;
- **Então** a lista de sugestões deve exibir ao menos Santiago (Chile) e Santiago de Compostela (Espanha);
- **E** o subtítulo de cada opção deve evidenciar claramente a região e o país correspondente;
- **E** nenhum destino deve ser assumido como selecionado até que o usuário clique ou pressione Enter na opção desejada.

### CA-GEO-005: Destino Inexistente
- **Dado** que o usuário digita uma sequência aleatória sem sentido (ex: `"Xqzlkjw99"`);
- **Quando** a busca for processada;
- **Então** o serviço deve retornar uma lista vazia sem lançar exceção de erro técnico;
- **E** a interface deve exibir mensagem amigável de destino não localizado com sugestões de busca.

### CA-GEO-006: Timeout e Falha de Rede
- **Dado** que a requisição de busca demore mais de 5.000ms para responder;
- **Então** o serviço deve abortar a requisição e lançar erro categorizado `GEO_TIMEOUT`;
- **E** a interface deve sugerir ao usuário tentar novamente sem travar a tela.

### CA-GEO-007: Cache em Memória
- **Dado** que o usuário pesquisou `"Tóquio"`;
- **Quando** o usuário apagar o texto e digitar `"Tóquio"` novamente dentro da mesma sessão em menos de 1 hora;
- **Então** o resultado deve ser recuperado instantaneamente do cache L1 sem disparar requisição externa.

---

## 13. Plano de Testes Automatizados

A suíte de testes unitários e de integração para o serviço de busca e normalização deverá contemplar os seguintes cenários no arquivo `test-destination-service.ts`:

| # | Caso de Teste | Entrada / Ação | Comportamento Esperado |
|---|---|---|---|
| **1** | Validação de Entrada Mínima | Query `"NY"` | Retorna `[]` imediatamente sem acionar provedor externo |
| **2** | Sanitização de Espaços e Caracteres | Query `"   Paris  \n\t  "` | Executa busca limpa por `"Paris"` |
| **3** | Resposta Normalizada Válida | Query `"Tóquio"` | Objeto com `coordinates`, `address.countryCode == "JP"` e `type == "city"` |
| **4** | Detecção de Ambiguidades | Query `"Santiago"` | Retorna array com >= 2 opções distintas (Chile e Espanha) com subtítulos completos |
| **5** | Destino Inexistente | Query `"NonExistentCity12345"` | Retorna array vazio `[]` com status de sucesso |
| **6** | Cache em Memória (L1 Hit) | 2 buscas idênticas por `"Lisboa"` | Segunda busca executada com `0` chamadas ao provedor externo |
| **7** | Timeout Controlado | Provedor atrasado em 5500ms | Lança erro `GEO_TIMEOUT` em 5000ms via `AbortSignal` |
| **8** | Cancelamento por Digitação Concorrente | Busca 1 (`"Ber"`) seguida de Busca 2 (`"Berlim"`) | Sinal da Busca 1 é abortado com `AbortError` |
| **9** | Independência de Provedor (Adapter Switch) | Alternar de `MockProvider` para `NominatimProvider` | O contrato de saída `NormalizedDestination` permanece idêntico |
| **10** | Sanitização contra Injeção de Scripts | Query `"<script>alert(1)</script> Madri"` | Caracteres maliciosos sanitizados e busca executada como `"Madri"` |
