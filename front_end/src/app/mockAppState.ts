export type AppView =
  | 'profile'
  | 'home'
  | 'info'
  | 'loading'
  | 'planning'
  | 'planningEdit'
  | 'map'
  | 'emergency'
  | 'settings'
  | 'review';

export type TripStatus = 'draft' | 'planned' | 'in_progress' | 'completed';
export type PlanType = 'budget_matched';
export type EmergencyDecision = 'none' | 'accepted_alternative' | 'kept_original';

export interface MockTrip {
  id: string;
  title: string;
  route: string;
  dates: string;
  petName: string;
  selectedPlan: PlanType;
  status: TripStatus;
  nextStep: string;
  rating?: number;
}

export interface MockAppState {
  isAuthenticated: boolean;
  userName: string;
  currentTripId: string;
  selectedPlan: PlanType;
  emergencyDecision: EmergencyDecision;
  trips: MockTrip[];
}

export const initialMockAppState: MockAppState = {
  isAuthenticated: false,
  userName: 'Alex Chen',
  currentTripId: 'hangzhou-2026',
  selectedPlan: 'budget_matched',
  emergencyDecision: 'none',
  trips: [
    {
      id: 'hangzhou-draft',
      title: 'Hangzhou Pet-Friendly Weekend',
      route: 'Shanghai to Hangzhou',
      dates: 'May 15-17, 2026',
      petName: 'Biscuit',
      selectedPlan: 'budget_matched',
      status: 'draft',
      nextStep: 'Continue editing the budget-matched plan',
    },
    {
      id: 'hangzhou-2026',
      title: 'Hangzhou 3-Day Pet-Friendly Trip',
      route: 'Shanghai to Hangzhou',
      dates: 'May 15-17, 2026',
      petName: 'Biscuit',
      selectedPlan: 'budget_matched',
      status: 'planned',
      nextStep: 'Confirm the plan or start the trip',
    },
    {
      id: 'suzhou-2025',
      title: 'Suzhou Canal Walk With Biscuit',
      route: 'Shanghai to Suzhou',
      dates: 'Oct 3-4, 2025',
      petName: 'Biscuit',
      selectedPlan: 'budget_matched',
      status: 'completed',
      nextStep: 'View trip review',
      rating: 4.5,
    },
  ],
};

export function updateTripStatus(state: MockAppState, status: TripStatus): MockAppState {
  return {
    ...state,
    trips: state.trips.map((trip) =>
      trip.id === state.currentTripId
        ? {
            ...trip,
            status,
            nextStep:
              status === 'in_progress'
                ? 'Resume today from the route map'
                : status === 'completed'
                  ? 'View trip review'
                  : status === 'planned'
                    ? 'Confirm the plan or start the trip'
                    : trip.nextStep,
          }
        : trip,
    ),
  };
}
