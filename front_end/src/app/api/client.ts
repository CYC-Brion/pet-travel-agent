export type TripStatus = 'draft' | 'planned' | 'in_progress' | 'completed';
export type EmergencyDecision = 'none' | 'accepted_alternative' | 'kept_original' | 'cancelled';

export interface TripSummary {
  id: string;
  title: string;
  route: string;
  dates: string;
  petName: string;
  status: TripStatus;
  nextStep: string;
  rating?: number;
}

export interface BudgetRange {
  min: number;
  max: number;
  currency: string;
}

export interface PlanActivity {
  id?: string;
  time?: string;
  type?: string;
  title?: string;
  name?: string;
  duration?: string;
  distance?: string;
  ticket?: string;
  price?: string;
  petPolicy?: string;
  hours?: string;
  phone?: string;
  description?: string;
}

export interface PlanDay {
  day: number;
  date: string;
  activities: PlanActivity[];
}

export interface ApiPlan {
  title: string;
  route: string;
  dates: string;
  budget_range: BudgetRange;
  estimated_total: number;
  hotel: Record<string, any>;
  itinerary_days: PlanDay[];
  restaurants: Array<Record<string, any>>;
  attractions: Array<Record<string, any>>;
  hospitals: Array<Record<string, any>>;
  flights: Array<Record<string, any>>;
  risks: string[];
  documents: string[];
  source_trace: Array<Record<string, any>>;
}

export interface PlanRequest {
  user_id: string;
  session_id?: string;
  trip: {
    departure: string;
    destination: string;
    start_date: string;
    end_date: string;
    days: number;
    num_people: number;
    num_pets: number;
    budget_min: number;
    budget_max: number;
    transport: string;
    hotel_preference: string;
    pace: string;
  };
  pet: {
    name: string;
    type: string;
    breed: string;
    age: number;
    weight_kg: number;
    health_status: string;
    medical_notes: string;
  };
  safety: {
    emergency_contact: string;
    include_pet_hospitals: boolean;
  };
}

export interface PlanResponse {
  ok: boolean;
  trip_id: string;
  session_id: string;
  status: TripStatus;
  assistant_reply: string;
  plan: ApiPlan;
  warnings: string[];
  raw?: Record<string, any>;
}

export interface EmergencyReplanResponse {
  ok: boolean;
  emergency: { title?: string; description?: string; detectedAt?: string };
  affectedStops: Array<{ time?: string; name?: string; reason?: string; impact?: 'high' | 'medium' | 'low' }>;
  alternativePlan: Array<Record<string, any>>;
  originalPlan: Array<Record<string, any>>;
  hospitals: Array<Record<string, any>>;
  safetyChecklist: Array<{ id: number; label: string; checked: boolean }>;
}

export interface TripReviewData {
  trip_id?: string;
  name?: string;
  dates?: string;
  hotel?: string;
  rating?: number;
  spending?: Array<{ category: string; amount: string; percentage: number }>;
  placesVisited?: Array<{ name: string; type?: string; petFriendly?: boolean }>;
  petMilestones?: Array<{ label: string; value: string }>;
  notes?: string;
}

export interface UserProfile {
  user_id?: string;
  fullName: string;
  email: string;
  phone: string;
  petName: string;
  petType: string;
  breed: string;
  age: string;
  weight: string;
  healthStatus: string;
  healthNotes: string;
  minBudget: string;
  maxBudget: string;
  transportPreference: string;
  hotelPreference: string;
  travelPace: string;
  emergencyName: string;
  emergencyPhone: string;
  emergencyRelation: string;
}

export interface LoginResponse {
  ok: boolean;
  user_id: string;
  session_id: string;
  profile: UserProfile;
}

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') || '';

export const fallbackProfile: UserProfile = {
  fullName: '',
  email: '',
  phone: '',
  petName: '',
  petType: 'dog',
  breed: '',
  age: '',
  weight: '',
  healthStatus: 'healthy',
  healthNotes: '',
  minBudget: '',
  maxBudget: '',
  transportPreference: 'car',
  hotelPreference: '4-star',
  travelPace: 'moderate',
  emergencyName: '',
  emergencyPhone: '',
  emergencyRelation: '',
};

async function requestJson<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });

  if (!response.ok) {
    const message = await response.text().catch(() => '');
    throw new Error(`API ${path} failed with ${response.status}${message ? `: ${message}` : ''}`);
  }

  return response.json() as Promise<T>;
}

export const api = {
  async login(email?: string, name?: string): Promise<LoginResponse> {
    return await requestJson<LoginResponse>('/api/session/login', {
      method: 'POST',
      body: JSON.stringify({ email, name }),
    });
  },

  async getProfile(userId: string): Promise<UserProfile> {
    const data = await requestJson<{ ok: boolean; profile: UserProfile }>(`/api/users/${userId}/profile`);
    return data.profile;
  },

  async saveProfile(userId: string, profile: UserProfile): Promise<UserProfile> {
    const data = await requestJson<{ ok: boolean; profile: UserProfile }>(`/api/users/${userId}/profile`, {
      method: 'PUT',
      body: JSON.stringify(profile),
    });
    return data.profile;
  },

  async createPlan(payload: PlanRequest): Promise<PlanResponse> {
    return await requestJson<PlanResponse>('/api/trips/plan', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async getTrips(userId: string): Promise<TripSummary[]> {
    const data = await requestJson<{ ok: boolean; trips: TripSummary[] }>(`/api/users/${userId}/trips`);
    return data.trips;
  },

  async startTrip(tripId: string) {
    return await requestJson(`/api/trips/${tripId}/start`, { method: 'POST' });
  },

  async completeTrip(tripId: string) {
    return await requestJson(`/api/trips/${tripId}/complete`, { method: 'POST' });
  },

  async getMap(tripId: string) {
    return await requestJson<any>(`/api/trips/${tripId}/map`);
  },

  async emergencyReplan(tripId: string, issue: string): Promise<EmergencyReplanResponse> {
    return await requestJson<EmergencyReplanResponse>(`/api/trips/${tripId}/emergency-replan`, {
      method: 'POST',
      body: JSON.stringify({ issue, selected_day: 2 }),
    });
  },

  async emergencyDecision(tripId: string, decision: EmergencyDecision) {
    return await requestJson(`/api/trips/${tripId}/emergency-decision`, {
      method: 'POST',
      body: JSON.stringify({ decision }),
    });
  },

  async getReview(tripId: string): Promise<TripReviewData> {
    const data = await requestJson<{ ok: boolean; review: TripReviewData }>(`/api/trips/${tripId}/review`);
    return data.review;
  },

  async postReview(tripId: string, payload: { rating: number; notes: string }): Promise<TripReviewData> {
    const data = await requestJson<{ ok: boolean; review: TripReviewData }>(`/api/trips/${tripId}/review`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return data.review;
  },
};
