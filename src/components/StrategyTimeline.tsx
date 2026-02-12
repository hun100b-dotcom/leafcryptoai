/**
 * StrategyTimeline - 실시간 전략 수정 타임라인
 * 포지션별로 전략 수정의 수치적 근거를 실시간 박제
 */
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Clock, Shield, AlertTriangle, TrendingUp, Activity, Zap } from 'lucide-react';
import { StrategyTimelineEntry } from '@/hooks/useTrailingStop';
import { format } from 'date-fns';

interface StrategyTimelineProps {
  entries: StrategyTimelineEntry[];
  className?: string;
}

const typeConfig: Record<StrategyTimelineEntry['type'], { icon: typeof Clock; color: string; label: string }> = {
  TRAILING_STOP: { icon: Shield, color: 'text-long', label: '트레일링 스탑' },
  REGIME_SHIFT: { icon: Activity, color: 'text-primary', label: '국면 전환' },
  CIRCUIT_BREAKER: { icon: AlertTriangle, color: 'text-short', label: '서킷 브레이커' },
  POSITION_SIZE: { icon: TrendingUp, color: 'text-info', label: '비중 조정' },
  VOLATILITY: { icon: Zap, color: 'text-warning', label: '변동성 대응' },
};

export function StrategyTimeline({ entries, className }: StrategyTimelineProps) {
  if (entries.length === 0) return null;

  return (
    <div className={cn("space-y-1", className)}>
      <div className="flex items-center gap-1.5 mb-2">
        <Clock className="w-3 h-3 text-muted-foreground" />
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
          Strategy Timeline
        </span>
      </div>
      <div className="space-y-1 max-h-32 overflow-y-auto scrollbar-thin">
        <AnimatePresence mode="popLayout">
          {entries.slice(-5).map((entry) => {
            const config = typeConfig[entry.type];
            const Icon = config.icon;
            return (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, x: -10, height: 0 }}
                animate={{ opacity: 1, x: 0, height: 'auto' }}
                exit={{ opacity: 0, x: 10 }}
                className="flex items-start gap-2 text-[10px] p-1.5 rounded bg-accent/30 border border-border/50"
              >
                <Icon className={cn("w-3 h-3 mt-0.5 flex-shrink-0", config.color)} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-muted-foreground font-mono">
                      {format(entry.timestamp, 'HH:mm')}
                    </span>
                    <span className={cn("font-medium", config.color)}>
                      {entry.message}
                    </span>
                  </div>
                  <p className="text-muted-foreground truncate">{entry.detail}</p>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
