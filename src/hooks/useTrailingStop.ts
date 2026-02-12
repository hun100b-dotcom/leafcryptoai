/**
 * useTrailingStop - 동적 트레일링 스탑 로직
 * 수익 발생 시 손절가를 자동으로 상향 조정하는 리스크 관리 엔진
 */
import { useState, useEffect, useCallback, useRef } from 'react';

export interface TrailingStopState {
  originalStopLoss: number;
  currentStopLoss: number;
  highestPnl: number;
  adjustments: StrategyTimelineEntry[];
}

export interface StrategyTimelineEntry {
  id: string;
  timestamp: Date;
  type: 'TRAILING_STOP' | 'REGIME_SHIFT' | 'CIRCUIT_BREAKER' | 'POSITION_SIZE' | 'VOLATILITY';
  message: string;
  detail: string;
}

interface TrailingStopConfig {
  /** 트레일링 활성화 최소 수익률 (%) */
  activationThreshold: number;
  /** 고점 대비 되돌림 비율 (%) - 이만큼 되돌리면 손절 */
  trailPercent: number;
}

const DEFAULT_CONFIG: TrailingStopConfig = {
  activationThreshold: 1.0,
  trailPercent: 0.5,
};

/**
 * 실시간 가격을 기반으로 트레일링 스탑을 계산
 */
export function useTrailingStop(
  entryPrice: number,
  currentPrice: number | undefined,
  originalStopLoss: number,
  position: 'LONG' | 'SHORT',
  leverage: number,
  isActive: boolean,
  config: TrailingStopConfig = DEFAULT_CONFIG
) {
  const [state, setState] = useState<TrailingStopState>({
    originalStopLoss,
    currentStopLoss: originalStopLoss,
    highestPnl: 0,
    adjustments: [],
  });

  const prevPriceRef = useRef<number | undefined>();

  const calculatePnl = useCallback((price: number) => {
    if (position === 'LONG') {
      return ((price - entryPrice) / entryPrice) * 100 * leverage;
    }
    return ((entryPrice - price) / entryPrice) * 100 * leverage;
  }, [entryPrice, position, leverage]);

  useEffect(() => {
    if (!isActive || !currentPrice || currentPrice <= 0) return;

    const pnl = calculatePnl(currentPrice);

    setState(prev => {
      // 수익이 활성화 기준 이상이고, 이전 최고점보다 높으면 트레일링 조정
      if (pnl > config.activationThreshold && pnl > prev.highestPnl) {
        const newHighestPnl = pnl;

        // 새 손절가 계산: 현재가에서 trail% 뒤로
        let newStopLoss: number;
        if (position === 'LONG') {
          newStopLoss = currentPrice * (1 - config.trailPercent / 100);
          // 기존 손절보다 높아야만 업데이트
          if (newStopLoss <= prev.currentStopLoss) {
            return { ...prev, highestPnl: newHighestPnl };
          }
        } else {
          newStopLoss = currentPrice * (1 + config.trailPercent / 100);
          // SHORT: 기존 손절보다 낮아야만 업데이트
          if (newStopLoss >= prev.currentStopLoss) {
            return { ...prev, highestPnl: newHighestPnl };
          }
        }

        const entry: StrategyTimelineEntry = {
          id: `ts-${Date.now()}`,
          timestamp: new Date(),
          type: 'TRAILING_STOP',
          message: `트레일링 스탑 상향 조정`,
          detail: `수익률 +${pnl.toFixed(2)}% 도달 → 손절가 $${prev.currentStopLoss.toFixed(2)} → $${newStopLoss.toFixed(2)}`,
        };

        return {
          originalStopLoss: prev.originalStopLoss,
          currentStopLoss: newStopLoss,
          highestPnl: newHighestPnl,
          adjustments: [...prev.adjustments.slice(-19), entry], // 최근 20개만 유지
        };
      }

      return prev;
    });

    prevPriceRef.current = currentPrice;
  }, [currentPrice, isActive, calculatePnl, config, position]);

  return state;
}
