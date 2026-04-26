import { Calendar, MapPin, FileText, RefreshCw, Hospital } from 'lucide-react';

export function QuickActions() {
  const actions = [
    { icon: Calendar, label: '行前规划', color: 'from-blue-400 to-blue-600' },
    { icon: MapPin, label: '景点推荐', color: 'from-green-400 to-green-600' },
    { icon: FileText, label: '证件提醒', color: 'from-amber-400 to-amber-600' },
    { icon: RefreshCw, label: '行中重规划', color: 'from-purple-400 to-purple-600' },
    { icon: Hospital, label: '附近宠物医院', color: 'from-red-400 to-red-600' },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 px-1">
        <div className="w-1 h-4 bg-gradient-to-b from-[var(--sage-green)] to-[var(--warm-orange)] rounded-full"></div>
        <p className="text-xs font-medium text-[var(--deep-blue)]">快捷功能</p>
      </div>
      <div className="flex gap-2 flex-wrap">
        {actions.map((action, idx) => {
          const Icon = action.icon;
          return (
            <button
              key={idx}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-[var(--border)] hover:border-[var(--sage-green)] hover:shadow-lg transition-all duration-300 group relative overflow-hidden"
            >
              {/* Hover gradient background */}
              <div className="absolute inset-0 bg-gradient-to-r from-[var(--light-sage)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>

              <div className={`relative w-7 h-7 rounded-lg bg-gradient-to-br ${action.color} flex items-center justify-center shadow-sm group-hover:scale-110 group-hover:rotate-6 transition-transform`}>
                <Icon className="w-4 h-4 text-white" strokeWidth={2} />
              </div>
              <span className="relative text-sm text-[var(--deep-blue)] group-hover:text-[var(--sage-green)] transition-colors font-medium">
                {action.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
