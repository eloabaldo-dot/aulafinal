import {
  IPoiProvider,
  NormalizedPoi,
  PoiSearchRequest,
  PoiCategory,
  PoiServiceError,
} from '../../../types/poi';
import { createNormalizedPoi } from '../normalizer';

export class OverpassPoiProvider implements IPoiProvider {
  public readonly providerName = 'osm_overpass';
  private readonly baseUrl = 'https://overpass-api.de/api/interpreter';

  async fetchPois(request: PoiSearchRequest): Promise<NormalizedPoi[]> {
    const { latitude, longitude, categories, radiusMeters = 5000, limit = 20, signal } = request;

    // Proteção de chaves: se houver segredo de geolocalização no servidor, lê estritamente server-side
    const serverPlacesKey = typeof process !== 'undefined' ? process.env?.PLACES_API_KEY : undefined;

    // Constrói consulta Overpass QL simplificada
    const query = `
      [out:json][timeout:6];
      (
        node["tourism"~"attraction|museum|viewpoint"](around:${radiusMeters},${latitude},${longitude});
        node["amenity"~"restaurant|cafe|place_of_worship"](around:${radiusMeters},${latitude},${longitude});
        node["leisure"~"park|garden"](around:${radiusMeters},${latitude},${longitude});
      );
      out body ${limit};
    `;

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'SmartTripApp/1.0 (pois@smarttrip.com)',
          ...(serverPlacesKey ? { Authorization: `Bearer ${serverPlacesKey}` } : {}),
        },
        body: `data=${encodeURIComponent(query)}`,
        signal,
      });

      if (!response.ok) {
        if (response.status === 429) {
          throw new PoiServiceError('POI_RATE_LIMITED', 'Limite de requisições excedido no Overpass (HTTP 429).');
        }
        if (response.status >= 500) {
          throw new PoiServiceError('POI_PROVIDER_UNAVAILABLE', `Provedor Overpass indisponível (HTTP ${response.status}).`);
        }
        throw new PoiServiceError('POI_NETWORK_ERROR', `Erro HTTP na consulta de POIs: ${response.status}`);
      }

      const data = await response.json();
      const elements: any[] = data.elements || [];
      const pois: NormalizedPoi[] = [];

      for (const el of elements) {
        const tags = el.tags || {};
        const name = tags.name || tags['name:pt'] || tags['name:en'];
        if (!name) continue;

        let category: PoiCategory = 'atracao';
        if (tags.tourism === 'museum') category = 'museu';
        else if (tags.amenity === 'restaurant') category = 'restaurante';
        else if (tags.amenity === 'cafe') category = 'cafe';
        else if (tags.leisure === 'park') category = 'parque';
        else if (tags.amenity === 'place_of_worship' || tags.historic) category = 'ponto_historico';
        else if (tags.natural === 'beach') category = 'praia';

        if (categories && categories.length > 0 && !categories.includes(category)) {
          continue;
        }

        try {
          const street = tags['addr:street'] ? `${tags['addr:street']}, ${tags['addr:housenumber'] || ''}` : '';
          const city = tags['addr:city'] || '';
          const address = street && city ? `${street} - ${city}` : street || city;

          pois.push(
            createNormalizedPoi({
              name,
              category,
              address,
              latitude: el.lat,
              longitude: el.lon,
              sourceProvider: this.providerName,
              rawPlaceId: `node_${el.id}`,
              openingHours: tags.opening_hours,
              websiteUrl: tags.website || tags['contact:website'],
              centerCoordinates: { latitude, longitude },
            })
          );
        } catch {
          // Ignora item malformado
        }
      }

      return pois;
    } catch (err: any) {
      if (err instanceof PoiServiceError) throw err;
      if (err.name === 'AbortError') throw err;
      throw new PoiServiceError('POI_NETWORK_ERROR', `Falha ao consultar pontos de interesse: ${err.message}`, err);
    }
  }
}
