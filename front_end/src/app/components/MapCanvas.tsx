import { useState } from 'react';
import { Hotel, MapPin, Heart, Coffee, Flag, FlagOff, Maximize2, Navigation } from 'lucide-react';

interface MapCanvasProps {
  locations: any[];
  selectedLocation: any;
  onSelectLocation: (location: any) => void;
}

export function MapCanvas({ locations, selectedLocation, onSelectLocation }: MapCanvasProps) {
  const [hoveredLocation, setHoveredLocation] = useState<any>(null);

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
        return { primary: '#a855f7', secondary: '#c084fc', bg: '#faf5ff' };
      case 'spot':
        return { primary: '#22c55e', secondary: '#4ade80', bg: '#f0fdf4' };
      case 'pet-hospital':
        return { primary: '#ef4444', secondary: '#f87171', bg: '#fef2f2' };
      case 'restaurant':
        return { primary: '#f97316', secondary: '#fb923c', bg: '#fff7ed' };
      case 'start':
        return { primary: '#3b82f6', secondary: '#60a5fa', bg: '#eff6ff' };
      case 'end':
        return { primary: '#6b7280', secondary: '#9ca3af', bg: '#f9fafb' };
      default:
        return { primary: '#6b7280', secondary: '#9ca3af', bg: '#f9fafb' };
    }
  };

  // Generate path through all locations
  const generatePath = () => {
    if (locations.length < 2) return '';

    let path = `M ${locations[0].position.x} ${locations[0].position.y}`;

    for (let i = 1; i < locations.length; i++) {
      const prev = locations[i - 1].position;
      const curr = locations[i].position;

      // Create smooth curve
      const midX = (prev.x + curr.x) / 2;
      const midY = (prev.y + curr.y) / 2;

      path += ` Q ${midX} ${midY - 5}, ${curr.x} ${curr.y}`;
    }

    return path;
  };

  return (
    <div className="h-full bg-white rounded-2xl border border-[var(--border)] shadow-lg overflow-hidden flex flex-col">
      {/* Map Header */}
      <div className="p-5 border-b border-[var(--border)] bg-gradient-to-r from-blue-50 to-green-50 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-[var(--deep-blue)] mb-1">路线地图</h3>
          <p className="text-sm text-[var(--muted-foreground)]">点击标记查看详情</p>
        </div>

        <div className="flex gap-2">
          <button className="w-10 h-10 rounded-xl bg-white border border-[var(--border)] hover:shadow-md flex items-center justify-center transition-all">
            <Maximize2 className="w-4 h-4 text-[var(--deep-blue)]" strokeWidth={2} />
          </button>
          <button className="w-10 h-10 rounded-xl bg-white border border-[var(--border)] hover:shadow-md flex items-center justify-center transition-all">
            <Navigation className="w-4 h-4 text-[var(--sage-green)]" strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* Map Canvas */}
      <div className="flex-1 relative bg-gradient-to-br from-blue-50/30 via-green-50/30 to-amber-50/30 overflow-hidden">
        {/* Grid Pattern */}
        <svg className="absolute inset-0 w-full h-full opacity-10">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#8B9D83" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>

        {/* SVG Map */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
          {/* Area Labels */}
          <g opacity="0.3">
            <text x="20" y="40" fontSize="4" fill="#8B9D83" fontWeight="600">上海</text>
            <text x="45" y="45" fontSize="4" fill="#8B9D83" fontWeight="600">西湖景区</text>
            <text x="65" y="50" fontSize="4" fill="#8B9D83" fontWeight="600">云栖</text>
          </g>

          <defs>
            <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#8B9D83" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#E8A87C" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#a855f7" stopOpacity="0.8" />
            </linearGradient>

            {/* Glow effect for selected */}
            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Route Path */}
          <path
            d={generatePath()}
            stroke="url(#routeGradient)"
            strokeWidth="0.8"
            fill="none"
            strokeLinecap="round"
            strokeDasharray="3 2"
            className="animate-[pulse_2s_ease-in-out_infinite]"
          />

          {/* Connection Lines with Distance Labels */}
          {locations.map((location, idx) => {
            if (idx === locations.length - 1) return null;
            const next = locations[idx + 1];
            const midX = (location.position.x + next.position.x) / 2;
            const midY = (location.position.y + next.position.y) / 2;

            // Calculate approximate distance (mock)
            const dx = next.position.x - location.position.x;
            const dy = next.position.y - location.position.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const distanceKm = (distance * 0.5).toFixed(1); // Mock calculation

            return (
              <g key={`line-${idx}`}>
                <line
                  x1={location.position.x}
                  y1={location.position.y}
                  x2={next.position.x}
                  y2={next.position.y}
                  stroke="#8B9D83"
                  strokeWidth="0.3"
                  strokeOpacity="0.3"
                />
                {/* Distance Label */}
                <g transform={`translate(${midX}, ${midY})`}>
                  <rect
                    x="-3"
                    y="-1"
                    width="6"
                    height="2"
                    rx="0.5"
                    fill="white"
                    fillOpacity="0.9"
                  />
                  <text
                    textAnchor="middle"
                    y="0.5"
                    fontSize="1.2"
                    fill="#6B7280"
                    fontWeight="500"
                  >
                    {distanceKm}km
                  </text>
                </g>
              </g>
            );
          })}

          {/* Location Markers */}
          {locations.map((location, idx) => {
            const colors = getColor(location.type);
            const isSelected = selectedLocation?.id === location.id;
            const isHovered = hoveredLocation?.id === location.id;
            const scale = isSelected ? 1.4 : isHovered ? 1.2 : 1;

            return (
              <g
                key={location.id}
                transform={`translate(${location.position.x}, ${location.position.y})`}
                className="cursor-pointer"
                onClick={() => onSelectLocation(location)}
                onMouseEnter={() => setHoveredLocation(location)}
                onMouseLeave={() => setHoveredLocation(null)}
              >
                {/* Pulse Animation for selected */}
                {isSelected && (
                  <circle
                    r="3"
                    fill={colors.primary}
                    opacity="0.3"
                    className="animate-ping"
                    style={{ animationDuration: '1.5s' }}
                  />
                )}

                {/* Marker Circle */}
                <circle
                  r={2 * scale}
                  fill={colors.primary}
                  className="transition-all duration-300"
                  filter={isSelected ? 'url(#glow)' : undefined}
                />

                {/* Marker Border */}
                <circle
                  r={2.5 * scale}
                  fill="none"
                  stroke="white"
                  strokeWidth="0.6"
                  className="transition-all duration-300"
                />

                {/* Index Number */}
                <text
                  y="0.5"
                  textAnchor="middle"
                  fill="white"
                  fontSize="1.5"
                  fontWeight="bold"
                  className="pointer-events-none"
                >
                  {idx + 1}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Hover Tooltip */}
        {hoveredLocation && (
          <div
            className="absolute z-10 pointer-events-none"
            style={{
              left: `${hoveredLocation.position.x}%`,
              top: `${hoveredLocation.position.y}%`,
              transform: 'translate(-50%, -120%)',
            }}
          >
            <div className="px-3 py-2 bg-white rounded-lg shadow-lg border border-[var(--border)] whitespace-nowrap animate-[fadeInUp_0.2s_ease-out]">
              <p className="text-sm font-semibold text-[var(--deep-blue)]">
                {hoveredLocation.name}
              </p>
              <p className="text-xs text-[var(--muted-foreground)]">
                {hoveredLocation.time}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="p-4 border-t border-[var(--border)] bg-[var(--soft-grey)]/30">
        <div className="flex items-center gap-6 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-purple-500"></div>
            <span className="text-[var(--muted-foreground)]">住宿</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-[var(--muted-foreground)]">景点</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span className="text-[var(--muted-foreground)]">宠物医院</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-500"></div>
            <span className="text-[var(--muted-foreground)]">餐饮</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-0.5 bg-gradient-to-r from-[var(--sage-green)] to-[var(--warm-orange)]"></div>
            <span className="text-[var(--muted-foreground)]">推荐路线</span>
          </div>
        </div>
      </div>
    </div>
  );
}
