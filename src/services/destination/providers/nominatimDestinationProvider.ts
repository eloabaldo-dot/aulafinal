import {
  IDestinationProvider,
  NormalizedDestination,
  DestinationSearchOptions,
  DestinationServiceError,
} from '../../../types/destination';
import { normalizeNominatimResult } from '../normalizer';

export class NominatimDestinationProvider implements IDestinationProvider {
  public readonly providerName = 'nominatim';
  private readonly baseUrl = 'https://nominatim.openstreetmap.org/search';

  async search(query: string, options?: DestinationSearchOptions): Promise<NormalizedDestination[]> {
    const language = options?.language || 'pt-BR';
    const limit = options?.limit || 5;

    const url = new URL(this.baseUrl);
    url.searchParams.set('q', query);
    url.searchParams.set('format', 'jsonv2');
    url.searchParams.set('addressdetails', '1');
    url.searchParams.set('limit', String(limit));
    url.searchParams.set('accept-language', language);

    if (options?.countryCodes && options.countryCodes.length > 0) {
      url.searchParams.set('countrycodes', options.countryCodes.join(',').toLowerCase());
    }

    try {
      const response = await fetch(url.toString(), {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'SmartTripApp/1.0 (contato@smarttrip.com)',
        },
        signal: options?.signal,
      });

      if (!response.ok) {
        if (response.status === 429) {
          throw new DestinationServiceError(
            'GEO_RATE_LIMITED',
            'Limite de requisições excedido no provedor de mapas (HTTP 429).'
          );
        }
        if (response.status >= 500) {
          throw new DestinationServiceError(
            'GEO_PROVIDER_UNAVAILABLE',
            `Provedor de mapas indisponível (HTTP ${response.status}).`
          );
        }
        throw new DestinationServiceError(
          'GEO_NETWORK_ERROR',
          `Erro HTTP na consulta geográfica: ${response.status} ${response.statusText}`
        );
      }

      const rawData = await response.json();
      if (!Array.isArray(rawData)) {
        throw new DestinationServiceError(
          'GEO_INCOMPLETE_RESPONSE',
          'Formato de resposta inesperado do provedor Nominatim.'
        );
      }

      const results: NormalizedDestination[] = [];
      for (const item of rawData) {
        try {
          const normalized = normalizeNominatimResult(item);
          results.push(normalized);
        } catch {
          // Itens parciais ou sem dados municipais são descartados graciosamente
        }
      }

      return results;
    } catch (err: any) {
      if (err instanceof DestinationServiceError) {
        throw err;
      }
      if (err.name === 'AbortError') {
        throw err;
      }
      throw new DestinationServiceError(
        'GEO_NETWORK_ERROR',
        `Falha de conexão com o serviço de geocodificação: ${err.message}`,
        err
      );
    }
  }
}
