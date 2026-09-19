export type RoutePath =
  | '/'
  | '/login'
  | '/register'
  | '/dashboard'
  | '/profile'
  | '/availability'
  | '/explore'
  | '/trips'
  | '/trips/[id]';

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  bio?: string;
  avatarUrl?: string;
  preferences: {
    travelStyle: 'cultura' | 'natureza' | 'gastronomia' | 'aventura' | 'relaxamento';
    budgetLevel: 'economico' | 'moderado' | 'luxo';
    pace: 'tranquilo' | 'moderado' | 'intenso';
    dietaryRestrictions: string[];
  };
}

export interface VacationPeriod {
  id: string;
  title: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  totalDays: number;
  notes?: string;
}

export interface DestinationContext {
  id: string;
  name: string;
  country: string;
  latitude: number;
  longitude: number;
  imageUrl: string;
  description: string;
  weather: {
    temperature: number;
    condition: 'Ensolarado' | 'Chuvoso' | 'Nublado' | 'Agradável';
    icon: string;
  };
  highlights: string[];
}

export interface ItineraryActivity {
  id: string;
  placeId?: string;
  period: 'manha' | 'tarde' | 'noite';
  time: string;
  title: string;
  description: string;
  locationName: string;
  estimatedCost?: string;
  tips?: string;
}

export interface DayItinerary {
  dayNumber: number;
  date: string;
  theme: string;
  activities: ItineraryActivity[];
}

export type TripStatus =
  | 'rascunho'
  | 'planejamento'
  | 'confirmada'
  | 'em_andamento'
  | 'concluida'
  | 'arquivada'
  | 'excluida';

export type TripVisibility = 'private' | 'link' | 'public';

export interface PublicTripDTO {
  id: string;
  destination: {
    name: string;
    country: string;
    latitude: number;
    longitude: number;
  };
  title?: string;
  imageUrl: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  visibility: TripVisibility;
  shareToken?: string;
  itinerary: DayItinerary[];
}

export interface Trip {
  id: string;
  userId?: string;
  destination: string;
  country: string;
  imageUrl: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  status: TripStatus;
  visibility?: TripVisibility;
  shareToken?: string;
  isFavorite?: boolean;
  weatherSummary: {
    avgTempMax: number;
    avgTempMin: number;
    conditions: string;
    fetchedAt?: string;
    needsRevalidation?: boolean;
  };
  itinerary: DayItinerary[];
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string;
  clonedFromTripId?: string;
  sourceTripId?: string;
  revalidationRequired?: {
    weather: boolean;
    places: boolean;
    reason?: string;
  };
}
