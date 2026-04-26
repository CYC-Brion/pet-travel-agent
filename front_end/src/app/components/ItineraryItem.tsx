import {
  Car,
  Hotel,
  MapPin,
  Coffee,
  UtensilsCrossed,
  Camera,
  Clock,
  Navigation,
  PawPrint,
  AlertCircle,
  Star,
  CloudSun,
} from 'lucide-react';

interface ItineraryItemProps {
  item: any;
  isLast: boolean;
  index?: number;
}

export function ItineraryItem({ item, isLast, index = 0 }: ItineraryItemProps) {
  const getIcon = () => {
    switch (item.type) {
      case 'transport':
        return Car;
      case 'checkin':
      case 'checkout':
        return Hotel;
      case 'activity':
        return Camera;
      case 'rest':
        return Coffee;
      case 'lunch':
      case 'dinner':
        return UtensilsCrossed;
      default:
        return MapPin;
    }
  };

  const getTypeColor = () => {
    switch (item.type) {
      case 'transport':
        return { bg: 'bg-blue-50', icon: 'text-blue-500', border: 'border-blue-200' };
      case 'checkin':
      case 'checkout':
        return { bg: 'bg-purple-50', icon: 'text-purple-500', border: 'border-purple-200' };
      case 'activity':
        return { bg: 'bg-green-50', icon: 'text-green-500', border: 'border-green-200' };
      case 'rest':
        return { bg: 'bg-amber-50', icon: 'text-amber-500', border: 'border-amber-200' };
      case 'lunch':
      case 'dinner':
        return { bg: 'bg-orange-50', icon: 'text-orange-500', border: 'border-orange-200' };
      default:
        return { bg: 'bg-gray-50', icon: 'text-gray-500', border: 'border-gray-200' };
    }
  };

  const Icon = getIcon();
  const colors = getTypeColor();

  return (
    <div className="relative flex gap-4 group">
      {/* Timeline Dot */}
      <div className="relative z-10">
        <div className={`
          w-14 h-14 rounded-xl ${colors.bg} border-2 ${colors.border}
          flex items-center justify-center shadow-sm
          group-hover:scale-110 group-hover:shadow-md transition-all duration-300
        `}>
          <Icon className={`w-6 h-6 ${colors.icon}`} strokeWidth={2} />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 pb-4">
        {/* Time Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[var(--sage-green)]/10 rounded-lg mb-3">
          <Clock className="w-3.5 h-3.5 text-[var(--sage-green)]" strokeWidth={2} />
          <span className="text-sm font-semibold text-[var(--sage-green)]">
            {item.time}
          </span>
        </div>

        {/* Main Card */}
        <div className={`
          p-5 rounded-xl border ${colors.border} ${colors.bg}
          group-hover:shadow-md transition-all duration-300
        `}>
          {/* Title */}
          <h4 className="text-base font-semibold text-[var(--deep-blue)] mb-2 flex items-center gap-2">
            {item.title}
            {item.petFriendly && (
              <div className="px-2 py-1 bg-green-100 rounded-lg">
                <PawPrint className="w-3.5 h-3.5 text-green-600" strokeWidth={2.5} />
              </div>
            )}
          </h4>

          {/* Location */}
          {item.location && (
            <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)] mb-3">
              <MapPin className="w-4 h-4" strokeWidth={2} />
              <span>{item.location}</span>
              {item.rating && (
                <div className="flex items-center gap-1 ml-2">
                  <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" strokeWidth={2} />
                  <span className="text-xs font-medium text-amber-700">{item.rating}</span>
                </div>
              )}
            </div>
          )}

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-3 mb-3">
            {item.duration && (
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-[var(--muted-foreground)]" strokeWidth={2} />
                <span className="text-[var(--deep-blue)] font-medium">{item.duration}</span>
              </div>
            )}

            {item.method && (
              <div className="flex items-center gap-2 text-sm">
                <Navigation className="w-4 h-4 text-[var(--muted-foreground)]" strokeWidth={2} />
                <span className="text-[var(--deep-blue)] font-medium">{item.method}</span>
              </div>
            )}

            {item.distance && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4 text-[var(--muted-foreground)]" strokeWidth={2} />
                <span className="text-[var(--deep-blue)] font-medium">{item.distance}</span>
              </div>
            )}

            {item.weather && (
              <div className="flex items-center gap-2 text-sm">
                <CloudSun className="w-4 h-4 text-[var(--muted-foreground)]" strokeWidth={2} />
                <span className="text-[var(--deep-blue)] font-medium">{item.weather}</span>
              </div>
            )}
          </div>

          {/* Note */}
          {item.note && (
            <div className="flex items-start gap-2 p-3 bg-white/60 rounded-lg border border-current/10">
              <AlertCircle className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" strokeWidth={2} />
              <p className="text-sm text-[var(--deep-blue)] leading-relaxed">
                {item.note}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
