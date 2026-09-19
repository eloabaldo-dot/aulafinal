import {
  WeatherCondition,
  DailyWeatherForecast,
  WeatherSummary,
  WeatherServiceError,
} from '../../types/weather';

/**
 * Decodifica o código padrão WMO (World Meteorological Organization)
 * para o vocabulário canônico do SmartTrip.
 */
export function decodeWmoCode(code: number): { condition: WeatherCondition; icon: string } {
  switch (code) {
    case 0:
      return { condition: 'Ensolarado', icon: '☀️' };
    case 1:
    case 2:
      return { condition: 'Parcialmente Nublado', icon: '⛅' };
    case 3:
    case 45:
    case 48:
      return { condition: 'Nublado', icon: '☁️' };
    case 51:
    case 53:
    case 55:
    case 61:
    case 63:
    case 65:
    case 80:
    case 81:
    case 82:
      return { condition: 'Chuvoso', icon: '🌧️' };
    case 71:
    case 73:
    case 75:
      return { condition: 'Neve', icon: '❄️' };
    case 95:
    case 96:
    case 99:
      return { condition: 'Tempestade', icon: '⛈️' };
    default:
      return { condition: 'Desconhecido', icon: '❓' };
  }
}

/**
 * Valida rigorosamente se as coordenadas estão dentro dos limites do globo terrestre.
 */
export function validateWeatherCoordinates(lat: number, lng: number): void {
  if (
    typeof lat !== 'number' ||
    typeof lng !== 'number' ||
    isNaN(lat) ||
    isNaN(lng) ||
    !isFinite(lat) ||
    !isFinite(lng)
  ) {
    throw new WeatherServiceError(
      'WEATHER_INVALID_COORDINATES',
      `Coordenadas inválidas: lat=${lat}, lng=${lng}. Devem ser números finitos.`
    );
  }

  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    throw new WeatherServiceError(
      'WEATHER_INVALID_COORDINATES',
      `Coordenadas fora dos limites do globo: lat=${lat}, lng=${lng}.`
    );
  }
}

/**
 * Valida o formato ISO e a consistência cronológica das datas.
 */
export function validateDateRange(startDate: string, endDate: string): number {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
    throw new WeatherServiceError(
      'WEATHER_INVALID_DATES',
      `Formato de data inválido: startDate='${startDate}', endDate='${endDate}'. Use 'YYYY-MM-DD'.`
    );
  }

  const start = new Date(startDate + 'T00:00:00Z');
  const end = new Date(endDate + 'T00:00:00Z');

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw new WeatherServiceError('WEATHER_INVALID_DATES', 'Datas informadas são inexistentes no calendário.');
  }

  if (end < start) {
    throw new WeatherServiceError(
      'WEATHER_INVALID_DATES',
      `Data final (${endDate}) não pode ser anterior à data inicial (${startDate}).`
    );
  }

  const diffDays = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  if (diffDays > 14) {
    throw new WeatherServiceError(
      'WEATHER_INVALID_DATES',
      `Intervalo de ${diffDays} dias excede o limite máximo permitido de 14 dias para o MVP.`
    );
  }

  return diffDays;
}

/**
 * Verifica se uma data específica está dentro do horizonte físico de previsão (até 16 dias).
 */
export function isDateWithinForecastHorizon(
  dateStr: string,
  maxDaysAhead = 16,
  referenceDate = new Date()
): boolean {
  const target = new Date(dateStr + 'T00:00:00Z');
  // Zera horas da data de referência
  const ref = new Date(
    Date.UTC(referenceDate.getUTCFullYear(), referenceDate.getUTCMonth(), referenceDate.getUTCDate())
  );

  const diffMs = target.getTime() - ref.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  // Previsões só são confiáveis para dias futuros imediatos até maxDaysAhead
  return diffDays >= 0 && diffDays <= maxDaysAhead;
}

/**
 * Cria explicitamente uma previsão vazia/indisponível para datas fora do horizonte ou com erro.
 * REGRA FUNDAMENTAL: NUNCA inventar dados meteorológicos fictícios.
 */
