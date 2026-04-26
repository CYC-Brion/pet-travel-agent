import { useState } from 'react';
import { Sparkles, Send, MapPin, Hotel, Heart, FileText, CheckCircle2, AlertCircle, Loader2, Settings, Star } from 'lucide-react';
import { MockAppState } from '../mockAppState';

interface HomeDashboardProps {
  onNavigate?: (view: string) => void;
  appState: MockAppState;
}

export function HomeDashboard({ onNavigate, appState }: HomeDashboardProps) {
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePlan = () => {
    if (inputValue.trim()) {
      setIsProcessing(true);
      setTimeout(() => {
        setIsProcessing(false);
        onNavigate?.('info');
      }, 1500);
    }
  };

  const quickActions = [
    { icon: MapPin, label: 'Plan a pet-friendly trip', action: () => onNavigate?.('info') },
    { icon: Star, label: 'View trip reviews', action: () => onNavigate?.('review') },
    { icon: Heart, label: 'Find nearby pet hospitals', action: () => onNavigate?.('map') },
    { icon: FileText, label: 'Resume a previous trip', action: () => onNavigate?.('planning') },
  ];

  const upcomingTrips = appState.trips.filter((trip) => trip.status === 'draft' || trip.status === 'planned');
  const activeTrips = appState.trips.filter((trip) => trip.status === 'in_progress');
  const pastTrips = appState.trips.filter((trip) => trip.status === 'completed');

  const readinessFields = [
    { label: 'Destination', value: '', status: 'missing' },
    { label: 'Travel dates', value: '', status: 'missing' },
    { label: 'Trip length', value: '', status: 'missing' },
    { label: 'Budget', value: '', status: 'missing' },
    { label: 'Transport', value: '', status: 'missing' },
    { label: 'Pet profile', value: 'Biscuit, Golden Retriever', status: 'ready' },
    { label: 'Health notes', value: '', status: 'missing' },
    { label: 'Emergency contact', value: '', status: 'missing' },
  ];

  const readyCount = readinessFields.filter(f => f.status === 'ready').length;
  const totalCount = readinessFields.length;

  return (
    <div className="min-h-screen flex flex-col bg-[var(--cream-white)]">
      {/* Header */}
      <div className="border-b border-[var(--border)] bg-white">
        <div className="max-w-7xl mx-auto px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[var(--sage-green)] to-[var(--warm-orange)] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-base font-semibold text-[var(--deep-blue)]">
                Pet-Friendly Travel Planner
              </h1>
              <p className="text-xs text-[var(--muted-foreground)]">
                Plan smarter trips with your pet
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate?.('settings')}
              className="p-2 rounded-lg hover:bg-[var(--soft-grey)] transition-colors"
              title="Settings"
            >
              <Settings className="w-5 h-5 text-[var(--muted-foreground)]" strokeWidth={2} />
            </button>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--warm-orange)] to-[var(--sage-green)] flex items-center justify-center text-white text-xs font-medium cursor-pointer" onClick={() => onNavigate?.('settings')}>
              {appState.userName.split(' ').map((part) => part[0]).join('')}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto px-8 py-10 flex gap-8">
          {/* Left: Main Planning Area */}
          <div className="flex-1 space-y-6">
            {/* Main AI Planning Card */}
            <div className="bg-white rounded-2xl border-2 border-[var(--sage-green)]/30 p-8 shadow-md">
              <h2 className="text-2xl font-semibold text-[var(--deep-blue)] mb-3">
                Where should we take Biscuit next?
              </h2>
              <p className="text-[var(--muted-foreground)] mb-6 leading-relaxed">
                Tell us your destination, dates, budget, and anything your pet needs. The assistant will ask follow-up questions if details are missing.
              </p>

              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Example: Take my golden retriever from Shanghai to Hangzhou for 3 days, budget around ¥5,000. I prefer driving and pet-friendly hotels."
                disabled={isProcessing}
                rows={6}
                className="w-full px-5 py-4 rounded-xl border border-[var(--border)] bg-[var(--soft-grey)] focus:outline-none focus:ring-2 focus:ring-[var(--sage-green)]/40 focus:border-[var(--sage-green)] transition-all text-base resize-none"
              />

              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-[var(--muted-foreground)]">
                  Press Enter or click Start Planning to begin
                </p>
                <button
                  onClick={handlePlan}
                  disabled={isProcessing || !inputValue.trim()}
                  className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-[var(--sage-green)] to-[var(--warm-orange)] text-white font-semibold hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" strokeWidth={2} />
                      <span>Planning...</span>
                    </>
                  ) : (
                    <>
                      <span>Start Planning</span>
                      <Send className="w-5 h-5" strokeWidth={2} />
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Quick Actions */}
            <div>
              <h3 className="text-sm font-medium text-[var(--muted-foreground)] mb-3 px-1">
                Quick Actions
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {quickActions.map((action, idx) => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={idx}
                      onClick={action.action}
                      className="flex items-center gap-3 p-4 rounded-xl bg-white border border-[var(--border)] hover:border-[var(--sage-green)] hover:shadow-sm transition-all group text-left"
                    >
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-5 h-5 text-white" strokeWidth={2} />
                      </div>
                      <span className="text-sm font-medium text-[var(--deep-blue)] group-hover:text-[var(--sage-green)] transition-colors">
                        {action.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* AI Hint */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" strokeWidth={2} />
                <div>
                  <h4 className="text-sm font-semibold text-blue-900 mb-1">
                    AI Assistant
                  </h4>
                  <p className="text-sm text-blue-700 leading-relaxed">
                    The assistant will ask follow-up questions if key details are missing. You can also skip ahead and fill in the trip details manually.
                  </p>
                </div>
              </div>
            </div>

            {/* Saved Trips */}
            <div className="grid grid-cols-3 gap-4">
              <section className="bg-white rounded-xl border border-[var(--border)] p-4">
                <h3 className="text-sm font-semibold text-[var(--deep-blue)] mb-1">Upcoming Trips</h3>
                <p className="text-xs text-[var(--muted-foreground)] mb-4">Plans waiting for confirmation</p>
                {upcomingTrips.length === 0 && (
                  <p className="text-xs text-[var(--muted-foreground)]">No upcoming plans yet.</p>
                )}
                {upcomingTrips.map((trip) => (
                  <div key={trip.title} className="space-y-3">
                    <div>
                      <h4 className="text-sm font-medium text-[var(--deep-blue)]">{trip.title}</h4>
                      <p className="text-xs text-[var(--muted-foreground)] mt-1">{trip.dates} - {trip.route} - {trip.nextStep}</p>
                    </div>
                    <button
                      onClick={() => onNavigate?.(trip.status === 'draft' ? 'planningEdit' : 'planning')}
                      className="w-full px-3 py-2 rounded-lg border border-[var(--sage-green)] text-[var(--sage-green)] text-sm font-medium hover:bg-[var(--light-sage)] transition-all"
                    >
                      {trip.status === 'draft' ? 'Continue Editing' : 'View Plan'}
                    </button>
                  </div>
                ))}
              </section>

              <section className="bg-white rounded-xl border border-green-200 p-4">
                <h3 className="text-sm font-semibold text-[var(--deep-blue)] mb-1">In-Progress Trip</h3>
                <p className="text-xs text-[var(--muted-foreground)] mb-4">Pick up where you left off</p>
                {activeTrips.length === 0 && (
                  <p className="text-xs text-[var(--muted-foreground)]">No trip is currently in progress.</p>
                )}
                {activeTrips.map((trip) => (
                  <div key={trip.title} className="space-y-3">
                    <div>
                      <h4 className="text-sm font-medium text-[var(--deep-blue)]">{trip.title}</h4>
                      <p className="text-xs text-[var(--muted-foreground)] mt-1">{trip.nextStep}</p>
                    </div>
                    <button
                      onClick={() => onNavigate?.('map')}
                      className="w-full px-3 py-2 rounded-lg bg-gradient-to-r from-[var(--sage-green)] to-[var(--warm-orange)] text-white text-sm font-medium shadow-sm hover:shadow-md transition-all"
                    >
                      Resume Trip
                    </button>
                  </div>
                ))}
              </section>

              <section className="bg-white rounded-xl border border-[var(--border)] p-4">
                <h3 className="text-sm font-semibold text-[var(--deep-blue)] mb-1">Past Trips</h3>
                <p className="text-xs text-[var(--muted-foreground)] mb-4">Completed trips and reviews</p>
                {pastTrips.length === 0 && (
                  <p className="text-xs text-[var(--muted-foreground)]">Completed trips will appear here.</p>
                )}
                {pastTrips.map((trip) => (
                  <div key={trip.title} className="space-y-3">
                    <div>
                      <h4 className="text-sm font-medium text-[var(--deep-blue)]">{trip.title}</h4>
                      <p className="text-xs text-[var(--muted-foreground)] mt-1">Completed - {trip.rating ? `Rated ${trip.rating}/5` : 'Ready for review'}</p>
                    </div>
                    <button
                      onClick={() => onNavigate?.('review')}
                      className="w-full px-3 py-2 rounded-lg border border-[var(--border)] text-[var(--deep-blue)] text-sm font-medium hover:border-[var(--sage-green)] hover:bg-[var(--soft-grey)] transition-all"
                    >
                      View Review
                    </button>
                  </div>
                ))}
              </section>
            </div>
          </div>

          {/* Right: Trip Readiness Panel */}
          <div className="w-80 flex-shrink-0">
            <div className="bg-white rounded-xl border border-[var(--border)] overflow-hidden sticky top-6">
              {/* Header */}
              <div className="p-4 border-b border-[var(--border)] bg-[var(--soft-grey)]">
                <h3 className="font-medium text-[var(--deep-blue)] mb-2">
                  Trip Readiness
                </h3>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[var(--muted-foreground)]">
                    {readyCount} of {totalCount} complete
                  </span>
                  <span className="font-semibold text-[var(--sage-green)]">
                    {Math.round((readyCount / totalCount) * 100)}%
                  </span>
                </div>
                <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[var(--sage-green)] to-[var(--warm-orange)] transition-all duration-700"
                    style={{ width: `${(readyCount / totalCount) * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* Fields */}
              <div className="p-4 space-y-2.5 max-h-80 overflow-y-auto">
                {readinessFields.map((field, idx) => (
                  <div
                    key={idx}
                    className={`p-2.5 rounded-lg border transition-all ${
                      field.status === 'ready'
                        ? 'bg-green-50 border-green-200'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-sm font-medium text-[var(--deep-blue)]">
                        {field.label}
                      </span>
                      {field.status === 'ready' ? (
                        <CheckCircle2 className="w-4 h-4 text-green-600" strokeWidth={2.5} />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-gray-400" strokeWidth={2} />
                      )}
                    </div>
                    <p
                      className={`text-xs ${
                        field.status === 'ready'
                          ? 'text-green-700 font-medium'
                          : 'text-gray-400 italic'
                      }`}
                    >
                      {field.value || 'Not set'}
                    </p>
                  </div>
                ))}
              </div>

              {/* Action */}
              <div className="p-4 border-t border-[var(--border)]">
                <button
                  onClick={() => onNavigate?.('info')}
                  className="w-full px-4 py-2.5 rounded-lg border border-[var(--sage-green)] text-[var(--sage-green)] text-sm font-medium hover:bg-[var(--light-sage)] transition-all"
                >
                  Complete Trip Details
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

