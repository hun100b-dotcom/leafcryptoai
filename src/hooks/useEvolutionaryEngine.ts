/**
 * useEvolutionaryEngine - 자기 진화형 학습 엔진
 * Dual-Memory System, Self-Correction, Evolutionary Stats, Kelly Criterion
 */
import { useMemo } from 'react';
import { AISignal } from '@/hooks/useAISignals';

/** 진화 스탯 */
export interface EvolutionaryStats {
  riskManagement: number;    // 리스크 관리 지능 (0-100)
  trendFollowing: number;    // 추세 추종 (0-100)
  counterTrend: number;      // 역추세 대응 (0-100)
  regimeDetection: number;   // 국면 판단력 (0-100)
  overall: number;           // 종합 (0-100)
  newSkills: string[];       // 새로 획득한 스킬
}

/** Kelly Criterion 결과 */
export interface KellyCriterionResult {
  optimalFraction: number;   // 최적 투입 비중 (0-1)
  winRate: number;
  avgWinAmount: number;
  avgLossAmount: number;
  riskRewardRatio: number;
}

/** Dual Memory 결과 */
export interface DualMemory {
  shortTerm: MemoryAnalysis; // 최근 10회
  longTerm: MemoryAnalysis;  // 전체
  weightAdjustments: WeightAdjustment[];
}

interface MemoryAnalysis {
  winRate: number;
  avgPnl: number;
  totalTrades: number;
  bestStrategy: string;
  dominantRegime: string;
}

export interface WeightAdjustment {
  factor: string;
  originalWeight: number;
  adjustedWeight: number;
  reason: string;
}

