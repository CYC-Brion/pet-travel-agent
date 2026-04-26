import { Cloud, Thermometer, Wind, PawPrint, AlertCircle, Check } from 'lucide-react';

export function SidebarPanel() {
  const tripInfo = [
    { label: '出发地', value: '上海' },
    { label: '目的地', value: '杭州' },
    { label: '出行天数', value: '3天2晚' },
    { label: '宠物类型', value: '金毛犬 (大型犬)' },
  ];

  const checklistItems = [
    { label: '宠物疫苗证明', checked: true },
    { label: '宠物健康证明', checked: true },
    { label: '宠物用品准备', checked: false },
    { label: '酒店宠物政策确认', checked: false },
  ];

  return (
    <div className="w-80 border-l border-[var(--border)] bg-white overflow-y-auto">
      {/* Weather Card */}
      <div className="p-5 border-b border-[var(--border)]">
        <h3 className="text-sm font-semibold text-[var(--deep-blue)] mb-3">目的地天气</h3>
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-4 border border-blue-100">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-xs text-blue-600 mb-1">杭州 · 今日</p>
              <p className="text-3xl font-semibold text-blue-900">24°</p>
            </div>
            <Cloud className="w-12 h-12 text-blue-400" strokeWidth={1.5} />
          </div>
          <div className="flex items-center gap-4 text-xs text-blue-700">
            <div className="flex items-center gap-1">
              <Thermometer className="w-3.5 h-3.5" />
              <span>18-26°C</span>
            </div>
            <div className="flex items-center gap-1">
              <Wind className="w-3.5 h-3.5" />
              <span>微风</span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-blue-200">
            <div className="flex items-center gap-2 text-xs text-blue-600">
              <PawPrint className="w-3.5 h-3.5" />
              <span>适合户外活动，建议早晚出行</span>
            </div>
          </div>
        </div>
      </div>

      {/* Trip Summary */}
      <div className="p-5 border-b border-[var(--border)]">
        <h3 className="text-sm font-semibold text-[var(--deep-blue)] mb-3">行程信息</h3>
        <div className="space-y-3">
          {tripInfo.map((item, idx) => (
            <div key={idx} className="flex justify-between items-center">
              <span className="text-sm text-[var(--muted-foreground)]">{item.label}</span>
              <span className="text-sm font-medium text-[var(--deep-blue)]">{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Checklist */}
      <div className="p-5 border-b border-[var(--border)]">
        <h3 className="text-sm font-semibold text-[var(--deep-blue)] mb-3">出行清单</h3>
        <div className="space-y-2.5">
          {checklistItems.map((item, idx) => (
            <label
              key={idx}
              className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-[var(--soft-grey)] cursor-pointer transition-colors group"
            >
              <div
                className={`
                  w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all
                  ${item.checked
                    ? 'bg-[var(--sage-green)] border-[var(--sage-green)]'
                    : 'border-gray-300 group-hover:border-[var(--sage-green)]'
                  }
                `}
              >
                {item.checked && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
              </div>
              <span
                className={`text-sm ${
                  item.checked ? 'text-[var(--muted-foreground)] line-through' : 'text-[var(--deep-blue)]'
                }`}
              >
                {item.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Alerts */}
      <div className="p-5">
        <h3 className="text-sm font-semibold text-[var(--deep-blue)] mb-3">重要提醒</h3>
        <div className="space-y-2">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
            <div className="flex gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" strokeWidth={2} />
              <div>
                <p className="text-xs font-medium text-amber-900 mb-1">宠物入住政策</p>
                <p className="text-xs text-amber-700 leading-relaxed">
                  部分景点需要提前预约宠物入园许可
                </p>
              </div>
            </div>
          </div>

          <div className="p-3 bg-green-50 border border-green-200 rounded-xl">
            <div className="flex gap-2">
              <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" strokeWidth={2.5} />
              <div>
                <p className="text-xs font-medium text-green-900 mb-1">医院定位已保存</p>
                <p className="text-xs text-green-700 leading-relaxed">
                  已为您标记沿途3家24小时宠物医院
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
