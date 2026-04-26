import { useState } from 'react';
import { Send, Sparkles, Loader2, RotateCcw } from 'lucide-react';
import { ChatWelcome } from './ChatWelcome';
import { QuickActions } from './QuickActions';
import { InfoSummary } from './InfoSummary';
import { AIStatusIndicator } from './AIStatusIndicator';
import { DemoConversation } from './DemoConversation';

interface HomePageProps {
  onNavigate?: (view: string) => void;
}

export function HomePage({ onNavigate }: HomePageProps) {
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showDemo, setShowDemo] = useState(false);

  const handleSend = () => {
    if (inputValue.trim()) {
      setIsProcessing(true);
      setShowDemo(true);
      // Simulate AI processing then navigate
      setTimeout(() => {
        setIsProcessing(false);
        setTimeout(() => {
          if (onNavigate) onNavigate('info');
        }, 2000);
      }, 5000);
    }
  };

  const handleQuickAction = (action: string) => {
    setInputValue(action);
  };

  return (
    <div className="h-screen flex flex-col bg-[var(--cream-white)]">
      {/* Hero Header */}
      <div className="relative overflow-hidden border-b border-[var(--border)]">
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--light-sage)] via-white to-[var(--muted-orange)] opacity-60"></div>

        {/* Decorative Elements */}
        <div className="absolute top-4 left-8 w-24 h-24 bg-[var(--sage-green)] rounded-full blur-3xl opacity-20"></div>
        <div className="absolute bottom-4 right-8 w-32 h-32 bg-[var(--warm-orange)] rounded-full blur-3xl opacity-20"></div>

        {/* Reset Button */}
        {showDemo && (
          <button
            onClick={() => {
              setShowDemo(false);
              setInputValue('');
            }}
            className="absolute top-4 right-8 px-4 py-2 rounded-xl bg-white/80 backdrop-blur-sm border border-[var(--border)] hover:border-[var(--sage-green)] hover:shadow-md transition-all duration-300 flex items-center gap-2 group z-10"
          >
            <RotateCcw className="w-4 h-4 text-[var(--sage-green)] group-hover:rotate-180 transition-transform duration-500" strokeWidth={2} />
            <span className="text-sm font-medium text-[var(--deep-blue)]">重新开始</span>
          </button>
        )}

        <div className="relative px-8 py-12 text-center">
          <div className="inline-flex items-center gap-3 mb-4 animate-[fadeInUp_0.6s_ease-out]">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--sage-green)] to-[var(--warm-orange)] flex items-center justify-center shadow-lg">
              <Sparkles className="w-7 h-7 text-white" strokeWidth={2.5} />
            </div>
            <h1 className="text-4xl font-bold text-[var(--deep-blue)] tracking-tight">
              Pet-Friendly Travel Planner
            </h1>
          </div>
          <p className="text-lg text-[var(--muted-foreground)] animate-[fadeInUp_0.6s_ease-out_0.1s_both]">
            Plan smarter trips with your pet
          </p>

          {/* Feature Pills */}
          <div className="flex items-center justify-center gap-3 mt-6 animate-[fadeInUp_0.6s_ease-out_0.2s_both]">
            <div className="px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full border border-[var(--border)] shadow-sm">
              <span className="text-sm text-[var(--deep-blue)]">🤖 AI 智能规划</span>
            </div>
            <div className="px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full border border-[var(--border)] shadow-sm">
              <span className="text-sm text-[var(--deep-blue)]">🏥 医院定位</span>
            </div>
            <div className="px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full border border-[var(--border)] shadow-sm">
              <span className="text-sm text-[var(--deep-blue)]">🗺️ 路线可视化</span>
            </div>
            <button
              onClick={() => onNavigate?.('planning')}
              className="px-4 py-2 bg-gradient-to-r from-[var(--sage-green)] to-[var(--warm-orange)] text-white rounded-full border border-transparent shadow-md hover:shadow-lg transition-all duration-300"
            >
              <span className="text-sm font-medium">查看示例行程 →</span>
            </button>
            <button
              onClick={() => onNavigate?.('map')}
              className="px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full border border-[var(--sage-green)] shadow-sm hover:shadow-md transition-all duration-300"
            >
              <span className="text-sm font-medium text-[var(--sage-green)]">查看地图 →</span>
            </button>
            <button
              onClick={() => onNavigate?.('emergency')}
              className="px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full border border-orange-400 shadow-sm hover:shadow-md transition-all duration-300"
            >
              <span className="text-sm font-medium text-orange-600">应急演示 →</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex gap-6 px-8 pb-8 overflow-hidden">
        {/* Left: Chat Area */}
        <div className="flex-1 flex flex-col bg-white rounded-3xl shadow-lg border border-[var(--border)] overflow-hidden animate-[slideInLeft_0.5s_ease-out]">
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-6">
            {!showDemo ? (
              <ChatWelcome onExampleClick={() => setShowDemo(true)} />
            ) : (
              <>
                <DemoConversation />

                {/* AI Status Indicators */}
                {isProcessing && (
                  <div className="mt-6 space-y-3">
                    <AIStatusIndicator status="analyzing" label="正在识别需求" delay={3} />
                    <AIStatusIndicator status="processing" label="正在查询天气" delay={3.5} />
                    <AIStatusIndicator status="processing" label="正在读取宠物规则" delay={4} />
                    <AIStatusIndicator status="loading" label="正在调用地图服务" delay={4.5} />
                  </div>
                )}
              </>
            )}
          </div>

          {/* Quick Actions */}
          <div className="px-6 pt-4 pb-3 border-t border-[var(--border)] bg-gradient-to-b from-transparent to-[var(--soft-grey)]/30">
            <QuickActions />
          </div>

          {/* Input Area */}
          <div className="p-6 bg-[var(--soft-grey)]/50">
            <div className="relative">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="告诉我您的旅行计划，例如：我想带金毛从上海去杭州玩三天..."
                className="w-full pl-6 pr-14 py-4 rounded-2xl border-2 border-[var(--border)] bg-white focus:outline-none focus:ring-2 focus:ring-[var(--sage-green)]/40 focus:border-[var(--sage-green)] transition-all text-base shadow-sm"
                disabled={isProcessing}
              />
              <button
                onClick={handleSend}
                disabled={isProcessing || !inputValue.trim()}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--sage-green)] to-[var(--warm-orange)] hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-all hover:scale-105 active:scale-95"
              >
                {isProcessing ? (
                  <Loader2 className="w-5 h-5 text-white animate-spin" strokeWidth={2.5} />
                ) : (
                  <Send className="w-5 h-5 text-white" strokeWidth={2.5} />
                )}
              </button>
            </div>
            <div className="mt-3 flex items-center justify-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[var(--sage-green)] animate-pulse"></div>
              <p className="text-xs text-[var(--muted-foreground)]">
                AI 会主动追问细节，帮您完善旅行计划
              </p>
            </div>
          </div>
        </div>

        {/* Right: Info Summary */}
        <div className="w-96 animate-[fadeInUp_0.6s_ease-out_0.2s_both]">
          <InfoSummary showDemo={showDemo} />
        </div>
      </div>
    </div>
  );
}
