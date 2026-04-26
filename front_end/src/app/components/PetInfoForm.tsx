import { PawPrint, Heart, Thermometer, Wind } from 'lucide-react';

interface PetInfoFormProps {
  data: any;
  onChange: (field: string, value: any) => void;
}

export function PetInfoForm({ data, onChange }: PetInfoFormProps) {
  const petTypes = [
    { value: '小型犬', icon: '🐕', size: '<10kg' },
    { value: '中型犬', icon: '🐶', size: '10-25kg' },
    { value: '大型犬', icon: '🐕‍🦺', size: '>25kg' },
    { value: '猫', icon: '🐱', size: '各体型' },
  ];

  const healthOptions = [
    { value: '优秀', color: 'green', emoji: '💚' },
    { value: '良好', color: 'blue', emoji: '💙' },
    { value: '一般', color: 'amber', emoji: '💛' },
    { value: '需关注', color: 'red', emoji: '❤️' },
  ];

  return (
    <div className="bg-white rounded-2xl border border-[var(--border)] shadow-sm hover:shadow-md overflow-hidden animate-[fadeInUp_0.5s_ease-out_0.1s_both] transition-all duration-300 relative">
      {/* Top accent bar */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pink-400 to-orange-500"></div>

      {/* Header */}
      <div className="p-5 border-b border-[var(--border)] bg-gradient-to-r from-pink-50 to-orange-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-400 to-orange-500 flex items-center justify-center shadow-sm">
            <PawPrint className="w-5 h-5 text-white" strokeWidth={2} />
          </div>
          <div>
            <h3 className="font-semibold text-[var(--deep-blue)]">宠物信息</h3>
            <p className="text-xs text-[var(--muted-foreground)]">帮助我们安排最适合的行程</p>
          </div>
        </div>
      </div>

      {/* Form Fields */}
      <div className="p-6 space-y-5">
        {/* Pet Type */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-[var(--deep-blue)] mb-3">
            <PawPrint className="w-4 h-4 text-pink-500" strokeWidth={2} />
            宠物类型
          </label>
          <div className="grid grid-cols-4 gap-2">
            {petTypes.map((pet) => (
              <button
                key={pet.value}
                onClick={() => onChange('petType', pet.value)}
                className={`
                  p-3 rounded-xl border-2 transition-all duration-300
                  ${data.petType === pet.value
                    ? 'border-pink-500 bg-pink-50 shadow-sm'
                    : 'border-[var(--border)] hover:border-pink-300'
                  }
                `}
              >
                <div className="text-2xl mb-1">{pet.icon}</div>
                <div className={`text-xs font-medium mb-0.5 ${
                  data.petType === pet.value ? 'text-pink-700' : 'text-[var(--deep-blue)]'
                }`}>
                  {pet.value}
                </div>
                <div className="text-xs text-[var(--muted-foreground)]">{pet.size}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Age and Weight */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-[var(--deep-blue)] mb-3">
              年龄 (岁)
            </label>
            <input
              type="number"
              value={data.petAge}
              onChange={(e) => onChange('petAge', e.target.value)}
              placeholder="例如: 3"
              className="w-full px-4 py-3 rounded-xl border-2 border-[var(--border)] focus:border-pink-400 focus:ring-4 focus:ring-pink-100 focus:outline-none transition-all bg-[var(--soft-grey)] hover:border-pink-300"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-[var(--deep-blue)] mb-3">
              体重 (公斤)
            </label>
            <input
              type="number"
              value={data.petWeight}
              onChange={(e) => onChange('petWeight', e.target.value)}
              placeholder="例如: 35"
              className="w-full px-4 py-3 rounded-xl border-2 border-[var(--border)] focus:border-pink-400 focus:ring-4 focus:ring-pink-100 focus:outline-none transition-all bg-[var(--soft-grey)] hover:border-pink-300"
            />
          </div>
        </div>

        {/* Health Status */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-[var(--deep-blue)] mb-3">
            <Heart className="w-4 h-4 text-red-500" strokeWidth={2} />
            健康状态
            <span className="text-xs text-amber-500">*</span>
          </label>
          <div className="grid grid-cols-4 gap-2">
            {healthOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => onChange('healthStatus', option.value)}
                className={`
                  px-3 py-3 rounded-xl border-2 transition-all duration-300
                  ${data.healthStatus === option.value
                    ? `border-${option.color}-500 bg-${option.color}-50 shadow-sm`
                    : 'border-[var(--border)] hover:border-gray-300'
                  }
                `}
                style={
                  data.healthStatus === option.value
                    ? {
                        borderColor: option.color === 'green' ? '#22c55e' : option.color === 'blue' ? '#3b82f6' : option.color === 'amber' ? '#f59e0b' : '#ef4444',
                        backgroundColor: option.color === 'green' ? '#f0fdf4' : option.color === 'blue' ? '#eff6ff' : option.color === 'amber' ? '#fffbeb' : '#fef2f2',
                      }
                    : {}
                }
              >
                <div className="text-xl mb-1">{option.emoji}</div>
                <div className="text-xs font-medium text-[var(--deep-blue)]">
                  {option.value}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Special Considerations */}
        <div>
          <label className="text-sm font-medium text-[var(--deep-blue)] mb-3 block">
            特殊关注
          </label>
          <div className="space-y-2">
            <label className="flex items-center gap-3 p-4 rounded-xl border border-[var(--border)] hover:bg-[var(--soft-grey)] cursor-pointer transition-all group">
              <input
                type="checkbox"
                checked={data.heatSensitive}
                onChange={(e) => onChange('heatSensitive', e.target.checked)}
                className="w-5 h-5 rounded-lg border-2 border-gray-300 text-[var(--sage-green)] focus:ring-[var(--sage-green)] cursor-pointer"
              />
              <Thermometer className="w-5 h-5 text-orange-500" strokeWidth={2} />
              <div className="flex-1">
                <span className="text-sm font-medium text-[var(--deep-blue)]">易中暑</span>
                <p className="text-xs text-[var(--muted-foreground)]">需要避开高温时段</p>
              </div>
            </label>

            <label className="flex items-center gap-3 p-4 rounded-xl border border-[var(--border)] hover:bg-[var(--soft-grey)] cursor-pointer transition-all group">
              <input
                type="checkbox"
                checked={data.stressSensitive}
                onChange={(e) => onChange('stressSensitive', e.target.checked)}
                className="w-5 h-5 rounded-lg border-2 border-gray-300 text-[var(--sage-green)] focus:ring-[var(--sage-green)] cursor-pointer"
              />
              <Wind className="w-5 h-5 text-purple-500" strokeWidth={2} />
              <div className="flex-1">
                <span className="text-sm font-medium text-[var(--deep-blue)]">易应激</span>
                <p className="text-xs text-[var(--muted-foreground)]">需要更多休息时间</p>
              </div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
