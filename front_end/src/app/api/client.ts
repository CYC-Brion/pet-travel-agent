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

const fallbackPlan: ApiPlan = {
  title: 'Your Pet-Friendly Trip to Hangzhou',
  route: 'Shanghai to Hangzhou',
  dates: 'May 15-18, 2026',
  budget_range: { min: 3500, max: 6000, currency: 'CNY' },
  estimated_total: 4500,
  hotel: { name: 'Hangzhou Pet-Friendly Hotel', type: '4-star', price: '¥680/night', petPolicy: 'Friendly' },
  itinerary_days: [
    {
      day: 1,
      date: 'May 15, 2026',
      activities: [
        { id: 'd1-1', time: '09:00', type: 'transport', title: 'Depart Shanghai by Car', duration: '2 hrs', price: '¥200 gas' },
        { id: 'd1-2', time: '11:30', type: 'hotel', title: 'Check-in: West Lake Pet-Friendly Hotel', price: '¥680', petPolicy: 'Friendly', hours: '24 hours' },
        { id: 'd1-3', time: '14:00', type: 'attraction', title: 'Su Causeway Walk', duration: '2 hrs', ticket: 'Free', petPolicy: 'Leash required', hours: 'Always open' },
        { id: 'd1-4', time: '16:30', type: 'meal', title: 'Pet-Friendly Cafe', petPolicy: 'Friendly' },
      ],
    },
    {
      day: 2,
      date: 'May 16, 2026',
      activities: [
        { id: 'd2-1', time: '08:30', type: 'attraction', title: 'Prince Bay Park', duration: '2.5 hrs', ticket: 'Free', petPolicy: 'Leash required' },
        { id: 'd2-2', time: '15:00', type: 'attraction', title: 'Yunqi Bamboo Trail', duration: '2 hrs', ticket: '¥8', petPolicy: 'Friendly', hours: 'Open until 17:00' },
      ],
    },
    {
      day: 3,
      date: 'May 18, 2026',
      activities: [
        { id: 'd3-1', time: '09:00', type: 'attraction', title: 'Longjing Village', duration: '2 hrs', ticket: 'Free', petPolicy: 'Friendly' },
        { id: 'd3-2', time: '13:30', type: 'transport', title: 'Return to Shanghai', duration: '2 hrs', price: '¥200 gas' },
      ],
    },
  ],
  restaurants: [],
  attractions: [
    { id: 'a1', name: 'Su Causeway Walk', type: 'Nature', petFriendly: true },
    { id: 'a2', name: 'Prince Bay Park', type: 'Park', petFriendly: true },
    { id: 'a3', name: 'Yunqi Bamboo Trail', type: 'Nature', petFriendly: true },
  ],
  hospitals: [
    { id: 'hospital-1', name: 'Hangzhou Pet Hospital (24hr)', rating: 4.8, hours: '24 hours', distance: '2.3 km', eta: '8 min', phone: '+86 571-8888-0000', address: 'No. 268 Kaixuan Road, Hangzhou' },
  ],
  flights: [],
  risks: ['Confirm pet policies before arrival.', 'Carry vaccination records and water.'],
  documents: ['Pet vaccination record', 'Owner ID/passport', 'Hotel pet policy confirmation'],
  source_trace: [{ branch: 'frontend-fallback', used: true }],
};

export const fallbackProfile: UserProfile = {
  fullName: 'Alex Chen',
  email: 'alex.chen@example.com',
  phone: '+86 138-0000-1234',
  petName: 'Biscuit',
  petType: 'dog',
  breed: 'Golden Retriever',
  age: '3',
  weight: '35',
  healthStatus: 'healthy',
  healthNotes: 'Vaccinations up to date. No known allergies.',
  minBudget: '3500',
  maxBudget: '6000',
  transportPreference: 'car',
  hotelPreference: '4-star',
  travelPace: 'moderate',
  emergencyName: 'Jane Chen',
  emergencyPhone: '+86 138-0000-1234',
  emergencyRelation: 'Spouse',
};

