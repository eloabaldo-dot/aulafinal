import {
  IDestinationProvider,
  NormalizedDestination,
  DestinationSearchOptions,
  DestinationServiceError,
} from '../../../types/destination';
import {
  createNormalizedDestination,
  removeAccents,
} from '../normalizer';

export interface MockRawDestination {
  name: string;
  displayName: string;
  type?: any;
  coordinates: { latitude: number; longitude: number };
  address: {
    city: string;
    stateOrRegion: string;
    country: string;
    countryCode: string;
    postalCode?: string;
  };
  timezone?: string;
  rawPlaceId?: string;
}

const MOCK_DATABASE: MockRawDestination[] = [
  {
    name: 'Paris',
    displayName: 'Paris, Île-de-France, França',
    type: 'city',
    coordinates: { latitude: 48.8566, longitude: 2.3522 },
    address: {
      city: 'Paris',
      stateOrRegion: 'Île-de-France',
      country: 'França',
      countryCode: 'FR',
      postalCode: '75001',
    },
    timezone: 'Europe/Paris',
    rawPlaceId: 'mock_paris_1',
  },
  {
    name: 'Tóquio',
    displayName: 'Tóquio, Kanto, Japão',
    type: 'city',
    coordinates: { latitude: 35.6762, longitude: 139.6503 },
    address: {
      city: 'Tóquio',
      stateOrRegion: 'Kanto',
      country: 'Japão',
      countryCode: 'JP',
      postalCode: '100-0001',
    },
    timezone: 'Asia/Tokyo',
    rawPlaceId: 'mock_tokyo_1',
  },
  {
    name: 'São Paulo',
    displayName: 'São Paulo, Estado de São Paulo, Brasil',
    type: 'city',
    coordinates: { latitude: -23.5505, longitude: -46.6333 },
    address: {
      city: 'São Paulo',
      stateOrRegion: 'São Paulo',
      country: 'Brasil',
      countryCode: 'BR',
      postalCode: '01000-000',
    },
    timezone: 'America/Sao_Paulo',
    rawPlaceId: 'mock_sp_1',
  },
  {
    name: 'Florianópolis',
    displayName: 'Florianópolis, Santa Catarina, Brasil',
    type: 'city',
    coordinates: { latitude: -27.5954, longitude: -48.548 },
    address: {
      city: 'Florianópolis',
      stateOrRegion: 'Santa Catarina',
      country: 'Brasil',
      countryCode: 'BR',
      postalCode: '88000-000',
    },
    timezone: 'America/Sao_Paulo',
    rawPlaceId: 'mock_florianopolis_1',
  },
  {
    name: 'Roma',
    displayName: 'Roma, Lácio, Itália',
    type: 'city',
    coordinates: { latitude: 41.9028, longitude: 12.4964 },
    address: {
      city: 'Roma',
      stateOrRegion: 'Lácio',
      country: 'Itália',
      countryCode: 'IT',
      postalCode: '00100',
    },
    timezone: 'Europe/Rome',
    rawPlaceId: 'mock_rome_1',
  },
  {
    name: 'Lisboa',
    displayName: 'Lisboa, Distrito de Lisboa, Portugal',
    type: 'city',
    coordinates: { latitude: 38.7223, longitude: -9.1393 },
    address: {
      city: 'Lisboa',
      stateOrRegion: 'Lisboa',
      country: 'Portugal',
      countryCode: 'PT',
      postalCode: '1000-001',
    },
    timezone: 'Europe/Lisbon',
    rawPlaceId: 'mock_lisbon_1',
  },
  // Casos ambíguos: "Santiago"
  {
    name: 'Santiago',
    displayName: 'Santiago, Região Metropolitana de Santiago, Chile',
    type: 'city',
    coordinates: { latitude: -33.4489, longitude: -70.6693 },
    address: {
      city: 'Santiago',
      stateOrRegion: 'Região Metropolitana',
      country: 'Chile',
      countryCode: 'CL',
    },
    timezone: 'America/Santiago',
    rawPlaceId: 'mock_santiago_cl',
  },
  {
    name: 'Santiago de Compostela',
    displayName: 'Santiago de Compostela, Galícia, Espanha',
    type: 'city',
    coordinates: { latitude: 42.8782, longitude: -8.5448 },
    address: {
      city: 'Santiago de Compostela',
      stateOrRegion: 'Galícia',
      country: 'Espanha',
      countryCode: 'ES',
    },
    timezone: 'Europe/Madrid',
    rawPlaceId: 'mock_santiago_es',
  },
  {
    name: 'Rio de Janeiro',
    displayName: 'Rio de Janeiro, Estado do Rio de Janeiro, Brasil',
    type: 'city',
    coordinates: { latitude: -22.9068, longitude: -43.1729 },
    address: {
      city: 'Rio de Janeiro',
      stateOrRegion: 'Rio de Janeiro',
      country: 'Brasil',
      countryCode: 'BR',
      postalCode: '20000-000',
    },
    timezone: 'America/Sao_Paulo',
    rawPlaceId: 'mock_rio_1',
  },
  {
    name: 'Salvador',
    displayName: 'Salvador, Bahia, Brasil',
    type: 'city',
    coordinates: { latitude: -12.9777, longitude: -38.5016 },
    address: {
      city: 'Salvador',
      stateOrRegion: 'Bahia',
      country: 'Brasil',
      countryCode: 'BR',
      postalCode: '40000-000',
    },
    timezone: 'America/Bahia',
    rawPlaceId: 'mock_salvador_1',
  },
  {
    name: 'Curitiba',
    displayName: 'Curitiba, Paraná, Brasil',
    type: 'city',
    coordinates: { latitude: -25.4284, longitude: -49.2733 },
    address: {
      city: 'Curitiba',
      stateOrRegion: 'Paraná',
      country: 'Brasil',
      countryCode: 'BR',
      postalCode: '80000-000',
    },
    timezone: 'America/Sao_Paulo',
    rawPlaceId: 'mock_curitiba_1',
  },
  {
    name: 'Belo Horizonte',
    displayName: 'Belo Horizonte, Minas Gerais, Brasil',
    type: 'city',
    coordinates: { latitude: -19.9167, longitude: -43.9345 },
    address: {
      city: 'Belo Horizonte',
      stateOrRegion: 'Minas Gerais',
      country: 'Brasil',
      countryCode: 'BR',
      postalCode: '30000-000',
    },
    timezone: 'America/Sao_Paulo',
    rawPlaceId: 'mock_bh_1',
  },
  {
    name: 'Brasília',
    displayName: 'Brasília, Distrito Federal, Brasil',
    type: 'city',
    coordinates: { latitude: -15.7975, longitude: -47.8919 },
    address: {
      city: 'Brasília',
      stateOrRegion: 'Distrito Federal',
      country: 'Brasil',
      countryCode: 'BR',
      postalCode: '70000-000',
    },
    timezone: 'America/Sao_Paulo',
    rawPlaceId: 'mock_brasilia_1',
  },
  {
    name: 'Fortaleza',
    displayName: 'Fortaleza, Ceará, Brasil',
    type: 'city',
    coordinates: { latitude: -3.7319, longitude: -38.5267 },
    address: {
      city: 'Fortaleza',
      stateOrRegion: 'Ceará',
      country: 'Brasil',
      countryCode: 'BR',
      postalCode: '60000-000',
    },
    timezone: 'America/Fortaleza',
    rawPlaceId: 'mock_fortaleza_1',
  },
  {
    name: 'Recife',
    displayName: 'Recife, Pernambuco, Brasil',
    type: 'city',
    coordinates: { latitude: -8.0476, longitude: -34.877 },
    address: {
      city: 'Recife',
      stateOrRegion: 'Pernambuco',
      country: 'Brasil',
      countryCode: 'BR',
      postalCode: '50000-000',
    },
    timezone: 'America/Recife',
    rawPlaceId: 'mock_recife_1',
  },
  {
    name: 'Porto Alegre',
    displayName: 'Porto Alegre, Rio Grande do Sul, Brasil',
    type: 'city',
    coordinates: { latitude: -30.0346, longitude: -51.2177 },
    address: {
      city: 'Porto Alegre',
      stateOrRegion: 'Rio Grande do Sul',
      country: 'Brasil',
      countryCode: 'BR',
      postalCode: '90000-000',
    },
    timezone: 'America/Sao_Paulo',
    rawPlaceId: 'mock_poa_1',
  },
  {
    name: 'Buenos Aires',
    displayName: 'Buenos Aires, Cidade Autônoma de Buenos Aires, Argentina',
    type: 'city',
    coordinates: { latitude: -34.6037, longitude: -58.3816 },
    address: {
      city: 'Buenos Aires',
      stateOrRegion: 'CABA',
      country: 'Argentina',
      countryCode: 'AR',
      postalCode: 'C1000',
    },
    timezone: 'America/Argentina/Buenos_Aires',
    rawPlaceId: 'mock_ba_1',
  },
  {
    name: 'Nova York',
    displayName: 'Nova York, Nova York, Estados Unidos',
    type: 'city',
    coordinates: { latitude: 40.7128, longitude: -74.006 },
    address: {
      city: 'Nova York',
      stateOrRegion: 'Nova York',
      country: 'Estados Unidos',
      countryCode: 'US',
      postalCode: '10001',
    },
    timezone: 'America/New_York',
    rawPlaceId: 'mock_ny_1',
  },
  {
    name: 'Londres',
    displayName: 'Londres, Grande Londres, Reino Unido',
    type: 'city',
    coordinates: { latitude: 51.5074, longitude: -0.1278 },
    address: {
      city: 'Londres',
      stateOrRegion: 'Grande Londres',
      country: 'Reino Unido',
      countryCode: 'GB',
      postalCode: 'SW1A',
    },
    timezone: 'Europe/London',
    rawPlaceId: 'mock_london_1',
  },
  {
    name: 'Barcelona',
    displayName: 'Barcelona, Catalunha, Espanha',
    type: 'city',
    coordinates: { latitude: 41.3851, longitude: 2.1734 },
    address: {
      city: 'Barcelona',
      stateOrRegion: 'Catalunha',
      country: 'Espanha',
      countryCode: 'ES',
      postalCode: '08001',
    },
    timezone: 'Europe/Madrid',
    rawPlaceId: 'mock_bcn_1',
  },
];

