/**
 * useQuantMetrics - 전문 금융 지표 실시간 계산
 * MDD, Sharpe Ratio, Profit Factor, ATR, Equity Curve
 */
import { useMemo } from 'react';
import { AISignal } from '@/hooks/useAISignals';

export const AI_INITIAL_SEED = 10000;

export interface QuantMetrics {
  mdd: number;
  sharpeRatio: number;
  profitFactor: number;
  atr: number;
  winRate: number;
  currentAsset: number;
  totalReturn: number;
  equityCurve: EquityPoint[];
}

export interface EquityPoint {
  date: string;
  asset: number;
  drawdown: number;
  tradeIndex: number;
}

export function useQuantMetrics(signals: AISignal[]): QuantMetrics {
  return useMemo(() => {
    const completed = signals
      .filter(s => s.status === 'WIN' || s.status === 'LOSS')
      .sort((a, b) => new Date(a.closedAt || a.createdAt).getTime() - new Date(b.closedAt || b.createdAt).getTime());

    const pnlValues = completed.map(s => s.pnlPercent || 0);

    // Equity Curve + MDD
    let peak = AI_INITIAL_SEED;
    let maxDrawdown = 0;
    let running = AI_INITIAL_SEED;
    const equityCurve: EquityPoint[] = [{
      date: 'Start',
      asset: AI_INITIAL_SEED,
      drawdown: 0,
      tradeIndex: 0,
    }];

    completed.forEach((s, i) => {
      running = running * (1 + (s.pnlPercent || 0) / 100);
      if (running > peak) peak = running;
      const dd = (peak - running) / peak * 100;
      if (dd > maxDrawdown) maxDrawdown = dd;

      const date = s.closedAt || s.createdAt;
      equityCurve.push({
        date: new Date(date).toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' }),
        asset: Math.round(running),
        drawdown: -dd,
        tradeIndex: i + 1,
      });
    });

    // Sharpe Ratio (annualized)
    const avgReturn = pnlValues.length > 0 ? pnlValues.reduce((a, b) => a + b, 0) / pnlValues.length : 0;
    const variance = pnlValues.length > 1
      ? pnlValues.reduce((acc, v) => acc + Math.pow(v - avgReturn, 2), 0) / (pnlValues.length - 1)
      : 0;
    const stdDev = Math.sqrt(variance);
    const sharpeRatio = stdDev > 0 ? (avgReturn / stdDev) * Math.sqrt(252) : 0;

    // Profit Factor
    const grossProfit = pnlValues.filter(v => v > 0).reduce((a, b) => a + b, 0);
    const grossLoss = Math.abs(pnlValues.filter(v => v < 0).reduce((a, b) => a + b, 0));
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 999 : 0;

    // ATR proxy
    const atr = pnlValues.length > 0
      ? pnlValues.reduce((a, b) => a + Math.abs(b), 0) / pnlValues.length
      : 0;

    // Win Rate
    const wins = completed.filter(s => s.status === 'WIN').length;
    const winRate = completed.length > 0 ? (wins / completed.length) * 100 : 0;

    const totalReturn = pnlValues.reduce((a, b) => a + b, 0);

    return {
      mdd: maxDrawdown,
      sharpeRatio,
      profitFactor,
      atr,
      winRate,
      currentAsset: running,
      totalReturn,
      equityCurve,
    };
  }, [signals]);
}
