export type TabType = 'inicio' | 'explorar' | 'planejar' | 'roteiros' | 'compartilhar';

export interface DestinationItem {
  id: string;
  name: string;
  country: string;
  weather: string;
  weatherCondition: string;
  badge: string;
  badgeType: 'highlight' | 'value' | 'nature' | 'unforgettable';
  matchPercentage: number;
  description: string;
  dailyEstimate: number;
  imageUrl: string;
}

export interface CuratedInspiration {
  id: string;
  title: string;
  category: string;
  description: string;
  duration: string;
  matchScore: number;
  priceLevel: string;
  imageUrl: string;
}

export interface ActivityItem {
  id: string;
  time: string;
  category: string;
  title: string;
  description: string;
  tags: string[];
  priceLevel?: string;
  duration?: string;
  rating?: number;
  icon: string;
  imageUrl?: string;
  isMainAttraction?: boolean;
  transitBefore?: {
    type: 'walk' | 'subway' | 'bus' | 'taxi';
    text: string;
  };
  aiTip?: string;
  crowdNote?: string;
}

export interface TicketOption {
  id: string;
  name: string;
  description: string;
  price: number;
  recommended?: boolean;
  highlightNote: string;
}

export interface TravelerReview {
  id: string;
  author: string;
  avatarUrl: string;
  tripType: string;
  date: string;
  rating: number;
  comment: string;
}

export interface Companion {
  id: string;
  name: string;
  role: string;
  avatarUrl: string;
  permission: 'Owner' | 'Pode Editar' | 'Visualizar';
  isOnline?: boolean;
  lastSeen?: string;
  isCurrentUser?: boolean;
}

export interface DirectImageLink {
  label: string;
  category: string;
  url: string;
  usage: string;
}

export type ThemeMode = 'light' | 'dark';

export interface SearchImageItem {
  id: string;
  title: string;
  description: string;
  source: 'Unsplash' | 'Pexels' | 'Wikimedia';
  author: string;
  authorUrl?: string;
  url: string;
  thumbnailUrl: string;
  downloadUrl?: string;
  width?: number;
  height?: number;
  orientation: 'landscape' | 'portrait' | 'square';
  category: string;
  tags: string[];
  likes?: number;
}
