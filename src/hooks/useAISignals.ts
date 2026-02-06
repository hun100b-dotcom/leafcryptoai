import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface AISignal {
  id: string;
  symbol: string;
  position: 'LONG' | 'SHORT' | 'HOLD';
  entryPrice: number;
  targetPrice: number;
  stopLoss: number;
  leverage: number;
  confidence: number;
  sentimentScore: number | null;
  evidenceReasoning: string | null;
  referenceUrl: string | null;
  highestPriceReached: number | null;
  lowestPriceReached: number | null;
  isUrgent: boolean;
  urgencyReason: string | null;
  status: 'ACTIVE' | 'WIN' | 'LOSS' | 'CANCELLED';
  closePrice: number | null;
  pnlPercent: number | null;
  createdAt: Date;
  closedAt: Date | null;
}

export interface AIPerformanceStats {
  totalSignals: number;
  wins: number;
  losses: number;
  winRate: number;
  totalPnl: number;
  avgPnl: number;
  avgLeverage: number;
  bestTradePnl: number | null;
  worstTradePnl: number | null;
  avgHoldTimeMinutes: number | null;
}

export interface AISelfReview {
  id: string;
  periodStart: Date;
  periodEnd: Date;
  reviewContent: string;
  whatWentWell: string | null;
  whatToImprove: string | null;
  lessonsLearned: string | null;
  signalsReviewed: number;
  winRateThisPeriod: number | null;
  createdAt: Date;
}

export interface AIAdvice {
  id: string;
  symbol: string;
  adviceType: 'ENTRY' | 'HOLD' | 'EXIT' | 'WARNING' | 'EVENT' | 'URGENT';
  adviceContent: string;
  referenceUrl: string | null;
  confidence: number;
  isUrgent: boolean;
  urgencyReason: string | null;
  triggeredBy: string | null;
  priceAtTime: number | null;
  createdAt: Date;
}

export function useAISignals() {
  const [signals, setSignals] = useState<AISignal[]>([]);
  const [stats, setStats] = useState<AIPerformanceStats>({
    totalSignals: 0,
    wins: 0,
    losses: 0,
    winRate: 0,
    totalPnl: 0,
    avgPnl: 0,
    avgLeverage: 0,
    bestTradePnl: null,
    worstTradePnl: null,
    avgHoldTimeMinutes: null,
  });
  const [reviews, setReviews] = useState<AISelfReview[]>([]);
  const [advices, setAdvices] = useState<AIAdvice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSignals = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('ai_trading_signals')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      const mappedSignals: AISignal[] = (data || []).map(row => ({
        id: row.id,
        symbol: row.symbol,
        position: row.position as AISignal['position'],
        entryPrice: Number(row.entry_price),
        targetPrice: Number(row.target_price),
        stopLoss: Number(row.stop_loss),
        leverage: row.leverage,
        confidence: row.confidence,
        sentimentScore: row.sentiment_score ? Number(row.sentiment_score) : null,
        evidenceReasoning: row.evidence_reasoning,
        referenceUrl: row.reference_url,
        highestPriceReached: row.highest_price_reached ? Number(row.highest_price_reached) : null,
        lowestPriceReached: row.lowest_price_reached ? Number(row.lowest_price_reached) : null,
        isUrgent: row.is_urgent || false,
        urgencyReason: row.urgency_reason,
        status: row.status as AISignal['status'],
        closePrice: row.close_price ? Number(row.close_price) : null,
        pnlPercent: row.pnl_percent ? Number(row.pnl_percent) : null,
        createdAt: new Date(row.created_at),
        closedAt: row.closed_at ? new Date(row.closed_at) : null,
      }));

      setSignals(mappedSignals);

      // Calculate stats from signals
      const completed = mappedSignals.filter(s => s.status === 'WIN' || s.status === 'LOSS');
      const wins = completed.filter(s => s.status === 'WIN').length;
      const losses = completed.filter(s => s.status === 'LOSS').length;
      const totalPnl = completed.reduce((acc, s) => acc + (s.pnlPercent || 0), 0);
      const avgLeverage = completed.length > 0 
        ? completed.reduce((acc, s) => acc + s.leverage, 0) / completed.length 
        : 0;

      const pnlValues = completed.map(s => s.pnlPercent || 0);
      
      setStats({
        totalSignals: completed.length,
        wins,
        losses,
        winRate: completed.length > 0 ? (wins / completed.length) * 100 : 0,
        totalPnl,
        avgPnl: completed.length > 0 ? totalPnl / completed.length : 0,
        avgLeverage,
        bestTradePnl: pnlValues.length > 0 ? Math.max(...pnlValues) : null,
        worstTradePnl: pnlValues.length > 0 ? Math.min(...pnlValues) : null,
        avgHoldTimeMinutes: null, // Calculated on server
      });

    } catch (err) {
      console.error('Failed to fetch AI signals:', err);
      setError('AI 시그널을 불러오는데 실패했습니다');
    }
  };

  const fetchReviews = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('ai_self_reviews')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (fetchError) throw fetchError;

      const mappedReviews: AISelfReview[] = (data || []).map(row => ({
        id: row.id,
        periodStart: new Date(row.period_start),
        periodEnd: new Date(row.period_end),
        reviewContent: row.review_content,
        whatWentWell: row.what_went_well,
        whatToImprove: row.what_to_improve,
        lessonsLearned: row.lessons_learned,
        signalsReviewed: row.signals_reviewed,
        winRateThisPeriod: row.win_rate_this_period ? Number(row.win_rate_this_period) : null,
        createdAt: new Date(row.created_at),
      }));

      setReviews(mappedReviews);
    } catch (err) {
      console.error('Failed to fetch AI reviews:', err);
    }
  };

  const fetchAdvices = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('ai_advice_history')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (fetchError) throw fetchError;

      const mappedAdvices: AIAdvice[] = (data || []).map(row => ({
        id: row.id,
        symbol: row.symbol,
        adviceType: row.advice_type as AIAdvice['adviceType'],
        adviceContent: row.advice_content,
        referenceUrl: row.reference_url,
        confidence: row.confidence,
        isUrgent: row.is_urgent || false,
        urgencyReason: row.urgency_reason,
        triggeredBy: row.triggered_by,
        priceAtTime: row.price_at_time ? Number(row.price_at_time) : null,
        createdAt: new Date(row.created_at),
      }));

      setAdvices(mappedAdvices);
    } catch (err) {
      console.error('Failed to fetch AI advices:', err);
    }
  };

  useEffect(() => {
    const fetchAll = async () => {
      setIsLoading(true);
      await Promise.all([fetchSignals(), fetchReviews(), fetchAdvices()]);
      setIsLoading(false);
    };

    fetchAll();

    // Subscribe to realtime updates
    const signalsChannel = supabase
      .channel('ai_trading_signals_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'ai_trading_signals' },
        () => fetchSignals()
      )
      .subscribe();

    const advicesChannel = supabase
      .channel('ai_advice_history_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'ai_advice_history' },
        () => fetchAdvices()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(signalsChannel);
      supabase.removeChannel(advicesChannel);
    };
  }, []);

  return {
    signals,
    stats,
    reviews,
    advices,
    isLoading,
    error,
    refetch: () => Promise.all([fetchSignals(), fetchReviews(), fetchAdvices()]),
  };
}
