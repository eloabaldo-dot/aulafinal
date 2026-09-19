/**
 * Contrato Canônico de Saída do Roteiro SmartTrip
 * Conforme especificado em docs/specs/itinerary-contract-spec.md
 */

import { WeatherCondition } from './weather';

export type ActivityPeriod = 'manha' | 'tarde' | 'noite';

export interface ItineraryActivity {
  placeId: string;
  name: string;
  period: ActivityPeriod;
  timeSlot: string; // 'HH:MM'
  rationale: string; // 10 a 200 caracteres
  estimatedDuration?: string;
  curatorTip?: string;
}

export interface ItineraryDayWeather {
  hasForecast: boolean;
  tempMin: number | null;
  tempMax: number | null;
  condition: WeatherCondition;
  observation: string;
}

export interface ItineraryDay {
  dayNumber: number; // 1 a 14
  date: string; // 'YYYY-MM-DD'
  theme: string; // 3 a 80 caracteres
  weather: ItineraryDayWeather;
  alerts: string[]; // Pode ser array vazio []
  activities: ItineraryActivity[]; // 1 a 6 itens
}

export interface SmartTripItinerary {
  title: string; // 5 a 100 caracteres
  summary: string; // 20 a 400 caracteres
  destinationId: string;
  startDate: string; // 'YYYY-MM-DD'
  endDate: string; // 'YYYY-MM-DD'
  alerts?: string[];
  days: ItineraryDay[];
}

export type ItineraryValidationErrorCode =
  | 'REQUIRED_FIELD_MISSING'
  | 'INVALID_TYPE'
  | 'STRING_LENGTH_OUT_OF_BOUNDS'
  | 'DATE_OUT_OF_RANGE'
  | 'DATE_GAP_DETECTED'
  | 'INVALID_TIMESLOT_FORMAT'
  | 'UNKNOWN_PLACE_ID'
  | 'FACTUAL_NAME_MISMATCH'
  | 'WEATHER_INVARIANT_VIOLATION'
  | 'EXTRA_FIELDS_DISALLOWED'
  | 'EMPTY_COLLECTION_DISALLOWED';

export interface ItineraryValidationError {
  code: ItineraryValidationErrorCode;
  field: string;
  detail: string; // Mensagem técnica para logs do sistema
  userMessage: string; // Mensagem segura e amigável para exibição ao usuário
}

export interface ValidationResult<T> {
  isValid: boolean;
  data?: T;
  errors: ItineraryValidationError[];
}
