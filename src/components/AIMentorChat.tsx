import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, Send, X, Bot, User, Loader2, Trash2, 
  TrendingUp, TrendingDown, Zap
} from 'lucide-react';
import { useAIMentor } from '@/hooks/useAIMentor';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';

interface AIMentorChatProps {
  symbol: string;
  currentPrice: number;
  userAsset?: number;
  userPosition?: {
    type: 'LONG' | 'SHORT';
    entryPrice: number;
    targetPrice: number;
    stopLoss: number;
    leverage: number;
  };
}

const QUICK_QUESTIONS = [
  { label: '현재 진입해도 될까요?', icon: TrendingUp },
  { label: '내 포지션 어떻게 관리할까요?', icon: TrendingDown },
  { label: '시장 전망과 주요 이벤트는?', icon: Zap },
];

export function AIMentorChat({ symbol, currentPrice, userAsset, userPosition }: AIMentorChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const { messages, isLoading, sendMessage, clearMessages } = useAIMentor();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (text?: string) => {
    const messageText = text || input.trim();
    if (!messageText || isLoading) return;

    sendMessage(messageText, {
      symbol,
      currentPrice,
      position: userPosition,
      context: userAsset ? `현재 보유 자산: $${userAsset.toLocaleString()}` : undefined,
    });
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Floating Button */}
      <motion.button
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed bottom-6 right-6 z-40 p-4 rounded-full shadow-lg",
          "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground",
          "hover:shadow-xl hover:scale-105 transition-all",
          isOpen && "hidden"
        )}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <MessageSquare className="w-6 h-6" />
        <span className="absolute -top-1 -right-1 w-3 h-3 bg-long rounded-full animate-pulse" />
      </motion.button>

      {/* Chat Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 w-96 max-w-[calc(100vw-3rem)] h-[600px] max-h-[calc(100vh-6rem)] flex flex-col bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border bg-accent/30">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/20">
                  <Bot className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">AI 멘토</h3>
                  <p className="text-xs text-muted-foreground">{symbol}/USDT · ${currentPrice.toLocaleString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={clearMessages}
                  className="p-2 rounded-lg hover:bg-accent transition-colors"
                  title="대화 초기화"
                >
                  <Trash2 className="w-4 h-4 text-muted-foreground" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-lg hover:bg-accent transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
              {messages.length === 0 && (
                <div className="text-center py-8">
                  <Bot className="w-12 h-12 mx-auto mb-4 text-primary/50" />
                  <p className="text-sm text-muted-foreground mb-4">
                    AI 멘토에게 현재 시장 상황에 대해 물어보세요!
                  </p>
                  <div className="space-y-2">
                    {QUICK_QUESTIONS.map((q, i) => (
                      <button
                        key={i}
                        onClick={() => handleSend(q.label)}
                        className="w-full flex items-center gap-2 p-3 rounded-lg bg-accent/50 hover:bg-accent border border-border hover:border-primary/50 transition-all text-left text-sm"
                      >
                        <q.icon className="w-4 h-4 text-primary" />
                        {q.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "flex gap-3",
                    msg.role === 'user' ? "justify-end" : "justify-start"
                  )}
                >
                  {msg.role === 'assistant' && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                      <Bot className="w-4 h-4 text-primary" />
                    </div>
                  )}
                  <div
                    className={cn(
                      "max-w-[80%] rounded-2xl px-4 py-2 text-sm",
                      msg.role === 'user'
                        ? "bg-primary text-primary-foreground rounded-br-md"
                        : "bg-accent border border-border rounded-bl-md"
                    )}
                  >
                    {msg.role === 'assistant' ? (
                      <div className="prose prose-sm prose-invert max-w-none">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    ) : (
                      msg.content
                    )}
                  </div>
                  {msg.role === 'user' && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              ))}

              {isLoading && messages[messages.length - 1]?.role === 'user' && (
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-primary" />
                  </div>
                  <div className="bg-accent border border-border rounded-2xl rounded-bl-md px-4 py-2">
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-border bg-accent/30">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="AI 멘토에게 질문하세요..."
                  className="flex-1 px-4 py-2 rounded-lg bg-background border border-border focus:border-primary focus:outline-none text-sm"
                  disabled={isLoading}
                />
                <button
                  onClick={() => handleSend()}
                  disabled={!input.trim() || isLoading}
                  className={cn(
                    "p-2 rounded-lg transition-all",
                    input.trim() && !isLoading
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "bg-muted text-muted-foreground cursor-not-allowed"
                  )}
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                ⚠️ 투자 조언이 아닌 참고용 분석입니다
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
