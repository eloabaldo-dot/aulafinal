# SPEC: Serviço Meteorológico SmartTrip

**Documento:** `docs/specs/weather-service-spec.md`  
**Status:** Proposto  
**Versão:** 1.0.0  
**Rastreabilidade:** [smarttrip-mestre.md](./smarttrip-mestre.md), [ui-spec.md](./ui-spec.md), [destination-service-spec.md](./destination-service-spec.md)  
**Objetivo:** Especificar as regras de negócio, modelo de dados normalizado, limites temporais, tolerância a falhas, UX e testes para o **Serviço de Previsão Meteorológica** do SmartTrip.

---

## 1. Visão Geral e Papel no Ecossistema SmartTrip

O SmartTrip utiliza o contexto climático para orientar as decisões da Inteligência Artificial (Google Gemini) e informar o viajante durante a visualização do itinerário:
1. **Curadoria Inteligente de Atividades:** Em dias com alta probabilidade de chuva (> 60%), a IA prioriza atrações em ambientes cobertos (museus, gastronomia, galerias); em dias ensolarados, aloca parques, caminhadas e mirantes.
2. **Alertas de Preparação na UI:** Exibição clara de temperatura mínima/máxima e probabilidade de precipitação para cada dia do roteiro.
3. **Resiliência Operacional:** O clima é um enriquecedor contextual, **não um ponto único de falha**. Caso a API meteorológica falhe ou o destino esteja além do horizonte de previsão, o aplicativo deve operar normalmente sem interrupção de fluxo.

```mermaid
flowchart TD
    subgraph UI [Interface do Usuário / ExploreView & ItineraryView]
        CoordInput[Coordenadas do Destino + Datas]
        WeatherBadge[Badges Diários de Clima]
        RainAlert[Alerta de Contingência de Chuva]
    end

    subgraph WeatherLayer [WeatherService (Camada Agnóstica)]
        DateHorizonGuard{Verificador de Horizonte}
        WeatherCache[(Cache em Memória LRU - TTL 3h)]
        AdapterRouter{Provedor Ativo}
    end

    subgraph Providers [Adaptadores de Previsão]
        OpenMeteo[Open-Meteo API Adapter]
        MockWeather[Mock Weather Adapter]
    end

    subgraph Normalization [Normalizador Canônico]
        WMOParser[Decodificador WMO]
        CanonicalContract[DailyWeatherForecast]
    end

    CoordInput --> DateHorizonGuard
    DateHorizonGuard -->|Fora do Horizonte| ExplicitUnavailable[Ausência Explícita / status: unavailable]
    DateHorizonGuard -->|Dentro do Horizonte| WeatherCache
    WeatherCache -->|Cache Hit| WeatherBadge
    WeatherCache -->|Cache Miss| AdapterRouter
    AdapterRouter --> OpenMeteo & MockWeather
    OpenMeteo & MockWeather -->|Payload Bruto| WMOParser
    WMOParser --> CanonicalContract
    CanonicalContract --> WeatherBadge
    CanonicalContract --> RainAlert
```

---

## 2. Parâmetros de Entrada e Validações

### 2.1. Definição da Entrada

```typescript
export interface WeatherForecastRequest {
  latitude: number;
  longitude: number;
  startDate: string; // ISO 8601: 'YYYY-MM-DD'
  endDate: string;   // ISO 8601: 'YYYY-MM-DD'
  signal?: AbortSignal;
}
```

### 2.2. Regras de Validação de Entrada
1. **Coordenadas Geográficas:**
   - Latitude: `-90 <= latitude <= 90` (número finito).
   - Longitude: `-180 <= longitude <= 180` (número finito).
   - Coordenadas inválidas disparam erro de validação `WEATHER_INVALID_COORDINATES`.
