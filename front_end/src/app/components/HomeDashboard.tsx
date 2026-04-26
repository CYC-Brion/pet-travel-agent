import { useState } from 'react';
import { Sparkles, Send, MapPin, Heart, FileText, CheckCircle2, AlertCircle, Settings, Star } from 'lucide-react';
import { MockAppState } from '../mockAppState';
import { UserProfile } from '../api/client';

interface HomeDashboardProps {
  onNavigate?: (view: string) => void;
  onStartPlanning?: (prompt: string) => void;
  profile?: UserProfile;
  appState: MockAppState;
}

export function HomeDashboard({ onNavigate, onStartPlanning, profile, appState }: HomeDashboardProps) {
  const [inputValue, setInputValue] = useState('');

  const handlePlan = () => {
    if (!inputValue.trim()) return;
    onStartPlanning?.(inputValue.trim());
  };

  const quickActions = [
    { icon: MapPin, label: 'Plan a pet-friendly trip', action: () => onNavigate?.('info') },
    { icon: Star, label: 'View trip reviews', action: () => onNavigate?.('review') },
    { icon: Heart, label: 'Find nearby pet hospitals', action: () => onNavigate?.('info') },
    { icon: FileText, label: 'Resume a previous trip', action: () => onNavigate?.('planning') },
  ];

  const readinessFields = [
    { label: 'Budget', value: profile?.minBudget && profile?.maxBudget ? `CNY ${profile.minBudget}-CNY ${profile.maxBudget}` : '', status: profile?.minBudget && profile?.maxBudget ? 'ready' : 'missing' },
    { label: 'Transport', value: profile?.transportPreference || '', status: profile?.transportPreference ? 'ready' : 'missing' },
    { label: 'Pet profile', value: profile?.petName && profile?.breed ? `${profile.petName}, ${profile.breed}` : '', status: profile?.petName && profile?.breed ? 'ready' : 'missing' },
    { label: 'Health notes', value: profile?.healthNotes || '', status: profile?.healthNotes ? 'ready' : 'missing' },
    { label: 'Emergency contact', value: profile?.emergencyName && profile?.emergencyPhone ? `${profile.emergencyName} (${profile.emergencyPhone})` : '', status: profile?.emergencyName && profile?.emergencyPhone ? 'ready' : 'missing' },
  ];

  const readyCount = readinessFields.filter((f) => f.status === 'ready').length;
  const totalCount = readinessFields.length;

  return (
    <div className="min-h-screen bg-[var(--cream-white)]">
      <div className="border-b border-[var(--border)] bg-white">
        <div className="max-w-7xl mx-auto px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[var(--sage-green)] to-[var(--warm-orange)] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-base font-semibold text-[var(--deep-blue)]">Pet-Friendly Travel Planner</h1>
              <p className="text-xs text-[var(--muted-foreground)]">Plan smarter trips with your pet</p>
            </div>
          </div>
          <button onClick={() => onNavigate?.('settings')} className="p-2 rounded-lg hover:bg-[var(--soft-grey)] transition-colors" title="Settings">
            <Settings className="w-5 h-5 text-[var(--muted-foreground)]" strokeWidth={2} />
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-10 flex gap-8">
        <div className="flex-1 space-y-6">
          <div className="bg-white rounded-2xl border-2 border-[var(--sage-green)]/30 p-8 shadow-md">
            <h2 className="text-2xl font-semibold text-[var(--deep-blue)] mb-3">Where should we take your pet next?</h2>
            <p className="text-[var(--muted-foreground)] mb-6 leading-relaxed">
              Enter your travel request. We will carry this text into the detail form and keep it connected throughout planning.
            </p>
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Example: Take my golden retriever from Shanghai to Hangzhou for 3 days, budget around CNY 5,000, private car."
              rows={5}
              className="w-full px-5 py-4 rounded-xl border border-[var(--border)] bg-[var(--soft-grey)] focus:outline-none focus:ring-2 focus:ring-[var(--sage-green)]/40 focus:border-[var(--sage-green)] transition-all text-base resize-none"
            />
            <div className="mt-4 flex items-center justify-end">
              <button
                onClick={handlePlan}
                disabled={!inputValue.trim()}
                className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-[var(--sage-green)] to-[var(--warm-orange)] text-white font-semibold hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
              >
                <span>Start Planning</span>
                <Send className="w-5 h-5" strokeWidth={2} />
              </button>
            </div>
          </div>

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
                  <span className="text-sm font-medium text-[var(--deep-blue)] group-hover:text-[var(--sage-green)] transition-colors">{action.label}</span>
                </button>
              );
            })}
          </div>

          <div className="bg-white rounded-xl border border-[var(--border)] p-4">
            <h3 className="text-sm font-semibold text-[var(--deep-blue)] mb-3">Trips</h3>
            {appState.trips.map((trip) => (
              <div key={trip.id} className="py-2 text-sm text-[var(--muted-foreground)]">
                {trip.title} - {trip.status} - {trip.dates}
              </div>
            ))}
          </div>
        </div>

        <div className="w-80 flex-shrink-0">
          <div className="bg-white rounded-xl border border-[var(--border)] overflow-hidden sticky top-6">
            <div className="p-4 border-b border-[var(--border)] bg-[var(--soft-grey)]">
              <h3 className="font-medium text-[var(--deep-blue)] mb-2">Trip Readiness</h3>
              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--muted-foreground)]">{readyCount} of {totalCount} complete</span>
                <span className="font-semibold text-[var(--sage-green)]">{Math.round((readyCount / totalCount) * 100)}%</span>
              </div>
            </div>
            <div className="p-4 space-y-2.5">
              {readinessFields.map((field, idx) => (
                <div key={idx} className={`p-2.5 rounded-lg border ${field.status === 'ready' ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-sm font-medium text-[var(--deep-blue)]">{field.label}</span>
                    {field.status === 'ready' ? <CheckCircle2 className="w-4 h-4 text-green-600" strokeWidth={2.5} /> : <AlertCircle className="w-4 h-4 text-gray-400" strokeWidth={2} />}
                  </div>
                  <p className={`text-xs ${field.status === 'ready' ? 'text-green-700 font-medium' : 'text-gray-400 italic'}`}>{field.value || 'Not set'}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

