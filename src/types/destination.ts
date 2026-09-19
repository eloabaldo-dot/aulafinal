/**
 * Tipos e Contratos do Serviço de Destino e Geocodificação
 * Conforme especificado em docs/specs/destination-service-spec.md
 */

export type DestinationType =
  | 'city'
  | 'municipality'
  | 'state_province'
  | 'country'
  | 'island'
  | 'national_park'
  | 'landmark';

export interface GeoCoordinates {
  latitude: number;
  longitude: number;
}

export interface BoundingBox {
  south: number;
  north: number;
  west: number;
  east: number;
}

export interface GeographicAddress {
  city: string;
  stateOrRegion: string;
  country: string;
  countryCode: string; // ISO 3166-1 alpha-2 em maiúsculas (ex: "FR", "BR", "JP")
  postalCode?: string;
}

export interface NormalizedDestination {
  id: string;
  name: string;
  displayName: string;
  shortName: string;
  type: DestinationType;
  coordinates: GeoCoordinates;
  boundingBox?: BoundingBox;
  address: GeographicAddress;
  timezone?: string;
  sourceProvider: string;
  rawPlaceId?: string;
}

export interface DestinationSearchOptions {
  query: string;
  language?: string;
  limit?: number;
  countryCodes?: string[];
  signal?: AbortSignal;
}

export type DestinationErrorCode =
  | 'GEO_TIMEOUT'
  | 'GEO_RATE_LIMITED'
  | 'GEO_NETWORK_ERROR'
  | 'GEO_INVALID_INPUT'
  | 'GEO_PROVIDER_UNAVAILABLE'
  | 'GEO_INCOMPLETE_RESPONSE';

export class DestinationServiceError extends Error {
  public readonly code: DestinationErrorCode;
  public readonly originalError?: unknown;

  constructor(code: DestinationErrorCode, message: string, originalError?: unknown) {
    super(message);
    this.name = 'DestinationServiceError';
    this.code = code;
    this.originalError = originalError;
  }
}

export interface IDestinationProvider {
  readonly providerName: string;
  search(query: string, options?: DestinationSearchOptions): Promise<NormalizedDestination[]>;
  reverseGeocode?(coordinates: GeoCoordinates, language?: string): Promise<NormalizedDestination | null>;
}
