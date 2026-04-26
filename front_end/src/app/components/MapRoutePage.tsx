import { useState } from 'react';
import { ArrowLeft, Navigation, Info, Phone, MapPin, Clock, PawPrint, Building2, Shield, AlertCircle, Play, X, Star, ChevronRight } from 'lucide-react';
import { MockAppState } from '../mockAppState';
import { ApiPlan } from '../api/client';

interface MapRoutePageProps {
  onNavigate?: (view: string) => void;
  appState: MockAppState;
  plan?: ApiPlan | null;
  mapData?: {
    ok?: boolean;
    days?: Array<{ day: number; date: string; label?: string }>;
    routes?: Record<string, any[]>;
    hospitals?: Array<Record<string, any>>;
  } | null;
}

export function MapRoutePage({ onNavigate, appState, plan, mapData }: MapRoutePageProps) {
  const [selectedDay, setSelectedDay] = useState(1);
  const [selectedPOI, setSelectedPOI] = useState<any>(null);
  const [showHospitalPanel, setShowHospitalPanel] = useState(false);

  const fallbackDays = [
    { day: 1, date: 'May 15, 2026', label: 'Day 1' },
    { day: 2, date: 'May 16, 2026', label: 'Day 2' },
    { day: 3, date: 'May 17, 2026', label: 'Day 3' },
  ];

  const fallbackRoutes: Record<number, any[]> = {
    1: [
      { id: 1, time: '09:00', name: 'Depart Shanghai', type: 'start', duration: '2 hrs', distance: '180 km', x: 15, y: 50 },
      { id: 2, time: '11:30', name: 'Check-in: West Lake Pet Hotel', type: 'hotel', petPolicy: 'Friendly', hours: '24 hours', phone: '+86 571-8888-1111', description: 'Modern pet-friendly hotel with welcome packages for pets. Clean rooms and excellent service.', x: 45, y: 45 },
      { id: 3, time: '14:00', name: 'Su Causeway Walk', type: 'attraction', duration: '2 hrs', distance: '3 km', petPolicy: 'Leash required', hours: 'Always open', ticket: 'Free', phone: '+86 571-8888-2222', description: 'Beautiful lakeside walk with dedicated pet rest areas and water stations.', x: 50, y: 52 },
      { id: 4, time: '16:30', name: 'Pet-Friendly Cafe', type: 'meal', petPolicy: 'Friendly', hours: '10:00-22:00', phone: '+86 571-8888-3333', description: 'Cozy cafe with outdoor seating area where pets are welcome.', x: 48, y: 48 },
      { id: 5, time: '18:00', name: 'Dinner at Hubin Road Pet Restaurant', type: 'meal', petPolicy: 'Friendly', hours: '11:00-23:00', phone: '+86 571-8888-4444', description: 'Restaurant with pet menu and outdoor dining area.', x: 52, y: 50 },
    ],
    2: [
      { id: 6, time: '08:30', name: 'Prince Bay Park', type: 'attraction', duration: '2.5 hrs', distance: '5 km', petPolicy: 'Leash required', hours: 'Open until 18:00', ticket: 'Free', phone: '+86 571-8888-5555', description: 'Spring flowers and photo-worthy scenery. Pets allowed in designated areas.', x: 55, y: 58 },
      { id: 7, time: '12:00', name: 'Lunch Break', type: 'meal', x: 58, y: 55 },
      { id: 8, time: '14:00', name: 'Drive to Yunqi Bamboo Trail', type: 'transport', duration: '30 min', distance: '12 km', x: 60, y: 50 },
      { id: 9, time: '15:00', name: 'Yunqi Bamboo Trail', type: 'attraction', duration: '2 hrs', petPolicy: 'Friendly', hours: 'Open until 17:00', ticket: '¥8', phone: '+86 571-8888-6666', description: 'Cool bamboo forest trails, perfect for pets. Shaded and comfortable.', x: 70, y: 45 },
      { id: 10, time: '17:30', name: 'Tea House Rest Stop', type: 'meal', petPolicy: 'Friendly', hours: '09:00-20:00', phone: '+86 571-8888-7777', description: 'Traditional tea house with pet-friendly outdoor seating.', x: 72, y: 48 },
    ],
    3: [
      { id: 11, time: '09:00', name: 'Longjing Village', type: 'attraction', duration: '2 hrs', petPolicy: 'Friendly', hours: 'Always open', ticket: 'Free', phone: '+86 571-8888-8888', description: 'Tea plantation trails where pets can walk alongside you.', x: 62, y: 40 },
      { id: 12, time: '12:00', name: 'Hotel Check-out', type: 'hotel', x: 45, y: 45 },
      { id: 13, time: '13:30', name: 'Return to Shanghai', type: 'end', duration: '2 hrs', distance: '180 km', x: 85, y: 50 },
    ],
  };

  const fallbackHospitals = [
    {
      id: 1,
      name: 'Zhejiang University Animal Hospital',
      rating: 4.8,
      hours: '24 hours',
      distance: '2.3 km',
      eta: '8 min',
      phone: '+86 571-8888-0000',
      address: 'No. 268 Kaixuan Road, Hangzhou',
    },
    {
      id: 2,
      name: 'Hangzhou Pet Care Hospital',
      rating: 4.6,
      hours: '08:00-22:00',
      distance: '4.1 km',
      eta: '12 min',
      phone: '+86 571-8888-0001',
      address: 'No. 155 Wensan West Road, Hangzhou',
    },
  ];

  const days = mapData?.days?.length
    ? mapData.days.map((day) => ({ day: day.day, date: day.date, label: day.label || `Day ${day.day}` }))
    : plan?.itinerary_days?.length
    ? plan.itinerary_days.map((day) => ({ day: day.day, date: day.date, label: `Day ${day.day}` }))
    : fallbackDays;
  const routes: Record<number, any[]> = mapData?.routes
    ? Object.fromEntries(
        Object.entries(mapData.routes).map(([key, value]) => [Number(key), value || []]),
      )
    : plan?.itinerary_days?.length
    ? Object.fromEntries(plan.itinerary_days.map((day) => [
        day.day,
        day.activities.map((activity, idx) => ({
          id: activity.id || `${day.day}-${idx + 1}`,
          time: activity.time || 'TBD',
          name: activity.title || activity.name || 'Trip stop',
          type: activity.type || 'attraction',
          duration: activity.duration,
          distance: activity.distance,
          petPolicy: activity.petPolicy,
          hours: activity.hours,
          ticket: activity.ticket,
          phone: activity.phone,
          description: activity.description,
          x: 15 + Math.min(idx * 12, 70),
          y: 45 + ((idx % 3) * 5),
        })),
      ]))
    : fallbackRoutes;
  const hospitals = mapData?.hospitals?.length ? mapData.hospitals : plan?.hospitals?.length ? plan.hospitals : fallbackHospitals;
  const activeDay = days.find((d) => d.day === selectedDay) || days[0];
  const currentRoute = routes[selectedDay] || [];

  return (
    <div className="h-screen flex flex-col bg-[var(--cream-white)]">
      {/* Header */}
      <div className="border-b border-[var(--border)] bg-white">
        <div className="max-w-[1600px] mx-auto px-8 py-6">
          <button
            onClick={() => onNavigate?.('planning')}
            className="mb-4 flex items-center gap-2 px-3 py-1.5 rounded-lg text-[var(--muted-foreground)] hover:text-[var(--deep-blue)] hover:bg-[var(--soft-grey)] transition-all group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" strokeWidth={2} />
            <span className="text-sm font-medium">Back to Plan</span>
          </button>

          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[var(--sage-green)] to-[var(--warm-orange)] flex items-center justify-center">
                <Navigation className="w-5 h-5 text-white" strokeWidth={2.5} />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-[var(--deep-blue)]">
                  {activeDay.label} - {activeDay.date}
                </h1>
                <p className="text-sm text-[var(--muted-foreground)] flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                  Trip in progress · {appState.emergencyDecision === 'accepted_alternative' ? 'Alternative plan applied' : 'Budget-matched plan active'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => onNavigate?.('planningEdit')}
                className="px-4 py-2.5 rounded-lg border border-[var(--border)] bg-white hover:border-[var(--sage-green)] hover:shadow-sm transition-all text-sm font-medium text-[var(--deep-blue)]"
              >
                Edit Itinerary
              </button>
              <button
                onClick={() => onNavigate?.('review')}
                className="px-4 py-2.5 rounded-lg bg-gradient-to-r from-[var(--sage-green)] to-[var(--warm-orange)] text-white font-medium shadow-md hover:shadow-lg transition-all text-sm"
              >
                End Trip
              </button>
            </div>
          </div>

          {/* Day Tabs */}
          <div className="flex gap-2">
            {days.map((d) => (
              <button
                key={d.day}
                onClick={() => setSelectedDay(d.day)}
                className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  selectedDay === d.day
                    ? 'bg-[var(--sage-green)] text-white shadow-sm'
                    : 'bg-white text-[var(--deep-blue)] border border-[var(--border)] hover:border-[var(--sage-green)]'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Warning Banner */}
      {selectedDay === 2 && (
        <div className="px-8 py-3 bg-amber-50 border-b border-amber-200">
          <div className="max-w-[1600px] mx-auto flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" strokeWidth={2} />
            <p className="text-sm text-amber-800">
              <span className="font-semibold">Yunqi Bamboo Trail</span> closes at 5:00 PM. About 45 minutes remaining.
            </p>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full max-w-[1600px] mx-auto px-8 py-6 flex gap-6">
          {/* Left: Route Timeline */}
          <div className="w-96 flex-shrink-0 bg-white rounded-xl border border-[var(--border)] p-5 overflow-y-auto">
            <h3 className="font-semibold text-[var(--deep-blue)] mb-4">Route Timeline</h3>
            <div className="space-y-3">
              {currentRoute.map((stop, idx) => (
                <button
                  key={stop.id}
                  onClick={() => stop.type !== 'start' && stop.type !== 'end' && stop.type !== 'transport' && setSelectedPOI(stop)}
                  className={`w-full text-left p-4 rounded-lg border transition-all ${
                    selectedPOI?.id === stop.id
                      ? 'border-[var(--sage-green)] bg-[var(--light-sage)]'
                      : 'border-[var(--border)] hover:border-[var(--sage-green)]/50 hover:bg-[var(--soft-grey)]'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      stop.type === 'hotel' ? 'bg-blue-100' :
                      stop.type === 'attraction' ? 'bg-green-100' :
                      stop.type === 'meal' ? 'bg-orange-100' :
                      'bg-purple-100'
                    }`}>
                      {stop.type === 'hotel' && <Building2 className="w-5 h-5 text-blue-600" strokeWidth={2} />}
                      {stop.type === 'attraction' && <MapPin className="w-5 h-5 text-green-600" strokeWidth={2} />}
                      {stop.type === 'meal' && <MapPin className="w-5 h-5 text-orange-600" strokeWidth={2} />}
                      {(stop.type === 'transport' || stop.type === 'start' || stop.type === 'end') && <Navigation className="w-5 h-5 text-purple-600" strokeWidth={2} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Clock className="w-3.5 h-3.5 text-[var(--muted-foreground)]" strokeWidth={2} />
                        <span className="text-xs font-medium text-[var(--muted-foreground)]">{stop.time}</span>
                        {stop.duration && <span className="text-xs text-[var(--muted-foreground)]">·{stop.duration}</span>}
                      </div>
                      <h4 className="font-medium text-[var(--deep-blue)] text-sm mb-1 truncate">{stop.name}</h4>
                      <div className="flex flex-wrap gap-1.5 text-xs">
                        {stop.distance && (
                          <span className="px-2 py-0.5 bg-white rounded border border-[var(--border)] text-[var(--muted-foreground)]">
                            {stop.distance}
                          </span>
                        )}
                        {stop.petPolicy && (
                          <span className={`px-2 py-0.5 rounded ${
                            stop.petPolicy === 'Friendly' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                          }`}>
                            <PawPrint className="w-3 h-3 inline mr-0.5" strokeWidth={2} />
                            {stop.petPolicy}
                          </span>
                        )}
                        {stop.hours && (
                          <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded">
                            {stop.hours}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Right: Map */}
          <div className="flex-1 relative bg-white rounded-xl border border-[var(--border)] overflow-hidden">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              {/* Map background */}
              <rect x="0" y="0" width="100" height="100" fill="#F7F6F4" />

              {/* Route path */}
              {currentRoute.map((stop, idx) => {
                if (idx === currentRoute.length - 1) return null;
                const next = currentRoute[idx + 1];
                return (
                  <line
                    key={`line-${stop.id}`}
                    x1={stop.x}
                    y1={stop.y}
                    x2={next.x}
                    y2={next.y}
                    stroke="#7A8F73"
                    strokeWidth="0.3"
                    strokeDasharray="1,1"
                  />
                );
              })}

              {/* Route pins */}
              {currentRoute.map((stop, idx) => (
                <g
                  key={stop.id}
                  onClick={() => stop.type !== 'start' && stop.type !== 'end' && stop.type !== 'transport' && setSelectedPOI(stop)}
                  className={stop.type !== 'start' && stop.type !== 'end' && stop.type !== 'transport' ? 'cursor-pointer' : ''}
                  style={{ transition: 'transform 0.2s' }}
                  onMouseEnter={(e) => {
                    if (stop.type !== 'start' && stop.type !== 'end' && stop.type !== 'transport') {
                      e.currentTarget.style.transform = 'scale(1.2)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  <circle
                    cx={stop.x}
                    cy={stop.y}
                    r="2"
                    fill={
                      selectedPOI?.id === stop.id ? '#7A8F73' :
                      stop.type === 'hotel' ? '#3B82F6' :
                      stop.type === 'attraction' ? '#10B981' :
                      stop.type === 'meal' ? '#F59E0B' :
                      '#9CA3AF'
                    }
                    stroke="white"
                    strokeWidth="0.5"
                  />
                  <text
                    x={stop.x}
                    y={stop.y - 3}
                    textAnchor="middle"
                    fontSize="2"
                    fill="#2C3E50"
                    fontWeight="500"
                  >
                    {idx + 1}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="border-t border-[var(--border)] bg-white px-8 py-4">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowHospitalPanel(true)}
              className="px-4 py-2.5 rounded-lg border-2 border-green-600 text-green-600 font-medium hover:bg-green-50 transition-all flex items-center gap-2"
            >
              <Shield className="w-4 h-4" strokeWidth={2} />
              <span>Pet Hospital</span>
            </button>
            <button className="px-4 py-2.5 rounded-lg border border-[var(--border)] bg-white hover:border-[var(--sage-green)] hover:shadow-sm transition-all flex items-center gap-2 font-medium text-[var(--deep-blue)]">
              <Play className="w-4 h-4" strokeWidth={2} />
              <span>Start Navigation</span>
            </button>
            <button
              onClick={() => onNavigate?.('emergency')}
              className="px-4 py-2.5 rounded-lg border border-amber-500 text-amber-600 font-medium hover:bg-amber-50 transition-all flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4" strokeWidth={2} />
              <span>Emergency Help</span>
            </button>
            <button
              onClick={() => onNavigate?.('review')}
              className="px-4 py-2.5 rounded-lg bg-gradient-to-r from-[var(--sage-green)] to-[var(--warm-orange)] text-white font-medium shadow-md hover:shadow-lg transition-all flex items-center gap-2"
            >
              <ChevronRight className="w-4 h-4" strokeWidth={2} />
              <span>End Trip</span>
            </button>
          </div>
        </div>
      </div>

      {/* POI Detail Card */}
      {selectedPOI && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-8">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="p-6 border-b border-[var(--border)]">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-[var(--deep-blue)] mb-1">{selectedPOI.name}</h3>
                  <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
                    <Clock className="w-4 h-4" strokeWidth={2} />
                    <span>{selectedPOI.hours}</span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedPOI(null)}
                  className="w-8 h-8 rounded-lg hover:bg-[var(--soft-grey)] flex items-center justify-center transition-colors"
                >
                  <X className="w-5 h-5 text-[var(--muted-foreground)]" strokeWidth={2} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {selectedPOI.description && (
                <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">{selectedPOI.description}</p>
              )}

              <div className="grid grid-cols-2 gap-3 text-sm">
                {selectedPOI.ticket && (
                  <div className="p-3 rounded-lg bg-[var(--soft-grey)]">
                    <p className="text-xs text-[var(--muted-foreground)] mb-1">Ticket Price</p>
                    <p className="font-semibold text-[var(--deep-blue)]">{selectedPOI.ticket}</p>
                  </div>
                )}
                {selectedPOI.petPolicy && (
                  <div className="p-3 rounded-lg bg-[var(--soft-grey)]">
                    <p className="text-xs text-[var(--muted-foreground)] mb-1">Pet Policy</p>
                    <p className="font-semibold text-[var(--deep-blue)]">
                      <PawPrint className="w-3.5 h-3.5 inline mr-1" strokeWidth={2} />
                      {selectedPOI.petPolicy}
                    </p>
                  </div>
                )}
              </div>

              {selectedPOI.phone && (
                <div className="p-3 rounded-lg bg-[var(--soft-grey)]">
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-[var(--sage-green)]" strokeWidth={2} />
                    <span className="text-[var(--muted-foreground)]">Phone:</span>
                    <span className="font-medium text-[var(--deep-blue)]">{selectedPOI.phone}</span>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button className="flex-1 px-4 py-3 rounded-lg bg-gradient-to-r from-[var(--sage-green)] to-[var(--warm-orange)] text-white font-medium shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2">
                  <Play className="w-4 h-4" strokeWidth={2} />
                  <span>Start Navigation</span>
                </button>
                <button className="px-4 py-3 rounded-lg border-2 border-[var(--sage-green)] text-[var(--sage-green)] font-medium hover:bg-[var(--light-sage)] transition-all flex items-center justify-center gap-2">
                  <Phone className="w-4 h-4" strokeWidth={2} />
                  <span>Call</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hospital Panel */}
      {showHospitalPanel && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-8">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden">
            <div className="p-6 border-b border-[var(--border)] bg-gradient-to-br from-green-50 to-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-green-600" strokeWidth={2} />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-[var(--deep-blue)]">Nearby Pet Hospitals</h3>
                    <p className="text-sm text-[var(--muted-foreground)]">Emergency veterinary care</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowHospitalPanel(false)}
                  className="w-8 h-8 rounded-lg hover:bg-white flex items-center justify-center transition-colors"
                >
                  <X className="w-5 h-5 text-[var(--muted-foreground)]" strokeWidth={2} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {hospitals.map((hospital) => (
                <div key={hospital.id} className="p-5 rounded-xl border border-[var(--border)] hover:border-green-500 hover:shadow-sm transition-all">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="font-semibold text-[var(--deep-blue)] mb-1">{hospital.name}</h4>
                      <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)] mb-2">
                        <Star className="w-4 h-4 fill-amber-400 text-amber-400" strokeWidth={2} />
                        <span className="font-medium">{hospital.rating}</span>
                      </div>
                      <p className="text-sm text-[var(--muted-foreground)]">{hospital.address}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 mb-4 text-sm">
                    <div className="p-2 rounded-lg bg-[var(--soft-grey)]">
                      <p className="text-xs text-[var(--muted-foreground)] mb-0.5">Hours</p>
                      <p className="font-medium text-[var(--deep-blue)]">{hospital.hours}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-[var(--soft-grey)]">
                      <p className="text-xs text-[var(--muted-foreground)] mb-0.5">Distance</p>
                      <p className="font-medium text-[var(--deep-blue)]">{hospital.distance}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-[var(--soft-grey)]">
                      <p className="text-xs text-[var(--muted-foreground)] mb-0.5">ETA</p>
                      <p className="font-medium text-[var(--deep-blue)]">{hospital.eta}</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button className="flex-1 px-4 py-2.5 rounded-lg border-2 border-green-600 text-green-600 font-medium hover:bg-green-50 transition-all flex items-center justify-center gap-2">
                      <Phone className="w-4 h-4" strokeWidth={2} />
                      <span>Call Now</span>
                    </button>
                    <button className="flex-1 px-4 py-2.5 rounded-lg bg-gradient-to-r from-[var(--sage-green)] to-[var(--warm-orange)] text-white font-medium shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2">
                      <Navigation className="w-4 h-4" strokeWidth={2} />
                      <span>Navigate</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
