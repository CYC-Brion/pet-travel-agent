import { MapPin, Calendar, Clock, Sun, Hotel } from 'lucide-react';

interface TripInfoFormProps {
  data: any;
  onChange: (field: string, value: any) => void;
}

export function TripInfoForm({ data, onChange }: TripInfoFormProps) {
  const hotelAreas = [
    { value: '西湖景区', icon: '🌊', desc: '临近景点' },
    { value: '市中心', icon: '🏙️', desc: '交通便利' },
    { value: '郊区安静', icon: '🌳', desc: '远离喧嚣' },
  ];

  return (
    <div className="bg-white rounded-2xl border border-[var(--border)] shadow-sm hover:shadow-md overflow-hidden animate-[fadeInUp_0.5s_ease-out_0.2s_both] transition-all duration-300 relative">
      {/* Top accent bar */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-400 to-teal-500"></div>

      {/* Header */}
      <div className="p-5 border-b border-[var(--border)] bg-gradient-to-r from-green-50 to-teal-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-400 to-teal-500 flex items-center justify-center shadow-sm">
            <MapPin className="w-5 h-5 text-white" strokeWidth={2} />
          </div>
          <div>
            <h3 className="font-semibold text-[var(--deep-blue)]">行程信息</h3>
            <p className="text-xs text-[var(--muted-foreground)]">确认您的旅行计划</p>
          </div>
        </div>
      </div>

      {/* Form Fields */}
      <div className="p-6 space-y-5">
        {/* Destination */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-[var(--deep-blue)] mb-3">
            <MapPin className="w-4 h-4 text-green-500" strokeWidth={2} />
            目的地
          </label>
          <input
            type="text"
            value={data.destination}
            onChange={(e) => onChange('destination', e.target.value)}
            placeholder="输入目的地城市"
            className="w-full px-4 py-3 rounded-xl border-2 border-[var(--border)] focus:border-green-400 focus:ring-4 focus:ring-green-100 focus:outline-none transition-all bg-[var(--soft-grey)] hover:border-green-300"
          />
        </div>

        {/* Date and Duration */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-[var(--deep-blue)] mb-3">
              <Calendar className="w-4 h-4 text-blue-500" strokeWidth={2} />
              出发日期
              <span className="text-xs text-amber-500">*</span>
            </label>
            <input
              type="date"
              value={data.startDate}
              onChange={(e) => onChange('startDate', e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 border-[var(--border)] focus:border-blue-400 focus:ring-4 focus:ring-blue-100 focus:outline-none transition-all bg-[var(--soft-grey)] hover:border-blue-300"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-[var(--deep-blue)] mb-3">
              <Clock className="w-4 h-4 text-purple-500" strokeWidth={2} />
              天数
            </label>
            <div className="flex gap-2">
              {['2', '3', '4', '5+'].map((days) => (
                <button
                  key={days}
                  onClick={() => onChange('duration', days.replace('+', ''))}
                  className={`
                    flex-1 px-3 py-3 rounded-xl border-2 transition-all duration-300
                    ${data.duration === days.replace('+', '')
                      ? 'border-purple-500 bg-purple-50 text-purple-700 font-medium shadow-sm'
                      : 'border-[var(--border)] hover:border-purple-300 text-[var(--deep-blue)]'
                    }
                  `}
                >
                  {days}天
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Daily Hours */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-[var(--deep-blue)] mb-3">
            <Sun className="w-4 h-4 text-amber-500" strokeWidth={2} />
            每日游玩时长
            <span className="text-xs text-amber-500">*</span>
          </label>
          <div className="grid grid-cols-4 gap-2">
            {['3-4小时', '5-6小时', '7-8小时', '全天'].map((hours) => (
              <button
                key={hours}
                onClick={() => onChange('dailyHours', hours)}
                className={`
                  px-3 py-3 rounded-xl border-2 transition-all duration-300 text-sm
                  ${data.dailyHours === hours
                    ? 'border-amber-500 bg-amber-50 text-amber-700 font-medium shadow-sm'
                    : 'border-[var(--border)] hover:border-amber-300 text-[var(--deep-blue)]'
                  }
                `}
              >
                {hours}
              </button>
            ))}
          </div>
        </div>

        {/* Hotel Area */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-[var(--deep-blue)] mb-3">
            <Hotel className="w-4 h-4 text-indigo-500" strokeWidth={2} />
            酒店区域偏好
            <span className="text-xs text-amber-500">*</span>
          </label>
          <div className="grid grid-cols-3 gap-3">
            {hotelAreas.map((area) => (
              <button
                key={area.value}
                onClick={() => onChange('hotelArea', area.value)}
                className={`
                  p-4 rounded-xl border-2 transition-all duration-300
                  ${data.hotelArea === area.value
                    ? 'border-indigo-500 bg-indigo-50 shadow-sm'
                    : 'border-[var(--border)] hover:border-indigo-300'
                  }
                `}
              >
                <div className="text-2xl mb-2">{area.icon}</div>
                <div className={`text-sm font-medium mb-1 ${
                  data.hotelArea === area.value ? 'text-indigo-700' : 'text-[var(--deep-blue)]'
                }`}>
                  {area.value}
                </div>
                <div className="text-xs text-[var(--muted-foreground)]">{area.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Additional Notes */}
        <div>
          <label className="text-sm font-medium text-[var(--deep-blue)] mb-3 block">
            其他要求 (可选)
          </label>
          <textarea
            placeholder="例如：宠物怕水、需要无烟房间、对某些食物过敏等..."
            rows={3}
            className="w-full px-4 py-3 rounded-xl border-2 border-[var(--border)] focus:border-green-400 focus:ring-4 focus:ring-green-100 focus:outline-none transition-all bg-[var(--soft-grey)] hover:border-green-300 resize-none"
          />
        </div>
      </div>
    </div>
  );
}
