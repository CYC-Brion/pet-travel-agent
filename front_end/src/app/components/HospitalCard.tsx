import { Heart, MapPin, Phone, Clock } from 'lucide-react';

interface HospitalCardProps {
  name: string;
  distance: string;
  rating: number;
  type: string;
}

export function HospitalCard({ name, distance, rating, type }: HospitalCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-[var(--border)] p-5 hover:shadow-lg transition-all duration-300 group">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center shadow-sm">
          <Heart className="w-5 h-5 text-white" strokeWidth={2} />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-[var(--deep-blue)] mb-1">{name}</h3>
          <div className="flex items-center gap-2">
            <p className="text-xs text-[var(--muted-foreground)] flex items-center gap-1">
              <MapPin className="w-3 h-3" strokeWidth={2} />
              {distance}
            </p>
            <span className="text-xs text-[var(--muted-foreground)]">·</span>
            <div className="px-2 py-0.5 bg-red-50 rounded">
              <span className="text-xs font-medium text-red-600">{type}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 text-sm">
          <span className="text-[var(--deep-blue)] flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" strokeWidth={2} />
            全天营业
          </span>
          <span className="text-[var(--muted-foreground)]">· 评分 {rating}</span>
        </div>

        <button className="w-8 h-8 rounded-lg hover:bg-[var(--light-sage)] flex items-center justify-center transition-colors">
          <Phone className="w-4 h-4 text-[var(--sage-green)]" strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}
