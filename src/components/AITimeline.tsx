import { AISignal } from '@/types/trading';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Bot, TrendingUp, TrendingDown, Minus, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

interface AITimelineProps {
  signals: AISignal[];
}

export function AITimeline({ signals }: AITimelineProps) {
  const getStatusIcon = (status: AISignal['status']) => {
    switch (status) {
      case 'WIN':
        return <CheckCircle2 className="w-4 h-4 text-long" />;
      case 'LOSS':
        return <XCircle className="w-4 h-4 text-short" />;
      case 'ACTIVE':
        return <Clock className="w-4 h-4 text-primary animate-pulse" />;
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getPositionIcon = (position: AISignal['position']) => {
    switch (position) {
      case 'LONG':
        return <TrendingUp className="w-4 h-4" />;
      case 'SHORT':
        return <TrendingDown className="w-4 h-4" />;
      default:
        return <Minus className="w-4 h-4" />;
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-border flex items-center gap-2">
        <div className="relative">
          <Bot className="w-5 h-5 text-primary" />
          <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-long animate-pulse" />
        </div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          AI 멘토 리딩
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-4">
        {signals.map((signal, index) => (
          <motion.div
            key={signal.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className={cn(
              "trading-card p-4 border-l-4",
              signal.position === 'LONG' && "border-l-long",
              signal.position === 'SHORT' && "border-l-short",
              signal.position === 'HOLD' && "border-l-muted-foreground"
            )}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className={cn(
                  "flex items-center gap-1 px-2 py-1 rounded text-xs font-bold",
                  signal.position === 'LONG' && "bg-long/20 text-long",
                  signal.position === 'SHORT' && "bg-short/20 text-short",
                  signal.position === 'HOLD' && "bg-muted text-muted-foreground"
                )}>
                  {getPositionIcon(signal.position)}
                  {signal.position}
                </span>
                <span className="font-semibold text-sm">{signal.symbol}</span>
              </div>
              {getStatusIcon(signal.status)}
            </div>

            <p className="text-sm leading-relaxed mb-3 text-foreground/90">
              {signal.message}
            </p>

            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="bg-accent/50 rounded px-2 py-1">
                <span className="text-muted-foreground">진입</span>
                <p className="font-mono font-semibold">${signal.entryPrice.toLocaleString()}</p>
              </div>
              <div className="bg-long/10 rounded px-2 py-1">
                <span className="text-long/80">TP</span>
                <p className="font-mono font-semibold text-long">${signal.targetPrice.toLocaleString()}</p>
              </div>
              <div className="bg-short/10 rounded px-2 py-1">
                <span className="text-short/80">SL</span>
                <p className="font-mono font-semibold text-short">${signal.stopLoss.toLocaleString()}</p>
              </div>
            </div>

            <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
              <span>레버리지 {signal.leverage}x</span>
              <span>{formatDistanceToNow(signal.timestamp, { addSuffix: true, locale: ko })}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
