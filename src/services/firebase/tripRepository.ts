import { Trip, DayItinerary, TripStatus, ItineraryActivity } from '../../types/mvp';
import { CreateTripInput, UpdateTripInput } from '../../types/firestore';

export interface ListTripsOptions {
  statusFilter?: TripStatus;
  favoritesFirst?: boolean;
  includeArchived?: boolean;
  includeDeleted?: boolean;
}

export interface ITripRepository {
  createTrip(userId: string, currentAuthUid: string, input: CreateTripInput): Promise<Trip>;
  getTripById(userId: string, currentAuthUid: string, tripId: string, options?: { includeDeleted?: boolean }): Promise<Trip | null>;
  listTrips(
    userId: string,
    currentAuthUid: string,
    filterOrOptions?: TripStatus | ListTripsOptions
  ): Promise<Trip[]>;
  updateTrip(userId: string, currentAuthUid: string, tripId: string, updates: UpdateTripInput): Promise<Trip>;
  updateTripItinerary(userId: string, currentAuthUid: string, tripId: string, itinerary: DayItinerary[]): Promise<void>;
  toggleFavorite(userId: string, currentAuthUid: string, tripId: string): Promise<boolean>;
  duplicateTrip(
    userId: string,
    currentAuthUid: string,
    tripId: string,
    options?: { newStartDate?: string; newEndDate?: string }
  ): Promise<Trip>;
  reopenTrip(userId: string, currentAuthUid: string, tripId: string): Promise<Trip>;
  deleteTrip(
    userId: string,
    currentAuthUid: string,
    tripId: string,
    options?: { softDelete?: boolean }
  ): Promise<{ deleted: boolean; softDeleted: boolean }>;
  restoreTrip(userId: string, currentAuthUid: string, tripId: string): Promise<Trip>;
  addActivityToDay(
    userId: string,
    currentAuthUid: string,
    tripId: string,
    dayNumber: number,
    activity: ItineraryActivity
  ): Promise<Trip>;
  updateActivity(
    userId: string,
    currentAuthUid: string,
    tripId: string,
    dayNumber: number,
    activityId: string,
    updates: Partial<ItineraryActivity>
  ): Promise<Trip>;
  deleteActivity(
    userId: string,
    currentAuthUid: string,
    tripId: string,
    dayNumber: number,
    activityId: string
  ): Promise<Trip>;
}

export interface StoredTripRecord extends Trip {
  userId: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  clonedFromTripId?: string;
}

export class TripRepository implements ITripRepository {
  private inMemoryDb: Map<string, StoredTripRecord>;

  constructor() {
    this.inMemoryDb = new Map();
  }

  private validateOwnership(userId: string, currentAuthUid: string): void {
    if (!currentAuthUid) {
      throw new Error('permission-denied: Usuário não autenticado.');
    }
    if (userId !== currentAuthUid) {
      throw new Error('permission-denied: Acesso negado. Tentativa de acessar subcoleção de outro usuário.');
    }
  }

  private mapToTrip(stored: StoredTripRecord): Trip {
    return {
      id: stored.id,
      destination: stored.destination,
      country: stored.country,
      imageUrl: stored.imageUrl,
      startDate: stored.startDate,
      endDate: stored.endDate,
      totalDays: stored.totalDays,
      status: stored.status,
      isFavorite: stored.isFavorite ?? false,
      weatherSummary: stored.weatherSummary,
      itinerary: stored.itinerary,
      createdAt: stored.createdAt,
      updatedAt: stored.updatedAt,
      deletedAt: stored.deletedAt,
      clonedFromTripId: stored.clonedFromTripId,
    };
  }

