import { useState } from 'react';
import { Send, Sparkles, Loader2, MapPin, Calendar, PawPrint } from 'lucide-react';

interface HomePageEnglishProps {
  onNavigate?: (view: string) => void;
}

export function HomePageEnglish({ onNavigate }: HomePageEnglishProps) {
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSend = () => {
    if (inputValue.trim()) {
      setIsProcessing(true);
      setTimeout(() => {
        setIsProcessing(false);
        setTimeout(() => {
          if (onNavigate) onNavigate('info');
        }, 500);
      }, 2000);
    }
  };

  const quickStarts = [
    { icon: MapPin, text: 'Plan a weekend trip with my dog', color: 'from-blue-400 to-blue-600' },
    { icon: Calendar, text: 'Find pet-friendly hotels in Hangzhou', color: 'from-green-400 to-green-600' },
    { icon: PawPrint, text: 'Locate nearby pet hospitals', color: 'from-orange-400 to-orange-600' },
  ];

  return (
    <div className="h-screen flex flex-col bg-[var(--cream-white)]">
      {/* Header */}
      <div className="border-b border-[var(--border)] bg-white">
        <div className="max-w-6xl mx-auto px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[var(--sage-green)] to-[var(--warm-orange)] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-base font-semibold text-[var(--deep-blue)]">
                Pet-Friendly Travel Planner
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate?.('planning')}
              className="px-4 py-2 text-sm font-medium text-[var(--sage-green)] hover:bg-[var(--light-sage)] rounded-lg transition-colors"
            >
              View Demo Plan
            </button>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--warm-orange)] to-[var(--sage-green)] flex items-center justify-center text-white text-xs font-medium">
              AC
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-8 py-12">
        <div className="w-full max-w-3xl">
          {/* Hero */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[var(--light-sage)] rounded-full mb-6">
              <Sparkles className="w-4 h-4 text-[var(--sage-green)]" strokeWidth={2} />
              <span className="text-sm font-medium text-[var(--deep-blue)]">
                AI-Powered Trip Planning
              </span>
            </div>

            <h2 className="text-4xl font-bold text-[var(--deep-blue)] mb-4">
              Plan smarter trips with your pet
            </h2>
            <p className="text-lg text-[var(--muted-foreground)] max-w-2xl mx-auto">
              Get personalized itineraries, pet-friendly recommendations, and real-time
              adjustments powered by AI.
            </p>
          </div>

          {/* Chat Input */}
          <div className="bg-white rounded-2xl border border-[var(--border)] shadow-sm p-6 mb-8">
            <div className="relative mb-4">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Tell me about your trip... e.g., I want to take my Golden Retriever to Hangzhou for 3 days"
                className="w-full pl-4 pr-12 py-4 rounded-xl border border-[var(--border)] bg-[var(--soft-grey)] focus:outline-none focus:ring-2 focus:ring-[var(--sage-green)]/30 focus:border-[var(--sage-green)] transition-all text-base"
                disabled={isProcessing}
              />
              <button
                onClick={handleSend}
                disabled={isProcessing || !inputValue.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-lg bg-gradient-to-br from-[var(--sage-green)] to-[var(--warm-orange)] hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-all"
              >
                {isProcessing ? (
                  <Loader2 className="w-5 h-5 text-white animate-spin" strokeWidth={2.5} />
                ) : (
                  <Send className="w-5 h-5 text-white" strokeWidth={2.5} />
                )}
              </button>
            </div>

            <p className="text-xs text-[var(--muted-foreground)] text-center">
              AI will ask follow-up questions to build your perfect itinerary
            </p>
          </div>

          {/* Quick Starts */}
          <div>
            <p className="text-sm text-[var(--muted-foreground)] mb-3">
              Or try one of these:
            </p>
            <div className="grid grid-cols-1 gap-2">
              {quickStarts.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <button
                    key={idx}
                    onClick={() => {
                      setInputValue(item.text);
                      setTimeout(() => handleSend(), 100);
                    }}
                    className="flex items-center gap-3 p-4 rounded-xl bg-white border border-[var(--border)] hover:border-[var(--sage-green)] hover:shadow-sm transition-all duration-300 group text-left"
                  >
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${item.color} flex items-center justify-center flex-shrink-0`}>
                      <Icon className="w-5 h-5 text-white" strokeWidth={2} />
                    </div>
                    <span className="text-sm text-[var(--deep-blue)] group-hover:text-[var(--sage-green)] transition-colors">
                      {item.text}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-[var(--border)] bg-white px-8 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-sm text-[var(--muted-foreground)]">
          <div className="flex items-center gap-6">
            <span>© 2026 Pet-Friendly Travel Planner</span>
            <a href="#" className="hover:text-[var(--sage-green)] transition-colors">Privacy</a>
            <a href="#" className="hover:text-[var(--sage-green)] transition-colors">Terms</a>
          </div>
          <div className="flex items-center gap-1">
            <span>Powered by</span>
            <Sparkles className="w-3.5 h-3.5" strokeWidth={2} />
            <span className="font-medium">AI</span>
          </div>
        </div>
      </div>
    </div>
  );
}
