import { poiService, PoiServiceError, PoiCategory } from '../../services/poiService';

/**
 * Handler HTTP server-side para a rota /api/pois
 * Mantém qualquer chave privada ou segredo estritamente no backend.
 */
export async function handlePoiApiRequest(req: {
  query?: Record<string, any>;
  url?: string;
}): Promise<{
  status: number;
  headers: Record<string, string>;
  body: any;
}> {
  try {
    let query: Record<string, any> = req.query || {};

    if (req.url && (!req.query || Object.keys(req.query).length === 0)) {
      const parsedUrl = new URL(req.url, 'http://localhost');
      query = Object.fromEntries(parsedUrl.searchParams.entries());
    }

    const { latitude, longitude, categories, radiusMeters, limit } = query;

    if (!latitude || !longitude) {
      return {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
        body: {
          error: 'invalid_request',
          message: 'Parâmetros obrigatórios ausentes: latitude e longitude.',
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

    let parsedCategories: PoiCategory[] | undefined;
    if (categories) {
      if (Array.isArray(categories)) {
        parsedCategories = categories as PoiCategory[];
      } else if (typeof categories === 'string') {
        parsedCategories = categories.split(',').map((c) => c.trim()) as PoiCategory[];
      }
    }

    const parsedRadius = radiusMeters ? parseInt(radiusMeters, 10) : undefined;
    const parsedLimit = limit ? parseInt(limit, 10) : undefined;

    const response = await poiService.searchPois({
      latitude: lat,
      longitude: lng,
      categories: parsedCategories,
      radiusMeters: parsedRadius,
      limit: parsedLimit,
    });

    return {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=86400', // 24 horas de cache
      },
      body: response,
    };
  } catch (err: any) {
    if (err instanceof PoiServiceError && err.code === 'POI_INVALID_COORDINATES') {
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
        message: err.message || 'Erro inesperado ao consultar pontos de interesse.',
      },
    };
  }
}
