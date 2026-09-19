import {
  NormalizedPoi,
  PoiCategory,
  PoiServiceError,
} from '../../types/poi';

/**
 * Fórmula de Haversine para calcular a distância física em metros entre dois pontos geográficos
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Raio médio da Terra em metros
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * Normaliza e simplifica texto para comparação e geração de slugs
 */
export function slugify(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Gera um identificador canônico estável e determinístico para o POI
 */
export function generateStablePoiId(params: {
  sourceProvider: string;
  rawPlaceId?: string;
  category: PoiCategory;
  name: string;
  latitude: number;
  longitude: number;
}): string {
  if (params.rawPlaceId && params.rawPlaceId.trim()) {
    const cleanRaw = params.rawPlaceId.replace(/[^a-zA-Z0-9_-]/g, '_');
    return `poi_${params.sourceProvider}_${cleanRaw}`;
  }

  const slug = slugify(params.name || 'local') || 'unknown';
  const latStr = params.latitude.toFixed(4).replace('.', '-');
  const lngStr = params.longitude.toFixed(4).replace('.', '-');
  return `poi_${params.category}_${slug}_${latStr}_${lngStr}`;
}

/**
 * Valida se as coordenadas são números finitos e estão nos limites do globo
 */
export function validatePoiCoordinates(lat: any, lng: any): { latitude: number; longitude: number } {
  const latitude = typeof lat === 'number' ? lat : parseFloat(lat);
  const longitude = typeof lng === 'number' ? lng : parseFloat(lng);

  if (
    typeof latitude !== 'number' ||
    typeof longitude !== 'number' ||
    isNaN(latitude) ||
    isNaN(longitude) ||
    !isFinite(latitude) ||
    !isFinite(longitude)
  ) {
    throw new PoiServiceError(
      'POI_INCOMPLETE_RESPONSE',
      `Coordenadas inválidas ou ausentes para o ponto de interesse: lat=${lat}, lng=${lng}.`
    );
  }

  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    throw new PoiServiceError(
      'POI_INCOMPLETE_RESPONSE',
      `Coordenadas fora dos limites do globo: lat=${latitude}, lng=${longitude}.`
    );
  }

  return { latitude, longitude };
}

/**
 * Constrói e normaliza uma entidade de Ponto de Interesse (POI)
 * Lida graciosamente com itens sem endereço preenchido.
 */
export function createNormalizedPoi(params: {
  name: any;
  category: PoiCategory;
  address?: any;
  latitude: any;
  longitude: any;
  rating?: any;
  userRatingsTotal?: any;
  priceLevel?: any;
  openingHours?: any;
  websiteUrl?: any;
  imageUrl?: any;
  sourceProvider: string;
  rawPlaceId?: string;
  centerCoordinates?: { latitude: number; longitude: number };
}): NormalizedPoi {
  if (!params.name || typeof params.name !== 'string' || !params.name.trim()) {
    throw new PoiServiceError(
      'POI_INCOMPLETE_RESPONSE',
      'Resposta incompleta do provedor de POI: campo "name" obrigatório ausente.'
    );
  }

  const { latitude, longitude } = validatePoiCoordinates(params.latitude, params.longitude);

  // Tratamento gracioso para item sem endereço do provedor
  const cleanAddress =
    typeof params.address === 'string' && params.address.trim()
      ? params.address.trim()
      : `Coordenadas [${latitude.toFixed(4)}, ${longitude.toFixed(4)}]`;

  const stableId = generateStablePoiId({
    sourceProvider: params.sourceProvider,
    rawPlaceId: params.rawPlaceId,
    category: params.category,
    name: params.name.trim(),
    latitude,
    longitude,
  });

  let distanceMeters: number | undefined;
  if (params.centerCoordinates) {
    distanceMeters = calculateHaversineDistance(
      params.centerCoordinates.latitude,
      params.centerCoordinates.longitude,
      latitude,
      longitude
    );
  }

  let rating: number | undefined;
  if (typeof params.rating === 'number' && !isNaN(params.rating) && params.rating >= 0 && params.rating <= 5) {
    rating = Number(params.rating.toFixed(1));
  }

  return {
    id: stableId,
    name: params.name.trim(),
    category: params.category,
    address: cleanAddress,
    latitude,
    longitude,
    rating,
    userRatingsTotal: typeof params.userRatingsTotal === 'number' ? params.userRatingsTotal : undefined,
    priceLevel: params.priceLevel,
    openingHours: typeof params.openingHours === 'string' ? params.openingHours.trim() : undefined,
    websiteUrl: typeof params.websiteUrl === 'string' ? params.websiteUrl.trim() : undefined,
    imageUrl: typeof params.imageUrl === 'string' ? params.imageUrl.trim() : undefined,
    distanceMeters,
    sourceProvider: params.sourceProvider,
    rawPlaceId: params.rawPlaceId,
  };
}

/**
 * Remove duplicidades espaciais (locais a menos de 50m com nomes similares ou mesmo rawPlaceId)
 */
export function deduplicatePois(pois: NormalizedPoi[], maxDistanceMeters = 50): NormalizedPoi[] {
  const result: NormalizedPoi[] = [];

  for (const current of pois) {
    const isDuplicate = result.some((existing) => {
      // 1. Mesmo rawPlaceId ou ID estável
      if (existing.id === current.id) return true;
      if (existing.rawPlaceId && current.rawPlaceId && existing.rawPlaceId === current.rawPlaceId) return true;

      // 2. Mesma categoria e proximidade espacial < 50m
      if (existing.category === current.category) {
        const distance = calculateHaversineDistance(
          existing.latitude,
          existing.longitude,
          current.latitude,
          current.longitude
        );

        if (distance <= maxDistanceMeters) {
          const s1 = slugify(existing.name);
          const s2 = slugify(current.name);
          // Se um contém o outro ou slugs idênticos
          if (s1 === s2 || s1.includes(s2) || s2.includes(s1)) {
            return true;
          }
        }
      }

      return false;
    });

    if (!isDuplicate) {
      result.push(current);
    }
  }

  return result;
}