export function createUnavailableDayForecast(
  date: string,
  status: 'unavailable' | 'historical_estimate' = 'unavailable'
): DailyWeatherForecast {
  return {
    date,
    tempMin: null,
    tempMax: null,
    rainProbability: null,
    condition: 'Desconhecido',
    conditionCode: -1,
    icon: '❓',
    hasForecast: false,
    status,
    windSpeedMaxKmh: null,
    uvIndexMax: null,
  };
}

/**
 * Constrói e valida uma entrada de previsão diária a partir de valores brutos.
 */
export function createDailyForecast(params: {
  date: string;
  tempMin: any;
  tempMax: any;
  rainProbability?: any;
  wmoCode: any;
  windSpeedMaxKmh?: any;
  uvIndexMax?: any;
}): DailyWeatherForecast {
  const { condition, icon } = decodeWmoCode(Number(params.wmoCode));

  const min = typeof params.tempMin === 'number' && !isNaN(params.tempMin) ? Math.round(params.tempMin) : null;
  const max = typeof params.tempMax === 'number' && !isNaN(params.tempMax) ? Math.round(params.tempMax) : null;
  const rain =
    typeof params.rainProbability === 'number' && !isNaN(params.rainProbability)
      ? Math.min(100, Math.max(0, Math.round(params.rainProbability)))
      : null;

  // Se temperatura for nula ou corrompida, trata como indisponível sem inventar
  const hasForecast = min !== null && max !== null;

  return {
    date: params.date,
    tempMin: min,
    tempMax: max,
    rainProbability: rain,
    condition: hasForecast ? condition : 'Desconhecido',
    conditionCode: Number(params.wmoCode) || 0,
    icon: hasForecast ? icon : '❓',
    hasForecast,
    status: hasForecast ? 'forecast' : 'unavailable',
    windSpeedMaxKmh:
      typeof params.windSpeedMaxKmh === 'number' && !isNaN(params.windSpeedMaxKmh)
        ? Math.round(params.windSpeedMaxKmh)
        : null,
    uvIndexMax:
      typeof params.uvIndexMax === 'number' && !isNaN(params.uvIndexMax)
        ? Number(params.uvIndexMax.toFixed(1))
        : null,
  };
}

/**
 * Consolida o resumo climático a partir dos dias processados.
 */
export function buildWeatherSummary(daily: DailyWeatherForecast[]): WeatherSummary {
  const validDays = daily.filter((d) => d.hasForecast && d.tempMin !== null && d.tempMax !== null);

  if (validDays.length === 0) {
    return {
      avgTempMin: null,
      avgTempMax: null,
      rainyDaysCount: 0,
      dominantCondition: 'Desconhecido',
      hasAnyForecast: false,
      notes: 'Previsão indisponível para o período selecionado.',
    };
  }

  const sumMin = validDays.reduce((acc, d) => acc + (d.tempMin || 0), 0);
  const sumMax = validDays.reduce((acc, d) => acc + (d.tempMax || 0), 0);

  const avgTempMin = Math.round(sumMin / validDays.length);
  const avgTempMax = Math.round(sumMax / validDays.length);

  const rainyDaysCount = validDays.filter(
    (d) => d.condition === 'Chuvoso' || d.condition === 'Tempestade' || (d.rainProbability !== null && d.rainProbability >= 60)
  ).length;

  // Determina condição mais frequente
  const frequencyMap: Record<string, number> = {};
  validDays.forEach((d) => {
    frequencyMap[d.condition] = (frequencyMap[d.condition] || 0) + 1;
  });

  let dominantCondition: WeatherCondition = 'Ensolarado';
  let highestCount = 0;
  for (const [cond, count] of Object.entries(frequencyMap)) {
    if (count > highestCount) {
      highestCount = count;
      dominantCondition = cond as WeatherCondition;
    }
  }

  let notes = `Clima predominantemente ${dominantCondition.toLowerCase()}.`;
  if (rainyDaysCount > 0) {
    notes += ` Possibilidade de chuva em ${rainyDaysCount} dia(s).`;
  }

  return {
    avgTempMin,
    avgTempMax,
    rainyDaysCount,
    dominantCondition,
    hasAnyForecast: true,
    notes,
  };
}
