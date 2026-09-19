import {
  IPoiProvider,
  NormalizedPoi,
  PoiSearchRequest,
  PoiCategory,
  PoiServiceError,
} from '../../../types/poi';
import {
  createNormalizedPoi,
  calculateHaversineDistance,
} from '../normalizer';

interface MockPoiRaw {
  rawPlaceId: string;
  name: string;
  category: PoiCategory;
  address: string;
  latitude: number;
  longitude: number;
  rating: number;
  priceLevel?: '$' | '$$' | '$$$' | '$$$$';
  openingHours?: string;
}

const MOCK_POI_DATABASE: MockPoiRaw[] = [
  // Paris (48.8566, 2.3522)
  {
    rawPlaceId: 'osm_node_1001',
    name: 'Museu do Louvre',
    category: 'museu',
    address: 'Rue de Rivoli, 75001 Paris, França',
    latitude: 48.8606,
    longitude: 2.3376,
    rating: 4.8,
    openingHours: '09:00 - 18:00',
  },
  {
    rawPlaceId: 'osm_node_1002',
    name: 'Torre Eiffel',
    category: 'atracao',
    address: 'Champ de Mars, 5 Av. Anatole France, 75007 Paris, França',
    latitude: 48.8584,
    longitude: 2.2945,
    rating: 4.7,
    openingHours: '09:30 - 23:45',
  },
  {
    rawPlaceId: 'osm_node_1003',
    name: 'Catedral de Notre-Dame',
    category: 'ponto_historico',
    address: '6 Parvis Notre-Dame, 75004 Paris, França',
    latitude: 48.8530,
    longitude: 2.3499,
    rating: 4.7,
    openingHours: '08:00 - 18:45',
  },
  {
    rawPlaceId: 'osm_node_1004',
    name: 'Jardin du Luxembourg',
    category: 'parque',
    address: '75006 Paris, França',
    latitude: 48.8462,
    longitude: 2.3372,
    rating: 4.8,
    openingHours: '07:30 - 20:00',
  },
  {
    rawPlaceId: 'osm_node_1005',
    name: 'Café de Flore',
    category: 'cafe',
    address: '172 Bd Saint-Germain, 75006 Paris, França',
    latitude: 48.8542,
    longitude: 2.3325,
    rating: 4.2,
    priceLevel: '$$$',
    openingHours: '07:30 - 01:30',
  },
  {
    rawPlaceId: 'osm_node_1006',
    name: 'Le Jules Verne',
    category: 'restaurante',
    address: 'Torre Eiffel - 2º Piso, 75007 Paris, França',
    latitude: 48.8583,
    longitude: 2.2944,
    rating: 4.6,
    priceLevel: '$$$$',
    openingHours: '12:00 - 21:30',
  },

  // Rio de Janeiro / Praias (-22.9068, -43.1729)
  {
    rawPlaceId: 'osm_node_2001',
    name: 'Praia de Copacabana',
    category: 'praia',
    address: 'Av. Atlântica, Copacabana, Rio de Janeiro - RJ, Brasil',
    latitude: -22.9698,
    longitude: -43.1803,
    rating: 4.7,
  },
  {
    rawPlaceId: 'osm_node_2002',
    name: 'Cristo Redentor',
    category: 'atracao',
    address: 'Parque Nacional da Tijuca, Rio de Janeiro - RJ, Brasil',
    latitude: -22.9519,
    longitude: -43.2105,
    rating: 4.9,
    openingHours: '08:00 - 19:00',
  },
  {
    rawPlaceId: 'osm_node_2003',
    name: 'Confeitaria Colombo',
    category: 'cafe',
    address: 'R. Gonçalves Dias, 32 - Centro, Rio de Janeiro - RJ, Brasil',
    latitude: -22.9064,
    longitude: -43.1785,
    rating: 4.6,
    priceLevel: '$$',
    openingHours: '11:00 - 18:00',
  },

  // Roma (41.9028, 12.4964)
  {
    rawPlaceId: 'osm_node_3001',
    name: 'Coliseu Romano',
    category: 'ponto_historico',
    address: 'Piazza del Colosseo, 1, 00184 Roma, Itália',
    latitude: 41.8902,
    longitude: 12.4922,
    rating: 4.8,
    openingHours: '08:30 - 19:15',
  },
  {
    rawPlaceId: 'osm_node_3002',
    name: 'Villa Borghese',
    category: 'parque',
    address: '00197 Roma, Itália',
    latitude: 41.9130,
    longitude: 12.4921,
    rating: 4.7,
    openingHours: 'Aberto 24h',
  },
];

