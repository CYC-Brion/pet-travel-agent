import { MapPin, Coffee, Camera, Hotel, Trees } from 'lucide-react';

export function Timeline() {
  const timelineEvents = [
    {
      day: 'Day 1',
      date: '4月25日',
      events: [
        {
          time: '09:00',
          title: '出发前往杭州',
          location: '上海 → 杭州',
          icon: MapPin,
          color: 'from-blue-400 to-blue-600',
          description: '建议自驾，车程约2小时',
        },
        {
          time: '12:00',
          title: '酒店入住',
          location: '西湖宠物友好酒店',
          icon: Hotel,
          color: 'from-purple-400 to-purple-600',
          description: '提前办理宠物入住手续',
        },
        {
          time: '15:00',
          title: '西湖漫步',
          location: '苏堤 · 宠物友好区域',
          icon: Trees,
          color: 'from-green-400 to-green-600',
          description: '下午阳光温和，适合遛狗',
        },
      ],
    },
    {
      day: 'Day 2',
      date: '4月26日',
      events: [
        {
          time: '08:30',
          title: '太子湾公园',
          location: '宠物可入园区域',
          icon: Camera,
          color: 'from-pink-400 to-pink-600',
          description: '春季花开，拍照好去处',
        },
        {
          time: '14:00',
          title: '宠物友好咖啡馆',
          location: '云栖小镇',
          icon: Coffee,
          color: 'from-amber-400 to-amber-600',
          description: '可携带宠物的下午茶时光',
        },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      {timelineEvents.map((day, dayIdx) => (
        <div key={dayIdx} className="relative">
          {/* Day Header */}
          <div className="flex items-center gap-3 mb-4">
            <div className="px-4 py-1.5 bg-gradient-to-r from-[var(--sage-green)] to-[var(--warm-orange)] rounded-full">
              <span className="text-sm font-semibold text-white">{day.day}</span>
            </div>
            <span className="text-sm text-[var(--muted-foreground)]">{day.date}</span>
          </div>

          {/* Events */}
          <div className="space-y-4 pl-8">
            {day.events.map((event, eventIdx) => {
              const Icon = event.icon;
              return (
                <div
                  key={eventIdx}
                  className="relative bg-white rounded-2xl border border-[var(--border)] p-4 hover:shadow-lg transition-all duration-300 group"
                >
                  {/* Timeline Dot */}
                  <div className="absolute -left-8 top-6 w-4 h-4 rounded-full bg-white border-4 border-[var(--sage-green)] shadow-sm"></div>

                  {/* Timeline Line */}
                  {eventIdx < day.events.length - 1 && (
                    <div className="absolute -left-6 top-10 w-0.5 h-[calc(100%+16px)] bg-gradient-to-b from-[var(--sage-green)] to-transparent"></div>
                  )}

                  <div className="flex gap-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${event.color} flex items-center justify-center shadow-sm flex-shrink-0 group-hover:scale-110 transition-transform`}>
                      <Icon className="w-6 h-6 text-white" strokeWidth={2} />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-semibold text-[var(--deep-blue)] mb-1">
                            {event.title}
                          </h4>
                          <p className="text-sm text-[var(--muted-foreground)] flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" strokeWidth={2} />
                            {event.location}
                          </p>
                        </div>
                        <span className="text-sm font-medium text-[var(--sage-green)] bg-[var(--light-sage)] px-3 py-1 rounded-lg">
                          {event.time}
                        </span>
                      </div>
                      <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">
                        {event.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
