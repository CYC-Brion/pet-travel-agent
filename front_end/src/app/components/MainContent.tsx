import { TripOverview } from './TripOverview';
import { Timeline } from './Timeline';
import { MapView } from './MapView';
import { HospitalCard } from './HospitalCard';
import { Hotel, MapPinned } from 'lucide-react';

interface MainContentProps {
  currentView: 'home' | 'info' | 'chat' | 'planning' | 'journey';
}

export function MainContent({ currentView }: MainContentProps) {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        {/* Trip Overview */}
        <TripOverview />

        {/* Timeline */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[var(--deep-blue)] flex items-center gap-2">
              <div className="w-1.5 h-6 bg-gradient-to-b from-[var(--sage-green)] to-[var(--warm-orange)] rounded-full"></div>
              行程时间轴
            </h2>
            <button className="px-4 py-1.5 text-sm text-[var(--sage-green)] hover:bg-[var(--light-sage)] rounded-lg transition-colors">
              调整行程
            </button>
          </div>
          <Timeline />
        </div>

        {/* Map View */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-[var(--deep-blue)] flex items-center gap-2">
            <div className="w-1.5 h-6 bg-gradient-to-b from-[var(--warm-orange)] to-[var(--sage-green)] rounded-full"></div>
            路线地图
          </h2>
          <MapView />
        </div>

        {/* Recommended Locations */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-[var(--deep-blue)] flex items-center gap-2">
            <div className="w-1.5 h-6 bg-gradient-to-b from-[var(--sage-green)] to-purple-400 rounded-full"></div>
            推荐地点
          </h2>

          <div className="grid grid-cols-2 gap-4">
            {/* Hotels */}
            <div className="bg-white rounded-2xl border border-[var(--border)] p-5 hover:shadow-lg transition-all duration-300 group">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-sm">
                  <Hotel className="w-5 h-5 text-white" strokeWidth={2} />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-[var(--deep-blue)] mb-1">西湖宠物友好酒店</h3>
                  <p className="text-xs text-[var(--muted-foreground)]">距离西湖 800m · 允许大型犬</p>
                </div>
                <div className="px-2 py-1 bg-[var(--light-sage)] rounded-lg">
                  <span className="text-xs font-medium text-[var(--sage-green)]">推荐</span>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-[var(--deep-blue)]">¥680/晚</span>
                <span className="text-[var(--muted-foreground)]">· 评分 4.8</span>
              </div>
            </div>

            {/* Hospital */}
            <HospitalCard
              name="杭州宠颐生24小时动物医院"
              distance="2.3km"
              rating={4.9}
              type="24小时"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
