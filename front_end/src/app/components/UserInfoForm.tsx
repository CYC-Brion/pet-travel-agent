import { Users, Wallet, Clock, Car } from 'lucide-react';

interface UserInfoFormProps {
  data: any;
  onChange: (field: string, value: any) => void;
}

export function UserInfoForm({ data, onChange }: UserInfoFormProps) {
  const paceOptions = [
    { value: 'relaxed', label: '轻松', emoji: '🌿', desc: '每天2-3个景点' },
    { value: 'moderate', label: '适中', emoji: '⚡', desc: '每天3-4个景点' },
    { value: 'intensive', label: '充实', emoji: '🚀', desc: '每天4+个景点' },
  ];

  const transportOptions = [
    { value: '自驾', icon: '🚗' },
    { value: '高铁', icon: '🚄' },
    { value: '飞机', icon: '✈️' },
    { value: '混合', icon: '🔄' },
  ];

  return (
    <div className="bg-white rounded-2xl border border-[var(--border)] shadow-sm hover:shadow-md overflow-hidden animate-[fadeInUp_0.5s_ease-out] transition-all duration-300 relative">
      {/* Top accent bar */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-purple-500"></div>

      {/* Header */}
      <div className="p-5 border-b border-[var(--border)] bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center shadow-sm">
            <Users className="w-5 h-5 text-white" strokeWidth={2} />
          </div>
          <div>
            <h3 className="font-semibold text-[var(--deep-blue)]">用户信息</h3>
            <p className="text-xs text-[var(--muted-foreground)]">告诉我们您的旅行偏好</p>
          </div>
        </div>
      </div>

      {/* Form Fields */}
      <div className="p-6 space-y-5">
        {/* Travelers */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-[var(--deep-blue)] mb-3">
            <Users className="w-4 h-4 text-blue-500" strokeWidth={2} />
            同行人数
          </label>
          <div className="flex gap-2">
            {['1', '2', '3', '4+'].map((num) => (
              <button
                key={num}
                onClick={() => onChange('travelers', num)}
                className={`
                  flex-1 px-4 py-3 rounded-xl border-2 transition-all duration-300 hover:scale-105 active:scale-95
                  ${data.travelers === num
                    ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium shadow-sm scale-105'
                    : 'border-[var(--border)] hover:border-blue-300 text-[var(--deep-blue)]'
                  }
                `}
              >
                {num}人
              </button>
            ))}
          </div>
        </div>

        {/* Budget */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-[var(--deep-blue)] mb-3">
            <Wallet className="w-4 h-4 text-green-500" strokeWidth={2} />
            预算范围
            <span className="text-xs text-amber-500">*</span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            {['经济型', '舒适型', '豪华型'].map((budget) => (
              <button
                key={budget}
                onClick={() => onChange('budget', budget)}
                className={`
                  px-4 py-3 rounded-xl border-2 transition-all duration-300 text-sm hover:scale-105 active:scale-95
                  ${data.budget === budget
                    ? 'border-green-500 bg-green-50 text-green-700 font-medium shadow-sm scale-105'
                    : 'border-[var(--border)] hover:border-green-300 text-[var(--deep-blue)]'
                  }
                `}
              >
                {budget}
              </button>
            ))}
          </div>
        </div>

        {/* Pace */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-[var(--deep-blue)] mb-3">
            <Clock className="w-4 h-4 text-purple-500" strokeWidth={2} />
            旅行节奏
            <span className="text-xs text-amber-500">*</span>
          </label>
          <div className="grid grid-cols-3 gap-3">
            {paceOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => onChange('pace', option.value)}
                className={`
                  p-4 rounded-xl border-2 transition-all duration-300 text-center
                  ${data.pace === option.value
                    ? 'border-purple-500 bg-purple-50 shadow-sm'
                    : 'border-[var(--border)] hover:border-purple-300'
                  }
                `}
              >
                <div className="text-2xl mb-1">{option.emoji}</div>
                <div className={`text-sm font-medium mb-1 ${
                  data.pace === option.value ? 'text-purple-700' : 'text-[var(--deep-blue)]'
                }`}>
                  {option.label}
                </div>
                <div className="text-xs text-[var(--muted-foreground)]">{option.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Transport */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-[var(--deep-blue)] mb-3">
            <Car className="w-4 h-4 text-orange-500" strokeWidth={2} />
            交通方式
          </label>
          <div className="grid grid-cols-4 gap-2">
            {transportOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => onChange('transport', option.value)}
                className={`
                  px-3 py-3 rounded-xl border-2 transition-all duration-300
                  ${data.transport === option.value
                    ? 'border-orange-500 bg-orange-50 shadow-sm'
                    : 'border-[var(--border)] hover:border-orange-300'
                  }
                `}
              >
                <div className="text-xl mb-1">{option.icon}</div>
                <div className={`text-xs font-medium ${
                  data.transport === option.value ? 'text-orange-700' : 'text-[var(--deep-blue)]'
                }`}>
                  {option.value}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