export const fallbackPlanResponse: PlanResponse = {
  ok: true,
  trip_id: 'frontend-fallback-trip',
  session_id: 'frontend-fallback-session',
  status: 'planned',
  assistant_reply: 'Backend unavailable, showing the local fallback trip plan.',
  plan: fallbackPlan,
  warnings: ['Backend unavailable; local fallback data is being used.'],
};

async function requestJson<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`API ${path} failed with ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export const api = {
  async login(email?: string, name?: string): Promise<LoginResponse> {
    try {
      return await requestJson<LoginResponse>('/api/session/login', {
        method: 'POST',
        body: JSON.stringify({ email, name }),
      });
    } catch {
      return { ok: true, user_id: 'alex-chen', session_id: 'frontend-fallback-session', profile: fallbackProfile };
    }
  },

  async getProfile(userId: string): Promise<UserProfile> {
    try {
      const data = await requestJson<{ ok: boolean; profile: UserProfile }>(`/api/users/${userId}/profile`);
      return data.profile;
    } catch {
      return fallbackProfile;
    }
  },

  async saveProfile(userId: string, profile: UserProfile): Promise<UserProfile> {
    try {
      const data = await requestJson<{ ok: boolean; profile: UserProfile }>(`/api/users/${userId}/profile`, {
        method: 'PUT',
        body: JSON.stringify(profile),
      });
      return data.profile;
    } catch {
      return profile;
    }
  },

  async createPlan(payload: PlanRequest): Promise<PlanResponse> {
    try {
      return await requestJson<PlanResponse>('/api/trips/plan', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    } catch {
      return fallbackPlanResponse;
    }
  },

  async getTrips(userId: string): Promise<TripSummary[]> {
    try {
      const data = await requestJson<{ ok: boolean; trips: TripSummary[] }>(`/api/users/${userId}/trips`);
      return data.trips;
    } catch {
      return [
        { id: 'frontend-fallback-trip', title: fallbackPlan.title, route: fallbackPlan.route, dates: fallbackPlan.dates, petName: 'Biscuit', status: 'planned', nextStep: 'Confirm the plan or start the trip' },
      ];
    }
  },

  async startTrip(tripId: string) {
    try {
      return await requestJson(`/api/trips/${tripId}/start`, { method: 'POST' });
    } catch {
      return { ok: true };
    }
  },

  async completeTrip(tripId: string) {
    try {
      return await requestJson(`/api/trips/${tripId}/complete`, { method: 'POST' });
    } catch {
      return { ok: true };
    }
  },

  async getMap(tripId: string) {
    try {
      return await requestJson<any>(`/api/trips/${tripId}/map`);
    } catch {
      return null;
    }
  },

  async emergencyReplan(tripId: string, issue: string): Promise<EmergencyReplanResponse | null> {
    try {
      return await requestJson<EmergencyReplanResponse>(`/api/trips/${tripId}/emergency-replan`, {
        method: 'POST',
        body: JSON.stringify({ issue, selected_day: 2 }),
      });
    } catch {
      return null;
    }
  },

  async emergencyDecision(tripId: string, decision: EmergencyDecision) {
    try {
      return await requestJson(`/api/trips/${tripId}/emergency-decision`, {
        method: 'POST',
        body: JSON.stringify({ decision }),
      });
    } catch {
      return { ok: true };
    }
  },

  async getReview(tripId: string): Promise<TripReviewData | null> {
    try {
      const data = await requestJson<{ ok: boolean; review: TripReviewData }>(`/api/trips/${tripId}/review`);
      return data.review;
    } catch {
      return null;
    }
  },

  async postReview(tripId: string, payload: { rating: number; notes: string }): Promise<TripReviewData | null> {
    try {
      const data = await requestJson<{ ok: boolean; review: TripReviewData }>(`/api/trips/${tripId}/review`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      return data.review;
    } catch {
      return null;
    }
  },
};
