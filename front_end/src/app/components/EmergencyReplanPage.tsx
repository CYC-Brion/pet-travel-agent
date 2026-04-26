import { useState } from 'react';
import { ArrowLeft, AlertTriangle, CheckCircle2, X, CloudRain, Shield, Phone, MapPin, Clock, Navigation, PawPrint, ChevronRight } from 'lucide-react';

interface EmergencyReplanPageProps {
  onNavigate?: (view: string) => void;
  onDecision?: (decision: 'accepted_alternative' | 'kept_original' | 'cancelled') => Promise<void>;
  data?: {
    emergency?: { title?: string; description?: string; detectedAt?: string };
    affectedStops?: Array<{ time?: string; name?: string; reason?: string; impact?: 'high' | 'medium' | 'low' }>;
    originalPlan?: Array<Record<string, any>>;
    alternativePlan?: Array<Record<string, any>>;
    hospitals?: Array<Record<string, any>>;
    safetyChecklist?: Array<{ id: number; label: string; checked: boolean }>;
  } | null;
}

export function EmergencyReplanPage({ onNavigate, onDecision, data }: EmergencyReplanPageProps) {
  const [selectedPlan, setSelectedPlan] = useState<'original' | 'alternative'>('alternative');

  const emergency = {
    type: 'weather',
    severity: 'moderate',
    title: data?.emergency?.title || 'Heavy Rain Alert',
    description: data?.emergency?.description || 'Heavy rainfall expected in West Lake area from 14:00-18:00. Outdoor activities may be unsafe.',
    detectedAt: data?.emergency?.detectedAt || '2 minutes ago',
  };

  const fallbackAffectedStops = [
    {
      time: '14:00',
      name: 'Su Causeway Walk',
      reason: 'Heavy rain warning, outdoor activity unsafe',
      impact: 'high',
    },
    {
      time: '16:30',
      name: 'Lakeside Cafe',
      reason: 'May close early due to weather',
      impact: 'medium',
    },
  ];
  const affectedStops = data?.affectedStops?.length ? data.affectedStops : fallbackAffectedStops;

  const fallbackOriginalPlan = [
    { time: '14:00', name: 'Su Causeway Walk', type: 'outdoor', petPolicy: 'Friendly' },
    { time: '16:30', name: 'Lakeside Cafe', type: 'outdoor', petPolicy: 'Friendly' },
    { time: '18:00', name: 'Dinner at Hubin Road', type: 'indoor', petPolicy: 'Friendly' },
  ];
  const originalPlan = data?.originalPlan?.length ? data.originalPlan : fallbackOriginalPlan;

  const fallbackAlternativePlan = [
    {
      time: '14:00',
      name: 'Zhejiang Provincial Museum',
      type: 'indoor',
      original: 'Su Causeway Walk',
      reason: 'Indoor venue, pet boarding service available',
      distance: '2.5 km',
      eta: '15 min',
      petService: 'Pet boarding available',
      ticket: '¥30',
    },
    {
      time: '16:30',
      name: 'Return to Hotel',
      type: 'indoor',
      original: 'Lakeside Cafe',
      reason: 'Hotel rest area, more comfortable for pets',
      distance: '1.2 km',
      eta: '8 min',
      petPolicy: 'Friendly',
    },
    {
      time: '18:00',
      name: 'Dinner at Hubin Road',
      type: 'indoor',
      original: 'Same as original',
      petPolicy: 'Friendly',
    },
  ];
  const alternativePlan = data?.alternativePlan?.length ? data.alternativePlan : fallbackAlternativePlan;

  const fallbackSafetyChecklist = [
    { id: 1, label: 'Pet rain gear prepared', checked: true },
    { id: 2, label: 'Emergency contact verified', checked: true },
    { id: 3, label: 'Nearest pet hospital located', checked: true },
    { id: 4, label: 'Hotel notified of early return', checked: false },
  ];
  const safetyChecklist = data?.safetyChecklist?.length ? data.safetyChecklist : fallbackSafetyChecklist;
  const hospital = data?.hospitals?.[0] || {
    name: 'Zhejiang University Animal Hospital',
    distance: '2.3 km',
    eta: '8 min',
    phone: '+86 571-8888-0000',
  };

  return (
    <div className="min-h-screen bg-[var(--cream-white)]">
      {/* Alert Banner */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-8 py-4 border-b border-amber-600">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="font-semibold text-white">{emergency.title}</h3>
              <p className="text-sm text-white/90">{emergency.description}</p>
            </div>
          </div>
          <div className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-lg border border-white/30">
            <span className="text-sm font-medium text-white">Detected {emergency.detectedAt}</span>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="border-b border-[var(--border)] bg-white">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <button
            onClick={async () => {
              await onDecision?.('cancelled');
              onNavigate?.('map');
            }}
            className="mb-4 flex items-center gap-2 px-3 py-1.5 rounded-lg text-[var(--muted-foreground)] hover:text-[var(--deep-blue)] hover:bg-[var(--soft-grey)] transition-all group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" strokeWidth={2} />
            <span className="text-sm font-medium">Back to Original Plan</span>
          </button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-[var(--deep-blue)] mb-1">
                Emergency Replanning
              </h1>
              <p className="text-sm text-[var(--muted-foreground)]">
                AI has generated safer alternatives for affected stops
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="px-4 py-2 bg-amber-50 rounded-lg border border-amber-200">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                  <span className="text-sm font-medium text-amber-700">
                    {affectedStops.length} stops affected
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-8 py-8">
        <div className="flex gap-8">
          {/* Left: Affected Stops */}
          <div className="w-80 flex-shrink-0">
            <div className="bg-white rounded-xl border border-[var(--border)] overflow-hidden sticky top-8">
              <div className="p-5 border-b border-[var(--border)] bg-gradient-to-br from-amber-50 to-white">
                <h3 className="font-semibold text-[var(--deep-blue)] mb-1">Affected Stops</h3>
                <p className="text-sm text-[var(--muted-foreground)]">Original itinerary items</p>
              </div>

              <div className="p-5 space-y-3">
                {affectedStops.map((stop, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-lg border-2 ${
                      stop.impact === 'high'
                        ? 'bg-red-50 border-red-200'
                        : 'bg-amber-50 border-amber-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-4 h-4 text-[var(--muted-foreground)]" strokeWidth={2} />
                      <span className="text-sm font-medium text-[var(--deep-blue)]">{stop.time}</span>
                    </div>
                    <h4 className="font-semibold text-[var(--deep-blue)] mb-2">{stop.name}</h4>
                    <div className="flex items-start gap-2">
                      <AlertTriangle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                        stop.impact === 'high' ? 'text-red-500' : 'text-amber-500'
                      }`} strokeWidth={2} />
                      <p className="text-sm text-[var(--muted-foreground)]">{stop.reason}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Center: Plan Comparison */}
          <div className="flex-1">
            {/* Plan Toggle */}
            <div className="flex gap-4 mb-6">
              <button
                onClick={() => setSelectedPlan('alternative')}
                className={`flex-1 p-5 rounded-xl border-2 transition-all text-left ${
                  selectedPlan === 'alternative'
                    ? 'border-[var(--sage-green)] bg-[var(--light-sage)] shadow-md'
                    : 'border-[var(--border)] bg-white hover:border-[var(--sage-green)]/50'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-green-600" strokeWidth={2} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[var(--deep-blue)]">Alternative Plan</h3>
                    <p className="text-sm text-green-600">Recommended</p>
                  </div>
                </div>
                <p className="text-sm text-[var(--muted-foreground)]">
                  Indoor activities with pet services available
                </p>
              </button>

              <button
                onClick={() => setSelectedPlan('original')}
                className={`flex-1 p-5 rounded-xl border-2 transition-all text-left ${
                  selectedPlan === 'original'
                    ? 'border-[var(--sage-green)] bg-[var(--light-sage)] shadow-md'
                    : 'border-[var(--border)] bg-white hover:border-[var(--sage-green)]/50'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-amber-600" strokeWidth={2} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[var(--deep-blue)]">Keep Original Plan</h3>
                    <p className="text-sm text-amber-600">Weather risk</p>
                  </div>
                </div>
                <p className="text-sm text-[var(--muted-foreground)]">
                  Continue with outdoor activities despite weather
                </p>
              </button>
            </div>

            {/* Plan Details */}
            <div className="bg-white rounded-xl border border-[var(--border)] overflow-hidden">
              <div className="p-5 border-b border-[var(--border)] bg-gradient-to-r from-[var(--light-sage)] to-white">
                <h3 className="font-semibold text-[var(--deep-blue)]">
                  {selectedPlan === 'alternative' ? 'Alternative Itinerary' : 'Original Itinerary'}
                </h3>
              </div>

              <div className="p-5 space-y-4">
                {selectedPlan === 'alternative' ? (
                  <>
                    {alternativePlan.map((stop, idx) => (
                      <div key={idx} className="p-4 rounded-lg bg-[var(--soft-grey)]">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Clock className="w-4 h-4 text-[var(--muted-foreground)]" strokeWidth={2} />
                              <span className="text-sm font-medium text-[var(--muted-foreground)]">{stop.time}</span>
                            </div>
                            <h4 className="font-semibold text-[var(--deep-blue)] mb-1">{stop.name}</h4>
                            {stop.original !== 'Same as original' && (
                              <p className="text-sm text-[var(--muted-foreground)] mb-2">
                                Replaces: <span className="line-through">{stop.original}</span>
                              </p>
                            )}
                          </div>
                          <div className={`px-3 py-1 rounded-lg text-xs font-medium ${
                            stop.type === 'indoor' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                          }`}>
                            {stop.type}
                          </div>
                        </div>

                        {stop.reason && (
                          <p className="text-sm text-[var(--muted-foreground)] mb-3">{stop.reason}</p>
                        )}

                        <div className="flex flex-wrap gap-2 text-sm">
                          {stop.distance && (
                            <span className="px-2.5 py-1 bg-white rounded-md border border-[var(--border)]">
                              {stop.distance} ·{stop.eta}
                            </span>
                          )}
                          {stop.ticket && (
                            <span className="px-2.5 py-1 bg-white rounded-md border border-[var(--border)]">
                              Ticket: {stop.ticket}
                            </span>
                          )}
                          {stop.petPolicy && (
                            <span className="px-2.5 py-1 bg-green-100 text-green-700 rounded-md">
                              <PawPrint className="w-3 h-3 inline mr-1" strokeWidth={2} />
                              {stop.petPolicy}
                            </span>
                          )}
                          {stop.petService && (
                            <span className="px-2.5 py-1 bg-blue-100 text-blue-700 rounded-md">
                              {stop.petService}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </>
                ) : (
                  <>
                    {originalPlan.map((stop, idx) => (
                      <div key={idx} className="p-4 rounded-lg bg-[var(--soft-grey)]">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Clock className="w-4 h-4 text-[var(--muted-foreground)]" strokeWidth={2} />
                              <span className="text-sm font-medium text-[var(--muted-foreground)]">{stop.time}</span>
                            </div>
                            <h4 className="font-semibold text-[var(--deep-blue)]">{stop.name}</h4>
                          </div>
                          <div className={`px-3 py-1 rounded-lg text-xs font-medium ${
                            stop.type === 'indoor' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                          }`}>
                            {stop.type}
                          </div>
                        </div>

                        {stop.petPolicy && (
                          <span className="inline-block px-2.5 py-1 bg-green-100 text-green-700 rounded-md text-sm">
                            <PawPrint className="w-3 h-3 inline mr-1" strokeWidth={2} />
                            {stop.petPolicy}
                          </span>
                        )}
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right: Safety Checklist */}
          <div className="w-80 flex-shrink-0">
            <div className="bg-white rounded-xl border border-[var(--border)] overflow-hidden sticky top-8 mb-6">
              <div className="p-5 border-b border-[var(--border)] bg-gradient-to-br from-green-50 to-white">
                <div className="flex items-center gap-2 mb-1">
                  <Shield className="w-5 h-5 text-green-600" strokeWidth={2} />
                  <h3 className="font-semibold text-[var(--deep-blue)]">Safety Checklist</h3>
                </div>
                <p className="text-sm text-[var(--muted-foreground)]">Emergency preparedness</p>
              </div>

              <div className="p-5 space-y-3">
                {safetyChecklist.map((item) => (
                  <div
                    key={item.id}
                    className={`flex items-center gap-3 p-3 rounded-lg ${
                      item.checked ? 'bg-green-50' : 'bg-gray-50'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 ${
                      item.checked ? 'bg-green-500' : 'bg-gray-300'
                    }`}>
                      {item.checked && <CheckCircle2 className="w-4 h-4 text-white" strokeWidth={2.5} />}
                    </div>
                    <span className={`text-sm ${
                      item.checked ? 'text-green-700 font-medium' : 'text-[var(--muted-foreground)]'
                    }`}>
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-[var(--border)] overflow-hidden">
              <div className="p-5 border-b border-[var(--border)] bg-gradient-to-br from-red-50 to-white">
                <div className="flex items-center gap-2 mb-1">
                  <Shield className="w-5 h-5 text-red-600" strokeWidth={2} />
                  <h3 className="font-semibold text-[var(--deep-blue)]">Emergency Contact</h3>
                </div>
                <p className="text-sm text-[var(--muted-foreground)]">24-hour pet hospital</p>
              </div>

              <div className="p-5">
                <h4 className="font-semibold text-[var(--deep-blue)] mb-3">{hospital.name}</h4>
                <div className="space-y-2 text-sm mb-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[var(--sage-green)]" strokeWidth={2} />
                    <span className="text-[var(--muted-foreground)]">{hospital.distance} away</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[var(--sage-green)]" strokeWidth={2} />
                    <span className="text-[var(--muted-foreground)]">{hospital.eta} by car</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-[var(--sage-green)]" strokeWidth={2} />
                    <span className="font-medium text-[var(--deep-blue)]">{hospital.phone}</span>
                  </div>
                </div>

                <button className="w-full px-4 py-2.5 rounded-lg border-2 border-red-600 text-red-600 font-medium hover:bg-red-50 transition-all flex items-center justify-center gap-2">
                  <Phone className="w-4 h-4" strokeWidth={2} />
                  <span>Emergency Call</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="mt-8 flex gap-4">
          <button
            onClick={async () => {
              await onDecision?.('cancelled');
              onNavigate?.('map');
            }}
            className="px-6 py-3 rounded-xl border-2 border-[var(--border)] text-[var(--deep-blue)] font-medium hover:bg-[var(--soft-grey)] transition-all"
          >
            Cancel
          </button>
          <button
            onClick={async () => {
              await onDecision?.('kept_original');
              onNavigate?.('map');
            }}
            className="px-6 py-3 rounded-xl border-2 border-amber-500 text-amber-600 font-medium hover:bg-amber-50 transition-all flex items-center gap-2"
          >
            <AlertTriangle className="w-4 h-4" strokeWidth={2} />
            <span>Keep Original Plan</span>
          </button>
          <button
            onClick={async () => {
              await onDecision?.('accepted_alternative');
              onNavigate?.('map');
            }}
            className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-[var(--sage-green)] to-[var(--warm-orange)] text-white font-medium shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-5 h-5" strokeWidth={2.5} />
            <span>Accept Alternative Plan</span>
          </button>
        </div>
      </div>
    </div>
  );
}
