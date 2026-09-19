import { weatherService, WeatherServiceError } from '../../services/weatherService';

/**
 * Handler HTTP para a rota /api/weather
 * Compatível com Express, Next.js API Routes e middlewares de desenvolvimento Vite.
 *
 * Garante que chaves privadas (ex: WEATHER_API_KEY) jamais vazem para o cliente.
 */
export async function handleWeatherApiRequest(req: {
  query?: Record<string, any>;
  url?: string;
}): Promise<{
  status: number;
  headers: Record<string, string>;
  body: any;
}> {
  try {
    let query: Record<string, any> = req.query || {};

    // Se req.url for fornecido e query estiver vazio, analisa URL
    if (req.url && (!req.query || Object.keys(req.query).length === 0)) {
      const parsedUrl = new URL(req.url, 'http://localhost');
      query = Object.fromEntries(parsedUrl.searchParams.entries());
    }

    const { latitude, longitude, startDate, endDate } = query;

    if (!latitude || !longitude || !startDate || !endDate) {
      return {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
        body: {
          error: 'invalid_request',
          message: 'Parâmetros obrigatórios ausentes: latitude, longitude, startDate, endDate.',
        },
      };
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
        body: {
          error: 'invalid_coordinates',
          message: `Coordenadas inválidas: latitude=${latitude}, longitude=${longitude}.`,
        },
      };
    }

    // Executa a busca através do WeatherService com resiliência
    const weatherContext = await weatherService.getDestinationWeather({
      latitude: lat,
      longitude: lng,
      startDate: String(startDate),
      endDate: String(endDate),
    });

    return {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=10800', // 3 horas de cache
      },
      body: weatherContext,
    };
  } catch (err: any) {
    if (err instanceof WeatherServiceError && (err.code === 'WEATHER_INVALID_COORDINATES' || err.code === 'WEATHER_INVALID_DATES')) {
      return {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
        body: {
          error: err.code,
          message: err.message,
        },
      };
    }

    return {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
      body: {
        error: 'internal_server_error',
        message: err.message || 'Erro inesperado ao consultar serviço meteorológico.',
      },
    };
  }
}
