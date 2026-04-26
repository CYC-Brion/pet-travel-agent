import {
  CheckCircle2,
  ArrowRight,
  Clock,
  Navigation,
  PawPrint,
  Star,
  AlertCircle,
  Zap,
} from 'lucide-react';

interface AlternativePlanProps {
  plan: any;
  isSelected: boolean;
  onSelect: () => void;
}

export function AlternativePlan({ plan, isSelected, onSelect }: AlternativePlanProps) {
  return (
    <div
      onClick={onSelect}
      className={`
        bg-white rounded-2xl border-2 overflow-hidden cursor-pointer
        transition-all duration-300
        ${isSelected
          ? 'border-[var(--sage-green)] shadow-xl scale-102'
          : 'border-[var(--border)] hover:border-gray-300 hover:shadow-md'
        }
      `}
    >
      {/* Header */}
      <div className={`
        p-5 border-b border-[var(--border)]
        ${plan.recommended
          ? 'bg-gradient-to-br from-green-50 to-emerald-50'
          : 'bg-gradient-to-br from-blue-50 to-purple-50'
        }
      `}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={`
              w-10 h-10 rounded-xl flex items-center justify-center shadow-sm
              ${plan.recommended
                ? 'bg-gradient-to-br from-green-400 to-emerald-500'
                : 'bg-gradient-to-br from-blue-400 to-purple-500'
              }
            `}>
              {plan.recommended ? (
                <Star className="w-5 h-5 text-white fill-white" strokeWidth={2} />
              ) : (
                <Zap className="w-5 h-5 text-white" strokeWidth={2.5} />
              )}
            </div>

            <div>
              <h3 className="font-semibold text-[var(--deep-blue)] mb-1">
                {plan.name}
              </h3>
              {plan.recommended && (
                <div className="px-2 py-0.5 bg-green-100 rounded">
                  <span className="text-xs font-medium text-green-700">AI 推荐</span>
                </div>
              )}
            </div>
          </div>

          {/* Selection Indicator */}
          <div className={`
            w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all
            ${isSelected
              ? 'border-[var(--sage-green)] bg-[var(--sage-green)]'
              : 'border-gray-300'
            }
          `}>
            {isSelected && (
              <CheckCircle2 className="w-4 h-4 text-white" strokeWidth={3} />
            )}
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-3">
          <div className="px-3 py-2 bg-white/60 rounded-lg">
            <p className="text-xs text-[var(--muted-foreground)] mb-0.5">通勤时间</p>
            <p className="text-sm font-semibold text-[var(--deep-blue)]">
              {plan.summary.totalTime}
            </p>
          </div>
          <div className="px-3 py-2 bg-white/60 rounded-lg">
            <p className="text-xs text-[var(--muted-foreground)] mb-0.5">时间节省</p>
            <p className="text-sm font-semibold text-green-700">
              {plan.summary.saved}
            </p>
          </div>
          <div className="px-3 py-2 bg-white/60 rounded-lg">
            <p className="text-xs text-[var(--muted-foreground)] mb-0.5">宠物舒适度</p>
            <p className="text-sm font-semibold text-purple-700">
              {plan.summary.petComfort}
            </p>
          </div>
        </div>
      </div>

      {/* Changes */}
      <div className="p-5 space-y-4">
        {plan.changes.map((change: any, idx: number) => (
          <div
            key={idx}
            className="relative p-4 bg-gradient-to-br from-[var(--soft-grey)] to-white rounded-xl border border-[var(--border)]"
          >
            {/* Time */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[var(--sage-green)]/10 rounded-lg mb-3">
              <Clock className="w-3.5 h-3.5 text-[var(--sage-green)]" strokeWidth={2} />
              <span className="text-sm font-semibold text-[var(--sage-green)]">
                {change.time}
              </span>
            </div>

            {/* Change Comparison */}
            <div className="grid grid-cols-[1fr,auto,1fr] gap-4 items-center mb-3">
              {/* Original */}
              <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                <p className="text-xs text-red-600 mb-1">原计划</p>
                <p className="text-sm font-medium text-red-900 line-through">
                  {change.original}
                </p>
              </div>

              {/* Arrow */}
              <ArrowRight className="w-5 h-5 text-[var(--sage-green)]" strokeWidth={2.5} />

              {/* Alternative */}
              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <p className="text-xs text-green-600 mb-1">替代方案</p>
                <p className="text-sm font-semibold text-green-900">
                  {change.alternative}
                </p>
              </div>
            </div>

            {/* Details */}
            <div className="space-y-2">
              {/* Reason */}
              <div className="flex items-start gap-2 text-sm">
                <AlertCircle className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" strokeWidth={2} />
                <p className="text-[var(--deep-blue)]">
                  <span className="font-medium">原因：</span>
                  {change.reason}
                </p>
              </div>

              {/* Distance & Duration */}
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1.5">
                  <Navigation className="w-4 h-4 text-[var(--muted-foreground)]" strokeWidth={2} />
                  <span className="text-[var(--deep-blue)]">{change.distance}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-[var(--muted-foreground)]" strokeWidth={2} />
                  <span className="text-[var(--deep-blue)]">{change.duration}</span>
                </div>
              </div>

              {/* Pet Status */}
              {change.petFriendly ? (
                <div className="flex items-center gap-2 p-2 bg-green-50 rounded-lg border border-green-200">
                  <PawPrint className="w-4 h-4 text-green-600" strokeWidth={2.5} />
                  <span className="text-sm font-medium text-green-700">
                    {change.petService || '宠物友好'}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 p-2 bg-amber-50 rounded-lg border border-amber-200">
                  <AlertCircle className="w-4 h-4 text-amber-600" strokeWidth={2} />
                  <span className="text-sm font-medium text-amber-700">
                    {change.petService || '需要寄存宠物'}
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Action */}
      {isSelected && (
        <div className="p-5 border-t border-[var(--border)] bg-gradient-to-r from-green-50 to-emerald-50 animate-[fadeInUp_0.3s_ease-out]">
          <button className="w-full px-6 py-3 rounded-xl bg-gradient-to-r from-[var(--sage-green)] to-[var(--warm-orange)] text-white font-medium shadow-lg hover:shadow-xl hover:scale-105 active:scale-100 transition-all duration-300 flex items-center justify-center gap-2">
            <CheckCircle2 className="w-5 h-5" strokeWidth={2.5} />
            <span>采用此方案</span>
          </button>
          <p className="text-xs text-center text-[var(--muted-foreground)] mt-2">
            点击立即更新行程并开始导航
          </p>
        </div>
      )}
    </div>
  );
}