export class MockDestinationProvider implements IDestinationProvider {
  public readonly providerName = 'mock';

  // Opções para testes de resiliência e simulação
  private forceDelayMs = 0;
  private forceError?: { status: number; message: string };
  private forceIncomplete = false;

  public setDelay(ms: number) {
    this.forceDelayMs = ms;
  }

  public setForceError(error?: { status: number; message: string }) {
    this.forceError = error;
  }

  public setForceIncomplete(incomplete: boolean) {
    this.forceIncomplete = incomplete;
  }

  async search(query: string, options?: DestinationSearchOptions): Promise<NormalizedDestination[]> {
    if (this.forceDelayMs > 0) {
      await new Promise((resolve, reject) => {
        const timer = setTimeout(resolve, this.forceDelayMs);
        if (options?.signal) {
          options.signal.addEventListener('abort', () => {
            clearTimeout(timer);
            reject(new DOMException('This operation was aborted', 'AbortError'));
          });
        }
      });
    }

    if (this.forceError) {
      if (this.forceError.status === 429) {
        throw new DestinationServiceError('GEO_RATE_LIMITED', this.forceError.message);
      }
      throw new DestinationServiceError('GEO_PROVIDER_UNAVAILABLE', this.forceError.message);
    }

    if (this.forceIncomplete) {
      // Retorna objeto defeituoso sem coordenadas para testar o normalizador
      const rawIncomplete: any = {
        name: 'Cidade Incompleta',
        displayName: 'Cidade Incompleta',
        coordinates: { latitude: NaN, longitude: NaN },
        address: { city: 'Cidade Incompleta', stateOrRegion: '', country: '', countryCode: '' },
      };
      // O normalizador deve lançar erro
      createNormalizedDestination(rawIncomplete);
    }

    const cleanQuery = removeAccents(query.trim().toLowerCase());
    if (!cleanQuery) {
      return [];
    }

    const matches = MOCK_DATABASE.filter((item) => {
      const name = removeAccents(item.name.toLowerCase());
      const display = removeAccents(item.displayName.toLowerCase());
      const country = removeAccents(item.address.country.toLowerCase());
      return name.includes(cleanQuery) || display.includes(cleanQuery) || country.includes(cleanQuery);
    });

    const limit = options?.limit || 5;
    const sliced = matches.slice(0, limit);

    return sliced.map((item) =>
      createNormalizedDestination({
        ...item,
        sourceProvider: this.providerName,
      })
    );
  }
}
