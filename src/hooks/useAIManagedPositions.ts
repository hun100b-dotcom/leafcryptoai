import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface AIManagedPosition {
  id: string;
  userId: string;
  signalId: string;
  allocatedAsset: number;
  entryPrice: number;
  currentPnl: number;
  status: 'ACTIVE' | 'WIN' | 'LOSS' | 'CANCELLED';
  closePrice: number | null;
  closedAt: Date | null;
  createdAt: Date;
  // Joined signal data
  signal?: {
    symbol: string;
    position: 'LONG' | 'SHORT';
    targetPrice: number;
    stopLoss: number;
    leverage: number;
  };
}

const USER_ID = 'anonymous-user'; // TODO: Replace with real auth

export function useAIManagedPositions() {
  const [positions, setPositions] = useState<AIManagedPosition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPositions = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('ai_managed_positions')
        .select(`
          *,
          ai_trading_signals (
            symbol,
            position,
            target_price,
            stop_loss,
            leverage
          )
        `)
        .eq('user_id', USER_ID)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      const mappedPositions: AIManagedPosition[] = (data || []).map(row => ({
        id: row.id,
        userId: row.user_id,
        signalId: row.signal_id,
        allocatedAsset: Number(row.allocated_asset),
        entryPrice: Number(row.entry_price),
        currentPnl: Number(row.current_pnl || 0),
        status: row.status as AIManagedPosition['status'],
        closePrice: row.close_price ? Number(row.close_price) : null,
        closedAt: row.closed_at ? new Date(row.closed_at) : null,
        createdAt: new Date(row.created_at),
        signal: row.ai_trading_signals ? {
          symbol: row.ai_trading_signals.symbol,
          position: row.ai_trading_signals.position as 'LONG' | 'SHORT',
          targetPrice: Number(row.ai_trading_signals.target_price),
          stopLoss: Number(row.ai_trading_signals.stop_loss),
          leverage: row.ai_trading_signals.leverage,
        } : undefined,
      }));

      setPositions(mappedPositions);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch AI managed positions:', err);
      setError('함께 진입 포지션을 불러오는데 실패했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  const joinSignal = async (signalId: string, allocatedAsset: number) => {
    try {
      // Get signal details
      const { data: signal, error: signalError } = await supabase
        .from('ai_trading_signals')
        .select('*')
        .eq('id', signalId)
        .single();

      if (signalError) throw signalError;

      // Create managed position via edge function (to bypass RLS)
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-join-signal`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            user_id: USER_ID,
            signal_id: signalId,
            allocated_asset: allocatedAsset,
            entry_price: signal.entry_price,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to join signal');
      }

      await fetchPositions();
      return { success: true };
    } catch (err) {
      console.error('Failed to join signal:', err);
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  };

  const leaveSignal = async (positionId: string) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-leave-signal`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            position_id: positionId,
            user_id: USER_ID,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to leave signal');
      }

      await fetchPositions();
      return { success: true };
    } catch (err) {
      console.error('Failed to leave signal:', err);
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  };

  useEffect(() => {
    fetchPositions();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('ai_managed_positions_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'ai_managed_positions' },
        () => fetchPositions()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Calculate stats
  const stats = {
    totalPositions: positions.length,
    activePositions: positions.filter(p => p.status === 'ACTIVE').length,
    totalAllocated: positions
      .filter(p => p.status === 'ACTIVE')
      .reduce((acc, p) => acc + p.allocatedAsset, 0),
    totalPnl: positions.reduce((acc, p) => acc + p.currentPnl, 0),
  };

  return {
    positions,
    stats,
    isLoading,
    error,
    joinSignal,
    leaveSignal,
    refetch: fetchPositions,
  };
}
