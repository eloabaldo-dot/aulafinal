import {
  IWeatherProvider,
  WeatherForecastRequest,
  DailyWeatherForecast,
  WeatherServiceError,
} from '../../../types/weather';
import {
  createDailyForecast,
  createUnavailableDayForecast,
  isDateWithinForecastHorizon,
} from '../normalizer';

export class OpenMeteoWeatherProvider implements IWeatherProvider {
  public readonly providerName = 'open_meteo';
  public readonly maxForecastDays = 16;
  private readonly baseUrl = 'https://api.open-meteo.com/v1/forecast';

  async fetchForecast(request: WeatherForecastRequest): Promise<DailyWeatherForecast[]> {
    const { latitude, longitude, startDate, endDate, signal } = request;

    // Constrói URL com os campos diários estritamente necessários
    const url = new URL(this.baseUrl);
    url.searchParams.set('latitude', latitude.toFixed(4));
    url.searchParams.set('longitude', longitude.toFixed(4));
    url.searchParams.set(
      'daily',
      'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max,uv_index_max'
    );
    url.searchParams.set('timezone', 'auto');
    url.searchParams.set('start_date', startDate);
    url.searchParams.set('end_date', endDate);

    // Se houver chave corporativa (ex: Open-Meteo Commercial), obtém estritamente server-side
    const serverApiKey = typeof process !== 'undefined' ? process.env?.WEATHER_API_KEY : undefined;
    if (serverApiKey) {
      url.searchParams.set('apikey', serverApiKey);
    }

    try {
      const response = await fetch(url.toString(), {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'SmartTripApp/1.0 (clima@smarttrip.com)',
        },
        signal,
      });

      if (!response.ok) {
        if (response.status === 429) {
          throw new WeatherServiceError(
            'WEATHER_RATE_LIMITED',
            'Limite de requisições excedido no provedor meteorológico (HTTP 429).'
          );
        }
        if (response.status >= 500) {
          throw new WeatherServiceError(
            'WEATHER_PROVIDER_UNAVAILABLE',
            `Provedor de clima indisponível (HTTP ${response.status}).`
          );
        }

        // Se o provedor retornar 400 por data fora de alcance, não derruba o app: retorna dias indisponíveis
        const errJson = await response.json().catch(() => ({}));
        if (response.status === 400 && errJson.reason?.includes('out of bounds')) {
          const start = new Date(startDate + 'T00:00:00Z');
          const end = new Date(endDate + 'T00:00:00Z');
          const totalDays = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
          const fallback: DailyWeatherForecast[] = [];
          for (let i = 0; i < totalDays; i++) {
            const cur = new Date(start.getTime() + i * 24 * 60 * 60 * 1000);
            fallback.push(createUnavailableDayForecast(cur.toISOString().slice(0, 10)));
          }
          return fallback;
        }

        throw new WeatherServiceError(
          'WEATHER_NETWORK_ERROR',
          `Erro na consulta ao provedor meteorológico: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      if (!data.daily || !Array.isArray(data.daily.time)) {
        throw new WeatherServiceError(
          'WEATHER_INCOMPLETE_RESPONSE',
          'Resposta meteorológica sem campos diários estruturados.'
        );
      }

      const daily = data.daily;
      const forecasts: DailyWeatherForecast[] = [];

      for (let i = 0; i < daily.time.length; i++) {
        const dateStr = daily.time[i];

        // Se a data estiver além do horizonte físico, marca explicitamente como ausente
        if (!isDateWithinForecastHorizon(dateStr, this.maxForecastDays)) {
          forecasts.push(createUnavailableDayForecast(dateStr));
          continue;
        }

        forecasts.push(
          createDailyForecast({
            date: dateStr,
            tempMin: daily.temperature_2m_min?.[i],
            tempMax: daily.temperature_2m_max?.[i],
            rainProbability: daily.precipitation_probability_max?.[i],
            wmoCode: daily.weather_code?.[i],
            windSpeedMaxKmh: daily.wind_speed_10m_max?.[i],
            uvIndexMax: daily.uv_index_max?.[i],
          })
        );
      }

      return forecasts;
    } catch (err: any) {
      if (err instanceof WeatherServiceError) {
        throw err;
      }
      if (err.name === 'AbortError') {
        throw err;
      }
      throw new WeatherServiceError(
        'WEATHER_NETWORK_ERROR',
        `Falha de conexão com a API meteorológica: ${err.message}`,
        err
      );
    }
  }
}