2. **Consistência Cronológica:**
   - Formato estrito: `YYYY-MM-DD`.
   - `startDate` deve ser uma data válida no calendário.
   - `endDate` deve ser maior ou igual a `startDate`.
   - Intervalo máximo de consulta no MVP: **14 dias consecutivos** (viagens do MVP possuem de 1 a 7 dias, estendíveis até 14).
3. **Datas Passadas:**
   - Datas com mais de 30 dias no passado não são suportadas pela consulta preditiva.

---

## 3. Horizonte de Previsão e Tratamento de Ausência

### 3.1. Limite Físico do Horizonte Meteorológico
- **Horizonte Confiável:** Provedores meteorológicos globais (como Open-Meteo) fornecem modelos numéricos de previsão diária com boa acurácia para uma janela de **até 14 a 16 dias à frente** da data presente.
- **Regra Fundamental Anti-Alucinação:**
  > ⚠️ **É terminantemente proibido inventar dados de clima** para datas fora do horizonte de previsão (ex: viagem marcada para daqui a 6 meses).
  > A aplicação não deve gerar previsões fictícias ("25°C ensolarado") para datas futuras incertas, sob pena de induzir o usuário a erros graves de bagagem e planejamento.

### 3.2. Representação Explícita de Ausência de Dados
Para qualquer dia em que não haja modelo meteorológico disponível:
- `status`: `'unavailable'` (ou `'historical_average'` se houver base climatológica histórica anual);
- `tempMin`: `null`;
- `tempMax`: `null`;
- `rainProbability`: `null`;
- `condition`: `'Desconhecido'`;
- `icon`: `'❓'`;
- `hasForecast`: `false`.

---

## 4. Contrato de Saída Normalizado (SmartTrip Canonical Contract)

O formato interno normalizado independe do provedor utilizado (Open-Meteo, OpenWeather, WeatherAPI ou Mock):

```typescript
/**
 * Condições climáticas canônicas consolidadas
 */
export type WeatherCondition =
  | 'Ensolarado'
  | 'Parcialmente Nublado'
  | 'Nublado'
  | 'Chuvoso'
  | 'Tempestade'
  | 'Neve'
  | 'Desconhecido';

/**
 * Status de disponibilidade do dado meteorológico
 */
export type WeatherDataStatus = 'forecast' | 'historical_estimate' | 'unavailable';

/**
 * Previsão detalhada de um dia específico
 */
export interface DailyWeatherForecast {
  date: string;                       // 'YYYY-MM-DD'
  tempMin: number | null;             // Temperatura mínima em °C (ou null)
  tempMax: number | null;             // Temperatura máxima em °C (ou null)
  rainProbability: number | null;     // Probabilidade de chuva de 0 a 100% (ou null)
  condition: WeatherCondition;        // Rótulo padronizado em português
  conditionCode: number;              // Código WMO (ex: 0 = limpo, 61 = chuva)
  icon: string;                       // Emoji / identificador de ícone para UI
  hasForecast: boolean;               // true se houver dados numéricos reais
  status: WeatherDataStatus;          // Origem do dado
  windSpeedMaxKmh?: number | null;    // Velocidade máxima do vento (km/h)
  uvIndexMax?: number | null;         // Índice UV máximo
}

/**
 * Resumo consolidado do período para o motor de IA e UI
 */
export interface WeatherSummary {
  avgTempMin: number | null;
  avgTempMax: number | null;
  rainyDaysCount: number;
  dominantCondition: WeatherCondition;
  hasAnyForecast: boolean;
  notes?: string;
}

/**
 * Resposta completa do serviço meteorológico
 */
export interface DestinationWeatherContext {
  destinationCoordinates: {
    latitude: number;
    longitude: number;
  };
  period: {
    startDate: string;
    endDate: string;
    totalDays: number;
  };
  daily: DailyWeatherForecast[];
  summary: WeatherSummary;
  sourceProvider: string;
  retrievedAt: string;                // ISO 8601
  hasError: boolean;                  // true caso tenha ocorrido fallback por falha
  errorMessage?: string;
}
```

