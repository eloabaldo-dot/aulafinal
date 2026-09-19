import {
  NormalizedDestination,
  DestinationType,
  GeoCoordinates,
  GeographicAddress,
  BoundingBox,
  DestinationServiceError,
} from '../../types/destination';

/**
 * Remove acentuação e caracteres especiais para slugificação e comparação
 */
export function removeAccents(str: string): string {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/**
 * Converte nome de cidade em slug canônico limpo
 */
export function slugify(str: string): string {
  return removeAccents(str)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Higieniza o texto de busca do usuário (remove tags, controle e excessos)
 */
export function sanitizeSearchQuery(query: string): string {
  return query
    .replace(/<\s*script[^>]*>[\s\S]*?<\s*\/\s*script\s*>/gi, '') // Remove blocos de script completos
    .replace(/<[^>]*>?/gm, '') // Remove outras tags HTML
    .replace(/[\x00-\x1F\x7F]/g, '') // Remove caracteres de controle
    .replace(/\s+/g, ' ') // Colapsa múltiplos espaços em um
    .trim()
    .slice(0, 100); // Trunca em 100 caracteres
}

/**
 * Valida rigorosamente as coordenadas geográficas
 */
export function validateCoordinates(lat: number, lng: number): GeoCoordinates {
  if (
    typeof lat !== 'number' ||
    typeof lng !== 'number' ||
    isNaN(lat) ||
    isNaN(lng) ||
    !isFinite(lat) ||
    !isFinite(lng)
  ) {
    throw new DestinationServiceError(
      'GEO_INCOMPLETE_RESPONSE',
      `Coordenadas geográficas inválidas ou ausentes: lat=${lat}, lng=${lng}`
    );
  }

  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    throw new DestinationServiceError(
      'GEO_INCOMPLETE_RESPONSE',
      `Coordenadas fora dos limites do globo: lat=${lat}, lng=${lng}`
    );
  }

  return { latitude: lat, longitude: lng };
}

/**
 * Gera identificador canônico no formato:
 * dest_[countryCode]_[slugCity]_[latRounded]_[lngRounded]
 */
export function generateCanonicalId(
  countryCode: string,
  cityOrName: string,
  coords: GeoCoordinates
): string {
  const code = (countryCode || 'xx').toLowerCase();
  const slug = slugify(cityOrName || 'destino') || 'unknown';
  const latStr = coords.latitude.toFixed(4).replace('.', '-');
  const lngStr = coords.longitude.toFixed(4).replace('.', '-');
  return `dest_${code}_${slug}_${latStr}_${lngStr}`;
}

/**
 * Constrói e valida uma entidade NormalizedDestination
 */
export function createNormalizedDestination(params: {
  name: string;
  displayName: string;
  type?: DestinationType;
  coordinates: { latitude: number; longitude: number };
  boundingBox?: BoundingBox;
  address: {
    city: string;
    stateOrRegion: string;
    country: string;
    countryCode: string;
    postalCode?: string;
  };
  timezone?: string;
  sourceProvider: string;
  rawPlaceId?: string;
}): NormalizedDestination {
  if (!params.name || typeof params.name !== 'string' || !params.name.trim()) {
    throw new DestinationServiceError(
      'GEO_INCOMPLETE_RESPONSE',
      'Resposta incompleta do provedor: campo "name" ausente ou vazio.'
    );
  }

  if (!params.address || !params.address.country || !params.address.countryCode) {
    throw new DestinationServiceError(
      'GEO_INCOMPLETE_RESPONSE',
      'Resposta incompleta do provedor: dados de país ou código ISO ausentes.'
    );
  }

  const validCoords = validateCoordinates(
    params.coordinates.latitude,
    params.coordinates.longitude
  );

  const cleanCountryCode = params.address.countryCode.toUpperCase().slice(0, 2);
  const city = params.address.city || params.name;
  const canonicalId = generateCanonicalId(cleanCountryCode, city, validCoords);

  return {
    id: canonicalId,
    name: params.name.trim(),
    displayName: params.displayName.trim() || `${params.name}, ${params.address.country}`,
    shortName: `${params.name}, ${cleanCountryCode}`,
    type: params.type || 'city',
    coordinates: validCoords,
    boundingBox: params.boundingBox,
    address: {
      city: city.trim(),
      stateOrRegion: (params.address.stateOrRegion || '').trim(),
      country: params.address.country.trim(),
      countryCode: cleanCountryCode,
      postalCode: params.address.postalCode?.trim(),
    },
    timezone: params.timezone,
    sourceProvider: params.sourceProvider,
    rawPlaceId: params.rawPlaceId,
  };
}

/**
 * Normaliza o resultado bruto do OpenStreetMap / Nominatim
 */
export function normalizeNominatimResult(raw: any): NormalizedDestination {
  if (!raw || typeof raw !== 'object') {
    throw new DestinationServiceError(
      'GEO_INCOMPLETE_RESPONSE',
      'Payload inválido ou vazio retornado pelo provedor Nominatim.'
    );
  }

  const lat = parseFloat(raw.lat);
  const lng = parseFloat(raw.lon);

  const address = raw.address || {};
  const city =
    address.city ||
    address.town ||
    address.municipality ||
    address.village ||
    address.city_district ||
    raw.name ||
    '';

  const stateOrRegion = address.state || address.region || address.county || '';
  const country = address.country || '';
  const countryCode = address.country_code ? address.country_code.toUpperCase() : '';

  if (!city || !country || !countryCode) {
    throw new DestinationServiceError(
      'GEO_INCOMPLETE_RESPONSE',
      'Campos de endereço incompletos na resposta do Nominatim.'
    );
  }

  let boundingBox: BoundingBox | undefined;
  if (Array.isArray(raw.boundingbox) && raw.boundingbox.length === 4) {
    boundingBox = {
      south: parseFloat(raw.boundingbox[0]),
      north: parseFloat(raw.boundingbox[1]),
      west: parseFloat(raw.boundingbox[2]),
      east: parseFloat(raw.boundingbox[3]),
    };
  }

  let type: DestinationType = 'city';
  if (raw.type === 'administrative' || raw.addresstype === 'state') {
    type = 'state_province';
  } else if (raw.addresstype === 'country') {
    type = 'country';
  } else if (raw.addresstype === 'tourism' || raw.class === 'tourism') {
    type = 'landmark';
  }

  return createNormalizedDestination({
    name: city,
    displayName: raw.display_name || `${city}, ${stateOrRegion}, ${country}`,
    type,
    coordinates: { latitude: lat, longitude: lng },
    boundingBox,
    address: {
      city,
      stateOrRegion,
      country,
      countryCode,
      postalCode: address.postcode,
    },
    sourceProvider: 'nominatim',
    rawPlaceId: raw.place_id ? String(raw.place_id) : undefined,
  });
}
