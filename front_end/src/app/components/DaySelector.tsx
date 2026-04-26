import { Calendar } from 'lucide-react';

interface DaySelectorProps {
  selectedDay: number;
  onSelectDay: (day: number) => void;
  totalDays: number;
}

export function DaySelector({ selectedDay, onSelectDay, totalDays }: DaySelectorProps) {
  const days = Array.from({ length: totalDays }, (_, i) => i + 1);

  const dates = [
    { day: 1, date: '4月25日', weekday: '周五' },
    { day: 2, date: '4月26日', weekday: '周六' },
    { day: 3, date: '4月27日', weekday: '周日' },
  ];

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
        <Calendar className="w-4 h-4" strokeWidth={2} />
        <span>选择日期</span>
      </div>

      <div className="flex gap-2 bg-white rounded-xl p-1.5 border border-[var(--border)] shadow-sm">
        {days.map((day) => {
          const isSelected = selectedDay === day;
          const dateInfo = dates.find(d => d.day === day);

          return (
            <button
              key={day}
              onClick={() => onSelectDay(day)}
              className={`
                px-5 py-2.5 rounded-lg transition-all duration-300
                ${isSelected
                  ? 'bg-gradient-to-br from-[var(--sage-green)] to-[var(--warm-orange)] text-white shadow-md scale-105'
                  : 'text-[var(--deep-blue)] hover:bg-[var(--soft-grey)]'
                }
              `}
            >
              <div className="text-center">
                <div className={`text-sm font-semibold ${isSelected ? 'text-white' : 'text-[var(--deep-blue)]'}`}>
                  Day {day}
                </div>
                <div className={`text-xs mt-0.5 ${isSelected ? 'text-white/90' : 'text-[var(--muted-foreground)]'}`}>
                  {dateInfo?.date}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
