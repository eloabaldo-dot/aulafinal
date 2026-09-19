/**
 * Tipos e Contratos do Serviço Meteorológico do SmartTrip
 * Conforme especificado em docs/specs/weather-service-spec.md
 */

export type WeatherCondition =
  | 'Ensolarado'
  | 'Parcialmente Nublado'
  | 'Nublado'
  | 'Chuvoso'
  | 'Tempestade'
  | 'Neve'
  | 'Desconhecido';

export type WeatherDataStatus = 'forecast' | 'historical_estimate' | 'unavailable';

export interface DailyWeatherForecast {
  date: string; // 'YYYY-MM-DD'
  tempMin: number | null;
  tempMax: number | null;
  rainProbability: number | null; // 0 a 100%
  condition: WeatherCondition;
  conditionCode: number; // Código WMO
  icon: string;
  hasForecast: boolean;
  status: WeatherDataStatus;
  windSpeedMaxKmh?: number | null;
  uvIndexMax?: number | null;
}

export interface WeatherSummary {
  avgTempMin: number | null;
  avgTempMax: number | null;
  rainyDaysCount: number;
  dominantCondition: WeatherCondition;
  hasAnyForecast: boolean;
  notes?: string;
}

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
  retrievedAt: string;
  hasError: boolean;
  errorMessage?: string;
}

export interface WeatherForecastRequest {
  latitude: number;
  longitude: number;
  startDate: string;
  endDate: string;
  signal?: AbortSignal;
}

export type WeatherErrorCode =
  | 'WEATHER_INVALID_COORDINATES'
  | 'WEATHER_INVALID_DATES'
  | 'WEATHER_TIMEOUT'
  | 'WEATHER_RATE_LIMITED'
  | 'WEATHER_NETWORK_ERROR'
  | 'WEATHER_PROVIDER_UNAVAILABLE'
  | 'WEATHER_INCOMPLETE_RESPONSE';

export class WeatherServiceError extends Error {
  public readonly code: WeatherErrorCode;
  public readonly originalError?: unknown;

  constructor(code: WeatherErrorCode, message: string, originalError?: unknown) {
    super(message);
    this.name = 'WeatherServiceError';
    this.code = code;
    this.originalError = originalError;
  }
}

export interface IWeatherProvider {
  readonly providerName: string;
  readonly maxForecastDays: number; // Horizonte máximo confiável (ex: 16)
  fetchForecast(request: WeatherForecastRequest): Promise<DailyWeatherForecast[]>;
}
