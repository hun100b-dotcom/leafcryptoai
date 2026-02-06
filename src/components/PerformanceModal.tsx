import { AISignal } from '@/types/trading';
import { motion } from 'framer-motion';
import { 
  BarChart3, TrendingUp, TrendingDown, CheckCircle2, XCircle, 
  Target, Calendar, Percent, DollarSign, X 
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface PerformanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  signals: AISignal[];
}

export function PerformanceModal({ isOpen, onClose, signals }: PerformanceModalProps) {
  if (!isOpen) return null;

  // Calculate statistics
  const completedSignals = signals.filter(s => s.status === 'WIN' || s.status === 'LOSS');
  const wins = completedSignals.filter(s => s.status === 'WIN').length;
  const losses = completedSignals.filter(s => s.status === 'LOSS').length;
  const winRate = completedSignals.length > 0 
    ? Math.round((wins / completedSignals.length) * 100) 
    : 0;
  
  // Mock cumulative P&L calculation
  const totalPnL = signals.reduce((acc, signal) => {
    if (signal.status === 'WIN') {
      const pnl = ((signal.targetPrice - signal.entryPrice) / signal.entryPrice) * 100 * signal.leverage;
      return acc + pnl;
    } else if (signal.status === 'LOSS') {
      const pnl = ((signal.stopLoss - signal.entryPrice) / signal.entryPrice) * 100 * signal.leverage;
      return acc + pnl;
    }
    return acc;
  }, 0);

  // Stats by coin
  const statsByCoin = signals.reduce((acc, signal) => {
    if (!acc[signal.symbol]) {
      acc[signal.symbol] = { wins: 0, losses: 0, active: 0 };
    }
    if (signal.status === 'WIN') acc[signal.symbol].wins++;
    else if (signal.status === 'LOSS') acc[signal.symbol].losses++;
    else if (signal.status === 'ACTIVE') acc[signal.symbol].active++;
    return acc;
  }, {} as Record<string, { wins: number; losses: number; active: number }>);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="trading-card w-full max-w-3xl max-h-[90vh] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/20">
              <BarChart3 className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold">AI 성과 기록</h2>
              <p className="text-sm text-muted-foreground">P&L Performance Dashboard</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-accent transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stats Grid */}
        <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="trading-card p-4 text-center">
            <Percent className="w-5 h-5 mx-auto mb-2 text-primary" />
            <p className="text-3xl font-bold font-mono text-primary">{winRate}%</p>
            <p className="text-xs text-muted-foreground">승률</p>
          </div>
          
          <div className="trading-card p-4 text-center">
            <DollarSign className="w-5 h-5 mx-auto mb-2 text-long" />
            <p className={cn(
              "text-3xl font-bold font-mono",
              totalPnL >= 0 ? "text-long" : "text-short"
            )}>
              {totalPnL >= 0 ? '+' : ''}{totalPnL.toFixed(1)}%
            </p>
            <p className="text-xs text-muted-foreground">누적 수익률</p>
          </div>
          
          <div className="trading-card p-4 text-center">
            <CheckCircle2 className="w-5 h-5 mx-auto mb-2 text-long" />
            <p className="text-3xl font-bold font-mono text-long">{wins}</p>
            <p className="text-xs text-muted-foreground">성공</p>
          </div>
          
          <div className="trading-card p-4 text-center">
            <XCircle className="w-5 h-5 mx-auto mb-2 text-short" />
            <p className="text-3xl font-bold font-mono text-short">{losses}</p>
            <p className="text-xs text-muted-foreground">실패</p>
          </div>
        </div>

        {/* Coin Stats */}
        <div className="px-6 pb-2">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            코인별 성과
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {Object.entries(statsByCoin).map(([coin, stats]) => {
              const coinWinRate = stats.wins + stats.losses > 0
                ? Math.round((stats.wins / (stats.wins + stats.losses)) * 100)
                : 0;
              return (
                <div key={coin} className="p-3 rounded-lg bg-accent/50 border border-border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold">{coin}</span>
                    <span className={cn(
                      "text-xs font-mono font-bold",
                      coinWinRate >= 60 ? "text-long" : coinWinRate >= 40 ? "text-primary" : "text-short"
                    )}>
                      {coinWinRate}%
                    </span>
                  </div>
                  <div className="flex gap-2 text-xs">
                    <span className="text-long">W:{stats.wins}</span>
                    <span className="text-short">L:{stats.losses}</span>
                    {stats.active > 0 && <span className="text-primary">A:{stats.active}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Signal History */}
        <div className="p-6 max-h-[300px] overflow-y-auto scrollbar-thin">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            시그널 히스토리
          </h3>
          <div className="space-y-2">
            {signals.map(signal => (
              <div
                key={signal.id}
                className={cn(
                  "flex items-center justify-between p-3 rounded-lg border",
                  signal.status === 'WIN' && "bg-long/5 border-long/30",
                  signal.status === 'LOSS' && "bg-short/5 border-short/30",
                  signal.status === 'ACTIVE' && "bg-primary/5 border-primary/30",
                  signal.status === 'PENDING' && "bg-muted border-border"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "p-1.5 rounded",
                    signal.position === 'LONG' ? "bg-long/20" : "bg-short/20"
                  )}>
                    {signal.position === 'LONG' ? (
                      <TrendingUp className="w-4 h-4 text-long" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-short" />
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{signal.symbol}/USDT</p>
                    <p className="text-xs text-muted-foreground">
                      {signal.position} · {signal.leverage}x · 
                      진입 ${signal.entryPrice.toLocaleString()}
                    </p>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className={cn(
                    "inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-bold",
                    signal.status === 'WIN' && "bg-long/20 text-long",
                    signal.status === 'LOSS' && "bg-short/20 text-short",
                    signal.status === 'ACTIVE' && "bg-primary/20 text-primary",
                    signal.status === 'PENDING' && "bg-muted text-muted-foreground"
                  )}>
                    {signal.status === 'WIN' && <CheckCircle2 className="w-3 h-3" />}
                    {signal.status === 'LOSS' && <XCircle className="w-3 h-3" />}
                    {signal.status === 'ACTIVE' && <Target className="w-3 h-3" />}
                    {signal.status === 'PENDING' && <Calendar className="w-3 h-3" />}
                    {signal.status}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(signal.timestamp, { addSuffix: true, locale: ko })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