---

## 5. Mapeamento de Códigos Meteorológicos (Tabela WMO)

Os códigos padrão da Organização Meteorológica Mundial (WMO Weather Interpretation Codes) são convertidos para o vocabulário canônico do SmartTrip:

| Código WMO | Descrição Original | Condição SmartTrip | Ícone |
|---|---|---|:---:|
| `0` | Céu limpo | `Ensolarado` | ☀️ |
| `1, 2` | Principalmente limpo / Parcialmente nublado | `Parcialmente Nublado` | ⛅ |
| `3` | Encoberto / Nublado | `Nublado` | ☁️ |
| `45, 48` | Nevoeiro / Névoa | `Nublado` | 🌫️ |
| `51, 53, 55` | Garoa leve / moderada | `Chuvoso` | 🌦️ |
| `61, 63, 65` | Chuva fraca / moderada / forte | `Chuvoso` | 🌧️ |
| `71, 73, 75` | Queda de neve | `Neve` | ❄️ |
| `80, 81, 82` | Pancadas de chuva | `Chuvoso` | 🌧️ |
| `95, 96, 99` | Tempestade com ou sem granizo | `Tempestade` | ⛈️ |
| Outros / Falha | Dados indisponíveis | `Desconhecido` | ❓ |

---

## 6. Resiliência: Tolerância a Falhas Sem Derrubar a Aplicação

O princípio fundamental de confiabilidade do SmartTrip é:
> **Falhas no serviço meteorológico não podem, em hipótese alguma, quebrar a aplicação ou impedir a geração de itinerários.**

### 6.1. Mecanismo de Fallback Gracioso
Quando a consulta ao provedor falhar por qualquer motivo (timeout, erro 500 do provedor, offline, quota esgotada):
1. O serviço **não lança exceções não tratadas** para as telas da UI.
2. É retornado um objeto `DestinationWeatherContext` com:
   - `hasError: true`
   - `errorMessage: "Previsão temporariamente indisponível."`
   - Lista diária preenchida para todas as datas do período com `hasForecast: false` e `status: 'unavailable'`.
3. O orquestrador da IA (Google Gemini) é notificado de que o contexto meteorológico está ausente, procedendo com a geração do roteiro com base estritamente nos pontos turísticos e preferências de viagem.

---

## 7. Timeout, Cache e Limites Operacionais

### 7.1. Timeout Estrito
- **Limite:** **5.000ms (5 segundos)**.
- Se a requisição de rede ultrapassar 5 segundos, ela é abortada via `AbortSignal.timeout(5000)` e o fallback gracioso é retornado imediatamente.

### 7.2. Cache em Duas Camadas
1. **L1: Cache em Memória da Sessão (LRU Cache):**
   - Chave: `${lat.toFixed(2)}_${lng.toFixed(2)}_${startDate}_${endDate}`.
   - **TTL:** **3 horas** (previsões meteorológicas têm atualização periódica de poucas horas).
   - Capacidade máxima: 100 consultas.
2. **L2: Respostas Indisponíveis (Negative Caching):**
   - TTL reduzido de **5 minutos** para falhas transitórias de rede, permitindo novas tentativas rápidas.

### 7.3. Limite de Requisições (Rate Limiting)
- Quando utilizando a API pública do Open-Meteo, o cliente respeita a restrição de no máximo 1 consulta simultânea para o mesmo destino.

---

## 8. Experiência do Usuário (UX)

### 8.1. Exibição na Tela de Roteiros (`/trips/[id]`)
- **Card Diário:** Cada dia do itinerário exibe um pill de clima compacto:
  - Ex: `☀️ 26°C / 18°C • 10% chuva`
- **Alerta de Chuva:** Se `rainProbability >= 60%`, um card de aviso surge:
  > 🌧️ *"Previsão de chuva forte para esta quarta-feira. Sugerimos priorizar atrações cobertas."*
