import { Sparkles, CheckCircle2, AlertCircle, Users, PawPrint, MapPin, Calendar, Wallet, Car } from 'lucide-react';

interface PlanSummaryProps {
  data: any;
  errors: string[];
}

export function PlanSummary({ data, errors }: PlanSummaryProps) {
  const summaryItems = [
    {
      icon: MapPin,
      label: '目的地',
      value: data.destination || '未填写',
      color: 'green',
      filled: !!data.destination,
    },
    {
      icon: Calendar,
      label: '出发日期',
      value: data.startDate ? new Date(data.startDate).toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' }) : '未填写',
      color: 'blue',
      filled: !!data.startDate,
    },
    {
      icon: Users,
      label: '同行人数',
      value: data.travelers ? `${data.travelers}人` : '未填写',
      color: 'purple',
      filled: !!data.travelers,
    },
    {
      icon: PawPrint,
      label: '宠物',
      value: data.petType ? `${data.petType} · ${data.petAge}岁 · ${data.petWeight}kg` : '未填写',
      color: 'pink',
      filled: !!(data.petType && data.petAge && data.petWeight),
    },
    {
      icon: Wallet,
      label: '预算',
      value: data.budget || '未填写',
      color: 'emerald',
      filled: !!data.budget,
    },
    {
      icon: Car,
      label: '交通',
      value: data.transport || '未填写',
      color: 'orange',
      filled: !!data.transport,
    },
  ];

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; text: string; icon: string }> = {
      green: { bg: 'bg-green-50', text: 'text-green-700', icon: 'text-green-500' },
      blue: { bg: 'bg-blue-50', text: 'text-blue-700', icon: 'text-blue-500' },
      purple: { bg: 'bg-purple-50', text: 'text-purple-700', icon: 'text-purple-500' },
      pink: { bg: 'bg-pink-50', text: 'text-pink-700', icon: 'text-pink-500' },
      emerald: { bg: 'bg-emerald-50', text: 'text-emerald-700', icon: 'text-emerald-500' },
      orange: { bg: 'bg-orange-50', text: 'text-orange-700', icon: 'text-orange-500' },
    };
    return colors[color] || colors.green;
  };

  return (
    <div className="sticky top-8">
      <div className="bg-white rounded-2xl border border-[var(--border)] shadow-lg overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-[var(--border)] bg-gradient-to-br from-[var(--light-sage)] to-[var(--muted-orange)]">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--sage-green)] to-[var(--warm-orange)] flex items-center justify-center shadow-md">
              <Sparkles className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="font-semibold text-[var(--deep-blue)]">实时规划摘要</h3>
              <p className="text-xs text-[var(--muted-foreground)]">自动生成中</p>
            </div>
          </div>

          {/* Status */}
          {errors.length === 0 ? (
            <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle2 className="w-4 h-4 text-green-600" strokeWidth={2.5} />
              <span className="text-sm font-medium text-green-700">信息已完整</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertCircle className="w-4 h-4 text-amber-600" strokeWidth={2} />
              <span className="text-sm font-medium text-amber-700">
                还需 {errors.length} 项信息
              </span>
            </div>
          )}
        </div>

        {/* Summary Items */}
        <div className="p-5 space-y-3 max-h-[600px] overflow-y-auto">
          {summaryItems.map((item, idx) => {
            const Icon = item.icon;
            const colors = getColorClasses(item.color);

            return (
              <div
                key={idx}
                className={`
                  p-4 rounded-xl border transition-all duration-300
                  ${item.filled
                    ? `${colors.bg} border-${item.color}-200`
                    : 'bg-gray-50 border-gray-200'
                  }
                `}
              >
                <div className="flex items-start gap-3">
                  <div className={`
                    w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0
                    ${item.filled ? colors.bg : 'bg-gray-100'}
                  `}>
                    <Icon
                      className={`w-4 h-4 ${item.filled ? colors.icon : 'text-gray-400'}`}
                      strokeWidth={2}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-[var(--muted-foreground)]">
                        {item.label}
                      </span>
                      {item.filled ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-500" strokeWidth={2.5} />
                      ) : (
                        <div className="w-3.5 h-3.5 rounded-full border-2 border-gray-300"></div>
                      )}
                    </div>
                    <p className={`
                      text-sm font-medium
                      ${item.filled ? colors.text : 'text-gray-400 italic'}
                    `}>
                      {item.value}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* AI Insights */}
        <div className="p-5 border-t border-[var(--border)] bg-gradient-to-br from-blue-50 to-purple-50">
          <h4 className="text-sm font-semibold text-[var(--deep-blue)] mb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-500" strokeWidth={2.5} />
            AI 智能建议
          </h4>

          <div className="space-y-2">
            {data.petWeight && parseFloat(data.petWeight) > 30 && (
              <div className="p-3 bg-white/60 rounded-lg border border-blue-200/50">
                <p className="text-xs text-blue-800 leading-relaxed">
                  🐕 您的宠物属于大型犬，建议选择自驾出行，并提前确认酒店对大型犬的接待政策
                </p>
              </div>
            )}

            {data.heatSensitive && (
              <div className="p-3 bg-white/60 rounded-lg border border-orange-200/50">
                <p className="text-xs text-orange-800 leading-relaxed">
                  🌡️ 宠物易中暑，行程将避开11:00-15:00高温时段，多安排室内或阴凉活动
                </p>
              </div>
            )}

            {data.stressSensitive && (
              <div className="p-3 bg-white/60 rounded-lg border border-purple-200/50">
                <p className="text-xs text-purple-800 leading-relaxed">
                  💜 宠物易应激，将为您安排更轻松的节奏，每天不超过3个景点
                </p>
              </div>
            )}

            {data.budget === '豪华型' && (
              <div className="p-3 bg-white/60 rounded-lg border border-emerald-200/50">
                <p className="text-xs text-emerald-800 leading-relaxed">
                  ✨ 根据您的预算，将为您推荐高端宠物友好酒店和私享景点体验
                </p>
              </div>
            )}

            {!data.heatSensitive && !data.stressSensitive && data.petType && (
              <div className="p-3 bg-white/60 rounded-lg border border-gray-200/50">
                <p className="text-xs text-gray-700 leading-relaxed">
                  💡 完善更多信息后，AI 会给出更精准的个性化建议
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
