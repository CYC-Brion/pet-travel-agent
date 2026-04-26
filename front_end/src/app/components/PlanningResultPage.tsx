import { useState } from 'react';
import { Sparkles, Map, Star, ArrowLeft, Edit3, AlertTriangle, Check, PawPrint, Hotel, MapPin, Clock, Utensils, Car, GripVertical, Phone, Navigation, X, Shield, Activity } from 'lucide-react';
import { ApiPlan } from '../api/client';

interface PlanningResultPageProps {
  onNavigate?: (view: string) => void;
  initialEditMode?: boolean;
  plan?: ApiPlan | null;
}

export function PlanningResultPage({ onNavigate, initialEditMode = false, plan }: PlanningResultPageProps) {
  const [isEditMode, setIsEditMode] = useState(initialEditMode);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const recommendedPlan = {
    name: 'Budget-Matched',
    totalCost: plan ? `¥${Number(plan.estimated_total || 0).toLocaleString()}` : '¥4,500',
    budgetRange: plan ? `¥${plan.budget_range.min.toLocaleString()} - ¥${plan.budget_range.max.toLocaleString()}` : '¥3,500 - ¥6,000',
    hotelType: (plan?.hotel?.type || plan?.hotel?.name || '4-Star Pet-Friendly Hotel') as string,
    attractions: plan?.attractions?.length || plan?.itinerary_days?.reduce((sum, day) => sum + day.activities.filter((activity) => activity.type === 'attraction').length, 0) || 12,
    petFriendliness: 95,
    pace: 'Moderate',
  };

  const fallbackItinerary = [
      {
        day: 1,
        date: 'May 15, 2026',
        activities: [
          { time: '09:00', type: 'transport', title: 'Depart Shanghai by Car', duration: '2 hrs', note: 'Self-drive recommended', price: '¥200 gas' },
          { time: '11:30', type: 'hotel', title: 'Check-in: West Lake Pet-Friendly Hotel', rating: 4, petPolicy: 'Friendly', petFee: '¥100/day', price: '¥680' },
          { time: '14:00', type: 'attraction', title: 'Su Causeway Walk', duration: '2 hrs', ticket: 'Free', petPolicy: 'Leash required', hours: 'Always open' },
          { time: '16:30', type: 'meal', title: 'Pet-Friendly Cafe', petPolicy: 'Friendly' },
          { time: '18:00', type: 'meal', title: 'Dinner at Hubin Road Pet Restaurant', petPolicy: 'Friendly' },
        ],
      },
      {
        day: 2,
        date: 'May 16, 2026',
        activities: [
          { time: '08:30', type: 'attraction', title: 'Prince Bay Park', duration: '2.5 hrs', ticket: 'Free', petPolicy: 'Leash required', hours: 'Open until 18:00' },
          { time: '12:00', type: 'meal', title: 'Lunch Break' },
          { time: '14:00', type: 'transport', title: 'Drive to Yunqi Bamboo Trail', duration: '30 min', price: '¥30 gas' },
          { time: '15:00', type: 'attraction', title: 'Yunqi Bamboo Trail', duration: '2 hrs', ticket: '¥8', petPolicy: 'Friendly', hours: 'Open until 17:00' },
          { time: '17:30', type: 'meal', title: 'Tea House Rest Stop', petPolicy: 'Friendly' },
        ],
      },
      {
        day: 3,
        date: 'May 17, 2026',
        activities: [
          { time: '09:00', type: 'attraction', title: 'Longjing Village', duration: '2 hrs', ticket: 'Free', petPolicy: 'Friendly' },
          { time: '12:00', type: 'hotel', title: 'Check-out' },
          { time: '13:30', type: 'transport', title: 'Return to Shanghai', duration: '2 hrs', price: '¥200 gas' },
        ],
      },
    ];

  const currentItinerary = plan?.itinerary_days?.length ? plan.itinerary_days : fallbackItinerary;
  const currentPlan = recommendedPlan;

  return (
    <div className="min-h-screen bg-[var(--cream-white)]">
      {/* Header */}
      <div className="border-b border-[var(--border)] bg-white">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <button
            onClick={() => onNavigate?.('info')}
            className="mb-4 flex items-center gap-2 px-3 py-1.5 rounded-lg text-[var(--muted-foreground)] hover:text-[var(--deep-blue)] hover:bg-[var(--soft-grey)] transition-all group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" strokeWidth={2} />
            <span className="text-sm font-medium">Back</span>
          </button>

          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[var(--sage-green)] to-[var(--warm-orange)] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" strokeWidth={2.5} />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-[var(--deep-blue)]">
                  {isEditMode ? `${currentPlan.name} Plan - Edit Mode` : 'Your Pet-Friendly Trip to Hangzhou'}
                </h1>
                <p className="text-sm text-[var(--muted-foreground)]">
                  {isEditMode ? 'Customize your itinerary' : plan ? `${plan.dates} · ${plan.route}` : '3 days · May 15-17, 2026 · Shanghai to Hangzhou'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {!isEditMode && (
                <>
                  <button
                    onClick={() => setIsEditMode(true)}
                    className="px-4 py-2.5 rounded-lg border border-[var(--border)] bg-white hover:border-[var(--sage-green)] hover:shadow-sm transition-all flex items-center gap-2"
                  >
                    <Edit3 className="w-4 h-4 text-[var(--sage-green)]" strokeWidth={2} />
                    <span className="text-sm font-medium text-[var(--deep-blue)]">Edit Plan</span>
                  </button>
                  <button
                    onClick={() => onNavigate?.('emergency')}
                    className="px-4 py-2.5 rounded-lg border border-[var(--border)] bg-white hover:border-amber-500 hover:shadow-sm transition-all flex items-center gap-2"
                  >
                    <AlertTriangle className="w-4 h-4 text-amber-500" strokeWidth={2} />
                    <span className="text-sm font-medium text-[var(--deep-blue)]">Emergency Replan</span>
                  </button>
                  <button
                    onClick={() => onNavigate?.('map')}
                    className="px-4 py-2.5 rounded-lg border border-[var(--border)] bg-white hover:border-[var(--sage-green)] hover:shadow-sm transition-all flex items-center gap-2"
                  >
                    <Map className="w-4 h-4 text-[var(--sage-green)]" strokeWidth={2} />
                    <span className="text-sm font-medium text-[var(--deep-blue)]">View Map</span>
                  </button>
                  <button
                    onClick={() => setShowConfirmModal(true)}
                    className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-[var(--sage-green)] to-[var(--warm-orange)] text-white font-medium shadow-md hover:shadow-lg transition-all flex items-center gap-2"
                  >
                    <Check className="w-4 h-4" strokeWidth={2.5} />
                    <span>Confirm Plan</span>
                  </button>
                </>
              )}
              {isEditMode && (
                <>
                  <button
                    onClick={() => setIsEditMode(false)}
                    className="px-4 py-2.5 rounded-lg border-2 border-[var(--border)] text-[var(--deep-blue)] font-medium hover:bg-[var(--soft-grey)] transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => onNavigate?.('map')}
                    className="px-4 py-2.5 rounded-lg border border-[var(--sage-green)] text-[var(--sage-green)] font-medium hover:bg-[var(--light-sage)] transition-all"
                  >
                    View Map
                  </button>
                  <button
                    onClick={() => setIsEditMode(false)}
                    className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-[var(--sage-green)] to-[var(--warm-orange)] text-white font-medium shadow-md hover:shadow-lg transition-all flex items-center gap-2"
                  >
                    <Check className="w-4 h-4" strokeWidth={2.5} />
                    <span>Save Changes</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Budget-Matched Recommendation */}
          {!isEditMode && (
            <div className="rounded-xl border-2 border-[var(--sage-green)] bg-[var(--light-sage)] p-5 shadow-sm">
              <div className="flex items-start justify-between gap-6">
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <Star className="w-6 h-6 text-blue-600" strokeWidth={2} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[var(--deep-blue)]">Budget-Matched Recommendation</h3>
                    <p className="text-sm text-[var(--muted-foreground)] mt-1">
                      One itinerary optimized around your budget range, pet safety, hotel preference, and travel pace.
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-medium text-[var(--muted-foreground)]">Estimated total</p>
                  <p className="text-2xl font-bold text-[var(--sage-green)]">{currentPlan.totalCost}</p>
                  <p className="text-xs text-[var(--muted-foreground)]">Within {currentPlan.budgetRange}</p>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-3 mt-5 text-sm">
                <div className="rounded-lg bg-white/80 border border-[var(--border)] p-3">
                  <p className="text-[var(--muted-foreground)]">Hotel</p>
                  <p className="font-medium text-[var(--deep-blue)] mt-1">{currentPlan.hotelType}</p>
                </div>
                <div className="rounded-lg bg-white/80 border border-[var(--border)] p-3">
                  <p className="text-[var(--muted-foreground)]">Attractions</p>
                  <p className="font-medium text-[var(--deep-blue)] mt-1">{currentPlan.attractions} stops</p>
                </div>
                <div className="rounded-lg bg-white/80 border border-[var(--border)] p-3">
                  <p className="text-[var(--muted-foreground)]">Pet Score</p>
                  <p className="font-medium text-green-600 mt-1">{currentPlan.petFriendliness}%</p>
                </div>
                <div className="rounded-lg bg-white/80 border border-[var(--border)] p-3">
                  <p className="text-[var(--muted-foreground)]">Pace</p>
                  <p className="font-medium text-[var(--deep-blue)] mt-1">{currentPlan.pace}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-8 py-8">
        <div className="flex gap-8">
          {/* Left: Itinerary */}
          <div className="flex-1 space-y-6">
            {/* Edit Mode Settings */}
            {isEditMode && (
              <div className="bg-white rounded-xl border border-[var(--border)] p-6">
                <h3 className="font-semibold text-[var(--deep-blue)] mb-4 flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-[var(--sage-green)]" strokeWidth={2} />
                  Trip Settings
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--deep-blue)] mb-2">Start Date</label>
                    <input type="date" defaultValue="2026-05-15" className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--soft-grey)] focus:outline-none focus:ring-2 focus:ring-[var(--sage-green)]/30 focus:border-[var(--sage-green)] transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--deep-blue)] mb-2">Daily Start Time</label>
                    <input type="time" defaultValue="09:00" className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--soft-grey)] focus:outline-none focus:ring-2 focus:ring-[var(--sage-green)]/30 focus:border-[var(--sage-green)] transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--deep-blue)] mb-2">Trip Pace</label>
                    <select defaultValue="Moderate (6-7 hrs/day)" className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--soft-grey)] focus:outline-none focus:ring-2 focus:ring-[var(--sage-green)]/30 focus:border-[var(--sage-green)] transition-all">
                      <option>Relaxed (4-5 hrs/day)</option>
                      <option>Moderate (6-7 hrs/day)</option>
                      <option>Active (8+ hrs/day)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--deep-blue)] mb-2">Transport Mode</label>
                    <select defaultValue="Private Car" className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--soft-grey)] focus:outline-none focus:ring-2 focus:ring-[var(--sage-green)]/30 focus:border-[var(--sage-green)] transition-all">
                      <option>Private Car</option>
                      <option>High-Speed Train</option>
                      <option>Mixed Transport</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--deep-blue)] mb-2">Min Budget (CNY)</label>
                    <input type="number" min="0" step="100" defaultValue={plan?.budget_range.min || 3500} className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--soft-grey)] focus:outline-none focus:ring-2 focus:ring-[var(--sage-green)]/30 focus:border-[var(--sage-green)] transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--deep-blue)] mb-2">Max Budget (CNY)</label>
                    <input type="number" min="0" step="100" defaultValue={plan?.budget_range.max || 6000} className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--soft-grey)] focus:outline-none focus:ring-2 focus:ring-[var(--sage-green)]/30 focus:border-[var(--sage-green)] transition-all" />
                  </div>
                </div>
              </div>
            )}

            {currentItinerary.map((dayData: any, idx: number) => (
              <div key={idx} className="bg-white rounded-xl border border-[var(--border)] overflow-hidden shadow-sm">
                <div className="p-5 border-b border-[var(--border)] bg-gradient-to-r from-[var(--light-sage)] to-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-[var(--deep-blue)]">Day {dayData.day}</h3>
                      <p className="text-sm text-[var(--muted-foreground)]">{dayData.date}</p>
                    </div>
                    {isEditMode && (
                      <GripVertical className="w-5 h-5 text-[var(--muted-foreground)] cursor-move" strokeWidth={2} />
                    )}
                  </div>
                </div>

                <div className="p-5 space-y-4">
                  {dayData.activities.map((activity: any, actIdx: number) => (
                    <div key={actIdx} className="flex gap-4 p-4 rounded-lg bg-[var(--soft-grey)] hover:bg-gray-100 transition-colors">
                      {isEditMode && (
                        <GripVertical className="w-5 h-5 text-[var(--muted-foreground)] cursor-move flex-shrink-0 mt-1" strokeWidth={2} />
                      )}
                      <div className="flex-shrink-0">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                          activity.type === 'hotel' ? 'bg-blue-100' :
                          activity.type === 'attraction' ? 'bg-green-100' :
                          activity.type === 'meal' ? 'bg-orange-100' :
                          'bg-purple-100'
                        }`}>
                          {activity.type === 'hotel' && <Hotel className="w-6 h-6 text-blue-600" strokeWidth={2} />}
                          {activity.type === 'attraction' && <MapPin className="w-6 h-6 text-green-600" strokeWidth={2} />}
                          {activity.type === 'meal' && <Utensils className="w-6 h-6 text-orange-600" strokeWidth={2} />}
                          {activity.type === 'transport' && <Car className="w-6 h-6 text-purple-600" strokeWidth={2} />}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <Clock className="w-4 h-4 text-[var(--muted-foreground)]" strokeWidth={2} />
                              <span className="text-sm font-medium text-[var(--muted-foreground)]">{activity.time}</span>
                              {activity.duration && (
                                <span className="text-sm text-[var(--muted-foreground)]">·{activity.duration}</span>
                              )}
                            </div>
                            <h4 className="font-semibold text-[var(--deep-blue)] mb-1">{activity.title || activity.name}</h4>
                          </div>
                          {isEditMode && (
                            <div className="flex gap-2">
                              <button className="px-3 py-1 text-xs rounded-lg border border-[var(--border)] bg-white hover:bg-[var(--soft-grey)] transition-colors">
                                Change
                              </button>
                              <button className="px-3 py-1 text-xs rounded-lg border border-[var(--border)] bg-white hover:bg-[var(--soft-grey)] transition-colors">
                                Details
                              </button>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2 text-sm">
                          {activity.ticket && (
                            <span className="px-2.5 py-1 bg-white rounded-md border border-[var(--border)] text-[var(--deep-blue)]">
                              Ticket: {activity.ticket}
                            </span>
                          )}
                          {activity.price && (
                            <span className="px-2.5 py-1 bg-white rounded-md border border-[var(--border)] text-[var(--deep-blue)]">
                              {activity.price}
                            </span>
                          )}
                          {activity.petPolicy && (
                            <span className={`px-2.5 py-1 rounded-md ${
                              activity.petPolicy === 'Friendly' ? 'bg-green-100 text-green-700' :
                              activity.petPolicy === 'Leash required' ? 'bg-amber-100 text-amber-700' :
                              'bg-blue-100 text-blue-700'
                            }`}>
                              <PawPrint className="w-3 h-3 inline mr-1" strokeWidth={2} />
                              {activity.petPolicy}
                            </span>
                          )}
                          {activity.petFee && (
                            <span className="px-2.5 py-1 bg-orange-100 text-orange-700 rounded-md">
                              Pet fee: {activity.petFee}
                            </span>
                          )}
                          {activity.hours && (
                            <span className="px-2.5 py-1 bg-purple-100 text-purple-700 rounded-md">
                              {activity.hours}
                            </span>
                          )}
                        </div>
                        {activity.note && (
                          <p className="text-sm text-[var(--muted-foreground)] mt-2">{activity.note}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Right: Safety Card */}
          <div className="w-80 flex-shrink-0">
            <div className="bg-white rounded-xl border border-[var(--border)] sticky top-8 overflow-hidden">
              <div className="p-5 border-b border-[var(--border)] bg-gradient-to-br from-green-50 to-white">
                <div className="flex items-center gap-2 mb-1">
                  <Shield className="w-5 h-5 text-green-600" strokeWidth={2} />
                  <h3 className="font-semibold text-[var(--deep-blue)]">Safety & Emergency</h3>
                </div>
                <p className="text-sm text-[var(--muted-foreground)]">Nearest pet hospital</p>
              </div>
              <div className="p-5">
                <h4 className="font-semibold text-[var(--deep-blue)] mb-2">Hangzhou Pet Hospital (24hr)</h4>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Navigation className="w-4 h-4 text-[var(--sage-green)]" strokeWidth={2} />
                    <span className="text-[var(--muted-foreground)]">Distance:</span>
                    <span className="font-medium text-[var(--deep-blue)]">2.3 km from hotel</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[var(--sage-green)]" strokeWidth={2} />
                    <span className="text-[var(--muted-foreground)]">ETA:</span>
                    <span className="font-medium text-[var(--deep-blue)]">8 minutes by car</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-[var(--sage-green)]" strokeWidth={2} />
                    <span className="text-[var(--muted-foreground)]">Phone:</span>
                    <span className="font-medium text-[var(--deep-blue)]">+86 571-8888-0000</span>
                  </div>
                  <div className="px-3 py-2 bg-green-50 rounded-lg border border-green-200 text-green-700">
                    <Activity className="w-4 h-4 inline mr-1" strokeWidth={2} />
                    Open 24/7
                  </div>
                </div>

                <button className="mt-4 w-full px-4 py-2.5 rounded-lg border-2 border-[var(--sage-green)] text-[var(--sage-green)] font-medium hover:bg-[var(--light-sage)] transition-all flex items-center justify-center gap-2">
                  <Phone className="w-4 h-4" strokeWidth={2} />
                  <span>Call Now</span>
                </button>
              </div>

              <div className="p-5 border-t border-[var(--border)] bg-[var(--soft-grey)]">
                <h4 className="font-medium text-[var(--deep-blue)] mb-2">Emergency Contact</h4>
                <p className="text-sm text-[var(--muted-foreground)]">Jane Chen</p>
                <p className="text-sm font-medium text-[var(--deep-blue)]">+86 138-0000-1234</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirm Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-8">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="p-6 border-b border-[var(--border)]">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-[var(--deep-blue)]">Start this trip?</h3>
                <button onClick={() => setShowConfirmModal(false)} className="w-8 h-8 rounded-lg hover:bg-[var(--soft-grey)] flex items-center justify-center transition-colors">
                  <X className="w-5 h-5 text-[var(--muted-foreground)]" strokeWidth={2} />
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-blue-100">
                    <Star className="w-6 h-6 text-blue-600" strokeWidth={2} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-[var(--deep-blue)]">{currentPlan.name} Plan</h4>
                    <p className="text-2xl font-bold text-[var(--sage-green)]">{currentPlan.totalCost}</p>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[var(--muted-foreground)]">Duration:</span>
                    <span className="font-medium text-[var(--deep-blue)]">3 days</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--muted-foreground)]">Dates:</span>
                    <span className="font-medium text-[var(--deep-blue)]">May 15-17, 2026</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--muted-foreground)]">Hotel:</span>
                    <span className="font-medium text-[var(--deep-blue)]">{currentPlan.hotelType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--muted-foreground)]">Pet:</span>
                    <span className="font-medium text-[var(--deep-blue)]">Biscuit (Golden Retriever)</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowConfirmModal(false)} className="flex-1 px-4 py-3 rounded-xl border-2 border-[var(--border)] text-[var(--deep-blue)] font-medium hover:bg-[var(--soft-grey)] transition-all">
                  Cancel
                </button>
                <button onClick={() => {
                  setShowConfirmModal(false);
                  onNavigate?.('map');
                }} className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-[var(--sage-green)] to-[var(--warm-orange)] text-white font-medium shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2">
                  <Check className="w-5 h-5" strokeWidth={2.5} />
                  <span>Start Trip</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