  async createTrip(userId: string, currentAuthUid: string, input: CreateTripInput): Promise<Trip> {
    this.validateOwnership(userId, currentAuthUid);

    if (!input.destination?.name || !input.startDate || !input.endDate) {
      throw new Error('invalid-argument: Dados obrigatórios do destino ou datas ausentes.');
    }

    if (new Date(input.endDate) < new Date(input.startDate)) {
      throw new Error('invalid-argument: A data de término deve ser igual ou posterior à data de início.');
    }

    const tripId = `trip_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const nowIso = new Date().toISOString();

    const storedTrip: StoredTripRecord = {
      id: tripId,
      destination: input.destination.name,
      country: input.destination.country,
      imageUrl: input.imageUrl,
      startDate: input.startDate,
      endDate: input.endDate,
      totalDays: input.totalDays,
      status: input.status || 'planejamento',
      isFavorite: input.isFavorite ?? false,
      weatherSummary: input.weatherSummary || {
        avgTempMax: 20,
        avgTempMin: 12,
        conditions: 'Previsão estável',
      },
      itinerary: input.itinerary || [],
      userId,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    this.inMemoryDb.set(tripId, storedTrip);
    return this.mapToTrip(storedTrip);
  }

  async getTripById(
    userId: string,
    currentAuthUid: string,
    tripId: string,
    options?: { includeDeleted?: boolean }
  ): Promise<Trip | null> {
    this.validateOwnership(userId, currentAuthUid);

    const trip = this.inMemoryDb.get(tripId);
    if (!trip) return null;

    if (trip.userId !== userId) {
      throw new Error('permission-denied: Tentativa de ler viagem de outro usuário.');
    }

    if (trip.status === 'excluida' && !options?.includeDeleted) {
      return null;
    }

    return this.mapToTrip(trip);
  }

  async listTrips(
    userId: string,
    currentAuthUid: string,
    filterOrOptions?: TripStatus | ListTripsOptions
  ): Promise<Trip[]> {
    this.validateOwnership(userId, currentAuthUid);

    let options: ListTripsOptions = {};
    if (typeof filterOrOptions === 'string') {
      options = { statusFilter: filterOrOptions };
    } else if (filterOrOptions && typeof filterOrOptions === 'object') {
      options = filterOrOptions;
    }

    const userTrips: Trip[] = [];
    for (const item of this.inMemoryDb.values()) {
      if (item.userId === userId) {
        // Por padrão, ignora viagens na lixeira a menos que expressamente solicitado
        if (item.status === 'excluida' && !options.includeDeleted) {
          continue;
        }

        // Por padrão, ignora arquivadas na listagem geral ativa, a não ser que filtrado por arquivada
        if (item.status === 'arquivada' && options.statusFilter !== 'arquivada' && !options.includeArchived) {
          continue;
        }

        if (!options.statusFilter || item.status === options.statusFilter) {
          userTrips.push(this.mapToTrip(item));
        }
      }
    }

    // Ordenação: se favoritesFirst estiver ativo (ou por padrão), favoritos primeiro, depois data ASC
    return userTrips.sort((a, b) => {
      const favFirst = options.favoritesFirst ?? true;
      if (favFirst) {
        if (Boolean(a.isFavorite) && !Boolean(b.isFavorite)) return -1;
        if (!Boolean(a.isFavorite) && Boolean(b.isFavorite)) return 1;
      }
      return a.startDate.localeCompare(b.startDate);
    });
  }

  async updateTrip(
    userId: string,
    currentAuthUid: string,
    tripId: string,
    updates: UpdateTripInput
  ): Promise<Trip> {
    this.validateOwnership(userId, currentAuthUid);

    const existing = this.inMemoryDb.get(tripId);
    if (!existing) {
      throw new Error('not-found: Viagem inexistente para atualização.');
    }

    if (existing.userId !== userId) {
      throw new Error('permission-denied: Não é permitido alterar viagem de outro usuário.');
    }

    const updatedStartDate = updates.startDate ?? existing.startDate;
    const updatedEndDate = updates.endDate ?? existing.endDate;

    if (new Date(updatedEndDate) < new Date(updatedStartDate)) {
      throw new Error('invalid-argument: A data de término deve ser igual ou posterior à data de início.');
    }

    const diffDays = Math.round(
      (new Date(updatedEndDate).getTime() - new Date(updatedStartDate).getTime()) / (1000 * 60 * 60 * 24)
    ) + 1;

    const updatedRecord: StoredTripRecord = {
      ...existing,
      destination: updates.destination?.name ?? existing.destination,
      country: updates.destination?.country ?? existing.country,
      imageUrl: updates.imageUrl ?? existing.imageUrl,
      startDate: updatedStartDate,
      endDate: updatedEndDate,
      totalDays: updates.totalDays ?? diffDays,
      status: updates.status ?? existing.status,
      isFavorite: updates.isFavorite !== undefined ? updates.isFavorite : existing.isFavorite,
      weatherSummary: updates.weatherSummary ?? existing.weatherSummary,
      itinerary: updates.itinerary ?? existing.itinerary,
      updatedAt: new Date().toISOString(),
    };

    this.inMemoryDb.set(tripId, updatedRecord);
    return this.mapToTrip(updatedRecord);
  }

  async updateTripItinerary(
    userId: string,
    currentAuthUid: string,
    tripId: string,
    itinerary: DayItinerary[]
  ): Promise<void> {
    this.validateOwnership(userId, currentAuthUid);

    const existing = this.inMemoryDb.get(tripId);
    if (!existing) {
      throw new Error('not-found: Viagem não encontrada para atualização de roteiro.');
    }

    if (existing.userId !== userId) {
      throw new Error('permission-denied: Proibido alterar roteiro de outro usuário.');
    }

    if (!Array.isArray(itinerary)) {
      throw new Error('invalid-argument: O itinerário deve ser um array válido de dias.');
    }

    this.inMemoryDb.set(tripId, {
      ...existing,
      itinerary,
      updatedAt: new Date().toISOString(),
    });
  }

  async toggleFavorite(userId: string, currentAuthUid: string, tripId: string): Promise<boolean> {
    this.validateOwnership(userId, currentAuthUid);

    const existing = this.inMemoryDb.get(tripId);
    if (!existing) {
      throw new Error('not-found: Viagem inexistente.');
    }

    if (existing.userId !== userId) {
      throw new Error('permission-denied: Não é permitido favoritar viagem de outro usuário.');
    }

    const nextFavoriteState = !Boolean(existing.isFavorite);
    this.inMemoryDb.set(tripId, {
      ...existing,
      isFavorite: nextFavoriteState,
      updatedAt: new Date().toISOString(),
    });

    return nextFavoriteState;
  }

  async duplicateTrip(
    userId: string,
    currentAuthUid: string,
    tripId: string,
    options?: { newStartDate?: string; newEndDate?: string }
  ): Promise<Trip> {
    this.validateOwnership(userId, currentAuthUid);

    const source = this.inMemoryDb.get(tripId);
    if (!source) {
      throw new Error('not-found: Viagem de origem para duplicação não encontrada.');
    }

    if (source.userId !== userId) {
      throw new Error('permission-denied: Não é permitido duplicar viagem privada de outro usuário.');
    }

    const newTripId = `trip_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const nowIso = new Date().toISOString();

    const targetStartDate = options?.newStartDate ?? source.startDate;
    const targetEndDate = options?.newEndDate ?? source.endDate;

    const diffDays = Math.round(
      (new Date(targetEndDate).getTime() - new Date(targetStartDate).getTime()) / (1000 * 60 * 60 * 24)
    ) + 1;

    // Clona o itinerário preservando todas as atividades
    const clonedItinerary: DayItinerary[] = JSON.parse(JSON.stringify(source.itinerary));

    const clonedRecord: StoredTripRecord = {
      id: newTripId,
      destination: source.destination,
      country: source.country,
      imageUrl: source.imageUrl,
      startDate: targetStartDate,
      endDate: targetEndDate,
      totalDays: diffDays,
      status: 'planejamento',
      isFavorite: false,
      weatherSummary: source.weatherSummary,
      itinerary: clonedItinerary,
      userId,
      createdAt: nowIso,
      updatedAt: nowIso,
      clonedFromTripId: source.id,
    };

    this.inMemoryDb.set(newTripId, clonedRecord);
    return this.mapToTrip(clonedRecord);
  }

