import {
  Wallet,
  Clock,
  Sun,
  AlertTriangle,
  CheckCircle2,
  Hotel,
  MapPin,
  Sparkles,
  CloudRain,
  FileCheck,
  Star,
  DollarSign,
} from 'lucide-react';

interface PlanOverviewSidebarProps {
  plan: string;
}

export function PlanOverviewSidebar({ plan }: PlanOverviewSidebarProps) {
  const overviewData: Record<string, any> = {
    luxury: {
      totalBudget: '¥6,800',
      budgetBreakdown: [
        { label: '住宿', amount: '¥3,600', percentage: 53 },
        { label: '交通', amount: '¥800', percentage: 12 },
        { label: '餐饮', amount: '¥1,800', percentage: 26 },
        { label: '门票', amount: '¥600', percentage: 9 },
      ],
      totalTravelTime: '4.5小时',
      dailyActivity: '5-6小时/天',
      hotels: [
        { name: '杭州西溪悦榕庄', area: '西溪湿地', rating: 5.0, price: '¥1,800/晚' },
      ],
    },
    comfort: {
      totalBudget: '¥3,200',
      budgetBreakdown: [
        { label: '住宿', amount: '¥1,360', percentage: 43 },
        { label: '交通', amount: '¥480', percentage: 15 },
        { label: '餐饮', amount: '¥900', percentage: 28 },
        { label: '门票', amount: '¥460', percentage: 14 },
      ],
      totalTravelTime: '5.5小时',
      dailyActivity: '6-7小时/天',
      hotels: [
        { name: '西湖宠物友好酒店', area: '西湖景区', rating: 4.8, price: '¥680/晚' },
        { name: '云栖度假酒店', area: '云栖小镇', rating: 4.6, price: '¥580/晚' },
      ],
    },
    budget: {
      totalBudget: '¥1,800',
      budgetBreakdown: [
        { label: '住宿', amount: '¥580', percentage: 32 },
        { label: '交通', amount: '¥480', percentage: 27 },
        { label: '餐饮', amount: '¥500', percentage: 28 },
        { label: '门票', amount: '¥240', percentage: 13 },
      ],
      totalTravelTime: '5小时',
      dailyActivity: '5-6小时/天',
      hotels: [
        { name: '如家精选（西湖店）', area: '西湖景区', rating: 4.2, price: '¥290/晚' },
      ],
    },
  };

  const data = overviewData[plan] || overviewData.comfort;

  return (
    <div className="sticky top-8 space-y-6 animate-[fadeInUp_0.5s_ease-out_0.3s_both]">
      {/* Budget Card */}
      <div className="bg-white rounded-2xl border border-[var(--border)] shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300">
        <div className="p-5 bg-gradient-to-br from-green-50 to-emerald-50 border-b border-[var(--border)]">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-sm">
              <Wallet className="w-5 h-5 text-white" strokeWidth={2} />
            </div>
            <div>
              <h3 className="font-semibold text-[var(--deep-blue)]">总预算</h3>
              <p className="text-2xl font-bold text-green-700">{data.totalBudget}</p>
            </div>
          </div>
        </div>

        <div className="p-5">
          <h4 className="text-sm font-semibold text-[var(--deep-blue)] mb-3">预算明细</h4>
          <div className="space-y-3">
            {data.budgetBreakdown.map((item, idx) => (
              <div key={idx}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm text-[var(--muted-foreground)]">{item.label}</span>
                  <span className="text-sm font-semibold text-[var(--deep-blue)]">
                    {item.amount}
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full transition-all duration-700"
                    style={{ width: `${item.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Statistics Card */}
      <div className="bg-white rounded-2xl border border-[var(--border)] shadow-lg hover:shadow-xl transition-all duration-300 p-5 space-y-4">
        <h3 className="font-semibold text-[var(--deep-blue)] flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[var(--sage-green)]" strokeWidth={2.5} />
          行程统计
        </h3>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-500" strokeWidth={2} />
              <span className="text-sm text-[var(--deep-blue)]">总通勤时间</span>
            </div>
            <span className="text-sm font-semibold text-blue-700">{data.totalTravelTime}</span>
          </div>

          <div className="flex items-center justify-between p-3 bg-purple-50 rounded-xl">
            <div className="flex items-center gap-2">
              <Sun className="w-4 h-4 text-purple-500" strokeWidth={2} />
              <span className="text-sm text-[var(--deep-blue)]">每日游玩</span>
            </div>
            <span className="text-sm font-semibold text-purple-700">{data.dailyActivity}</span>
          </div>
        </div>
      </div>

      {/* Risks & Compliance */}
      <div className="bg-white rounded-2xl border border-[var(--border)] shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
        <div className="p-5 border-b border-[var(--border)]">
          <h3 className="font-semibold text-[var(--deep-blue)] flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-[var(--sage-green)]" strokeWidth={2.5} />
            风险与提醒
          </h3>
        </div>

        <div className="p-5 space-y-3">
          {/* Weather Risk */}
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
            <div className="flex items-start gap-2 mb-2">
              <CloudRain className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" strokeWidth={2} />
              <div className="flex-1">
                <p className="text-xs font-semibold text-amber-900 mb-1">天气提醒</p>
                <p className="text-xs text-amber-800 leading-relaxed">
                  Day 2 下午可能有阵雨，建议携带雨具
                </p>
              </div>
            </div>
          </div>

          {/* Pet Compliance */}
          <div className="p-3 bg-green-50 border border-green-200 rounded-xl">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" strokeWidth={2.5} />
              <div className="flex-1">
                <p className="text-xs font-semibold text-green-900 mb-1">证件齐全</p>
                <p className="text-xs text-green-800 leading-relaxed">
                  疫苗证明、健康证已备案
                </p>
              </div>
            </div>
          </div>

          {/* Attention */}
          <div className="p-3 bg-orange-50 border border-orange-200 rounded-xl">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-600 flex-shrink-0 mt-0.5" strokeWidth={2} />
              <div className="flex-1">
                <p className="text-xs font-semibold text-orange-900 mb-1">特别注意</p>
                <p className="text-xs text-orange-800 leading-relaxed">
                  部分景点需提前预约宠物入园
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recommended Hotels */}
      <div className="bg-white rounded-2xl border border-[var(--border)] shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
        <div className="p-5 border-b border-[var(--border)] bg-gradient-to-r from-purple-50 to-pink-50">
          <h3 className="font-semibold text-[var(--deep-blue)] flex items-center gap-2">
            <Hotel className="w-4 h-4 text-purple-500" strokeWidth={2} />
            推荐住宿
          </h3>
        </div>

        <div className="p-5 space-y-4">
          {data.hotels.map((hotel, idx) => (
            <div
              key={idx}
              className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-xl hover:shadow-md transition-all duration-300 group cursor-pointer"
            >
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-semibold text-[var(--deep-blue)] text-sm group-hover:text-purple-700 transition-colors">
                  {hotel.name}
                </h4>
                <div className="flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" strokeWidth={2} />
                  <span className="text-xs font-semibold text-amber-700">{hotel.rating}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)] mb-2">
                <MapPin className="w-3.5 h-3.5" strokeWidth={2} />
                <span>{hotel.area}</span>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-purple-200/50">
                <div className="flex items-center gap-1">
                  <DollarSign className="w-3.5 h-3.5 text-purple-500" strokeWidth={2} />
                  <span className="text-sm font-bold text-purple-700">{hotel.price}</span>
                </div>
                <button className="px-3 py-1 bg-white rounded-lg text-xs font-medium text-purple-600 hover:bg-purple-100 transition-colors">
                  查看详情
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Insights */}
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl border border-blue-200 shadow-lg p-5">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center flex-shrink-0 shadow-sm">
            <Sparkles className="w-4 h-4 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-blue-900 mb-2">AI 优化建议</h4>
            <ul className="space-y-2 text-xs text-blue-800 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="text-blue-500 flex-shrink-0">•</span>
                <span>已避开宠物高温时段，安排阴凉活动</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 flex-shrink-0">•</span>
                <span>每日活动间隔充足，留出休息时间</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 flex-shrink-0">•</span>
                <span>沿途已定位3家24小时宠物医院</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
