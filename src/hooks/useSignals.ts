import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AISignal } from '@/types/trading';

export function useSignals() {
  const [signals, setSignals] = useState<AISignal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Calculate stats from signals
  const stats = {
    totalSignals: signals.length,
    completedSignals: signals.filter(s => s.status === 'WIN' || s.status === 'LOSS').length,
    wins: signals.filter(s => s.status === 'WIN').length,
    losses: signals.filter(s => s.status === 'LOSS').length,
    winRate: 0,
    totalPnL: 0,
  };

  if (stats.completedSignals > 0) {
    stats.winRate = Math.round((stats.wins / stats.completedSignals) * 100);
  }

  // Calculate P&L
  stats.totalPnL = signals.reduce((acc, signal) => {
    if (signal.status === 'WIN') {
      const pnl = ((signal.targetPrice - signal.entryPrice) / signal.entryPrice) * 100 * signal.leverage;
      return acc + pnl;
    } else if (signal.status === 'LOSS') {
      const pnl = ((signal.stopLoss - signal.entryPrice) / signal.entryPrice) * 100 * signal.leverage;
      return acc + pnl;
    }
    return acc;
  }, 0);
  stats.totalPnL = Math.round(stats.totalPnL * 10) / 10;

  const fetchSignals = async () => {
    try {
      setIsLoading(true);
      const { data, error: fetchError } = await supabase
        .from('trading_signals')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      const mappedSignals: AISignal[] = (data || []).map(row => ({
        id: row.id,
        symbol: row.symbol,
        position: row.position as AISignal['position'],
        entryPrice: parseFloat(row.entry_price),
        targetPrice: parseFloat(row.target_price),
        stopLoss: parseFloat(row.stop_loss),
        leverage: row.leverage,
        timestamp: new Date(row.created_at),
        confidence: row.confidence,
        status: row.status as AISignal['status'],
        message: row.message || '',
        closedAt: row.closed_at ? new Date(row.closed_at) : undefined,
        closePrice: row.close_price ? parseFloat(row.close_price) : undefined,
      }));

      setSignals(mappedSignals);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch signals:', err);
      setError('시그널 데이터를 불러오는데 실패했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSignals();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('trading_signals_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'trading_signals',
        },
        () => {
          fetchSignals();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    signals,
    stats,
    isLoading,
    error,
    refetch: fetchSignals,
  };
}
