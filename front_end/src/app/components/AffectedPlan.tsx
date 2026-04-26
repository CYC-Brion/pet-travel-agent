import { XCircle, AlertCircle, Clock } from 'lucide-react';

interface AffectedPlanProps {
  items: Array<{
    time: string;
    title: string;
    reason: string;
    impact: string;
  }>;
}

export function AffectedPlan({ items }: AffectedPlanProps) {
  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high':
        return {
          bg: 'bg-red-50',
          border: 'border-red-300',
          icon: 'text-red-500',
          text: 'text-red-700',
        };
      case 'medium':
        return {
          bg: 'bg-orange-50',
          border: 'border-orange-300',
          icon: 'text-orange-500',
          text: 'text-orange-700',
        };
      default:
        return {
          bg: 'bg-amber-50',
          border: 'border-amber-300',
          icon: 'text-amber-500',
          text: 'text-amber-700',
        };
    }
  };

  return (
    <div className="h-full bg-white rounded-2xl border-2 border-red-200 shadow-lg overflow-hidden flex flex-col">
      {/* Header */}
      <div className="p-5 border-b border-red-200 bg-gradient-to-br from-red-50 to-orange-50">
        <div className="flex items-center gap-2 mb-2">
          <XCircle className="w-5 h-5 text-red-500" strokeWidth={2.5} />
          <h3 className="font-semibold text-[var(--deep-blue)]">受影响节点</h3>
        </div>
        <p className="text-sm text-[var(--muted-foreground)]">
          {items.length} 个活动无法按计划执行
        </p>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-3">
          {items.map((item, idx) => {
            const colors = getImpactColor(item.impact);

            return (
              <div
                key={idx}
                className={`
                  p-4 rounded-xl border-2 ${colors.border} ${colors.bg}
                  animate-[fadeInUp_0.5s_ease-out_both]
                `}
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                {/* Time Badge */}
                <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-white/60 rounded-lg mb-2">
                  <Clock className={`w-3 h-3 ${colors.icon}`} strokeWidth={2} />
                  <span className={`text-xs font-semibold ${colors.text}`}>{item.time}</span>
                </div>

                {/* Title */}
                <h4 className="font-semibold text-[var(--deep-blue)] mb-2 line-through opacity-60">
                  {item.title}
                </h4>

                {/* Reason */}
                <div className="flex items-start gap-2 p-2 bg-white/60 rounded-lg">
                  <AlertCircle className={`w-4 h-4 ${colors.icon} flex-shrink-0 mt-0.5`} strokeWidth={2} />
                  <p className="text-sm text-[var(--deep-blue)] leading-relaxed">
                    {item.reason}
                  </p>
                </div>

                {/* Impact Badge */}
                <div className="mt-3 flex justify-end">
                  <div className={`px-2 py-1 ${colors.bg} border ${colors.border} rounded`}>
                    <span className={`text-xs font-medium ${colors.text}`}>
                      {item.impact === 'high' ? '高影响' : item.impact === 'medium' ? '中等影响' : '低影响'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-red-200 bg-red-50">
        <div className="flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" strokeWidth={2} />
          <p className="text-xs text-red-800 leading-relaxed">
            请在右侧选择替代方案，或立即联系应急资源
          </p>
        </div>
      </div>
    </div>
  );
}
