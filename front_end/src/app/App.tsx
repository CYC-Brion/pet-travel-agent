import { useCallback, useState } from 'react';
import { ProfilePage } from './components/ProfilePage';
import { HomeDashboard } from './components/HomeDashboard';
import { InfoCompletionPage } from './components/InfoCompletionPage';
import { LoadingPlanningPage } from './components/LoadingPlanningPage';
import { PlanningResultPage } from './components/PlanningResultPage';
import { MapRoutePage } from './components/MapRoutePage';
import { EmergencyReplanPage } from './components/EmergencyReplanPage';
import { SettingsPage } from './components/SettingsPage';
import { TripReviewPage } from './components/TripReviewPage';
import { AppView, initialMockAppState, updateTripStatus } from './mockAppState';
import { api, ApiPlan, EmergencyReplanResponse, fallbackProfile, PlanRequest, PlanResponse, TripReviewData, UserProfile } from './api/client';

export default function App() {
  const [currentView, setCurrentView] = useState<AppView>('profile');
  const [mockState, setMockState] = useState(initialMockAppState);
  const [userId, setUserId] = useState('alex-chen');
  const [sessionId, setSessionId] = useState<string | undefined>();
  const [profile, setProfile] = useState<UserProfile>(fallbackProfile);
  const [pendingPlanForm, setPendingPlanForm] = useState<any>(null);
  const [currentPlanResponse, setCurrentPlanResponse] = useState<PlanResponse | null>(null);
  const [planningError, setPlanningError] = useState<string | null>(null);
  const [mapData, setMapData] = useState<any>(null);
  const [emergencyData, setEmergencyData] = useState<EmergencyReplanResponse | null>(null);
  const [reviewData, setReviewData] = useState<TripReviewData | null>(null);

  const handleLogin = async (email?: string, name?: string) => {
    const result = await api.login(email, name);
    setUserId(result.user_id);
    setSessionId(result.session_id);
    setProfile(result.profile);
    setMockState((current) => ({ ...current, isAuthenticated: true, userName: result.profile.fullName || current.userName }));
    const trips = await api.getTrips(result.user_id);
    setMockState((current) => ({
      ...current,
      trips: trips.map((trip) => ({ ...trip, selectedPlan: 'budget_matched' as const })),
      currentTripId: trips[0]?.id || current.currentTripId,
    }));
  };

  const buildPlanRequest = useCallback((formData: any): PlanRequest => ({
    user_id: userId,
    session_id: sessionId,
    trip: {
      departure: 'Shanghai',
      destination: formData.destination || 'Hangzhou',
      start_date: formData.startDate,
      end_date: formData.endDate,
      days: Number(formData.duration || 3),
      num_people: Number(formData.travelers || 1),
      num_pets: 1,
      budget_min: Number(formData.minBudget || 0),
      budget_max: Number(formData.maxBudget || 0),
      transport: formData.transportMode || 'car',
      hotel_preference: formData.hotelPreference || '4-star',
      pace: formData.pace || 'relaxed',
    },
    pet: {
      name: formData.petName || profile.petName,
      type: formData.petType || profile.petType,
      breed: formData.breed || profile.breed,
      age: Number(formData.age || profile.age || 0),
      weight_kg: Number(formData.weight || profile.weight || 0),
      health_status: formData.healthStatus || profile.healthStatus,
      medical_notes: formData.medicalNotes || profile.healthNotes || '',
    },
    safety: {
      emergency_contact: formData.emergencyContact || `${profile.emergencyName} (${profile.emergencyPhone})`,
      include_pet_hospitals: formData.hospitalPreference !== 'no',
    },
  }), [profile, sessionId, userId]);

  const generatePlan = useCallback(async () => {
    if (!pendingPlanForm || currentPlanResponse?.status === 'planned') return;
    setPlanningError(null);
    const response = await api.createPlan(buildPlanRequest(pendingPlanForm));
    setCurrentPlanResponse(response);
    setSessionId(response.session_id);
    setMapData(null);
    setEmergencyData(null);
    setReviewData(null);
    setMockState((current) => ({
      ...current,
      currentTripId: response.trip_id,
      trips: [
        {
          id: response.trip_id,
          title: response.plan.title,
          route: response.plan.route,
          dates: response.plan.dates,
          petName: pendingPlanForm.petName || 'Biscuit',
          selectedPlan: 'budget_matched',
          status: response.status,
          nextStep: 'Confirm the plan or start the trip',
        },
        ...current.trips.filter((trip) => trip.id !== response.trip_id),
      ],
    }));
    if (response.warnings?.length) {
      setPlanningError(response.warnings[0]);
    }
    setCurrentView('planning');
  }, [buildPlanRequest, currentPlanResponse?.status, pendingPlanForm]);

  const handleNavigate = (view: string) => {
    const nextView = view as AppView;

    setMockState((current) => {
      if (currentView === 'profile' && nextView === 'home') {
        return { ...current, isAuthenticated: true };
      }

      if (currentView === 'emergency' && nextView === 'map') {
        return {
          ...updateTripStatus(current, 'in_progress'),
          emergencyDecision: current.emergencyDecision,
        };
      }

      if (nextView === 'map') {
        if (currentPlanResponse?.trip_id) {
          const activeTripId = currentPlanResponse.trip_id;
          void api.startTrip(activeTripId);
          void api.getMap(activeTripId).then((payload) => {
            if (payload?.ok) setMapData(payload);
          });
        }
        const nextState = updateTripStatus(current, 'in_progress');
        return { ...nextState, emergencyDecision: current.emergencyDecision };
      }

      if (nextView === 'emergency') {
        if (currentPlanResponse?.trip_id) {
          void api.emergencyReplan(currentPlanResponse.trip_id, 'Heavy rainfall expected near the current route').then((payload) => {
            if (payload?.ok) setEmergencyData(payload);
          });
        }
        return current;
      }

      if (nextView === 'review') {
        if (currentPlanResponse?.trip_id) {
          const activeTripId = currentPlanResponse.trip_id;
          void api.completeTrip(activeTripId);
          void api.getReview(activeTripId).then((payload) => setReviewData(payload));
        }
        return updateTripStatus(current, 'completed');
      }

      if (nextView === 'planning' || nextView === 'planningEdit') {
        return updateTripStatus(current, current.trips.find((trip) => trip.id === current.currentTripId)?.status === 'completed' ? 'planned' : 'planned');
      }

      return current;
    });

    setCurrentView(nextView);
  };

  // Route to different pages
  if (currentView === 'profile') {
    return <ProfilePage onLogin={handleLogin} onNavigate={handleNavigate} />;
  }

  if (currentView === 'home') {
    return <HomeDashboard appState={mockState} onNavigate={handleNavigate} />;
  }

  if (currentView === 'info') {
    return <InfoCompletionPage onSubmitPlan={(formData) => {
      setPendingPlanForm(formData);
      setCurrentPlanResponse(null);
    }} onNavigate={handleNavigate} />;
  }

  if (currentView === 'loading') {
    return <LoadingPlanningPage planningError={planningError} onGeneratePlan={generatePlan} onNavigate={handleNavigate} />;
  }

  if (currentView === 'planning') {
    return <PlanningResultPage key="planning" plan={currentPlanResponse?.plan as ApiPlan | undefined} onNavigate={handleNavigate} />;
  }

  if (currentView === 'planningEdit') {
    return <PlanningResultPage key="planningEdit" plan={currentPlanResponse?.plan as ApiPlan | undefined} initialEditMode onNavigate={handleNavigate} />;
  }

  if (currentView === 'map') {
    return <MapRoutePage mapData={mapData} plan={currentPlanResponse?.plan as ApiPlan | undefined} appState={mockState} onNavigate={handleNavigate} />;
  }

  if (currentView === 'emergency') {
    return <EmergencyReplanPage data={emergencyData} onDecision={async (decision) => {
      if (currentPlanResponse?.trip_id) {
        await api.emergencyDecision(currentPlanResponse.trip_id, decision);
      }
      setMockState((current) => ({ ...current, emergencyDecision: decision === 'accepted_alternative' ? 'accepted_alternative' : decision === 'kept_original' ? 'kept_original' : current.emergencyDecision }));
    }} onNavigate={handleNavigate} />;
  }

  if (currentView === 'settings') {
    return <SettingsPage profile={profile} onSaveProfile={async (nextProfile) => {
      const saved = await api.saveProfile(userId, nextProfile);
      setProfile(saved);
      setMockState((current) => ({ ...current, userName: saved.fullName || current.userName }));
    }} onNavigate={handleNavigate} />;
  }

  if (currentView === 'review') {
    return <TripReviewPage
      review={reviewData}
      onSaveReview={async (payload) => {
        if (!currentPlanResponse?.trip_id) return;
        const saved = await api.postReview(currentPlanResponse.trip_id, payload);
        setReviewData(saved);
      }}
      onNavigate={handleNavigate}
    />;
  }

  return null;
}
