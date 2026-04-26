import { MapPin, Navigation, Maximize2 } from 'lucide-react';

export function MapView() {
  return (
    <div className="relative bg-white rounded-2xl border border-[var(--border)] overflow-hidden shadow-sm hover:shadow-md transition-all duration-300">
      {/* Map Container - Placeholder for actual map */}
      <div className="relative h-96 bg-gradient-to-br from-blue-50 via-green-50 to-amber-50">
        {/* Map Controls */}
        <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
          <button className="w-10 h-10 bg-white rounded-xl shadow-md hover:shadow-lg flex items-center justify-center transition-all hover:scale-105">
            <Maximize2 className="w-4 h-4 text-[var(--deep-blue)]" strokeWidth={2} />
          </button>
          <button className="w-10 h-10 bg-white rounded-xl shadow-md hover:shadow-lg flex items-center justify-center transition-all hover:scale-105">
            <Navigation className="w-4 h-4 text-[var(--sage-green)]" strokeWidth={2} />
          </button>
        </div>

        {/* Mock Map Pins */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative w-full h-full">
            {/* Route Line */}
            <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 1 }}>
              <defs>
                <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="var(--sage-green)" stopOpacity="0.6" />
                  <stop offset="100%" stopColor="var(--warm-orange)" stopOpacity="0.6" />
                </linearGradient>
              </defs>
              <path
                d="M 100 200 Q 200 150, 300 180 T 500 200 T 700 180"
                stroke="url(#routeGradient)"
                strokeWidth="4"
                fill="none"
                strokeLinecap="round"
                strokeDasharray="8 4"
              />
            </svg>

            {/* Location Pins */}
            {[
              { x: '15%', y: '50%', label: '上海', type: 'start' },
              { x: '40%', y: '45%', label: '西湖', type: 'spot' },
              { x: '65%', y: '52%', label: '太子湾', type: 'spot' },
              { x: '85%', y: '48%', label: '云栖小镇', type: 'end' },
            ].map((pin, idx) => (
              <div
                key={idx}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 group cursor-pointer"
                style={{ left: pin.x, top: pin.y, zIndex: 2 }}
              >
                <div className="relative">
                  {/* Pin */}
                  <div
                    className={`
                      w-8 h-8 rounded-full shadow-lg flex items-center justify-center
                      group-hover:scale-125 transition-transform duration-200
                      ${pin.type === 'start'
                        ? 'bg-gradient-to-br from-blue-400 to-blue-600'
                        : pin.type === 'end'
                        ? 'bg-gradient-to-br from-purple-400 to-purple-600'
                        : 'bg-gradient-to-br from-[var(--sage-green)] to-[var(--warm-orange)]'
                      }
                    `}
                  >
                    <MapPin className="w-4 h-4 text-white" strokeWidth={2.5} />
                  </div>

                  {/* Label */}
                  <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="px-3 py-1.5 bg-white rounded-lg shadow-lg border border-[var(--border)] whitespace-nowrap">
                      <span className="text-xs font-medium text-[var(--deep-blue)]">
                        {pin.label}
                      </span>
                    </div>
                  </div>

                  {/* Pulse Animation */}
                  <div
                    className={`
                      absolute inset-0 rounded-full animate-ping opacity-30
                      ${pin.type === 'start'
                        ? 'bg-blue-400'
                        : pin.type === 'end'
                        ? 'bg-purple-400'
                        : 'bg-[var(--sage-green)]'
                      }
                    `}
                    style={{ animationDuration: '2s' }}
                  ></div>
                </div>
              </div>
            ))}

            {/* Hospital Markers */}
            {[
              { x: '30%', y: '65%' },
              { x: '55%', y: '70%' },
              { x: '75%', y: '68%' },
            ].map((hospital, idx) => (
              <div
                key={idx}
                className="absolute w-6 h-6 transform -translate-x-1/2 -translate-y-1/2 group cursor-pointer"
                style={{ left: hospital.x, top: hospital.y, zIndex: 2 }}
              >
                <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center shadow-md group-hover:scale-125 transition-transform">
                  <span className="text-white text-xs font-bold">H</span>
                </div>
                <div className="absolute top-full mt-1 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="px-2 py-1 bg-red-500 rounded text-white text-xs whitespace-nowrap shadow-lg">
                    宠物医院
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Map Legend */}
      <div className="p-4 border-t border-[var(--border)] bg-[var(--soft-grey)]/30">
        <div className="flex items-center gap-6 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gradient-to-br from-[var(--sage-green)] to-[var(--warm-orange)]"></div>
            <span className="text-[var(--muted-foreground)]">宠物友好景点</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span className="text-[var(--muted-foreground)]">24小时宠物医院</span>
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
