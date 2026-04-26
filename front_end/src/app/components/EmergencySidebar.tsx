import {
  Heart,
  Hospital,
  Phone,
  Navigation,
  Clock,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  Zap,
} from 'lucide-react';

export function EmergencySidebar() {
  const petHospitals = [
    {
      name: '杭州宠颐生24小时动物医院',
      distance: '1.2km',
      eta: '5分钟',
      status: '营业中',
      phone: '0571-88888888',
      emergency: true,
    },
    {
      name: '西湖宠物医院',
      distance: '2.8km',
      eta: '12分钟',
      status: '营业中',
      phone: '0571-87777777',
      emergency: false,
    },
  ];

  const humanHospitals = [
    {
      name: '浙江省人民医院',
      distance: '3.5km',
      eta: '15分钟',
      status: '24小时',
      phone: '120',
    },
  ];

  const emergencyTips = [
    {
      type: 'high',
      title: '暴雨天气注意事项',
      tips: [
        '避免带宠物外出，防止失散',
        '检查宠物是否有雷雨恐惧症',
        '准备好毛巾和干粮',
      ],
    },
  ];

  return (
    <div className="h-full space-y-4 overflow-y-auto">
      {/* Pet Hospitals */}
      <div className="bg-white rounded-2xl border-2 border-red-200 shadow-lg overflow-hidden">
        <div className="p-5 border-b border-red-200 bg-gradient-to-br from-red-50 to-orange-50">
          <div className="flex items-center gap-2 mb-2">
            <Heart className="w-5 h-5 text-red-500" strokeWidth={2.5} />
            <h3 className="font-semibold text-[var(--deep-blue)]">最近宠物医院</h3>
          </div>
          <p className="text-sm text-[var(--muted-foreground)]">
            应急备用，建议提前联系
          </p>
        </div>

        <div className="p-4 space-y-3">
          {petHospitals.map((hospital, idx) => (
            <div
              key={idx}
              className={`
                p-4 rounded-xl border-2 transition-all duration-300 hover:shadow-md
                ${hospital.emergency
                  ? 'border-red-300 bg-gradient-to-br from-red-50 to-orange-50'
                  : 'border-[var(--border)] bg-white'
                }
              `}
            >
              {hospital.emergency && (
                <div className="flex items-center gap-1.5 mb-2">
                  <Zap className="w-3.5 h-3.5 text-red-500" strokeWidth={2.5} />
                  <span className="text-xs font-semibold text-red-600">24小时急诊</span>
                </div>
              )}

              <h4 className="font-semibold text-[var(--deep-blue)] mb-3 text-sm">
                {hospital.name}
              </h4>

              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[var(--muted-foreground)]" strokeWidth={2} />
                  <span className="text-xs text-[var(--deep-blue)]">{hospital.distance}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Navigation className="w-3.5 h-3.5 text-[var(--muted-foreground)]" strokeWidth={2} />
                  <span className="text-xs font-medium text-green-700">{hospital.eta}</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 mb-3">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-500" strokeWidth={2.5} />
                <span className="text-xs font-medium text-green-700">{hospital.status}</span>
              </div>

              <div className="flex gap-2">
                <button className="flex-1 px-3 py-2 rounded-lg bg-gradient-to-r from-[var(--sage-green)] to-[var(--warm-orange)] text-white text-sm font-medium hover:shadow-md transition-all flex items-center justify-center gap-1.5">
                  <Navigation className="w-3.5 h-3.5" strokeWidth={2} />
                  <span>导航</span>
                </button>
                <button className="px-3 py-2 rounded-lg border-2 border-[var(--border)] hover:border-[var(--sage-green)] text-sm font-medium transition-all flex items-center justify-center gap-1.5">
                  <Phone className="w-3.5 h-3.5" strokeWidth={2} />
                  <span>拨号</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Human Hospitals */}
      <div className="bg-white rounded-2xl border border-[var(--border)] shadow-lg overflow-hidden">
        <div className="p-5 border-b border-[var(--border)] bg-gradient-to-br from-blue-50 to-purple-50">
          <div className="flex items-center gap-2">
            <Hospital className="w-5 h-5 text-blue-500" strokeWidth={2} />
            <h3 className="font-semibold text-[var(--deep-blue)]">最近医院</h3>
          </div>
        </div>

        <div className="p-4">
          {humanHospitals.map((hospital, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl border border-[var(--border)] bg-gradient-to-br from-blue-50 to-white"
            >
              <h4 className="font-semibold text-[var(--deep-blue)] mb-3 text-sm">
                {hospital.name}
              </h4>

              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[var(--muted-foreground)]" strokeWidth={2} />
                  <span className="text-xs text-[var(--deep-blue)]">{hospital.distance}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[var(--muted-foreground)]" strokeWidth={2} />
                  <span className="text-xs font-medium text-blue-700">{hospital.status}</span>
                </div>
              </div>

              <button className="w-full px-3 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition-all flex items-center justify-center gap-1.5">
                <Phone className="w-3.5 h-3.5" strokeWidth={2} />
                <span>拨打 {hospital.phone}</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Emergency Tips */}
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border-2 border-amber-300 shadow-lg overflow-hidden">
        <div className="p-5 border-b border-amber-300 bg-gradient-to-r from-amber-100 to-orange-100">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-600" strokeWidth={2.5} />
            <h3 className="font-semibold text-amber-900">紧急建议</h3>
          </div>
        </div>

        <div className="p-4">
          {emergencyTips.map((tip, idx) => (
            <div key={idx}>
              <h4 className="font-semibold text-amber-900 mb-3 text-sm">
                {tip.title}
              </h4>
              <ul className="space-y-2">
                {tip.tips.map((item, itemIdx) => (
                  <li
                    key={itemIdx}
                    className="flex items-start gap-2 text-sm text-amber-800 leading-relaxed"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0 mt-1.5"></div>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl border border-[var(--border)] shadow-lg p-4">
        <h3 className="font-semibold text-[var(--deep-blue)] mb-3">快速操作</h3>
        <div className="space-y-2">
          <button className="relative w-full px-4 py-3 rounded-xl bg-gradient-to-r from-red-500 to-orange-500 text-white font-medium hover:shadow-lg hover:scale-105 active:scale-100 transition-all flex items-center justify-center gap-2 overflow-hidden group">
            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity"></div>
            <Phone className="w-4 h-4 relative z-10" strokeWidth={2} />
            <span className="relative z-10">紧急求助</span>
          </button>
          <button className="w-full px-4 py-3 rounded-xl border-2 border-[var(--border)] hover:border-[var(--sage-green)] hover:bg-[var(--light-sage)] font-medium transition-all flex items-center justify-center gap-2">
            <Navigation className="w-4 h-4" strokeWidth={2} />
            <span>返回酒店</span>
          </button>
        </div>
      </div>
    </div>
  );
}
