import { Send, Sparkles, PawPrint, MapPin, Plus } from 'lucide-react';
import { useState } from 'react';

export function ChatPanel() {
  const [inputValue, setInputValue] = useState('');

  const quickIntents = [
    { icon: MapPin, label: '推荐宠物医院', color: 'from-[var(--sage-green)] to-emerald-500' },
    { icon: PawPrint, label: '规划路线', color: 'from-[var(--warm-orange)] to-amber-500' },
    { icon: Sparkles, label: '优化行程', color: 'from-purple-400 to-pink-400' },
  ];

  const conversations = [
    {
      type: 'user',
      text: '我计划带我的金毛从上海出发去杭州玩三天，能帮我规划一下行程吗?',
      time: '14:32',
    },
    {
      type: 'assistant',
      text: '当然可以!我会为您和您的金毛规划一个舒适的杭州三日游。让我先了解一下具体需求：',
      time: '14:32',
    },
    {
      type: 'assistant',
      text: '已为您生成初步行程方案，包含3家宠物友好酒店、5个适合遛狗的景点，以及沿途3家24小时宠物医院定位。您可以在右侧查看详细信息。',
      time: '14:33',
      isResult: true,
    },
  ];

  return (
    <div className="w-80 border-r border-[var(--border)] bg-white flex flex-col">
      {/* Chat Header */}
      <div className="p-4 border-b border-[var(--border)]">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-[var(--deep-blue)]">对话助手</h2>
          <button className="w-8 h-8 rounded-lg hover:bg-[var(--light-sage)] flex items-center justify-center transition-colors">
            <Plus className="w-4 h-4 text-[var(--deep-blue)]" strokeWidth={2} />
          </button>
        </div>

        {/* Quick Intent Buttons */}
        <div className="space-y-2">
          {quickIntents.map((intent, idx) => {
            const Icon = intent.icon;
            return (
              <button
                key={idx}
                className="w-full px-3 py-2 rounded-lg border border-[var(--border)] hover:border-[var(--sage-green)] bg-gradient-to-r hover:from-[var(--light-sage)] transition-all duration-200 flex items-center gap-2 group"
              >
                <div className={`w-6 h-6 rounded-md bg-gradient-to-br ${intent.color} flex items-center justify-center shadow-sm`}>
                  <Icon className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
                </div>
                <span className="text-sm text-[var(--deep-blue)] group-hover:text-[var(--sage-green)] transition-colors">
                  {intent.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Conversation Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {conversations.map((msg, idx) => (
          <div
            key={idx}
            className={`flex gap-3 ${msg.type === 'user' ? 'flex-row-reverse' : ''}`}
          >
            {msg.type === 'assistant' && (
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[var(--sage-green)] to-[var(--warm-orange)] flex items-center justify-center flex-shrink-0 shadow-sm">
                <Sparkles className="w-4 h-4 text-white" strokeWidth={2.5} />
              </div>
            )}

            <div
              className={`
                flex-1 rounded-2xl px-4 py-2.5 text-sm leading-relaxed
                ${msg.type === 'user'
                  ? 'bg-[var(--sage-green)] text-white'
                  : msg.isResult
                  ? 'bg-gradient-to-br from-[var(--light-sage)] to-[var(--muted-orange)] border border-[var(--warm-orange)]/30 text-[var(--deep-blue)]'
                  : 'bg-[var(--soft-grey)] text-[var(--deep-blue)]'
                }
              `}
            >
              {msg.text}
            </div>

            {msg.type === 'user' && (
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[var(--warm-orange)] to-[var(--sage-green)] flex items-center justify-center flex-shrink-0 text-white text-xs font-medium">
                李
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-[var(--border)]">
        <div className="relative">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="描述您的旅行需求..."
            className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--soft-grey)] focus:outline-none focus:ring-2 focus:ring-[var(--sage-green)]/30 focus:border-[var(--sage-green)] transition-all text-sm"
          />
          <button className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg bg-[var(--sage-green)] hover:bg-[var(--sage-green)]/90 flex items-center justify-center transition-all shadow-sm hover:shadow">
            <Send className="w-4 h-4 text-white" strokeWidth={2} />
          </button>
        </div>
      </div>
    </div>
  );
}
