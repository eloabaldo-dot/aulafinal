/**
 * Tipos e Contratos do Serviço de Pontos de Interesse (POIs)
 * Conforme especificado em docs/specs/poi-service-spec.md
 */

export type PoiCategory =
  | 'atracao'
  | 'praia'
  | 'museu'
  | 'parque'
  | 'restaurante'
  | 'cafe'
  | 'ponto_historico';

export interface NormalizedPoi {
  id: string; // Identificador canônico estável (ex: 'poi_osm_node_12345')
  name: string; // Nome factual oficial
  category: PoiCategory; // Categoria canônica classificada
  address: string; // Endereço factual estruturado
  latitude: number; // Latitude factual confirmada
  longitude: number; // Longitude factual confirmada
  rating?: number; // Avaliação de 1 a 5 se disponível
  userRatingsTotal?: number; // Total de avaliações
  priceLevel?: '$' | '$$' | '$$$' | '$$$$';
  openingHours?: string;
  websiteUrl?: string;
  imageUrl?: string;
  distanceMeters?: number; // Distância do centro da busca (Haversine)
  sourceProvider: string;
  rawPlaceId?: string;
}

export interface PoiSearchRequest {
  latitude: number;
  longitude: number;
  categories?: PoiCategory[];
  radiusMeters?: number; // Padrão: 5000m
  limit?: number; // Padrão: 20
  language?: string;
  signal?: AbortSignal;
}

export interface PoiSearchResponse {
  center: {
    latitude: number;
    longitude: number;
  };
  radiusMeters: number;
  total: number;
  pois: NormalizedPoi[];
  sourceProvider: string;
  retrievedAt: string;
  hasError: boolean;
  errorMessage?: string;
}

export type PoiErrorCode =
  | 'POI_INVALID_COORDINATES'
  | 'POI_TIMEOUT'
  | 'POI_RATE_LIMITED'
  | 'POI_NETWORK_ERROR'
  | 'POI_PROVIDER_UNAVAILABLE'
  | 'POI_INCOMPLETE_RESPONSE';

export class PoiServiceError extends Error {
  public readonly code: PoiErrorCode;
  public readonly originalError?: unknown;

  constructor(code: PoiErrorCode, message: string, originalError?: unknown) {
    super(message);
    this.name = 'PoiServiceError';
    this.code = code;
    this.originalError = originalError;
  }
}

export interface IPoiProvider {
  readonly providerName: string;
  fetchPois(request: PoiSearchRequest): Promise<NormalizedPoi[]>;
}