  async reopenTrip(userId: string, currentAuthUid: string, tripId: string): Promise<Trip> {
    this.validateOwnership(userId, currentAuthUid);

    const existing = this.inMemoryDb.get(tripId);
    if (!existing) {
      throw new Error('not-found: Viagem não encontrada para reabertura.');
    }

    if (existing.userId !== userId) {
      throw new Error('permission-denied: Não é permitido reabrir viagem de outro usuário.');
    }

    const updatedRecord: StoredTripRecord = {
      ...existing,
      status: 'planejamento',
      updatedAt: new Date().toISOString(),
    };

    this.inMemoryDb.set(tripId, updatedRecord);
    return this.mapToTrip(updatedRecord);
  }

  async deleteTrip(
    userId: string,
    currentAuthUid: string,
    tripId: string,
    options?: { softDelete?: boolean }
  ): Promise<{ deleted: boolean; softDeleted: boolean }> {
    this.validateOwnership(userId, currentAuthUid);

    const existing = this.inMemoryDb.get(tripId);
    if (!existing) {
      throw new Error('not-found: Viagem inexistente para exclusão.');
    }

    if (existing.userId !== userId) {
      throw new Error('permission-denied: Não é permitido excluir viagem de outro usuário.');
    }

    const useSoftDelete = options?.softDelete ?? false;
    const nowIso = new Date().toISOString();

    if (useSoftDelete) {
      this.inMemoryDb.set(tripId, {
        ...existing,
        status: 'excluida',
        deletedAt: nowIso,
        updatedAt: nowIso,
      });
      return { deleted: true, softDeleted: true };
    }

    this.inMemoryDb.delete(tripId);
    return { deleted: true, softDeleted: false };
  }

