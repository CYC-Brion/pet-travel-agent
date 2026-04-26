import { useState, useEffect } from 'react';
import { Sparkles, CheckCircle2, Loader2, PawPrint, CloudSun, Building2, FileText, MapPin, X } from 'lucide-react';

interface LoadingPlanningPageProps {
  onNavigate?: (view: string) => void;
  onGeneratePlan?: () => Promise<void>;
  planningError?: string | null;
}

type StageStatus = 'pending' | 'in-progress' | 'complete';

interface Stage {
  id: string;
  label: string;
  icon: typeof PawPrint;
  status: StageStatus;
}

export function LoadingPlanningPage({ onNavigate, onGeneratePlan, planningError }: LoadingPlanningPageProps) {
  const [stages, setStages] = useState<Stage[]>([
    { id: '1', label: 'Reading pet profile', icon: PawPrint, status: 'pending' },
    { id: '2', label: 'Checking weather', icon: CloudSun, status: 'pending' },
    { id: '3', label: 'Finding pet-friendly hotels', icon: Building2, status: 'pending' },
    { id: '4', label: 'Evaluating local pet rules', icon: FileText, status: 'pending' },
    { id: '5', label: 'Building route options', icon: MapPin, status: 'pending' },
  ]);

  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [isCancelled, setIsCancelled] = useState(false);

  useEffect(() => {
    if (isCancelled) return;

    const interval = setInterval(() => {
      setCurrentStageIndex((prev) => {
        if (prev >= stages.length) {
          clearInterval(interval);
          if (!onGeneratePlan) {
            setTimeout(() => {
              if (!isCancelled) {
              onNavigate?.('planning');
              }
            }, 800);
          }
          return prev;
        }

        setStages((prevStages) => {
          const newStages = [...prevStages];
          if (prev > 0) {
            newStages[prev - 1].status = 'complete';
          }
          if (prev < newStages.length) {
            newStages[prev].status = 'in-progress';
          }
          return newStages;
        });

        return prev + 1;
      });
    }, 1500);

    return () => clearInterval(interval);
  }, [isCancelled, stages.length, onGeneratePlan, onNavigate]);

  useEffect(() => {
    onGeneratePlan?.();
  }, [onGeneratePlan]);

  const handleCancel = () => {
    setIsCancelled(true);
    onNavigate?.('info');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--cream-white)] via-[var(--light-sage)] to-[var(--muted-orange)] flex items-center justify-center p-8">
      <div className="w-full max-w-2xl">
        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-[var(--border)] overflow-hidden">
          {/* Header with animated pet mascot */}
          <div className="p-8 text-center bg-gradient-to-br from-[var(--light-sage)] to-white border-b border-[var(--border)]">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-[var(--sage-green)] to-[var(--warm-orange)] mb-4 shadow-lg animate-[pulse-soft_2s_ease-in-out_infinite]">
              <PawPrint className="w-10 h-10 text-white" strokeWidth={2.5} />
            </div>
            <h2 className="text-2xl font-semibold text-[var(--deep-blue)] mb-2">
              Biscuit is planning your trip...
            </h2>
            <p className="text-sm text-[var(--muted-foreground)]">
              Sit tight while we create the perfect itinerary for you and your pet
            </p>
          </div>

          {/* Progress Stages */}
          <div className="p-8 space-y-4">
            {stages.map((stage, index) => {
              const Icon = stage.icon;
              return (
                <div
                  key={stage.id}
                  className={`flex items-center gap-4 p-4 rounded-xl transition-all duration-500 ${
                    stage.status === 'complete'
                      ? 'bg-green-50 border-2 border-green-200'
                      : stage.status === 'in-progress'
                      ? 'bg-blue-50 border-2 border-blue-300 shadow-sm'
                      : 'bg-[var(--soft-grey)] border-2 border-transparent'
                  }`}
                >
                  <div
                    className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-500 ${
                      stage.status === 'complete'
                        ? 'bg-green-500'
                        : stage.status === 'in-progress'
                        ? 'bg-gradient-to-br from-[var(--sage-green)] to-[var(--warm-orange)]'
                        : 'bg-gray-300'
                    }`}
                  >
                    {stage.status === 'complete' ? (
                      <CheckCircle2 className="w-6 h-6 text-white" strokeWidth={2.5} />
                    ) : stage.status === 'in-progress' ? (
                      <Loader2 className="w-6 h-6 text-white animate-spin" strokeWidth={2.5} />
                    ) : (
                      <Icon className="w-6 h-6 text-white" strokeWidth={2} />
                    )}
                  </div>

                  <div className="flex-1">
                    <p
                      className={`text-sm font-medium transition-colors duration-300 ${
                        stage.status === 'complete'
                          ? 'text-green-700'
                          : stage.status === 'in-progress'
                          ? 'text-[var(--deep-blue)]'
                          : 'text-[var(--muted-foreground)]'
                      }`}
                    >
                      {stage.label}
                    </p>
                  </div>

                  {stage.status === 'complete' && (
                    <span className="text-xs font-medium text-green-600 bg-green-100 px-2.5 py-1 rounded-full">
                      Complete
                    </span>
                  )}
                  {stage.status === 'in-progress' && (
                    <span className="text-xs font-medium text-blue-600 bg-blue-100 px-2.5 py-1 rounded-full">
                      In Progress
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Footer with Cancel */}
          <div className="p-6 border-t border-[var(--border)] bg-[var(--soft-grey)]">
            <div className="flex items-center justify-between">
              <p className="text-sm text-[var(--muted-foreground)]">
                This usually takes 10-15 seconds
              </p>
              <button
                onClick={handleCancel}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--border)] bg-white text-[var(--deep-blue)] font-medium hover:bg-gray-50 transition-all"
              >
                <X className="w-4 h-4" strokeWidth={2} />
                <span className="text-sm">Cancel</span>
              </button>
            </div>
            {planningError && (
              <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                {planningError}
              </div>
            )}
          </div>
        </div>

        {/* Helpful Hint */}
        <div className="mt-6 p-4 bg-white/80 backdrop-blur-sm rounded-xl border border-[var(--border)]">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-[var(--sage-green)] flex-shrink-0 mt-0.5" strokeWidth={2} />
            <div>
              <h4 className="text-sm font-semibold text-[var(--deep-blue)] mb-1">
                AI is personalizing your trip
              </h4>
              <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">
                We're analyzing thousands of pet-friendly locations, reviews, and local regulations to create the best experience for you and Biscuit.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
