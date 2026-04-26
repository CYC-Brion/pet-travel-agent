import { Crown, Star, DollarSign, LucideIcon } from 'lucide-react';

interface Plan {
  name: string;
  icon: LucideIcon;
  budget: string;
  description: string;
  color: string;
}

interface PlanTabsProps {
  plans: Record<string, Plan>;
  selectedPlan: string;
  onSelectPlan: (plan: string) => void;
}

export function PlanTabs({ plans, selectedPlan, onSelectPlan }: PlanTabsProps) {
  const getColorClasses = (color: string, isSelected: boolean) => {
    const colors: Record<string, { border: string; bg: string; text: string; icon: string }> = {
      purple: {
        border: 'border-purple-400',
        bg: 'bg-gradient-to-br from-purple-50 to-pink-50',
        text: 'text-purple-700',
        icon: 'text-purple-500',
      },
      blue: {
        border: 'border-blue-400',
        bg: 'bg-gradient-to-br from-blue-50 to-cyan-50',
        text: 'text-blue-700',
        icon: 'text-blue-500',
      },
      green: {
        border: 'border-green-400',
        bg: 'bg-gradient-to-br from-green-50 to-emerald-50',
        text: 'text-green-700',
        icon: 'text-green-500',
      },
    };

    const colorSet = colors[color] || colors.blue;

    return isSelected
      ? `${colorSet.border} ${colorSet.bg} shadow-md scale-105`
      : 'border-[var(--border)] bg-white hover:border-gray-300 hover:shadow-sm';
  };

  return (
    <div className="flex gap-4">
      {Object.entries(plans).map(([key, plan]) => {
        const Icon = plan.icon;
        const isSelected = selectedPlan === key;
        const colorClasses = getColorClasses(plan.color, isSelected);

        const iconColorMap: Record<string, string> = {
          purple: 'text-purple-500',
          blue: 'text-blue-500',
          green: 'text-green-500',
        };

        const textColorMap: Record<string, string> = {
          purple: 'text-purple-700',
          blue: 'text-blue-700',
          green: 'text-green-700',
        };

        return (
          <button
            key={key}
            onClick={() => onSelectPlan(key)}
            className={`
              flex-1 p-5 rounded-2xl border-2 transition-all duration-300 cursor-pointer
              ${colorClasses}
              ${isSelected ? '' : 'hover:scale-102 active:scale-98'}
            `}
          >
            <div className="flex items-start gap-3 mb-3">
              <div className={`
                w-11 h-11 rounded-xl flex items-center justify-center
                ${isSelected
                  ? plan.color === 'purple'
                    ? 'bg-gradient-to-br from-purple-400 to-pink-500 shadow-md'
                    : plan.color === 'blue'
                    ? 'bg-gradient-to-br from-blue-400 to-cyan-500 shadow-md'
                    : 'bg-gradient-to-br from-green-400 to-emerald-500 shadow-md'
                  : 'bg-gray-100'
                }
              `}>
                <Icon
                  className={`w-6 h-6 ${isSelected ? 'text-white' : 'text-gray-400'}`}
                  strokeWidth={2}
                />
              </div>

              <div className="flex-1 text-left">
                <h3 className={`font-semibold mb-1 ${
                  isSelected ? textColorMap[plan.color] : 'text-[var(--deep-blue)]'
                }`}>
                  {plan.name}
                </h3>
                <p className="text-xs text-[var(--muted-foreground)]">
                  {plan.description}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-current/10">
              <span className={`text-sm font-medium ${
                isSelected ? textColorMap[plan.color] : 'text-[var(--muted-foreground)]'
              }`}>
                总预算
              </span>
              <span className={`text-xl font-bold ${
                isSelected ? textColorMap[plan.color] : 'text-[var(--deep-blue)]'
              }`}>
                {plan.budget}
              </span>
            </div>

            {isSelected && (
              <div className="mt-3 px-3 py-1.5 bg-white/60 backdrop-blur-sm rounded-lg border border-white/50">
                <span className="text-xs font-medium text-[var(--deep-blue)]">
                  ✨ 当前方案
                </span>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
