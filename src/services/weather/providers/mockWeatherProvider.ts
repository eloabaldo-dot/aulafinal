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

export class MockWeatherProvider implements IWeatherProvider {
  public readonly providerName = 'mock_weather';
  public readonly maxForecastDays = 16;

  private forceDelayMs = 0;
  private forceError?: { status: number; message: string };
  private forcePartial = false;
  private customReferenceDate?: Date;

  public setDelay(ms: number) {
    this.forceDelayMs = ms;
  }

  public setForceError(error?: { status: number; message: string }) {
    this.forceError = error;
  }

  public setForcePartial(partial: boolean) {
    this.forcePartial = partial;
  }

  public setReferenceDate(date?: Date) {
    this.customReferenceDate = date;
  }

  async fetchForecast(request: WeatherForecastRequest): Promise<DailyWeatherForecast[]> {
    if (this.forceDelayMs > 0) {
      await new Promise((resolve, reject) => {
        const timer = setTimeout(resolve, this.forceDelayMs);
        if (request.signal) {
          request.signal.addEventListener('abort', () => {
            clearTimeout(timer);
            reject(new DOMException('This operation was aborted', 'AbortError'));
          });
        }
      });
    }

    if (this.forceError) {
      if (this.forceError.status === 429) {
        throw new WeatherServiceError('WEATHER_RATE_LIMITED', this.forceError.message);
      }
      throw new WeatherServiceError('WEATHER_PROVIDER_UNAVAILABLE', this.forceError.message);
    }

    const start = new Date(request.startDate + 'T00:00:00Z');
    const end = new Date(request.endDate + 'T00:00:00Z');
    const daysCount = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    const results: DailyWeatherForecast[] = [];
    const refDate = this.customReferenceDate || new Date();

    for (let i = 0; i < daysCount; i++) {
      const current = new Date(start.getTime() + i * 24 * 60 * 60 * 1000);
      const dateStr = current.toISOString().slice(0, 10);

      // Verificação estrita de horizonte: datas > 16 dias não recebem dados inventados!
      const withinHorizon = isDateWithinForecastHorizon(dateStr, this.maxForecastDays, refDate);

      if (!withinHorizon) {
        results.push(createUnavailableDayForecast(dateStr, 'unavailable'));
        continue;
      }

      if (this.forcePartial && i === 1) {
        // Simula resposta com dados corrompidos/incompletos no dia 2
        results.push(
          createDailyForecast({
            date: dateStr,
            tempMin: NaN,
            tempMax: null,
            wmoCode: -1,
          })
        );
        continue;
      }

      // Previsão determinística e realista dentro do horizonte
      const isRainy = i % 3 === 2;
      results.push(
        createDailyForecast({
          date: dateStr,
          tempMin: 18 + (i % 4),
          tempMax: 26 + (i % 5),
          rainProbability: isRainy ? 75 : 15,
          wmoCode: isRainy ? 61 : 0, // 61 = chuva, 0 = limpo
          windSpeedMaxKmh: 14 + i,
          uvIndexMax: 6.5,
        })
      );
    }

    return results;
  }
}
