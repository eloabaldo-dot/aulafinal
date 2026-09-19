import { UserProfileDocument, UserPreferences } from '../../types/auth';

/**
 * Interface de abstração de armazenamento para o Repositório de Usuários.
 * Suporta tanto o SDK nativo do Firestore quanto mock determinístico para testes e offline.
 */
export interface IUserRepository {
  getUserProfile(userId: string, currentAuthUid: string): Promise<UserProfileDocument | null>;
  updateUserPreferences(
    userId: string,
    currentAuthUid: string,
    preferences: UserPreferences
  ): Promise<void>;
  updateUserProfile(
    userId: string,
    currentAuthUid: string,
    updates: Partial<Pick<UserProfileDocument, 'displayName' | 'bio' | 'photoURL'>>
  ): Promise<void>;
}

export class UserRepository implements IUserRepository {
  private inMemoryDb: Map<string, UserProfileDocument>;

  constructor(initialData?: Map<string, UserProfileDocument>) {
    this.inMemoryDb = initialData || new Map();
  }

  private validateOwnership(userId: string, currentAuthUid: string): void {
    if (!currentAuthUid) {
      throw new Error('permission-denied: Usuário não autenticado.');
    }
    if (userId !== currentAuthUid) {
      throw new Error('permission-denied: Acesso negado. Usuário não é o proprietário deste recurso.');
    }
  }

  async getUserProfile(userId: string, currentAuthUid: string): Promise<UserProfileDocument | null> {
    this.validateOwnership(userId, currentAuthUid);
    const profile = this.inMemoryDb.get(userId);
    return profile ? { ...profile } : null;
  }

  async updateUserPreferences(
    userId: string,
    currentAuthUid: string,
    preferences: UserPreferences
  ): Promise<void> {
    this.validateOwnership(userId, currentAuthUid);

    if (!preferences || !preferences.travelStyle || !preferences.budgetLevel || !preferences.pace) {
      throw new Error('invalid-argument: Objeto de preferências incompleto ou inválido.');
    }

    const existing = this.inMemoryDb.get(userId);
    if (!existing) {
      throw new Error('not-found: Documento de usuário inexistente.');
    }

    this.inMemoryDb.set(userId, {
      ...existing,
      preferences,
      updatedAt: new Date().toISOString(), // Simula serverTimestamp()
    });
  }

  async updateUserProfile(
    userId: string,
    currentAuthUid: string,
    updates: Partial<Pick<UserProfileDocument, 'displayName' | 'bio' | 'photoURL'>>
  ): Promise<void> {
    this.validateOwnership(userId, currentAuthUid);

    const existing = this.inMemoryDb.get(userId);
    if (!existing) {
      throw new Error('not-found: Documento de usuário inexistente.');
    }

    this.inMemoryDb.set(userId, {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  }

  // Método auxiliar para testes
  _setSeedUser(user: UserProfileDocument): void {
    this.inMemoryDb.set(user.uid, user);
  }
}
