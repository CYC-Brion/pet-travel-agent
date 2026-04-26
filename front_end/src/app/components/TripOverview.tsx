import { MapPin, Calendar, PawPrint, Sparkles } from 'lucide-react';

export function TripOverview() {
  return (
    <div className="bg-gradient-to-br from-white via-[var(--light-sage)] to-[var(--muted-orange)] rounded-3xl border border-[var(--border)] p-6 shadow-sm hover:shadow-md transition-all duration-300">
      <div className="flex items-start justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[var(--sage-green)] to-[var(--warm-orange)] flex items-center justify-center shadow-lg">
            <Sparkles className="w-6 h-6 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-[var(--deep-blue)] mb-1">
              杭州宠物友好三日游
            </h2>
            <p className="text-sm text-[var(--muted-foreground)]">
              智能规划 · 已优化路线
            </p>
          </div>
        </div>

        <div className="px-4 py-2 bg-white/80 backdrop-blur-sm rounded-xl border border-[var(--sage-green)]/30 shadow-sm">
          <span className="text-sm font-medium text-[var(--sage-green)]">方案已生成</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-white/50">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-[var(--sage-green)]" strokeWidth={2} />
            <span className="text-xs text-[var(--muted-foreground)]">行程天数</span>
          </div>
          <p className="text-2xl font-semibold text-[var(--deep-blue)]">3天</p>
        </div>

        <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-white/50">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="w-4 h-4 text-[var(--warm-orange)]" strokeWidth={2} />
            <span className="text-xs text-[var(--muted-foreground)]">景点数量</span>
          </div>
          <p className="text-2xl font-semibold text-[var(--deep-blue)]">8个</p>
        </div>

        <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-white/50">
          <div className="flex items-center gap-2 mb-2">
            <PawPrint className="w-4 h-4 text-purple-500" strokeWidth={2} />
            <span className="text-xs text-[var(--muted-foreground)]">宠物友好</span>
          </div>
          <p className="text-2xl font-semibold text-[var(--deep-blue)]">100%</p>
        </div>

        <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-white/50">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-4 h-4 rounded-full bg-green-500"></div>
            <span className="text-xs text-[var(--muted-foreground)]">医院覆盖</span>
          </div>
          <p className="text-2xl font-semibold text-[var(--deep-blue)]">3家</p>
        </div>
      </div>
    </div>
  );
}
