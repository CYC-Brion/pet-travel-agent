import { Sparkles, Map, MessageSquare, Calendar } from 'lucide-react';

interface HeaderProps {
  currentView: 'home' | 'info' | 'chat' | 'planning' | 'journey';
  onViewChange: (view: 'home' | 'info' | 'chat' | 'planning' | 'journey') => void;
}

export function Header({ currentView, onViewChange }: HeaderProps) {
  const navItems = [
    { id: 'planning', label: '行程规划', icon: Calendar },
    { id: 'journey', label: '旅程视图', icon: Map },
    { id: 'chat', label: '对话助手', icon: MessageSquare },
  ] as const;

  return (
    <header className="h-16 border-b border-[var(--border)] bg-white/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="h-full px-6 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--sage-green)] to-[var(--warm-orange)] flex items-center justify-center shadow-sm">
            <Sparkles className="w-5 h-5 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-[var(--deep-blue)] tracking-tight">
              PawTrip Agent
            </h1>
            <p className="text-xs text-[var(--muted-foreground)] -mt-0.5">
              宠物友好旅行智能规划
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex items-center gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={`
                  px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-300
                  ${isActive
                    ? 'bg-[var(--sage-green)] text-white shadow-sm'
                    : 'text-[var(--deep-blue)] hover:bg-[var(--light-sage)]'
                  }
                `}
              >
                <Icon className="w-4 h-4" strokeWidth={2} />
                <span className="text-sm font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* User Profile */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[var(--warm-orange)] to-[var(--sage-green)] flex items-center justify-center text-white text-sm font-medium">
            李
          </div>
        </div>
      </div>
    </header>
  );
}
