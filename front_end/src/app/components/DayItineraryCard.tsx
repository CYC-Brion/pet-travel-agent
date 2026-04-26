import { Calendar, Clock } from 'lucide-react';
import { ItineraryItem } from './ItineraryItem';

interface DayItineraryCardProps {
  day: {
    day: number;
    date: string;
    items: any[];
  };
  index: number;
}

export function DayItineraryCard({ day, index }: DayItineraryCardProps) {
  const totalDuration = day.items
    .filter(item => item.duration)
    .reduce((acc, item) => {
      const hours = parseFloat(item.duration.replace(/[^0-9.]/g, ''));
      return acc + (isNaN(hours) ? 0 : hours);
    }, 0);

  return (
    <div
      className="bg-white rounded-2xl border border-[var(--border)] shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden animate-[fadeInUp_0.5s_ease-out_both]"
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      {/* Day Header */}
      <div className="relative overflow-hidden">
        {/* Gradient accent */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[var(--sage-green)] via-[var(--warm-orange)] to-purple-400"></div>

        <div className="p-6 bg-gradient-to-br from-[var(--light-sage)] to-white border-b border-[var(--border)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[var(--sage-green)] to-[var(--warm-orange)] flex items-center justify-center shadow-md">
                <span className="text-white text-xl font-bold">D{day.day}</span>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-[var(--deep-blue)] mb-1 flex items-center gap-2">
                  Day {day.day}
                  <span className="text-lg font-normal text-[var(--muted-foreground)]">
                    · {day.date}
                  </span>
                </h3>
                <div className="flex items-center gap-4 text-sm text-[var(--muted-foreground)]">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" strokeWidth={2} />
                    {day.items.length} 项活动
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" strokeWidth={2} />
                    约 {totalDuration.toFixed(1)} 小时
                  </span>
                </div>
              </div>
            </div>

            {/* Day Status Badge */}
            <div className="px-4 py-2 bg-white/80 backdrop-blur-sm rounded-xl border border-[var(--sage-green)]/30 shadow-sm">
              <span className="text-sm font-medium text-[var(--sage-green)]">
                已优化
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Timeline Items */}
      <div className="p-6">
        <div className="space-y-4 relative">
          {/* Vertical timeline line */}
          <div className="absolute left-[26px] top-6 bottom-6 w-0.5 bg-gradient-to-b from-[var(--sage-green)] via-[var(--warm-orange)] to-purple-300 opacity-50"></div>

          {day.items.map((item, idx) => (
            <ItineraryItem
              key={idx}
              item={item}
              isLast={idx === day.items.length - 1}
              index={idx}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
