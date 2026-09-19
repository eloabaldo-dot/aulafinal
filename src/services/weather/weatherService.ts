import {
  IWeatherProvider,
  DestinationWeatherContext,
  WeatherForecastRequest,
  WeatherServiceError,
} from '../../types/weather';
import {
  validateWeatherCoordinates,
  validateDateRange,
  buildWeatherSummary,
  createUnavailableDayForecast,
} from './normalizer';
import { MockWeatherProvider } from './providers/mockWeatherProvider';
import { OpenMeteoWeatherProvider } from './providers/openMeteoWeatherProvider';

interface CacheEntry {
  data: DestinationWeatherContext;
  timestamp: number;
}

export class WeatherService {
  private provider: IWeatherProvider;
  private cache: Map<string, CacheEntry> = new Map();
  private readonly maxCacheSize = 100;
  private readonly cacheTtlMs = 3 * 60 * 60 * 1000; // 3 horas de TTL
  private readonly timeoutMs: number;

  constructor(options?: {
    provider?: IWeatherProvider;
    timeoutMs?: number;
  }) {
    this.provider = options?.provider || new OpenMeteoWeatherProvider();
    this.timeoutMs = options?.timeoutMs ?? 5000;
  }

  public setProvider(provider: IWeatherProvider): void {
    this.provider = provider;
  }

  public getProvider(): IWeatherProvider {
    return this.provider;
  }

  public clearCache(): void {
    this.cache.clear();
  }

  public getCacheSize(): number {
    return this.cache.size;
  }

  /**
   * Obtém a previsão normalizada para um destino e período.
   * Tolerância a falhas: se a rede ou provedor falharem, retorna fallback gracioso sem quebrar o app.
   */
  async getDestinationWeather(
    request: WeatherForecastRequest,
    options?: { throwOnError?: boolean }
  ): Promise<DestinationWeatherContext> {
    const { latitude, longitude, startDate, endDate, signal } = request;

    // 1. Validações estritas de entrada
    validateWeatherCoordinates(latitude, longitude);
    const totalDays = validateDateRange(startDate, endDate);

    // 2. Verificação de Cache LRU
    const cacheKey = `${latitude.toFixed(2)}_${longitude.toFixed(2)}_${startDate}_${endDate}`;
    const cached = this.cache.get(cacheKey);
    const now = Date.now();
    if (cached && now - cached.timestamp < this.cacheTtlMs) {
      this.cache.delete(cacheKey);
      this.cache.set(cacheKey, cached);
      return cached.data;
    }

    // 3. Controle de Timeout com AbortController
    const controller = new AbortController();
    let isTimeout = false;
    const timeoutTimer = setTimeout(() => {
      isTimeout = true;
      controller.abort();
    }, this.timeoutMs);

    if (signal) {
      signal.addEventListener('abort', () => {
        clearTimeout(timeoutTimer);
        controller.abort();
      });
    }

    try {
      // 4. Chamada ao Provedor Ativo
      const dailyForecasts = await this.provider.fetchForecast({
        latitude,
        longitude,
        startDate,
        endDate,
        signal: controller.signal,
      });

      clearTimeout(timeoutTimer);

      const summary = buildWeatherSummary(dailyForecasts);
      const context: DestinationWeatherContext = {
        destinationCoordinates: { latitude, longitude },
        period: { startDate, endDate, totalDays },
        daily: dailyForecasts,
        summary,
        sourceProvider: this.provider.providerName,
        retrievedAt: new Date().toISOString(),
        hasError: false,
      };

      // 5. Armazena no Cache LRU
      if (this.cache.size >= this.maxCacheSize) {
        const oldestKey = this.cache.keys().next().value;
        if (oldestKey) {
          this.cache.delete(oldestKey);
        }
      }
      this.cache.set(cacheKey, { data: context, timestamp: Date.now() });

      return context;
    } catch (err: any) {
      clearTimeout(timeoutTimer);

      let serviceError: WeatherServiceError;
      if (isTimeout || err.name === 'TimeoutError') {
        serviceError = new WeatherServiceError(
          'WEATHER_TIMEOUT',
          `Tempo limite excedido (${this.timeoutMs}ms) ao consultar o serviço meteorológico.`,
          err
        );
      } else if (err instanceof WeatherServiceError) {
        serviceError = err;
      } else {
        serviceError = new WeatherServiceError(
          'WEATHER_PROVIDER_UNAVAILABLE',
          `Falha ao obter previsão: ${err.message}`,
          err
        );
      }

      if (options?.throwOnError) {
        throw serviceError;
      }

      // 6. Resiliência: Fallback Gracioso que NÃO derruba a aplicação
      const fallbackDays = [];
      const start = new Date(startDate + 'T00:00:00Z');
      for (let i = 0; i < totalDays; i++) {
        const cur = new Date(start.getTime() + i * 24 * 60 * 60 * 1000);
        fallbackDays.push(createUnavailableDayForecast(cur.toISOString().slice(0, 10), 'unavailable'));
      }

      return {
        destinationCoordinates: { latitude, longitude },
        period: { startDate, endDate, totalDays },
        daily: fallbackDays,
        summary: buildWeatherSummary(fallbackDays),
        sourceProvider: this.provider.providerName,
        retrievedAt: new Date().toISOString(),
        hasError: true,
        errorMessage: serviceError.message,
      };
    }
  }
}

// Instância padrão do serviço meteorológico
export const weatherService = new WeatherService({
  provider: new MockWeatherProvider(), // Inicializa com Mock e pode alternar para Open-Meteo
});
