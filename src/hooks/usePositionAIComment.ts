import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PositionContext {
  id: string;
  symbol: string;
  position: 'LONG' | 'SHORT';
  entryPrice: number;
  targetPrice: number;
  stopLoss: number;
  leverage: number;
  currentPrice: number;
  pnlPercent: number;
}

interface AIComment {
  positionId: string;
  comment: string;
  sentiment: 'positive' | 'neutral' | 'negative' | 'urgent';
  timestamp: Date;
}

const AI_MENTOR_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-mentor`;

export function usePositionAIComment() {
  const [comments, setComments] = useState<Map<string, AIComment>>(new Map());
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());

  const generateComment = useCallback(async (position: PositionContext) => {
    const { id, symbol, position: posType, entryPrice, targetPrice, stopLoss, leverage, currentPrice, pnlPercent } = position;

    // Determine urgency and sentiment
    const distanceToTP = posType === 'LONG'
      ? ((targetPrice - currentPrice) / currentPrice) * 100
      : ((currentPrice - targetPrice) / currentPrice) * 100;
    
    const distanceToSL = posType === 'LONG'
      ? ((currentPrice - stopLoss) / currentPrice) * 100
      : ((stopLoss - currentPrice) / currentPrice) * 100;

    // Generate simple local comment first (fast)
    let sentiment: AIComment['sentiment'] = 'neutral';
    let quickComment = '';

    if (distanceToSL < 1) {
      sentiment = 'urgent';
      quickComment = `⚠️ 손절가 임박! SL까지 ${distanceToSL.toFixed(1)}% 남음`;
    } else if (distanceToTP < 2) {
      sentiment = 'positive';
      quickComment = `🎯 목표가 근접! TP까지 ${distanceToTP.toFixed(1)}% 남음`;
    } else if (pnlPercent > 10) {
      sentiment = 'positive';
      quickComment = `📈 수익 중! +${pnlPercent.toFixed(1)}% 수익 실현 고려`;
    } else if (pnlPercent < -5) {
      sentiment = 'negative';
      quickComment = `📉 손실 확대 중. 손절 라인 ${distanceToSL.toFixed(1)}% 여유`;
    } else if (pnlPercent >= 0) {
      sentiment = 'positive';
      quickComment = `✅ 양호. TP까지 ${distanceToTP.toFixed(1)}%, SL까지 ${distanceToSL.toFixed(1)}%`;
    } else {
      sentiment = 'neutral';
      quickComment = `⏳ 관망. 현재 ${pnlPercent.toFixed(1)}%, SL까지 ${distanceToSL.toFixed(1)}%`;
    }

    setComments(prev => {
      const next = new Map(prev);
      next.set(id, {
        positionId: id,
        comment: quickComment,
        sentiment,
        timestamp: new Date(),
      });
      return next;
    });

    return { comment: quickComment, sentiment };
  }, []);

  const updateAllComments = useCallback(async (positions: PositionContext[]) => {
    for (const pos of positions) {
      await generateComment(pos);
    }
  }, [generateComment]);

  const getComment = useCallback((positionId: string) => {
    return comments.get(positionId);
  }, [comments]);

  return {
    comments,
    loadingIds,
    generateComment,
    updateAllComments,
    getComment,
  };
}
