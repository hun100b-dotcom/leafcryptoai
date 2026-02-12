/**
 * TradeFootprintsOverlay - 차트 위 매매 이력 오버레이
 * Trade Footprints: 매수(▲), 매도(▼), 전략 수정(💡)
 * 클릭 시 당시의 신뢰도, 상관관계, 판단 근거 툴팁 표시
 */
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, Lightbulb, X, Eye, EyeOff } from 'lucide-react';
import { AISignal } from '@/hooks/useAISignals';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

interface TradeFootprintsOverlayProps {
  signals: AISignal[];
  className?: string;
}

export function TradeFootprintsOverlay({ signals, className }: TradeFootprintsOverlayProps) {
  const [showOverlay, setShowOverlay] = useState(true);
  const [selectedSignal, setSelectedSignal] = useState<AISignal | null>(null);
  const [enabledSignals, setEnabledSignals] = useState<Set<string>>(
    new Set(signals.map(s => s.id))
  );

  const toggleSignal = (id: string) => {
    setEnabledSignals(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const visibleSignals = signals.filter(s => enabledSignals.has(s.id));

  return (
    <div className={cn("relative", className)}>
      {/* Toggle Button */}
      <div className="absolute top-2 right-2 z-20 flex items-center gap-1">
        <Button
          size="sm"
          variant={showOverlay ? "default" : "outline"}
          onClick={() => setShowOverlay(!showOverlay)}
          className="h-6 px-2 text-[10px] gap-1"
        >
          {showOverlay ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
          Footprints
        </Button>
      </div>

      {/* Footprints Bar */}
      {showOverlay && (
        <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-background/90 to-transparent p-3">
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-thin pb-1">
            {visibleSignals.slice(-10).map((signal) => {
              const isLong = signal.position === 'LONG';
              const Icon = isLong ? TrendingUp : TrendingDown;
              const isWin = signal.status === 'WIN';
              const isLoss = signal.status === 'LOSS';

              return (
                <motion.button
                  key={signal.id}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  whileHover={{ scale: 1.3 }}
                  onClick={() => setSelectedSignal(signal)}
                  className={cn(
                    "flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-all border-2",
                    isLong ? "bg-long/20 border-long/50 text-long" : "bg-short/20 border-short/50 text-short",
                    isWin && "ring-2 ring-long/50",
                    isLoss && "ring-2 ring-short/50",
                    signal.status === 'ACTIVE' && "animate-pulse"
                  )}
                  title={`${signal.symbol} ${signal.position} - ${signal.confidence}%`}
                >
                  <Icon className="w-3.5 h-3.5" />
                </motion.button>
              );
            })}
          </div>

          {/* Per-Card Toggle */}
          <div className="flex items-center gap-1 mt-1 overflow-x-auto scrollbar-thin">
            {signals.slice(-10).map(s => (
              <button
                key={s.id}
                onClick={() => toggleSignal(s.id)}
                className={cn(
                  "text-[9px] px-1.5 py-0.5 rounded border flex-shrink-0",
                  enabledSignals.has(s.id)
                    ? "bg-primary/20 border-primary/30 text-primary"
                    : "bg-muted border-border text-muted-foreground"
                )}
              >
                {s.symbol}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Signal Detail Tooltip */}
      <AnimatePresence>
        {selectedSignal && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-20 left-1/2 -translate-x-1/2 z-30 w-72 trading-card p-3 border border-primary/30 shadow-lg"
          >
            <button
              onClick={() => setSelectedSignal(null)}
              className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-3.5 h-3.5" />
            </button>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className={cn(
                  "text-xs font-bold px-2 py-0.5 rounded",
                  selectedSignal.position === 'LONG' ? "bg-long/20 text-long" : "bg-short/20 text-short"
                )}>
                  {selectedSignal.position}
                </span>
                <span className="font-semibold text-sm">{selectedSignal.symbol}</span>
                <span className="text-xs text-muted-foreground">
                  {format(selectedSignal.createdAt, 'MM/dd HH:mm', { locale: ko })}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-[10px]">
                <div>
                  <p className="text-muted-foreground">신뢰도</p>
                  <p className="font-mono font-bold text-primary">{selectedSignal.confidence}%</p>
                </div>
                <div>
                  <p className="text-muted-foreground">레버리지</p>
                  <p className="font-mono font-bold">{selectedSignal.leverage}x</p>
                </div>
                <div>
                  <p className="text-muted-foreground">결과</p>
                  <p className={cn("font-mono font-bold",
                    selectedSignal.status === 'WIN' ? "text-long" :
                    selectedSignal.status === 'LOSS' ? "text-short" : "text-primary"
                  )}>
                    {selectedSignal.status === 'ACTIVE' ? '진행중' :
                     selectedSignal.pnlPercent ? `${selectedSignal.pnlPercent > 0 ? '+' : ''}${selectedSignal.pnlPercent.toFixed(1)}%` : '-'}
                  </p>
                </div>
              </div>

              {selectedSignal.evidenceReasoning && (
                <p className="text-[10px] text-muted-foreground leading-relaxed line-clamp-3">
                  {selectedSignal.evidenceReasoning}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
