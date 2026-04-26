import {
  Hotel,
  MapPin,
  Heart,
  Coffee,
  Flag,
  FlagOff,
  Clock,
  Star,
  PawPrint,
  Navigation2,
} from 'lucide-react';

interface RouteListProps {
  locations: any[];
  selectedLocation: any;
  onSelectLocation: (location: any) => void;
}

export function RouteList({ locations, selectedLocation, onSelectLocation }: RouteListProps) {
  const getIcon = (type: string) => {
    switch (type) {
      case 'hotel':
        return Hotel;
      case 'spot':
        return MapPin;
      case 'pet-hospital':
        return Heart;
      case 'restaurant':
        return Coffee;
      case 'start':
        return Flag;
      case 'end':
        return FlagOff;
      default:
        return MapPin;
    }
  };

  const getColor = (type: string) => {
    switch (type) {
      case 'hotel':
        return { bg: 'bg-purple-50', icon: 'text-purple-500', border: 'border-purple-200' };
      case 'spot':
        return { bg: 'bg-green-50', icon: 'text-green-500', border: 'border-green-200' };
      case 'pet-hospital':
        return { bg: 'bg-red-50', icon: 'text-red-500', border: 'border-red-200' };
      case 'restaurant':
        return { bg: 'bg-orange-50', icon: 'text-orange-500', border: 'border-orange-200' };
      case 'start':
        return { bg: 'bg-blue-50', icon: 'text-blue-500', border: 'border-blue-200' };
      case 'end':
        return { bg: 'bg-gray-50', icon: 'text-gray-500', border: 'border-gray-200' };
      default:
        return { bg: 'bg-gray-50', icon: 'text-gray-500', border: 'border-gray-200' };
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'hotel':
        return '住宿';
      case 'spot':
        return '景点';
      case 'pet-hospital':
        return '宠物医院';
      case 'restaurant':
        return '餐饮';
      case 'start':
        return '起点';
      case 'end':
        return '终点';
      default:
        return '其他';
    }
  };

  return (
    <div className="h-full bg-white rounded-2xl border border-[var(--border)] shadow-lg overflow-hidden flex flex-col">
      {/* Header */}
      <div className="p-5 border-b border-[var(--border)] bg-gradient-to-br from-[var(--light-sage)] to-white">
        <h3 className="font-semibold text-[var(--deep-blue)] mb-2">今日路线</h3>
        <p className="text-sm text-[var(--muted-foreground)]">
          共 {locations.length} 个点位 · 顺序已优化
        </p>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-3 relative">
          {/* Vertical line */}
          <div className="absolute left-[22px] top-8 bottom-8 w-0.5 bg-gradient-to-b from-[var(--sage-green)] via-[var(--warm-orange)] to-purple-300 opacity-30"></div>

          {locations.map((location, idx) => {
            const Icon = getIcon(location.type);
            const colors = getColor(location.type);
            const isSelected = selectedLocation?.id === location.id;

            return (
              <button
                key={location.id}
                onClick={() => onSelectLocation(location)}
                className={`
                  w-full text-left p-4 rounded-xl border-2 transition-all duration-300
                  ${isSelected
                    ? `${colors.border} ${colors.bg} shadow-md scale-102`
                    : 'border-[var(--border)] hover:border-gray-300 hover:shadow-sm bg-white'
                  }
                `}
              >
                <div className="flex items-start gap-3 relative">
                  {/* Icon with Number Badge */}
                  <div className="relative flex-shrink-0">
                    <div className={`
                      w-11 h-11 rounded-xl ${colors.bg} border ${colors.border}
                      flex items-center justify-center z-10
                      ${isSelected ? 'shadow-sm' : ''}
                    `}>
                      <Icon className={`w-5 h-5 ${colors.icon}`} strokeWidth={2} />
                    </div>
                    {/* Number Badge */}
                    <div className="absolute -top-1 -left-1 w-5 h-5 rounded-full bg-gradient-to-br from-[var(--sage-green)] to-[var(--warm-orange)] flex items-center justify-center shadow-md border-2 border-white">
                      <span className="text-xs font-bold text-white">{idx + 1}</span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 pt-1">
                    {/* Title */}
                    <div className="flex items-start justify-between mb-1">
                      <h4 className="font-semibold text-[var(--deep-blue)] text-sm">
                        {location.name}
                      </h4>
                      <span className={`
                        px-2 py-0.5 rounded text-xs font-medium
                        ${colors.bg} ${colors.icon}
                      `}>
                        {getTypeLabel(location.type)}
                      </span>
                    </div>

                    {/* Time */}
                    <div className="flex items-center gap-1.5 text-xs text-[var(--muted-foreground)] mb-2">
                      <Clock className="w-3 h-3" strokeWidth={2} />
                      <span>{location.time}</span>
                    </div>

                    {/* Details */}
                    {location.rating && (
                      <div className="flex items-center gap-3 text-xs">
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-amber-500 fill-amber-500" strokeWidth={2} />
                          <span className="font-medium text-amber-700">{location.rating}</span>
                        </div>

                        {location.petFriendly && (
                          <div className="flex items-center gap-1 px-2 py-0.5 bg-green-100 rounded">
                            <PawPrint className="w-3 h-3 text-green-600" strokeWidth={2.5} />
                            <span className="text-green-700 font-medium">宠物友好</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer Stats */}
      <div className="p-4 border-t border-[var(--border)] bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Navigation2 className="w-4 h-4 text-blue-500" strokeWidth={2} />
            <span className="text-[var(--deep-blue)] font-medium">预计通勤</span>
          </div>
          <span className="font-semibold text-blue-700">约 2.5 小时</span>
        </div>
      </div>
    </div>
  );
}