export class MockPoiProvider implements IPoiProvider {
  public readonly providerName = 'mock_poi';

  private forceDelayMs = 0;
  private forceError?: { status: number; message: string };
  private injectDuplicate = false;
  private injectMissingAddress = false;
  private injectMissingCoords = false;

  public setDelay(ms: number) {
    this.forceDelayMs = ms;
  }

  public setForceError(error?: { status: number; message: string }) {
    this.forceError = error;
  }

  public setInjectDuplicate(enable: boolean) {
    this.injectDuplicate = enable;
  }

  public setInjectMissingAddress(enable: boolean) {
    this.injectMissingAddress = enable;
  }

  public setInjectMissingCoords(enable: boolean) {
    this.injectMissingCoords = enable;
  }

  async fetchPois(request: PoiSearchRequest): Promise<NormalizedPoi[]> {
    if (this.forceDelayMs > 0) {
      await new Promise((resolve, reject) => {
        const timer = setTimeout(resolve, this.forceDelayMs);
        if (request.signal) {
          request.signal.addEventListener('abort', () => {
            clearTimeout(timer);
            reject(new DOMException('This operation was aborted', 'AbortError'));
          });
        }
      });
    }

    if (this.forceError) {
      if (this.forceError.status === 429) {
        throw new PoiServiceError('POI_RATE_LIMITED', this.forceError.message);
      }
      throw new PoiServiceError('POI_PROVIDER_UNAVAILABLE', this.forceError.message);
    }

    const { latitude, longitude, categories, radiusMeters = 5000, limit = 20 } = request;
    const center = { latitude, longitude };

    // Filtra pontos dentro do raio de busca
    let filtered = MOCK_POI_DATABASE.filter((item) => {
      const dist = calculateHaversineDistance(latitude, longitude, item.latitude, item.longitude);
      if (dist > radiusMeters) return false;
      if (categories && categories.length > 0 && !categories.includes(item.category)) {
        return false;
      }
      return true;
    });

    const results: NormalizedPoi[] = filtered.slice(0, limit).map((raw) =>
      createNormalizedPoi({
        ...raw,
        sourceProvider: this.providerName,
        centerCoordinates: center,
      })
    );

    // Injeções especiais para cobertura de testes
    if (this.injectDuplicate && results.length > 0) {
      const base = results[0];
      // Adiciona cópia a 15 metros de distância com nome idêntico ou similar
      results.push(
        createNormalizedPoi({
          name: base.name + ' (Entrada Secundária)',
          category: base.category,
          address: base.address,
          latitude: base.latitude + 0.0001, // ~11m de distância
          longitude: base.longitude + 0.0001,
          sourceProvider: this.providerName,
          rawPlaceId: base.rawPlaceId ? base.rawPlaceId + '_dup' : undefined,
          centerCoordinates: center,
        })
      );
    }

    if (this.injectMissingAddress) {
      results.push(
        createNormalizedPoi({
          name: 'Mirante Sem Endereço Cadastrado',
          category: 'atracao',
          address: '', // Endereço vazio
          latitude: latitude + 0.005,
          longitude: longitude + 0.005,
          sourceProvider: this.providerName,
          centerCoordinates: center,
        })
      );
    }

    if (this.injectMissingCoords) {
      // Deve lançar PoiServiceError('POI_INCOMPLETE_RESPONSE', ...)
      createNormalizedPoi({
        name: 'Local Fantasma Sem Coordenadas',
        category: 'atracao',
        latitude: NaN,
        longitude: null,
        sourceProvider: this.providerName,
      });
    }

    return results;
  }
}
