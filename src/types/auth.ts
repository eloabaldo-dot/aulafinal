export type UserRole = 'user' | 'admin';

export interface UserPreferences {
  travelStyle: 'cultura' | 'natureza' | 'gastronomia' | 'aventura' | 'relaxamento';
  interests?: string[];
  budgetLevel: 'economico' | 'moderado' | 'luxo';
  pace: 'tranquilo' | 'moderado' | 'intenso';
  transportation?: ('caminhada' | 'transporte_publico' | 'carro_alugado' | 'taxi_uber')[];
  preferredClimate?: 'ensolarado_quente' | 'ameno_fresco' | 'frio_neve' | 'indiferente';
  maxDistanceKm?: number;
  dietaryRestrictions: string[];
}

export interface UserProfileDocument {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  bio?: string;
  role: UserRole;
  preferences: UserPreferences;
  createdAt: string;
  updatedAt: string;
}

export interface AuthSession {
  user: UserProfileDocument | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
