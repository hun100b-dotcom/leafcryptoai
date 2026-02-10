import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface UserPosition {
  id: string;
  symbol: string;
  position: 'LONG' | 'SHORT';
  entryPrice: number;
  targetPrice: number;
  stopLoss: number;
  leverage: number;
  status: 'ACTIVE' | 'WIN' | 'LOSS';
  closePrice?: number;
  closedAt?: Date;
  createdAt: Date;
  message?: string;
}

export interface UserSettings {
  userId: string;
  initialAsset: number;
}

const DEFAULT_USER_ID = 'default_user';

export function useUserPositions() {
  const [positions, setPositions] = useState<UserPosition[]>([]);
  const [settings, setSettings] = useState<UserSettings>({ userId: DEFAULT_USER_ID, initialAsset: 1000 });
  const [isLoading, setIsLoading] = useState(true);

  // Calculate stats for completed positions only (base stats)
  const getBaseStats = useCallback(() => {
    const completedPositions = positions.filter(p => p.status === 'WIN' || p.status === 'LOSS');
    const wins = positions.filter(p => p.status === 'WIN').length;
    const losses = positions.filter(p => p.status === 'LOSS').length;
    
    let closedPnL = 0;
    positions.forEach(pos => {
      if (pos.status === 'WIN' || pos.status === 'LOSS') {
        // Use actual close_price if available, otherwise fall back to target/stop
        const exitPrice = pos.closePrice 
          ?? (pos.status === 'WIN' ? pos.targetPrice : pos.stopLoss);
        const pnl = pos.position === 'LONG'
          ? ((exitPrice - pos.entryPrice) / pos.entryPrice) * 100 * pos.leverage
          : ((pos.entryPrice - exitPrice) / pos.entryPrice) * 100 * pos.leverage;
        closedPnL += pnl;
      }
    });

    return {
      totalPositions: positions.length,
      completedPositions: completedPositions.length,
      wins,
      losses,
      winRate: completedPositions.length > 0 ? Math.round((wins / completedPositions.length) * 100) : 0,
      closedPnL: Math.round(closedPnL * 10) / 10,
    };
  }, [positions]);

  // Function to calculate real-time stats with live prices
  const calculateRealTimeStats = useCallback((
    priceGetter: (symbol: string) => number | undefined,
    aiPositions?: { 
      allocatedAsset: number; 
      entryPrice: number; 
      status: string;
      closePrice?: number;
      currentPnl?: number;
      signal?: { symbol: string; position: 'LONG' | 'SHORT'; leverage: number } 
    }[]
  ) => {
    const baseStats = getBaseStats();
    const marginPercent = 0.1; // 10% of initial asset per position

    // Calculate unrealized P&L for active manual positions
    let unrealizedManualPnL = 0;
    let activeManualMargin = 0;
    
    positions.filter(p => p.status === 'ACTIVE').forEach(pos => {
      const currentPrice = priceGetter(pos.symbol);
      if (currentPrice) {
        const pnlPercent = pos.position === 'LONG'
          ? ((currentPrice - pos.entryPrice) / pos.entryPrice) * 100 * pos.leverage
          : ((pos.entryPrice - currentPrice) / pos.entryPrice) * 100 * pos.leverage;
        
        const margin = settings.initialAsset * marginPercent;
        activeManualMargin += margin;
        unrealizedManualPnL += margin * (pnlPercent / 100);
      }
    });

    // Calculate AI positions P&L (both active and closed)
    let unrealizedAIPnL = 0;
    let activeAIMargin = 0;
    let closedAIPnL = 0;
    let aiWins = 0;
    let aiLosses = 0;
    
    if (aiPositions) {
      aiPositions.forEach(pos => {
        if (pos.status === 'ACTIVE') {
          // Active AI positions: unrealized P&L
          if (pos.signal) {
            const currentPrice = priceGetter(pos.signal.symbol);
            if (currentPrice) {
              const pnlPercent = pos.signal.position === 'LONG'
                ? ((currentPrice - pos.entryPrice) / pos.entryPrice) * 100 * pos.signal.leverage
                : ((pos.entryPrice - currentPrice) / pos.entryPrice) * 100 * pos.signal.leverage;
              
              activeAIMargin += pos.allocatedAsset;
              unrealizedAIPnL += pos.allocatedAsset * (pnlPercent / 100);
            }
          }
        } else if (pos.status === 'WIN' || pos.status === 'LOSS' || pos.status === 'CANCELLED') {
          // Closed AI positions: confirmed P&L
          if (pos.currentPnl !== undefined && pos.currentPnl !== null) {
            closedAIPnL += pos.allocatedAsset * (pos.currentPnl / 100);
          }
          if (pos.status === 'WIN') aiWins++;
          if (pos.status === 'LOSS') aiLosses++;
        }
      });
    }

    // Calculate closed manual P&L in dollar amount
    const closedManualPnLAmount = settings.initialAsset * (baseStats.closedPnL / 100);
    
    // Total current asset = initial + closed manual P&L + closed AI P&L + unrealized P&L
    const totalUnrealizedPnL = unrealizedManualPnL + unrealizedAIPnL;
    const currentAsset = settings.initialAsset + closedManualPnLAmount + closedAIPnL + totalUnrealizedPnL;
    const totalPnLPercent = settings.initialAsset > 0 
      ? ((currentAsset - settings.initialAsset) / settings.initialAsset) * 100 
      : 0;

    // Combine manual + AI wins/losses
    const totalWins = baseStats.wins + aiWins;
    const totalLosses = baseStats.losses + aiLosses;
    const totalCompleted = totalWins + totalLosses;

    return {
      ...baseStats,
      wins: totalWins,
      losses: totalLosses,
      winRate: totalCompleted > 0 ? Math.round((totalWins / totalCompleted) * 100) : 0,
      totalPnL: Math.round(totalPnLPercent * 10) / 10,
      currentAsset: Math.round(currentAsset * 100) / 100,
      unrealizedPnL: Math.round(totalUnrealizedPnL * 100) / 100,
      activeMargin: Math.round((activeManualMargin + activeAIMargin) * 100) / 100,
      availableMargin: Math.round((settings.initialAsset - activeManualMargin - activeAIMargin) * 100) / 100,
    };
  }, [positions, settings, getBaseStats]);

  // Static stats (without real-time prices)
  const stats = {
    ...getBaseStats(),
    totalPnL: getBaseStats().closedPnL,
    currentAsset: Math.round(settings.initialAsset * (1 + getBaseStats().closedPnL / 100) * 100) / 100,
    unrealizedPnL: 0,
    activeMargin: 0,
    availableMargin: settings.initialAsset,
  };

  const fetchPositions = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('user_positions')
        .select('*')
        .eq('user_id', DEFAULT_USER_ID)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mapped: UserPosition[] = (data || []).map(row => ({
        id: row.id,
        symbol: row.symbol,
        position: row.position as 'LONG' | 'SHORT',
        entryPrice: Number(row.entry_price),
        targetPrice: Number(row.target_price),
        stopLoss: Number(row.stop_loss),
        leverage: row.leverage,
        status: row.status as 'ACTIVE' | 'WIN' | 'LOSS',
        closePrice: row.close_price ? Number(row.close_price) : undefined,
        closedAt: row.closed_at ? new Date(row.closed_at) : undefined,
        createdAt: new Date(row.created_at),
        message: row.message || undefined,
      }));

      setPositions(mapped);
    } catch (err) {
      console.error('Failed to fetch positions:', err);
    }
  }, []);

  const fetchSettings = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', DEFAULT_USER_ID)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setSettings({
          userId: data.user_id,
          initialAsset: Number(data.initial_asset),
        });
      }
    } catch (err) {
      console.error('Failed to fetch settings:', err);
    }
  }, []);

  const updateInitialAsset = async (amount: number) => {
    try {
      const { data: existing } = await supabase
        .from('user_settings')
        .select('id')
        .eq('user_id', DEFAULT_USER_ID)
        .single();

      if (existing) {
        await supabase
          .from('user_settings')
          .update({ initial_asset: amount, updated_at: new Date().toISOString() })
          .eq('user_id', DEFAULT_USER_ID);
      } else {
        await supabase
          .from('user_settings')
          .insert({ user_id: DEFAULT_USER_ID, initial_asset: amount });
      }

      setSettings(prev => ({ ...prev, initialAsset: amount }));
    } catch (err) {
      console.error('Failed to update initial asset:', err);
    }
  };

  // Deposit: Add to initial asset
  const depositAsset = async (amount: number) => {
    if (amount <= 0) return;
    const newAmount = settings.initialAsset + amount;
    await updateInitialAsset(newAmount);
  };

  // Withdraw: Subtract from initial asset
  const withdrawAsset = async (amount: number) => {
    if (amount <= 0 || amount > settings.initialAsset) return;
    const newAmount = settings.initialAsset - amount;
    await updateInitialAsset(newAmount);
  };

  const addPosition = async (position: Omit<UserPosition, 'id' | 'createdAt' | 'status'>) => {
    try {
      const { error } = await supabase
        .from('user_positions')
        .insert({
          user_id: DEFAULT_USER_ID,
          symbol: position.symbol,
          position: position.position,
          entry_price: position.entryPrice,
          target_price: position.targetPrice,
          stop_loss: position.stopLoss,
          leverage: position.leverage,
          message: position.message,
        });

      if (error) throw error;
      await fetchPositions();
    } catch (err) {
      console.error('Failed to add position:', err);
      throw err;
    }
  };

  const closePosition = async (id: string, status: 'WIN' | 'LOSS', closePrice: number) => {
    try {
      const { error } = await supabase
        .from('user_positions')
        .update({
          status,
          close_price: closePrice,
          closed_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;
      await fetchPositions();
    } catch (err) {
      console.error('Failed to close position:', err);
      throw err;
    }
  };

  const deletePosition = async (id: string) => {
    try {
      const { error } = await supabase
        .from('user_positions')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchPositions();
    } catch (err) {
      console.error('Failed to delete position:', err);
      throw err;
    }
  };

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      await Promise.all([fetchPositions(), fetchSettings()]);
      setIsLoading(false);
    };
    load();

    // Realtime subscription
    const channel = supabase
      .channel('user_positions_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_positions' }, () => {
        fetchPositions();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchPositions, fetchSettings]);

  return {
    positions,
    settings,
    stats,
    isLoading,
    addPosition,
    closePosition,
    deletePosition,
    updateInitialAsset,
    depositAsset,
    withdrawAsset,
    calculateRealTimeStats,
    refetch: fetchPositions,
  };
}
