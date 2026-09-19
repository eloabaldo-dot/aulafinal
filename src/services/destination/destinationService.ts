import {
  IDestinationProvider,
  NormalizedDestination,
  DestinationSearchOptions,
  DestinationServiceError,
} from '../../types/destination';
import { sanitizeSearchQuery } from './normalizer';
import { MockDestinationProvider } from './providers/mockDestinationProvider';
import { NominatimDestinationProvider } from './providers/nominatimDestinationProvider';
import { CompositeDestinationProvider } from './providers/compositeDestinationProvider';

interface CacheEntry {
  data: NormalizedDestination[];
  timestamp: number;
}

export class DestinationService {
  private provider: IDestinationProvider;
  private cache: Map<string, CacheEntry> = new Map();
  private readonly maxCacheSize = 100;
  private readonly cacheTtlMs = 60 * 60 * 1000; // 1 hora
  private readonly timeoutMs: number;
  private lastRequestTime = 0;
  private readonly minRequestIntervalMs: number;

  constructor(options?: {
    provider?: IDestinationProvider;
    timeoutMs?: number;
    minRequestIntervalMs?: number;
  }) {
    // Provedor padrão: Mock em testes/desenvolvimento ou Nominatim
    this.provider = options?.provider || new NominatimDestinationProvider();
    this.timeoutMs = options?.timeoutMs ?? 5000;
    this.minRequestIntervalMs = options?.minRequestIntervalMs ?? 0;
  }

  public setProvider(provider: IDestinationProvider): void {
    this.provider = provider;
  }

  public getProvider(): IDestinationProvider {
    return this.provider;
  }

  public clearCache(): void {
    this.cache.clear();
  }

  public getCacheSize(): number {
    return this.cache.size;
  }

  /**
   * Executa a busca com validação de entrada, cache, rate limit e timeout
   */
  async searchDestinations(
    rawQuery: string,
    options?: Omit<DestinationSearchOptions, 'query'>
  ): Promise<NormalizedDestination[]> {
    // 1. Sanitização
    const sanitized = sanitizeSearchQuery(rawQuery || '');

    // 2. Regra de Limite Mínimo de Caracteres (< 3 letras retorna vazio)
    if (sanitized.length < 3) {
      return [];
    }

    const language = options?.language || 'pt-BR';
    const limit = options?.limit || 5;
    const cacheKey = `${sanitized.toLowerCase()}_${language}_${limit}`;

    // 3. Verificação de Cache LRU (L1)
    const cached = this.cache.get(cacheKey);
    const now = Date.now();
    if (cached && now - cached.timestamp < this.cacheTtlMs) {
      // Reinsere para manter a semântica LRU
      this.cache.delete(cacheKey);
      this.cache.set(cacheKey, cached);
      return cached.data;
    }

    // 4. Rate Limiting / Throttling se aplicável
    if (this.minRequestIntervalMs > 0) {
      const elapsed = now - this.lastRequestTime;
      if (elapsed < this.minRequestIntervalMs) {
        await new Promise((resolve) => setTimeout(resolve, this.minRequestIntervalMs - elapsed));
      }
    }
    this.lastRequestTime = Date.now();

    // 5. Configuração de Timeout com AbortController
    const controller = new AbortController();
    let isTimeout = false;
    const timeoutHandle = setTimeout(() => {
      isTimeout = true;
      controller.abort();
    }, this.timeoutMs);

    if (options?.signal) {
      options.signal.addEventListener('abort', () => {
        clearTimeout(timeoutHandle);
        controller.abort();
      });
    }

    try {
      const results = await this.provider.search(sanitized, {
        query: sanitized,
        language,
        limit,
        countryCodes: options?.countryCodes,
        signal: controller.signal,
      });

      clearTimeout(timeoutHandle);

      // 6. Armazenamento no Cache LRU
      if (this.cache.size >= this.maxCacheSize) {
        const oldestKey = this.cache.keys().next().value;
        if (oldestKey) {
          this.cache.delete(oldestKey);
        }
      }
      this.cache.set(cacheKey, { data: results, timestamp: Date.now() });

      return results;
    } catch (err: any) {
      clearTimeout(timeoutHandle);

      if (isTimeout || err.name === 'TimeoutError') {
        throw new DestinationServiceError(
          'GEO_TIMEOUT',
          `A busca pelo destino '${sanitized}' excedeu o tempo limite de resposta (${this.timeoutMs}ms).`,
          err
        );
      }

      if (err.name === 'AbortError') {
        throw err;
      }

      if (err instanceof DestinationServiceError) {
        throw err;
      }

      throw new DestinationServiceError(
        'GEO_PROVIDER_UNAVAILABLE',
        `Erro ao buscar destinos: ${err.message}`,
        err
      );
    }
  }

  /**
   * Converte uma entidade normalizada para o contrato de contexto do MVP (DestinationContext)
   */
  public toDestinationContext(
    dest: NormalizedDestination,
    extra?: {
      imageUrl?: string;
      description?: string;
      weather?: {
        temperature: number;
        condition: 'Ensolarado' | 'Chuvoso' | 'Nublado' | 'Agradável';
        icon?: string;
      };
      highlights?: string[];
    }
  ) {
    return {
      id: dest.id,
      name: dest.name,
      country: dest.address.country,
      latitude: dest.coordinates.latitude,
      longitude: dest.coordinates.longitude,
      imageUrl:
        extra?.imageUrl ||
        'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=800&q=80',
      description:
        extra?.description ||
        `Destino fascinante localizado em ${dest.address.stateOrRegion ? dest.address.stateOrRegion + ', ' : ''}${dest.address.country}.`,
      weather: {
        temperature: extra?.weather?.temperature ?? 22,
        condition: extra?.weather?.condition ?? ('Agradável' as const),
        icon: extra?.weather?.icon ?? '☀️',
      },
      highlights: extra?.highlights || [
        `Centro Histórico de ${dest.name}`,
        'Gastronomia Local',
        'Mirante e Parques',
      ],
    };
  }
}

// Instância padrão compartilhada do serviço (Provedor Composto com resolução global e fallback)
export const destinationService = new DestinationService({
  provider: new CompositeDestinationProvider(),
});
