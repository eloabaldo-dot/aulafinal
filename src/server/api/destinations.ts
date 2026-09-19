import { destinationService, NominatimDestinationProvider, MockDestinationProvider, sanitizeSearchQuery } from '../../services/destinationService';
import { NormalizedDestination } from '../../types/destination';

const nominatimProvider = new NominatimDestinationProvider();
const mockProvider = new MockDestinationProvider();

export async function handleDestinationApiRequest(req: { url: string }): Promise<{
  status: number;
  headers: Record<string, string>;
  body: { destinations?: NormalizedDestination[]; error?: string; message?: string };
}> {
  try {
    const url = new URL(req.url, 'http://localhost:3000');
    const query = url.searchParams.get('query') || url.searchParams.get('q') || '';
    const limitParam = url.searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : 6;
    const language = url.searchParams.get('language') || 'pt-BR';

    const clean = sanitizeSearchQuery(query);
    if (!clean || clean.length < 2) {
      return {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: { destinations: [] },
      };
    }

    let results: NormalizedDestination[] = [];

    // Tenta Nominatim primeiro (OpenStreetMap com User-Agent de servidor)
    try {
      results = await nominatimProvider.search(clean, {
        query: clean,
        limit,
        language,
      });
    } catch (nominatimErr) {
      console.warn('[Server Destinations API] Nominatim falhou ou rate-limited, usando fallback:', nominatimErr);
    }

    // Se nenhum resultado do Nominatim (ou erro), busca no banco mock
    if (!results || results.length === 0) {
      results = await mockProvider.search(clean, {
        query: clean,
        limit,
        language,
      });
    }

    return {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=3600',
      },
      body: { destinations: results },
    };
  } catch (err: any) {
    return {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
      body: { error: 'destination_search_failed', message: err.message },
    };
  }
}