- **Dias Sem Previsão (Fora do Horizonte):**
  - Exibição de badge informativo neutro:
    > 📅 *"Data futura (> 16 dias): Previsão meteorológica detalhada disponível mais próximo da viagem."*

---

## 9. Contrato do Provedor (`IWeatherProvider`)

```typescript
export interface IWeatherProvider {
  readonly providerName: string;
  readonly maxForecastDays: number; // Ex: 16 para Open-Meteo

  fetchForecast(request: WeatherForecastRequest): Promise<DailyWeatherForecast[]>;
}
```

### Provedores Planejados:
1. **`OpenMeteoWeatherProvider`**: Provedor aberto que não requer chaves de API, com suporte a latitude, longitude e arrays temporais de `temperature_2m_max`, `temperature_2m_min`, `precipitation_probability_max` e `weather_code`.
2. **`MockWeatherProvider`**: Provedor determinístico para testes unitários com simulação de horizonte, simulação de timeout e injeção de falhas 500.

---

## 10. Critérios de Aceite

### CA-MET-001: Previsão em Horizonte Válido
- **Dado** uma consulta com coordenadas válidas para datas dentro dos próximos 14 dias;
- **Quando** o serviço processar a requisição;
- **Então** cada dia deve conter `tempMin`, `tempMax`, `rainProbability`, `condition` normalizada e `hasForecast: true`.

### CA-MET-002: Previsão Fora do Horizonte
- **Dado** uma viagem planejada para daqui a 6 meses;
- **Quando** o serviço meteorológico for consultado;
- **Então** nenhum dado climático deve ser inventado;
- **E** todas as datas devem ter `hasForecast: false`, `tempMin: null`, `tempMax: null` e `status: 'unavailable'`.

### CA-MET-003: Tolerância a Falhas e Timeout
- **Dado** que a API externa caia ou demore mais de 5.000ms;
- **Então** o serviço deve retornar fallback seguro com `hasError: true`;
- **E** a aplicação web e o gerador de roteiro devem continuar funcionando sem quebrar.

### CA-MET-004: Decodificação WMO
- **Dado** um código WMO `61` (chuva moderada);
- **Então** o normalizador deve traduzir para `condition: 'Chuvoso'` e `icon: '🌧️'`.

### CA-MET-005: Cache em Memória
- **Dado** uma consulta bem-sucedida para o destino Paris no período 12 a 18/10;
- **Quando** a mesma consulta for repetida em menos de 3 horas;
- **Então** o resultado deve ser retornado do cache sem realizar chamadas de rede.

---

## 11. Plano de Testes Automatizados

A suíte em `test-weather-service.ts` deverá validar os seguintes cenários:

| # | Caso de Teste | Descrição da Validação |
|---|---|---|
| **1** | Previsão Válida em Horizonte | Retorno íntegro com temperaturas, probabilidade de chuva e condição normalizada |
| **2** | Datas Fora do Horizonte (> 16 dias) | Retorno explícito de `hasForecast: false` sem inventar clima |
| **3** | Datas Mistas (parcialmente no horizonte) | Dias próximos com previsão e dias distantes explicitamente indisponíveis |
| **4** | Timeout da Rede (5.000ms) | Disparo controlado de fallback sem crash da aplicação |
| **5** | Erro 500 do Provedor Externo | Retorno resiliente com `hasError: true` e flags `unavailable` |
| **6** | Validação de Coordenadas | Rejeição de latitude > 90 ou longitude > 180 com código adequado |
| **7** | Datas Invertidas | Rejeição imediata de `endDate < startDate` |
| **8** | Mapeamento WMO Completo | Validação de conversão de WMO 0, 3, 61, 71, 95 em condições SmartTrip |
| **9** | Cache em Memória | Segunda consulta idêntica não invoca o provedor externo |
| **10**| Resumo do Período | Cálculo correto de `rainyDaysCount`, `avgTempMax` e condição dominante |
