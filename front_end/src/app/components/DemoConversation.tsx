import { Sparkles } from 'lucide-react';

export function DemoConversation() {
  const messages = [
    {
      type: 'user',
      text: '我想带金毛从上海去杭州玩三天',
      time: '14:32',
      delay: 0,
    },
    {
      type: 'assistant',
      text: '好的！我来帮您规划这次杭州之旅。让我先确认几个重要信息：',
      time: '14:32',
      delay: 0.5,
    },
    {
      type: 'assistant',
      text: '🗓️ 您计划什么时候出发呢？方便告诉我具体日期吗？\n🐕 您的金毛多大了？体重大概多少？这会影响酒店和交通的选择。\n🚗 您打算自驾还是其他交通方式？',
      time: '14:32',
      delay: 1,
      isQuestion: true,
    },
    {
      type: 'user',
      text: '下周五出发，我的金毛3岁，35公斤，我们开车去',
      time: '14:33',
      delay: 2,
    },
    {
      type: 'assistant',
      text: '收到！正在为您生成方案...',
      time: '14:33',
      delay: 2.5,
      isProcessing: true,
    },
  ];

  return (
    <div className="space-y-4 mt-6">
      {messages.map((msg, idx) => (
        <div
          key={idx}
          className={`flex gap-4 animate-[fadeInUp_0.5s_ease-out_both] ${
            msg.type === 'user' ? 'flex-row-reverse' : ''
          }`}
          style={{ animationDelay: `${msg.delay}s` }}
        >
          {msg.type === 'assistant' && (
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--sage-green)] to-[var(--warm-orange)] flex items-center justify-center flex-shrink-0 shadow-md">
              <Sparkles className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
          )}

          <div className="flex-1 max-w-md">
            <div
              className={`
                rounded-2xl px-5 py-4 text-[15px] leading-relaxed
                ${msg.type === 'user'
                  ? 'bg-gradient-to-br from-[var(--sage-green)] to-[var(--warm-orange)] text-white shadow-md'
                  : msg.isQuestion
                  ? 'bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 text-[var(--deep-blue)]'
                  : msg.isProcessing
                  ? 'bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 text-blue-900'
                  : 'bg-[var(--soft-grey)] text-[var(--deep-blue)]'
                }
              `}
            >
              <p className="whitespace-pre-line">{msg.text}</p>
            </div>
            <span className="text-xs text-[var(--muted-foreground)] mt-2 inline-block">
              {msg.time}
            </span>
          </div>

          {msg.type === 'user' && (
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center flex-shrink-0 text-white font-medium shadow-md">
              李
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
