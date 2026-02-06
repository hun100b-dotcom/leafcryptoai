import { AISignal } from '@/types/trading';
import { motion } from 'framer-motion';
import { 
  BarChart3, TrendingUp, TrendingDown, CheckCircle2, XCircle, 
  Target, Calendar, Percent, DollarSign, X, Info, RefreshCw
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface PerformanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  signals: AISignal[];
  stats: {
    totalSignals: number;
    completedSignals: number;
    wins: number;
    losses: number;
    winRate: number;
    totalPnL: number;
  };
}

export function PerformanceModal({ isOpen, onClose, signals, stats }: PerformanceModalProps) {
  if (!isOpen) return null;

  // Calculate statistics
  const completedSignals = signals.filter(s => s.status === 'WIN' || s.status === 'LOSS');
  const activeSignals = signals.filter(s => s.status === 'ACTIVE');

  // Stats by coin
  const statsByCoin = signals.reduce((acc, signal) => {
    if (!acc[signal.symbol]) {
      acc[signal.symbol] = { wins: 0, losses: 0, active: 0, pnl: 0 };
    }
    if (signal.status === 'WIN') {
      acc[signal.symbol].wins++;
      const pnl = ((signal.targetPrice - signal.entryPrice) / signal.entryPrice) * 100 * signal.leverage;
      acc[signal.symbol].pnl += pnl;
    } else if (signal.status === 'LOSS') {
      acc[signal.symbol].losses++;
      const pnl = ((signal.stopLoss - signal.entryPrice) / signal.entryPrice) * 100 * signal.leverage;
      acc[signal.symbol].pnl += pnl;
    } else if (signal.status === 'ACTIVE') {
      acc[signal.symbol].active++;
    }
    return acc;
  }, {} as Record<string, { wins: number; losses: number; active: number; pnl: number }>);

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

        <div className="overflow-y-auto max-h-[calc(90vh-100px)]">
          {/* Win Rate Explanation */}
          <div className="mx-6 mt-6 p-4 rounded-lg bg-info/10 border border-info/30">
            <div className="flex items-start gap-2">
              <Info className="w-5 h-5 text-info flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-info mb-1">AI 승률 측정 기준</p>
                <p className="text-muted-foreground">
                  진입가 대비 <span className="text-long font-semibold">목표가(TP) 선도달 시 승리</span>, 
                  <span className="text-short font-semibold"> 손절가(SL) 선도달 시 패배</span>로 판정합니다.
                </p>
                <p className="font-mono mt-2 text-foreground bg-accent/30 p-2 rounded text-xs">
                  Win Rate = (성공 ÷ (성공 + 실패)) × 100
                </p>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="trading-card p-4 text-center">
              <Percent className="w-5 h-5 mx-auto mb-2 text-primary" />
              <p className="text-3xl font-bold font-mono text-primary">{stats.winRate}%</p>
              <p className="text-xs text-muted-foreground">승률</p>
            </div>
            
            <div className="trading-card p-4 text-center">
              <DollarSign className="w-5 h-5 mx-auto mb-2 text-long" />
              <p className={cn(
                "text-3xl font-bold font-mono",
                stats.totalPnL >= 0 ? "text-long" : "text-short"
              )}>
                {stats.totalPnL >= 0 ? '+' : ''}{stats.totalPnL.toFixed(1)}%
              </p>
              <p className="text-xs text-muted-foreground">누적 수익률</p>
            </div>
            
            <div className="trading-card p-4 text-center">
              <CheckCircle2 className="w-5 h-5 mx-auto mb-2 text-long" />
              <p className="text-3xl font-bold font-mono text-long">{stats.wins}</p>
              <p className="text-xs text-muted-foreground">성공</p>
            </div>
            
            <div className="trading-card p-4 text-center">
              <XCircle className="w-5 h-5 mx-auto mb-2 text-short" />
              <p className="text-3xl font-bold font-mono text-short">{stats.losses}</p>
              <p className="text-xs text-muted-foreground">실패</p>
            </div>
          </div>

          {/* No Data State */}
          {signals.length === 0 && (
            <div className="text-center py-12 px-6">
              <RefreshCw className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium">아직 시그널이 없습니다</p>
              <p className="text-sm text-muted-foreground mt-1">
                새로운 AI 시그널이 생성되면 여기에 기록됩니다
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                승률은 0%로 초기화되었습니다
              </p>
            </div>
          )}

          {/* Coin Stats */}
          {Object.keys(statsByCoin).length > 0 && (
            <div className="px-6 pb-2">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                코인별 성과
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {Object.entries(statsByCoin).map(([coin, coinStats]) => {
                  const coinWinRate = coinStats.wins + coinStats.losses > 0
                    ? Math.round((coinStats.wins / (coinStats.wins + coinStats.losses)) * 100)
                    : 0;
                  return (
                    <div key={coin} className="p-3 rounded-lg bg-accent/50 border border-border">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold">{coin}</span>
                        <span className={cn(
                          "text-xs font-mono font-bold",
                          coinStats.pnl >= 0 ? "text-long" : "text-short"
                        )}>
                          {coinStats.pnl >= 0 ? '+' : ''}{coinStats.pnl.toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex gap-2 text-xs">
                        <span className="text-long">W:{coinStats.wins}</span>
                        <span className="text-short">L:{coinStats.losses}</span>
                        {coinStats.active > 0 && <span className="text-primary">A:{coinStats.active}</span>}
                        <span className="ml-auto text-muted-foreground">{coinWinRate}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Signal History */}
          {signals.length > 0 && (
            <div className="p-6 max-h-[300px] overflow-y-auto scrollbar-thin">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                시그널 히스토리 ({signals.length}개)
              </h3>
              <div className="space-y-2">
                {signals.map(signal => {
                  const pnl = signal.status === 'WIN'
                    ? ((signal.targetPrice - signal.entryPrice) / signal.entryPrice) * 100 * signal.leverage
                    : signal.status === 'LOSS'
                    ? ((signal.stopLoss - signal.entryPrice) / signal.entryPrice) * 100 * signal.leverage
                    : 0;

                  return (
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
                        <div className="flex items-center gap-2">
                          {(signal.status === 'WIN' || signal.status === 'LOSS') && (
                            <span className={cn(
                              "font-mono font-bold text-sm",
                              pnl >= 0 ? 'text-long' : 'text-short'
                            )}>
                              {pnl >= 0 ? '+' : ''}{pnl.toFixed(1)}%
                            </span>
                          )}
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
                            {signal.status === 'WIN' ? '익절' : signal.status === 'LOSS' ? '손절' : signal.status}
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDistanceToNow(signal.timestamp, { addSuffix: true, locale: ko })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
