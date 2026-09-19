import {
  IPoiProvider,
  NormalizedPoi,
  PoiSearchRequest,
  PoiSearchResponse,
  PoiServiceError,
} from '../../types/poi';
import { deduplicatePois, calculateHaversineDistance } from './normalizer';
import { MockPoiProvider } from './providers/mockPoiProvider';
import { OverpassPoiProvider } from './providers/overpassPoiProvider';

interface CacheEntry {
  data: PoiSearchResponse;
  timestamp: number;
}

export class PoiService {
  private provider: IPoiProvider;
  private cache: Map<string, CacheEntry> = new Map();
  private readonly maxCacheSize = 150;
  private readonly cacheTtlMs = 24 * 60 * 60 * 1000; // 24 horas de TTL
  private readonly timeoutMs: number;

  constructor(options?: {
    provider?: IPoiProvider;
    timeoutMs?: number;
  }) {
    this.provider = options?.provider || new OverpassPoiProvider();
    this.timeoutMs = options?.timeoutMs ?? 6000;
  }

  public setProvider(provider: IPoiProvider): void {
    this.provider = provider;
  }

  public getProvider(): IPoiProvider {
    return this.provider;
  }

  public clearCache(): void {
    this.cache.clear();
  }

  public getCacheSize(): number {
    return this.cache.size;
  }

  /**
   * Busca pontos de interesse com validação geográfica, deduplicação espacial e cache LRU
   */
  async searchPois(
    request: PoiSearchRequest,
    options?: { throwOnError?: boolean }
  ): Promise<PoiSearchResponse> {
    const { latitude, longitude, categories, radiusMeters = 5000, limit = 20, signal } = request;

    // 1. Validação de Coordenadas
    if (
      typeof latitude !== 'number' ||
      typeof longitude !== 'number' ||
      isNaN(latitude) ||
      isNaN(longitude) ||
      !isFinite(latitude) ||
      !isFinite(longitude) ||
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      throw new PoiServiceError(
        'POI_INVALID_COORDINATES',
        `Coordenadas geográficas inválidas: latitude=${latitude}, longitude=${longitude}.`
      );
    }

    // 2. Verificação de Cache LRU (24 horas)
    const sortedCategories = categories ? [...categories].sort().join('_') : 'all';
    const cacheKey = `pois_${latitude.toFixed(2)}_${longitude.toFixed(2)}_${radiusMeters}_${sortedCategories}_${limit}`;
    const cached = this.cache.get(cacheKey);
    const now = Date.now();
    if (cached && now - cached.timestamp < this.cacheTtlMs) {
      this.cache.delete(cacheKey);
      this.cache.set(cacheKey, cached);
      return cached.data;
    }

    // 3. Controle de Timeout com AbortController
    const controller = new AbortController();
    let isTimeout = false;
    const timeoutTimer = setTimeout(() => {
      isTimeout = true;
      controller.abort();
    }, this.timeoutMs);

    if (signal) {
      signal.addEventListener('abort', () => {
        clearTimeout(timeoutTimer);
        controller.abort();
      });
    }

    try {
      // 4. Chamada ao Provedor
      const rawPois = await this.provider.fetchPois({
        latitude,
        longitude,
        categories,
        radiusMeters,
        limit: limit * 2, // Solicita margem para compensar deduplicação
        signal: controller.signal,
      });

      clearTimeout(timeoutTimer);

      // 5. Deduplicação Espacial (< 50m) e cálculo de distâncias
      const center = { latitude, longitude };
      const deduplicated = deduplicatePois(rawPois, 50);

      const processedPois = deduplicated.map((p) => ({
        ...p,
        distanceMeters:
          p.distanceMeters ??
          calculateHaversineDistance(center.latitude, center.longitude, p.latitude, p.longitude),
      }));

      // Ordena por proximidade do centro
      processedPois.sort((a, b) => (a.distanceMeters || 0) - (b.distanceMeters || 0));
      const limitedPois = processedPois.slice(0, limit);

      const response: PoiSearchResponse = {
        center,
        radiusMeters,
        total: limitedPois.length,
        pois: limitedPois,
        sourceProvider: this.provider.providerName,
        retrievedAt: new Date().toISOString(),
        hasError: false,
      };

      // 6. Armazena no Cache LRU
      if (this.cache.size >= this.maxCacheSize) {
        const oldestKey = this.cache.keys().next().value;
        if (oldestKey) this.cache.delete(oldestKey);
      }
      this.cache.set(cacheKey, { data: response, timestamp: Date.now() });

      return response;
    } catch (err: any) {
      clearTimeout(timeoutTimer);

      let serviceError: PoiServiceError;
      if (isTimeout || err.name === 'TimeoutError') {
        serviceError = new PoiServiceError(
          'POI_TIMEOUT',
          `Tempo limite excedido (${this.timeoutMs}ms) ao consultar pontos de interesse.`,
          err
        );
      } else if (err instanceof PoiServiceError) {
        serviceError = err;
      } else {
        serviceError = new PoiServiceError(
          'POI_PROVIDER_UNAVAILABLE',
          `Falha ao consultar pontos de interesse: ${err.message}`,
          err
        );
      }

      if (options?.throwOnError) {
        throw serviceError;
      }

      // Resiliência: Retorno seguro de fallback sem derrubar o ecossistema
      return {
        center: { latitude, longitude },
        radiusMeters,
        total: 0,
        pois: [],
        sourceProvider: this.provider.providerName,
        retrievedAt: new Date().toISOString(),
        hasError: true,
        errorMessage: serviceError.message,
      };
    }
  }

  /**
   * Constrói o contexto factual de grounding para o Google Gemini.
   * Garante que o Gemini só utilize lugares reais com IDs verificáveis.
   */
  public buildGeminiGroundingContext(pois: NormalizedPoi[]): string {
    const compactList = pois.map((p) => ({
      id: p.id,
      name: p.name,
      category: p.category,
      address: p.address,
      coordinates: { latitude: p.latitude, longitude: p.longitude },
      rating: p.rating,
      priceLevel: p.priceLevel,
    }));

    return JSON.stringify(compactList, null, 2);
  }
}

// Instância padrão do serviço de POIs
export const poiService = new PoiService({
  provider: new MockPoiProvider(), // Inicia com mock e conecta overpass em runtime
});
