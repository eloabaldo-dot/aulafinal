import { UserPreferences, UserProfileDocument } from './auth';
import { VacationPeriod, Trip, DayItinerary, ItineraryActivity, TripStatus, TripVisibility } from './mvp';

export interface CreateVacationInput {
  title: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  notes?: string;
}

export interface UpdateVacationInput {
  title?: string;
  startDate?: string;
  endDate?: string;
  notes?: string;
}

export interface CreateTripInput {
  destination: {
    name: string;
    country: string;
    latitude: number;
    longitude: number;
  };
  imageUrl: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  totalDays: number;
  status: TripStatus;
  visibility?: TripVisibility;
  shareToken?: string;
  isFavorite?: boolean;
  weatherSummary?: {
    avgTempMax: number;
    avgTempMin: number;
    conditions: string;
    fetchedAt?: string;
  };
  itinerary: DayItinerary[];
}

export interface UpdateTripInput {
  destination?: {
    name: string;
    country: string;
    latitude: number;
    longitude: number;
  };
  imageUrl?: string;
  startDate?: string;
  endDate?: string;
  totalDays?: number;
  status?: TripStatus;
  visibility?: TripVisibility;
  shareToken?: string;
  isFavorite?: boolean;
  weatherSummary?: {
    avgTempMax: number;
    avgTempMin: number;
    conditions: string;
    fetchedAt?: string;
  };
  itinerary?: DayItinerary[];
}
