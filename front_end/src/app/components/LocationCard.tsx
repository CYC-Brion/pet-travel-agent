import {
  X,
  MapPin,
  Clock,
  DollarSign,
  Star,
  PawPrint,
  Navigation,
  Phone,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

interface LocationCardProps {
  location: any;
  onClose: () => void;
}

export function LocationCard({ location, onClose }: LocationCardProps) {
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'hotel':
        return { gradient: 'from-purple-400 to-purple-600', bg: 'from-purple-50 to-pink-50' };
      case 'spot':
        return { gradient: 'from-green-400 to-green-600', bg: 'from-green-50 to-emerald-50' };
      case 'pet-hospital':
        return { gradient: 'from-red-400 to-red-600', bg: 'from-red-50 to-orange-50' };
      case 'restaurant':
        return { gradient: 'from-orange-400 to-orange-600', bg: 'from-orange-50 to-amber-50' };
      default:
        return { gradient: 'from-gray-400 to-gray-600', bg: 'from-gray-50 to-gray-100' };
    }
  };

  const colors = getTypeColor(location.type);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-8 bg-black/20 backdrop-blur-sm animate-[fadeInUp_0.3s_ease-out]"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-[var(--border)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`relative p-6 bg-gradient-to-br ${colors.bg} border-b border-[var(--border)]`}>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-white/80 backdrop-blur-sm hover:bg-white flex items-center justify-center transition-all shadow-sm"
          >
            <X className="w-4 h-4 text-[var(--deep-blue)]" strokeWidth={2} />
          </button>

          <div className="flex items-start gap-4 mb-4">
            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${colors.gradient} flex items-center justify-center shadow-lg`}>
              <MapPin className="w-7 h-7 text-white" strokeWidth={2} />
            </div>

            <div className="flex-1">
              <h2 className="text-xl font-semibold text-[var(--deep-blue)] mb-2">
                {location.name}
              </h2>

              {/* Rating */}
              {location.rating && (
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex items-center gap-1 px-3 py-1 bg-white rounded-lg shadow-sm">
                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" strokeWidth={2} />
                    <span className="text-sm font-semibold text-amber-700">{location.rating}</span>
                    <span className="text-xs text-[var(--muted-foreground)]">/5.0</span>
                  </div>

                  {location.petFriendly && (
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-green-100 rounded-lg">
                      <PawPrint className="w-4 h-4 text-green-600" strokeWidth={2.5} />
                      <span className="text-sm font-medium text-green-700">宠物友好</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Address */}
          <div className="flex items-start gap-2 text-sm text-[var(--deep-blue)]">
            <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" strokeWidth={2} />
            <p>{location.address}</p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Info Grid */}
          <div className="grid grid-cols-2 gap-3">
            {location.hours && (
              <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="w-4 h-4 text-blue-500" strokeWidth={2} />
                  <span className="text-xs font-medium text-blue-900">营业时间</span>
                </div>
                <p className="text-sm font-semibold text-blue-700">{location.hours}</p>
              </div>
            )}

            {location.price && (
              <div className="p-3 bg-green-50 rounded-xl border border-green-100">
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign className="w-4 h-4 text-green-500" strokeWidth={2} />
                  <span className="text-xs font-medium text-green-900">参考价格</span>
                </div>
                <p className="text-sm font-semibold text-green-700">{location.price}</p>
              </div>
            )}
          </div>

          {/* Features */}
          {location.features && location.features.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-[var(--deep-blue)] mb-2 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[var(--sage-green)]" strokeWidth={2.5} />
                特色服务
              </h4>
              <div className="flex flex-wrap gap-2">
                {location.features.map((feature: string, idx: number) => (
                  <div
                    key={idx}
                    className="px-3 py-1.5 bg-[var(--light-sage)] rounded-lg border border-[var(--sage-green)]/20"
                  >
                    <span className="text-sm text-[var(--deep-blue)]">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Review */}
          {location.reviews && (
            <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-100">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-purple-500 flex-shrink-0 mt-0.5" strokeWidth={2} />
                <div>
                  <h4 className="text-sm font-semibold text-purple-900 mb-1">用户评价</h4>
                  <p className="text-sm text-purple-800 leading-relaxed">
                    {location.reviews}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-[var(--sage-green)] to-[var(--warm-orange)] text-white font-medium shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2 group">
              <Navigation className="w-4 h-4 group-hover:rotate-45 transition-transform" strokeWidth={2} />
              <span>导航前往</span>
            </button>

            <button className="px-4 py-3 rounded-xl border-2 border-[var(--border)] hover:border-[var(--sage-green)] bg-white font-medium transition-all duration-300 flex items-center justify-center gap-2">
              <Phone className="w-4 h-4" strokeWidth={2} />
              <span>联系</span>
            </button>
          </div>

          {/* Tip */}
          {location.petFriendly && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-xl">
              <div className="flex items-start gap-2">
                <PawPrint className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" strokeWidth={2.5} />
                <p className="text-xs text-green-800 leading-relaxed">
                  此地点已确认宠物友好，建议提前告知店家携带宠物信息
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