export function useEvolutionaryEngine(signals: AISignal[]) {
  const completed = useMemo(
    () => signals.filter(s => s.status === 'WIN' || s.status === 'LOSS')
      .sort((a, b) => new Date(a.closedAt || a.createdAt).getTime() - new Date(b.closedAt || b.createdAt).getTime()),
    [signals]
  );

  /** Dual-Memory System */
  const dualMemory: DualMemory = useMemo(() => {
    const analyzeMemory = (trades: AISignal[]): MemoryAnalysis => {
      if (trades.length === 0) {
        return { winRate: 0, avgPnl: 0, totalTrades: 0, bestStrategy: 'N/A', dominantRegime: 'N/A' };
      }
      const wins = trades.filter(t => t.status === 'WIN').length;
      const avgPnl = trades.reduce((a, t) => a + (t.pnlPercent || 0), 0) / trades.length;

      // 분석: 어떤 포지션 타입이 더 좋았는지
      const longTrades = trades.filter(t => t.position === 'LONG');
      const shortTrades = trades.filter(t => t.position === 'SHORT');
      const longWinRate = longTrades.length > 0
        ? longTrades.filter(t => t.status === 'WIN').length / longTrades.length
        : 0;
      const shortWinRate = shortTrades.length > 0
        ? shortTrades.filter(t => t.status === 'WIN').length / shortTrades.length
        : 0;

      // evidence_reasoning에서 국면 태그 추출
      const regimes = trades
        .map(t => t.evidenceReasoning?.match(/\[국면 판단:\s*(\w+)\]/)?.[1])
        .filter(Boolean) as string[];
      const regimeCount: Record<string, number> = {};
      regimes.forEach(r => { regimeCount[r] = (regimeCount[r] || 0) + 1; });
      const dominantRegime = Object.entries(regimeCount).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

      return {
        winRate: (wins / trades.length) * 100,
        avgPnl: Math.round(avgPnl * 100) / 100,
        totalTrades: trades.length,
        bestStrategy: longWinRate >= shortWinRate ? 'LONG 편향' : 'SHORT 편향',
        dominantRegime,
      };
    };

    const shortTermTrades = completed.slice(-10);
    const shortTerm = analyzeMemory(shortTermTrades);
    const longTerm = analyzeMemory(completed);

    // Self-Correction: 단기 vs 장기 비교하여 가중치 조정 제안
    const weightAdjustments: WeightAdjustment[] = [];

    // 단기 승률이 장기보다 낮으면 → 최근 판단이 부정확
    if (shortTerm.winRate < longTerm.winRate - 10 && completed.length >= 5) {
      weightAdjustments.push({
        factor: '기술적 분석',
        originalWeight: 0.30,
        adjustedWeight: 0.25,
        reason: `단기 승률(${shortTerm.winRate.toFixed(0)}%)이 장기(${longTerm.winRate.toFixed(0)}%)보다 낮아 기술적 지표 의존도 하향`,
      });
      weightAdjustments.push({
        factor: '시장 심리',
        originalWeight: 0.20,
        adjustedWeight: 0.25,
        reason: '기술적 분석 약화 보완으로 심리 지표 비중 상향',
      });
    }

    // 연속 손실 패턴 감지
    const recentLosses = shortTermTrades.filter(t => t.status === 'LOSS');
    if (recentLosses.length >= 4) {
      weightAdjustments.push({
        factor: 'R/R 비율',
        originalWeight: 0.15,
        adjustedWeight: 0.22,
        reason: `최근 10회 중 ${recentLosses.length}회 손절 → 리스크/리워드 검증 강화`,
      });
    }

    return { shortTerm, longTerm, weightAdjustments };
  }, [completed]);

  /** Evolutionary Stats */
  const evolutionaryStats: EvolutionaryStats = useMemo(() => {
    if (completed.length === 0) {
      return { riskManagement: 30, trendFollowing: 30, counterTrend: 30, regimeDetection: 30, overall: 30, newSkills: [] };
    }

    const wins = completed.filter(t => t.status === 'WIN');
    const winRate = (wins.length / completed.length) * 100;

    // 리스크 관리: 손절 시 평균 손실이 작을수록 높음
    const losses = completed.filter(t => t.status === 'LOSS');
    const avgLoss = losses.length > 0
      ? Math.abs(losses.reduce((a, t) => a + (t.pnlPercent || 0), 0) / losses.length)
      : 0;
    const riskManagement = Math.min(30 + completed.length * 2 + Math.max(0, 30 - avgLoss * 3), 100);

    // 추세 추종: LONG 승률
    const longWins = wins.filter(t => t.position === 'LONG').length;
    const longTotal = completed.filter(t => t.position === 'LONG').length;
    const trendFollowing = longTotal > 0
      ? Math.min(30 + (longWins / longTotal) * 50 + completed.length, 100)
      : 30;

    // 역추세 대응: SHORT 승률
    const shortWins = wins.filter(t => t.position === 'SHORT').length;
    const shortTotal = completed.filter(t => t.position === 'SHORT').length;
    const counterTrend = shortTotal > 0
      ? Math.min(30 + (shortWins / shortTotal) * 50 + completed.length, 100)
      : 30;

    // 국면 판단력: 전체 승률 기반
    const regimeDetection = Math.min(30 + winRate * 0.5 + completed.length, 100);

    const overall = Math.round((riskManagement + trendFollowing + counterTrend + regimeDetection) / 4);

    // 스킬 획득 체크
    const newSkills: string[] = [];
    if (riskManagement >= 70) newSkills.push('정밀 리스크 컨트롤');
    if (trendFollowing >= 70) newSkills.push('추세 서핑 마스터');
    if (counterTrend >= 70) newSkills.push('역추세 스나이퍼');
    if (regimeDetection >= 70) newSkills.push('국면 전환 감지');
    if (completed.length >= 20 && winRate >= 60) newSkills.push('휩쏘(Whipsaw) 대응 지능');
    if (avgLoss < 2 && losses.length >= 3) newSkills.push('손절 최적화 엔진');

    return {
      riskManagement: Math.round(riskManagement),
      trendFollowing: Math.round(trendFollowing),
      counterTrend: Math.round(counterTrend),
      regimeDetection: Math.round(regimeDetection),
      overall,
      newSkills,
    };
  }, [completed]);

  /** Kelly Criterion */
  const kellyCriterion: KellyCriterionResult = useMemo(() => {
    if (completed.length < 3) {
      return { optimalFraction: 0.05, winRate: 0, avgWinAmount: 0, avgLossAmount: 0, riskRewardRatio: 1 };
    }

    const wins = completed.filter(t => t.status === 'WIN');
    const losses = completed.filter(t => t.status === 'LOSS');
    const winRate = wins.length / completed.length;

    const avgWin = wins.length > 0
      ? wins.reduce((a, t) => a + Math.abs(t.pnlPercent || 0), 0) / wins.length
      : 0;
    const avgLoss = losses.length > 0
      ? losses.reduce((a, t) => a + Math.abs(t.pnlPercent || 0), 0) / losses.length
      : 1;

    const rr = avgLoss > 0 ? avgWin / avgLoss : 1;

    // Kelly: f* = (bp - q) / b, where b = rr, p = winRate, q = 1 - winRate
    const kelly = (rr * winRate - (1 - winRate)) / rr;

    // Half-Kelly for safety
    const optimalFraction = Math.max(0.02, Math.min(kelly * 0.5, 0.25));

    return {
      optimalFraction: Math.round(optimalFraction * 1000) / 1000,
      winRate: Math.round(winRate * 100),
      avgWinAmount: Math.round(avgWin * 100) / 100,
      avgLossAmount: Math.round(avgLoss * 100) / 100,
      riskRewardRatio: Math.round(rr * 100) / 100,
    };
  }, [completed]);

  return { dualMemory, evolutionaryStats, kellyCriterion };
}
