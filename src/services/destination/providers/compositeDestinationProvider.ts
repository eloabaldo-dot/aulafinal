import {
  IDestinationProvider,
  NormalizedDestination,
  DestinationSearchOptions,
} from '../../../types/destination';
import { NominatimDestinationProvider } from './nominatimDestinationProvider';
import { MockDestinationProvider } from './mockDestinationProvider';

/**
 * Provedor Composto Inteligente:
 * 1. Em ambiente Browser: consulta /api/destinations (proxy interno sem bloqueio de headers)
 * 2. Se falhar ou em Node.js: tenta Nominatim diretamente (OpenStreetMap)
 * 3. Fallback gracioso: consulta banco local enriquecido (MockDestinationProvider com capitais globais e brasileiras)
 */
export class CompositeDestinationProvider implements IDestinationProvider {
  public readonly providerName = 'composite';
  private nominatimProvider: NominatimDestinationProvider;
  private mockProvider: MockDestinationProvider;

  constructor() {
    this.nominatimProvider = new NominatimDestinationProvider();
    this.mockProvider = new MockDestinationProvider();
  }

  async search(query: string, options?: DestinationSearchOptions): Promise<NormalizedDestination[]> {
    const isBrowser = typeof window !== 'undefined' && typeof window.fetch === 'function';

    // 1. Em ambiente de navegador: tenta o endpoint interno /api/destinations
    if (isBrowser) {
      try {
        const url = new URL('/api/destinations', window.location.origin);
        url.searchParams.set('query', query);
        if (options?.limit) url.searchParams.set('limit', String(options.limit));
        if (options?.language) url.searchParams.set('language', options.language);

        const res = await fetch(url.toString(), {
          signal: options?.signal,
        });

        if (res.ok) {
          const body = await res.json();
          if (Array.isArray(body.destinations) && body.destinations.length > 0) {
            return body.destinations;
          }
        }
      } catch (err: any) {
        if (err.name === 'AbortError') throw err;
        console.warn('[CompositeDestinationProvider] Falha ao consultar /api/destinations, tentando fallback local...', err);
      }
    }

    // 2. Se não estiver no browser ou se a API local falhar, tenta Nominatim diretamente
    try {
      const results = await this.nominatimProvider.search(query, options);
      if (results && results.length > 0) {
        return results;
      }
    } catch (err: any) {
      if (err.name === 'AbortError') throw err;
      // Prossiga para o fallback mock
    }

    // 3. Fallback de alta disponibilidade: Banco de dados local rico
    return this.mockProvider.search(query, options);
  }
}
