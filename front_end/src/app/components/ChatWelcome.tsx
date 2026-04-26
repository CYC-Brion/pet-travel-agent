import { Sparkles, PawPrint, MapPin, Calendar } from 'lucide-react';

interface ChatWelcomeProps {
  onExampleClick?: () => void;
}

export function ChatWelcome({ onExampleClick }: ChatWelcomeProps) {
  const conversation = [
    {
      type: 'assistant',
      text: '您好！我是您的宠物旅行智能规划助手 🐾',
      time: '刚刚',
    },
    {
      type: 'assistant',
      text: '我可以帮您：\n• 规划宠物友好的旅行路线\n• 推荐适合携宠的景点和酒店\n• 定位沿途宠物医院\n• 提醒证件和注意事项',
      time: '刚刚',
      isFeatureList: true,
    },
    {
      type: 'assistant',
      text: '请告诉我您的旅行计划，我会主动追问必要信息，为您生成最优方案。',
      time: '刚刚',
    },
  ];

  const examples = [
    { icon: MapPin, text: '我想带狗狗去杭州玩三天', color: 'from-blue-400 to-blue-600' },
    { icon: Calendar, text: '下周末带猫咪去苏州', color: 'from-purple-400 to-purple-600' },
    { icon: PawPrint, text: '国庆带金毛自驾游', color: 'from-green-400 to-green-600' },
  ];

  return (
    <div className="space-y-6 animate-[fadeInUp_0.6s_ease-out]">
      {/* Welcome Messages */}
      {conversation.map((msg, idx) => (
        <div
          key={idx}
          className="flex gap-4 animate-[fadeInUp_0.5s_ease-out] opacity-0"
          style={{ animationDelay: `${idx * 0.2}s`, animationFillMode: 'forwards' }}
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--sage-green)] to-[var(--warm-orange)] flex items-center justify-center flex-shrink-0 shadow-md">
            <Sparkles className="w-5 h-5 text-white" strokeWidth={2.5} />
          </div>

          <div className="flex-1">
            <div
              className={`
                rounded-2xl px-5 py-4 text-[15px] leading-relaxed
                ${msg.isFeatureList
                  ? 'bg-gradient-to-br from-[var(--light-sage)] to-[var(--muted-orange)]/30 border border-[var(--border)]'
                  : 'bg-[var(--soft-grey)]'
                }
                text-[var(--deep-blue)]
              `}
            >
              <p className="whitespace-pre-line">{msg.text}</p>
            </div>
            <span className="text-xs text-[var(--muted-foreground)] mt-2 inline-block">
              {msg.time}
            </span>
          </div>
        </div>
      ))}

      {/* Example Prompts */}
      <div
        className="pt-4 animate-[fadeInUp_0.5s_ease-out_0.8s_both]"
      >
        <p className="text-sm text-[var(--muted-foreground)] mb-3 px-1">
          💬 您可以这样开始：
        </p>
        <div className="space-y-2">
          {examples.map((example, idx) => {
            const Icon = example.icon;
            return (
              <button
                key={idx}
                onClick={onExampleClick}
                className="w-full flex items-center gap-3 p-4 rounded-xl bg-white border border-[var(--border)] hover:border-[var(--sage-green)] hover:shadow-md transition-all duration-300 group"
              >
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${example.color} flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform`}>
                  <Icon className="w-5 h-5 text-white" strokeWidth={2} />
                </div>
                <span className="text-sm text-[var(--deep-blue)] group-hover:text-[var(--sage-green)] transition-colors">
                  {example.text}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
