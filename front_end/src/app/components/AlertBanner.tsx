import { AlertTriangle, CloudRain, X, Clock } from 'lucide-react';

interface AlertBannerProps {
  alerts: Array<{
    type: string;
    severity: string;
    title: string;
    message: string;
    time: string;
  }>;
}

export function AlertBanner({ alerts }: AlertBannerProps) {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return {
          bg: 'bg-gradient-to-r from-red-500 to-orange-500',
          text: 'text-white',
          icon: 'text-white',
        };
      case 'medium':
        return {
          bg: 'bg-gradient-to-r from-orange-500 to-amber-500',
          text: 'text-white',
          icon: 'text-white',
        };
      default:
        return {
          bg: 'bg-gradient-to-r from-amber-500 to-yellow-500',
          text: 'text-white',
          icon: 'text-white',
        };
    }
  };

  return (
    <div className="border-b border-red-300 relative overflow-hidden">
      {/* Animated background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent animate-[pulse_2s_ease-in-out_infinite]"></div>
      </div>

      {alerts.map((alert, idx) => {
        const colors = getSeverityColor(alert.severity);

        return (
          <div
            key={idx}
            className={`relative ${colors.bg} px-8 py-4 flex items-center justify-between animate-[slideInLeft_0.5s_ease-out]`}
          >
            <div className="flex items-center gap-4 flex-1">
              {/* Icon */}
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center animate-pulse">
                {alert.type === 'weather' ? (
                  <CloudRain className={`w-5 h-5 ${colors.icon}`} strokeWidth={2.5} />
                ) : (
                  <AlertTriangle className={`w-5 h-5 ${colors.icon}`} strokeWidth={2.5} />
                )}
              </div>

              {/* Content */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className={`font-bold ${colors.text}`}>{alert.title}</h3>
                  <div className="px-2 py-0.5 bg-white/20 backdrop-blur-sm rounded">
                    <span className="text-xs font-medium text-white">{alert.severity === 'high' ? '紧急' : '警告'}</span>
                  </div>
                </div>
                <p className={`text-sm ${colors.text} opacity-90`}>{alert.message}</p>
              </div>

              {/* Time */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-lg">
                <Clock className={`w-3.5 h-3.5 ${colors.icon}`} strokeWidth={2} />
                <span className={`text-sm font-medium ${colors.text}`}>{alert.time}</span>
              </div>
            </div>

            {/* Close */}
            <button className="ml-4 w-8 h-8 rounded-lg bg-white/20 hover:bg-white/30 backdrop-blur-sm flex items-center justify-center transition-all">
              <X className={`w-4 h-4 ${colors.icon}`} strokeWidth={2} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
