import { Loader2, CheckCircle2, Sparkles, Search, Cloud, Map, FileText } from 'lucide-react';

interface AIStatusIndicatorProps {
  status: 'loading' | 'processing' | 'analyzing' | 'complete';
  label: string;
  delay?: number;
}

export function AIStatusIndicator({ status, label, delay = 0 }: AIStatusIndicatorProps) {
  const getIcon = () => {
    if (label.includes('识别')) return Search;
    if (label.includes('天气')) return Cloud;
    if (label.includes('地图')) return Map;
    if (label.includes('规则')) return FileText;
    return Sparkles;
  };

  const Icon = getIcon();
  const isComplete = status === 'complete';

  return (
    <div
      className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100 animate-[fadeInUp_0.4s_ease-out_both]"
      style={{ animationDelay: `${delay}s` }}
    >
      {/* Status Icon */}
      <div className="relative">
        {isComplete ? (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-sm">
            <CheckCircle2 className="w-5 h-5 text-white" strokeWidth={2.5} />
          </div>
        ) : (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center shadow-sm">
            <Loader2 className="w-5 h-5 text-white animate-spin" strokeWidth={2.5} />
          </div>
        )}

        {/* Pulse effect */}
        {!isComplete && (
          <div className="absolute inset-0 rounded-full bg-blue-400 animate-ping opacity-30"></div>
        )}
      </div>

      {/* Label */}
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-blue-600" strokeWidth={2} />
          <span className="text-sm font-medium text-blue-900">
            {label}
          </span>
        </div>
        {!isComplete && (
          <div className="mt-1 flex gap-1">
            <div
              className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce"
              style={{ animationDelay: '0s' }}
            ></div>
            <div
              className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce"
              style={{ animationDelay: '0.1s' }}
            ></div>
            <div
              className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce"
              style={{ animationDelay: '0.2s' }}
            ></div>
          </div>
        )}
      </div>

      {/* Streaming indicator */}
      {status === 'analyzing' && (
        <div className="flex gap-0.5">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="w-1 bg-gradient-to-t from-blue-400 to-purple-400 rounded-full animate-pulse"
              style={{
                height: `${Math.random() * 16 + 8}px`,
                animationDelay: `${i * 0.15}s`,
              }}
            ></div>
          ))}
        </div>
      )}
    </div>
  );
}
