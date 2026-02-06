import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAISignals, AISignal } from '@/hooks/useAISignals';
import { cn } from '@/lib/utils';
import { 
  TrendingUp, TrendingDown, Trophy, BarChart3, 
  RefreshCw, Trash2, CheckCircle2, XCircle, Loader2
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export function PerformanceAnalysisTab() {
  const { signals, stats, isLoading, refetch } = useAISignals();
  const [isResetting, setIsResetting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filter completed signals only
  const completedSignals = signals.filter(s => s.status === 'WIN' || s.status === 'LOSS');

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
    toast.success('데이터를 새로고침했습니다');
  };

  const handleReset = async () => {
    if (!confirm('⚠️ 모든 AI 거래 기록, 함께 진입 포지션, 내 포지션을 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.')) {
      return;
    }

    setIsResetting(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-reset-data`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ user_id: 'anonymous-user' }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to reset data');
      }

      await refetch();
      toast.success('모든 기록이 초기화되었습니다');
    } catch (err) {
      console.error('Reset failed:', err);
      toast.error('초기화에 실패했습니다');
    } finally {
      setIsResetting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Stats Overview - No top padding */}
      <div className="grid grid-cols-2 gap-2 p-3 border-b border-border bg-card/50">
        <div className="p-3 rounded-lg bg-accent/50 text-center">
          <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
            <Trophy className="w-3 h-3" />
            <span className="text-xs">승률</span>
          </div>
          <p className={cn(
            "text-xl font-bold",
            stats.winRate >= 50 ? "text-long" : "text-short"
          )}>
            {stats.winRate.toFixed(1)}%
          </p>
          <p className="text-[10px] text-muted-foreground">
            {stats.wins}승 {stats.losses}패
          </p>
        </div>

        <div className="p-3 rounded-lg bg-accent/50 text-center">
          <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
            <TrendingUp className="w-3 h-3" />
            <span className="text-xs">총 수익률</span>
          </div>
          <p className={cn(
            "text-xl font-bold",
            stats.totalPnl >= 0 ? "text-long" : "text-short"
          )}>
            {stats.totalPnl >= 0 ? '+' : ''}{stats.totalPnl.toFixed(1)}%
          </p>
        </div>

        <div className="p-3 rounded-lg bg-accent/50 text-center">
          <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
            <BarChart3 className="w-3 h-3" />
            <span className="text-xs">총 거래</span>
          </div>
          <p className="text-xl font-bold">{stats.totalSignals}</p>
        </div>

        <div className="p-3 rounded-lg bg-accent/50 text-center">
          <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
            <span className="text-xs">평균 레버리지</span>
          </div>
          <p className="text-xl font-bold">{stats.avgLeverage.toFixed(1)}x</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 p-3 border-b border-border">
        <Button
          size="sm"
          variant="outline"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex-1"
        >
          {isRefreshing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4 mr-1" />
          )}
          새로고침
        </Button>
        <Button
          size="sm"
          variant="destructive"
          onClick={handleReset}
          disabled={isResetting}
          className="flex-1"
        >
          {isResetting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Trash2 className="w-4 h-4 mr-1" />
          )}
          초기화
        </Button>
      </div>

      {/* Trade History */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin">
        {completedSignals.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            완료된 거래가 없습니다
          </div>
        ) : (
          completedSignals.slice(0, 20).map((signal, index) => (
            <SignalHistoryCard key={signal.id} signal={signal} index={index} />
          ))
        )}
      </div>
    </div>
  );
}

function SignalHistoryCard({ signal, index }: { signal: AISignal; index: number }) {
  const isWin = signal.status === 'WIN';

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03 }}
      className={cn(
        "p-3 rounded-lg border-l-4",
        isWin ? "border-l-long bg-long/5" : "border-l-short bg-short/5"
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isWin ? (
            <CheckCircle2 className="w-4 h-4 text-long" />
          ) : (
            <XCircle className="w-4 h-4 text-short" />
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm">{signal.symbol}</span>
              <span className={cn(
                "text-[10px] px-1.5 py-0.5 rounded",
                signal.position === 'LONG' ? "bg-long/20 text-long" : "bg-short/20 text-short"
              )}>
                {signal.position}
              </span>
              <span className="text-[10px] text-muted-foreground">{signal.leverage}x</span>
            </div>
            <p className="text-[10px] text-muted-foreground">
              ${signal.entryPrice.toLocaleString()} → ${signal.closePrice?.toLocaleString() || '-'}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className={cn(
            "font-bold text-sm",
            (signal.pnlPercent || 0) >= 0 ? "text-long" : "text-short"
          )}>
            {(signal.pnlPercent || 0) >= 0 ? '+' : ''}{signal.pnlPercent?.toFixed(2) || '0'}%
          </p>
          <p className="text-[10px] text-muted-foreground">
            {formatDistanceToNow(signal.createdAt, { addSuffix: true, locale: ko })}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
