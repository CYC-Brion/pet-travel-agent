import { MapPin, Calendar, PawPrint, Wallet, Car, AlertCircle, Check, Clock } from 'lucide-react';

interface InfoSummaryProps {
  showDemo?: boolean;
}

export function InfoSummary({ showDemo = false }: InfoSummaryProps) {
  const fields = showDemo
    ? [
        { icon: MapPin, label: '目的地', value: '杭州', status: 'filled' },
        { icon: Calendar, label: '出行日期', value: '下周五', status: 'filled' },
        { icon: Clock, label: '天数', value: '3天', status: 'filled' },
        { icon: PawPrint, label: '宠物类型', value: '金毛犬', status: 'filled' },
        { icon: PawPrint, label: '宠物年龄', value: '3岁', status: 'filled' },
        { icon: PawPrint, label: '体重', value: '35公斤', status: 'filled' },
        { icon: Wallet, label: '预算', value: '未填写', status: 'missing' },
        { icon: Car, label: '交通方式', value: '自驾', status: 'filled' },
      ]
    : [
        { icon: MapPin, label: '目的地', value: '未填写', status: 'missing' },
        { icon: Calendar, label: '出行日期', value: '未填写', status: 'missing' },
        { icon: Clock, label: '天数', value: '未填写', status: 'missing' },
        { icon: PawPrint, label: '宠物类型', value: '未填写', status: 'missing' },
        { icon: PawPrint, label: '宠物年龄', value: '未填写', status: 'missing' },
        { icon: PawPrint, label: '体重', value: '未填写', status: 'missing' },
        { icon: Wallet, label: '预算', value: '未填写', status: 'missing' },
        { icon: Car, label: '交通方式', value: '未填写', status: 'missing' },
      ];

  const filledCount = fields.filter(f => f.status === 'filled').length;
  const totalCount = fields.length;
  const progress = (filledCount / totalCount) * 100;

  return (
    <div className="h-full flex flex-col">
      <div className="bg-white rounded-3xl shadow-lg border border-[var(--border)] overflow-hidden flex-1 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-[var(--border)] bg-gradient-to-br from-[var(--light-sage)] to-white">
          <h3 className="text-lg font-semibold text-[var(--deep-blue)] mb-2">
            当前信息摘要
          </h3>
          <p className="text-sm text-[var(--muted-foreground)]">
            AI 会根据对话自动补全
          </p>
        </div>

        {/* Progress */}
        <div className="px-6 pt-5 pb-4 bg-gradient-to-b from-[var(--soft-grey)]/30 to-transparent">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-[var(--deep-blue)]">
              信息完整度
            </span>
            <span className="text-xs font-semibold text-[var(--sage-green)]">
              {filledCount}/{totalCount}
            </span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[var(--sage-green)] to-[var(--warm-orange)] transition-all duration-700 ease-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* Fields */}
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          <div className="space-y-3">
            {fields.map((field, idx) => {
              const Icon = field.icon;
              const isMissing = field.status === 'missing';

              return (
                <div
                  key={idx}
                  className={`
                    p-4 rounded-xl border transition-all duration-500
                    ${isMissing
                      ? 'bg-amber-50/50 border-amber-200/60'
                      : 'bg-green-50/50 border-green-200/60 animate-[pulse-soft_0.6s_ease-out]'
                    }
                  `}
                  style={
                    !isMissing && showDemo
                      ? { animationDelay: `${idx * 0.3 + 2}s`, animationFillMode: 'backwards' }
                      : {}
                  }
                >
                  <div className="flex items-start gap-3">
                    <div className={`
                      w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0
                      ${isMissing
                        ? 'bg-amber-100'
                        : 'bg-green-100'
                      }
                    `}>
                      <Icon
                        className={`w-4 h-4 ${isMissing ? 'text-amber-600' : 'text-green-600'}`}
                        strokeWidth={2}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-[var(--deep-blue)]">
                          {field.label}
                        </span>
                        {isMissing ? (
                          <AlertCircle className="w-3.5 h-3.5 text-amber-500" strokeWidth={2} />
                        ) : (
                          <Check className="w-3.5 h-3.5 text-green-500" strokeWidth={2.5} />
                        )}
                      </div>
                      <p className={`
                        text-sm
                        ${isMissing
                          ? 'text-amber-600 italic'
                          : 'text-green-700 font-medium'
                        }
                      `}>
                        {field.value}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Tip */}
        <div className="p-4 border-t border-[var(--border)] bg-gradient-to-br from-blue-50 to-purple-50">
          <div className="flex items-start gap-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
            </div>
            <div className="flex-1">
              <p className="text-xs font-medium text-blue-900 mb-1">
                智能补全提示
              </p>
              <p className="text-xs text-blue-700 leading-relaxed">
                开始对话后，AI 会主动追问缺失信息，您也可以随时补充细节
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