  async restoreTrip(userId: string, currentAuthUid: string, tripId: string): Promise<Trip> {
    this.validateOwnership(userId, currentAuthUid);

    const existing = this.inMemoryDb.get(tripId);
    if (!existing) {
      throw new Error('not-found: Viagem inexistente para restauração.');
    }

    if (existing.userId !== userId) {
      throw new Error('permission-denied: Não é permitido restaurar viagem de outro usuário.');
    }

    const restored: StoredTripRecord = {
      ...existing,
      status: 'planejamento',
      deletedAt: undefined,
      updatedAt: new Date().toISOString(),
    };

    this.inMemoryDb.set(tripId, restored);
    return this.mapToTrip(restored);
  }

  // --- Métodos de Consistência Atômica com ItineraryItems ---

  async addActivityToDay(
    userId: string,
    currentAuthUid: string,
    tripId: string,
    dayNumber: number,
    activity: ItineraryActivity
  ): Promise<Trip> {
    this.validateOwnership(userId, currentAuthUid);

    const existing = this.inMemoryDb.get(tripId);
    if (!existing) throw new Error('not-found: Viagem inexistente.');
    if (existing.userId !== userId) throw new Error('permission-denied: Proibido alterar viagem de outro usuário.');

    const itinerary: DayItinerary[] = JSON.parse(JSON.stringify(existing.itinerary));
    let day = itinerary.find((d) => d.dayNumber === dayNumber);

    if (!day) {
      day = {
        dayNumber,
        date: existing.startDate,
        theme: `Dia ${dayNumber}`,
        activities: [],
      };
      itinerary.push(day);
      itinerary.sort((a, b) => a.dayNumber - b.dayNumber);
    }

    day.activities.push(activity);

    const updatedRecord: StoredTripRecord = {
      ...existing,
      itinerary,
      updatedAt: new Date().toISOString(),
    };

    this.inMemoryDb.set(tripId, updatedRecord);
    return this.mapToTrip(updatedRecord);
  }

  async updateActivity(
    userId: string,
    currentAuthUid: string,
    tripId: string,
    dayNumber: number,
    activityId: string,
    updates: Partial<ItineraryActivity>
  ): Promise<Trip> {
    this.validateOwnership(userId, currentAuthUid);

    const existing = this.inMemoryDb.get(tripId);
    if (!existing) throw new Error('not-found: Viagem inexistente.');
    if (existing.userId !== userId) throw new Error('permission-denied: Proibido alterar viagem de outro usuário.');

    const itinerary: DayItinerary[] = JSON.parse(JSON.stringify(existing.itinerary));
    const day = itinerary.find((d) => d.dayNumber === dayNumber);
    if (!day) throw new Error(`not-found: Dia ${dayNumber} não encontrado no itinerário.`);

    const actIndex = day.activities.findIndex((a) => a.id === activityId);
    if (actIndex === -1) throw new Error(`not-found: Atividade ${activityId} não encontrada no dia ${dayNumber}.`);

    day.activities[actIndex] = {
      ...day.activities[actIndex],
      ...updates,
    };

    const updatedRecord: StoredTripRecord = {
      ...existing,
      itinerary,
      updatedAt: new Date().toISOString(),
    };

    this.inMemoryDb.set(tripId, updatedRecord);
    return this.mapToTrip(updatedRecord);
  }

  async deleteActivity(
    userId: string,
    currentAuthUid: string,
    tripId: string,
    dayNumber: number,
    activityId: string
  ): Promise<Trip> {
    this.validateOwnership(userId, currentAuthUid);

    const existing = this.inMemoryDb.get(tripId);
    if (!existing) throw new Error('not-found: Viagem inexistente.');
    if (existing.userId !== userId) throw new Error('permission-denied: Proibido alterar viagem de outro usuário.');

    const itinerary: DayItinerary[] = JSON.parse(JSON.stringify(existing.itinerary));
    const day = itinerary.find((d) => d.dayNumber === dayNumber);
    if (!day) throw new Error(`not-found: Dia ${dayNumber} não encontrado no itinerário.`);

    const beforeCount = day.activities.length;
    day.activities = day.activities.filter((a) => a.id !== activityId);

    if (day.activities.length === beforeCount) {
      throw new Error(`not-found: Atividade ${activityId} não encontrada para exclusão.`);
    }

    const updatedRecord: StoredTripRecord = {
      ...existing,
      itinerary,
      updatedAt: new Date().toISOString(),
    };

    this.inMemoryDb.set(tripId, updatedRecord);
    return this.mapToTrip(updatedRecord);
  }
}
