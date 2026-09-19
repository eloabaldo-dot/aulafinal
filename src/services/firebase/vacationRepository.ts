import { VacationPeriod } from '../../types/mvp';
import { CreateVacationInput, UpdateVacationInput } from '../../types/firestore';

export interface IVacationRepository {
  createVacation(userId: string, currentAuthUid: string, input: CreateVacationInput): Promise<VacationPeriod>;
  listVacations(userId: string, currentAuthUid: string): Promise<VacationPeriod[]>;
  updateVacation(userId: string, currentAuthUid: string, vacationId: string, input: UpdateVacationInput): Promise<VacationPeriod>;
  deleteVacation(userId: string, currentAuthUid: string, vacationId: string): Promise<void>;
}

export class VacationRepository implements IVacationRepository {
  private inMemoryDb: Map<string, VacationPeriod & { userId: string; createdAt: string; updatedAt: string }>;

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

  async createVacation(
    userId: string,
    currentAuthUid: string,
    input: CreateVacationInput
  ): Promise<VacationPeriod> {
    this.validateOwnership(userId, currentAuthUid);

    if (!input.title || !input.startDate || !input.endDate) {
      throw new Error('invalid-argument: Campos obrigatórios ausentes para período de folga.');
    }

    if (new Date(input.endDate) < new Date(input.startDate)) {
      throw new Error('invalid-argument: A data de término deve ser igual ou posterior à data de início.');
    }

    const diffDays = Math.ceil(
      (new Date(input.endDate).getTime() - new Date(input.startDate).getTime()) / (1000 * 60 * 60 * 24)
    ) + 1;

    const id = `vac_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newVacation = {
      id,
      title: input.title.trim(),
      startDate: input.startDate,
      endDate: input.endDate,
      totalDays: diffDays,
      notes: input.notes?.trim() || '',
      userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.inMemoryDb.set(id, newVacation);
    return {
      id: newVacation.id,
      title: newVacation.title,
      startDate: newVacation.startDate,
      endDate: newVacation.endDate,
      totalDays: newVacation.totalDays,
      notes: newVacation.notes,
    };
  }

  async listVacations(userId: string, currentAuthUid: string): Promise<VacationPeriod[]> {
    this.validateOwnership(userId, currentAuthUid);

    // Consulta restrita à subcoleção /users/{userId}/availability
    // SEMPRE ordenada por startDate ASC
    const userItems: VacationPeriod[] = [];
    for (const item of this.inMemoryDb.values()) {
      if (item.userId === userId) {
        userItems.push({
          id: item.id,
          title: item.title,
          startDate: item.startDate,
          endDate: item.endDate,
          totalDays: item.totalDays,
          notes: item.notes,
        });
      }
    }

    return userItems.sort((a, b) => a.startDate.localeCompare(b.startDate));
  }

  async updateVacation(
    userId: string,
    currentAuthUid: string,
    vacationId: string,
    input: UpdateVacationInput
  ): Promise<VacationPeriod> {
    this.validateOwnership(userId, currentAuthUid);

    const existing = this.inMemoryDb.get(vacationId);
    if (!existing) {
      throw new Error('not-found: Período de folga não encontrado.');
    }
    if (existing.userId !== userId) {
      throw new Error('permission-denied: Não é permitido editar período de outro usuário.');
    }

    const newStart = input.startDate || existing.startDate;
    const newEnd = input.endDate || existing.endDate;

    if (new Date(newEnd) < new Date(newStart)) {
      throw new Error('invalid-argument: A data de término deve ser igual ou posterior à data de início.');
    }

    const diffDays = Math.ceil(
      (new Date(newEnd).getTime() - new Date(newStart).getTime()) / (1000 * 60 * 60 * 24)
    ) + 1;

    const updated = {
      ...existing,
      title: input.title !== undefined ? input.title.trim() : existing.title,
      startDate: newStart,
      endDate: newEnd,
      totalDays: diffDays,
      notes: input.notes !== undefined ? input.notes.trim() : existing.notes,
      updatedAt: new Date().toISOString(),
    };

    this.inMemoryDb.set(vacationId, updated);
    return {
      id: updated.id,
      title: updated.title,
      startDate: updated.startDate,
      endDate: updated.endDate,
      totalDays: updated.totalDays,
      notes: updated.notes,
    };
  }

  async deleteVacation(userId: string, currentAuthUid: string, vacationId: string): Promise<void> {
    this.validateOwnership(userId, currentAuthUid);

    const existing = this.inMemoryDb.get(vacationId);
    if (!existing) {
      throw new Error('not-found: Período de folga não encontrado.');
    }

    if (existing.userId !== userId) {
      throw new Error('permission-denied: Não é permitido excluir período de outro usuário.');
    }

    this.inMemoryDb.delete(vacationId);
  }
}
