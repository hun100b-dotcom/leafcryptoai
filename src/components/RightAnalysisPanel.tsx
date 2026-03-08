import { useState } from 'react';
import { AISignal } from '@/hooks/useAISignals';
import { CoinData } from '@/types/trading';
import { CircuitBreakerState } from '@/hooks/useCircuitBreaker';
import { computeConfidenceFactors } from './QuantumConfidenceMatrix';
import {
  TrendingUp,
  TrendingDown,
  Target,
  Shield,
  Zap,
  Brain,
  AlertTriangle,
  Activity,
  BarChart2,
  Minus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface RightAnalysisPanelProps {
  coin?: CoinData;
  activeAISignal?: AISignal | null;
  longRatio?: number;
  circuitBreaker?: CircuitBreakerState;
  autoTradingEnabled: boolean;
  onJoinSignal?: (
    signalId: string,
    allocatedAsset: number,
  ) => Promise<{ success: boolean; error?: string }>;
  userAsset: number;
}

const FACTOR_LABELS: Record<string, string> = {
  technical: 'Technical',
  sentiment: 'Sentiment',
  momentum: 'Momentum',
  macro: 'Macro',
  riskReward: 'Risk/Reward',
};

export function RightAnalysisPanel({
  coin,
  activeAISignal,
  longRatio,
  circuitBreaker,
  autoTradingEnabled,
  onJoinSignal,
  userAsset,
}: RightAnalysisPanelProps) {
  const [isOrdering, setIsOrdering] = useState(false);

  const hasSignal = !!activeAISignal;
  const position = activeAISignal?.position ?? 'HOLD';

  const { factors, finalScore } = hasSignal
    ? computeConfidenceFactors(
        activeAISignal!.confidence,
        activeAISignal!.sentimentScore,
        coin?.change24h ?? 0,
        longRatio,
      )
    : {
        factors: { technical: 0, sentiment: 0, momentum: 0, macro: 0, riskReward: 0 },
        finalScore: 0,
      };

  const handleOrder = async (side: 'LONG' | 'SHORT') => {
    if (!activeAISignal || !onJoinSignal) {
      toast.error('활성 시그널이 없습니다');
      return;
    }
    if (circuitBreaker?.isCoolingDown) {
      toast.error('서킷 브레이커 작동 중 — 주문 불가');
      return;
    }
    setIsOrdering(true);
    try {
      const allocation = Math.max(1, Math.round(userAsset * 0.1));
      const result = await onJoinSignal(activeAISignal.id, allocation);
      if (result.success) {
        toast.success(`${coin?.symbol} ${side} 포지션 진입 완료 ($${allocation.toLocaleString()} 배분)`);
      } else {
        toast.error(result.error ?? '주문 실패');
      }
    } finally {
      setIsOrdering(false);
    }
  };

  /* ── Helpers ── */
  const positionColor =
    position === 'LONG' ? 'text-long' : position === 'SHORT' ? 'text-short' : 'text-muted-foreground';
  const positionBg =
    position === 'LONG'
      ? 'bg-long/10 border-long/30'
      : position === 'SHORT'
        ? 'bg-short/10 border-short/30'
        : 'bg-accent/40 border-border';
  const signalScore = finalScore;

  if (!coin) {
    return (
      <div className="flex items-center justify-center text-xs text-muted-foreground p-4 text-center py-10">
        <div>
          <Brain className="w-8 h-8 mx-auto mb-2 opacity-20" />
          <p>좌측 목록에서 코인을 선택하세요</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* ── Panel Header ── */}
      <div className="panel-section-header">
        <Brain className="w-3.5 h-3.5 text-primary flex-shrink-0" />
        <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          AI 분석 리포트
        </span>
        <span className="ml-auto font-mono text-[10px] text-muted-foreground/60">{coin.symbol}/USDT</span>
      </div>

      {/* ── Content (부모 aside가 스크롤 처리) ── */}
      <div className="flex flex-col">
        {/* Signal Summary */}
        <div className="p-3 border-b border-border/50">
          <div className={cn('flex items-center justify-between p-2.5 rounded-lg border', positionBg)}>
            <div className="flex items-center gap-2">
              {position === 'LONG' ? (
                <TrendingUp className="w-4 h-4 text-long" />
              ) : position === 'SHORT' ? (
                <TrendingDown className="w-4 h-4 text-short" />
              ) : (
                <Minus className="w-4 h-4 text-muted-foreground" />
              )}
              <div>
                <p className={cn('text-sm font-bold leading-none', positionColor)}>{position}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">AI 시그널</p>
              </div>
            </div>
            {hasSignal && (
              <div className="text-right">
                <p className="font-mono text-base font-bold leading-none">
                  {activeAISignal.confidence.toFixed(1)}
                  <span className="text-[10px] text-muted-foreground ml-0.5">%</span>
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">신뢰도</p>
              </div>
            )}
          </div>
        </div>

        {/* Price Grid */}
        {hasSignal && (
          <div className="p-3 border-b border-border/50 grid grid-cols-2 gap-2">
            {/* Current Price */}
            <div className="p-2 rounded-md bg-accent/25 border border-border/40">
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground mb-1">
                <Activity className="w-2.5 h-2.5" />
                현재가
              </div>
              <p className="font-mono text-[13px] font-semibold truncate">
                ${coin.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </p>
            </div>

            {/* Leverage */}
            <div className="p-2 rounded-md bg-primary/5 border border-primary/20">
              <div className="flex items-center gap-1 text-[10px] text-primary mb-1">
                <Zap className="w-2.5 h-2.5" />
                레버리지
              </div>
              <p className="font-mono text-[13px] font-semibold text-primary">
                {activeAISignal.leverage}x
              </p>
            </div>

            {/* Target Price */}
            <div className="p-2 rounded-md bg-long/5 border border-long/20">
              <div className="flex items-center gap-1 text-[10px] text-long mb-1">
                <Target className="w-2.5 h-2.5" />
                목표가 (TP)
              </div>
              <p className="font-mono text-[13px] font-semibold text-long truncate">
                ${activeAISignal.targetPrice.toLocaleString()}
              </p>
            </div>

            {/* Stop Loss */}
            <div className="p-2 rounded-md bg-short/5 border border-short/20">
              <div className="flex items-center gap-1 text-[10px] text-short mb-1">
                <Shield className="w-2.5 h-2.5" />
                손절가 (SL)
              </div>
              <p className="font-mono text-[13px] font-semibold text-short truncate">
                ${activeAISignal.stopLoss.toLocaleString()}
              </p>
            </div>
          </div>
        )}

        {/* Confidence Breakdown */}
        {hasSignal && (
          <div className="p-3 border-b border-border/50">
            <div className="flex items-center gap-1.5 mb-2.5">
              <BarChart2 className="w-3 h-3 text-muted-foreground" />
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                기술 지표 분석
              </p>
            </div>

            <div className="space-y-2">
              {Object.entries(factors).map(([key, val]) => (
                <div key={key} className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground w-[72px] flex-shrink-0">
                    {FACTOR_LABELS[key]}
                  </span>
                  <div className="flex-1 h-1 bg-accent/60 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all duration-500',
                        val >= 65 ? 'bg-long' : val >= 45 ? 'bg-primary' : 'bg-short',
                      )}
                      style={{ width: `${val}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-mono w-7 text-right text-muted-foreground">
                    {val.toFixed(0)}
                  </span>
                </div>
              ))}
            </div>

            {/* Final Score */}
            <div className="mt-3 pt-2.5 border-t border-border/50 flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">종합 스코어</span>
              <div className="flex items-center gap-2">
                <div className="w-16 h-1 bg-accent/60 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full',
                      signalScore >= 65 ? 'bg-long' : signalScore >= 45 ? 'bg-primary' : 'bg-short',
                    )}
                    style={{ width: `${signalScore}%` }}
                  />
                </div>
                <span
                  className={cn(
                    'font-mono text-sm font-bold',
                    signalScore >= 65 ? 'text-long' : signalScore >= 45 ? 'text-primary' : 'text-short',
                  )}
                >
                  {signalScore.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Evidence Reasoning */}
        {hasSignal && activeAISignal.evidenceReasoning && (
          <div className="p-3 border-b border-border/50">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">
              분석 코멘트
            </p>
            <p className="text-xs leading-relaxed text-foreground/75">
              {activeAISignal.evidenceReasoning}
            </p>
          </div>
        )}

        {/* R:R Ratio Info */}
        {hasSignal && coin && (
          <div className="p-3 border-b border-border/50">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">
              리스크/리워드
            </p>
            <div className="flex items-center gap-3">
              {(() => {
                const entry = coin.price;
                const tp = activeAISignal.targetPrice;
                const sl = activeAISignal.stopLoss;
                const reward = Math.abs(tp - entry);
                const risk = Math.abs(entry - sl);
                const rr = risk > 0 ? (reward / risk).toFixed(2) : '–';
                const tpPct = ((Math.abs(tp - entry) / entry) * 100).toFixed(2);
                const slPct = ((Math.abs(sl - entry) / entry) * 100).toFixed(2);
                return (
                  <>
                    <div className="flex-1 text-center">
                      <p className="font-mono text-sm font-bold text-long">+{tpPct}%</p>
                      <p className="text-[10px] text-muted-foreground">수익</p>
                    </div>
                    <div className="text-center">
                      <p className="font-mono text-base font-bold text-primary">{rr}</p>
                      <p className="text-[10px] text-muted-foreground">R:R</p>
                    </div>
                    <div className="flex-1 text-center">
                      <p className="font-mono text-sm font-bold text-short">-{slPct}%</p>
                      <p className="text-[10px] text-muted-foreground">손실</p>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        )}

        {/* No Signal State */}
        {!hasSignal && (
          <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
            <Activity className="w-8 h-8 text-muted-foreground/20 mb-3" />
            <p className="text-xs text-muted-foreground">현재 {coin.symbol} 활성 시그널 없음</p>
            <p className="text-[10px] text-muted-foreground/50 mt-1">AI가 시장을 분석 중입니다</p>
          </div>
        )}
      </div>

      {/* ── Circuit Breaker Warning ── */}
      {circuitBreaker?.isCoolingDown && (
        <div className="px-3 py-2 bg-short/8 border-t border-short/20">
          <div className="flex items-center gap-1.5 text-short">
            <AlertTriangle className="w-3 h-3 flex-shrink-0" />
            <span className="text-[10px] font-semibold">서킷 브레이커 작동 중</span>
          </div>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            일일 손실 한도 초과 — 신규 주문 일시 중단
          </p>
        </div>
      )}

      {/* ── Order Execution Buttons ── */}
      <div className="p-3 border-t border-border/60 bg-card/30">
        <div className="grid grid-cols-2 gap-2 mb-2">
          <button
            onClick={() => handleOrder('LONG')}
            disabled={isOrdering || !hasSignal || !!circuitBreaker?.isCoolingDown}
            className="btn-long flex items-center justify-center gap-1.5"
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>LONG</span>
          </button>
          <button
            onClick={() => handleOrder('SHORT')}
            disabled={isOrdering || !hasSignal || !!circuitBreaker?.isCoolingDown}
            className="btn-short flex items-center justify-center gap-1.5"
          >
            <TrendingDown className="w-3.5 h-3.5" />
            <span>SHORT</span>
          </button>
        </div>

        {/* Auto Trading Status Note */}
        <div className="text-center">
          {autoTradingEnabled ? (
            <p className="text-[10px] text-long/70">
              자동매매 ON — AI 시그널 자동 진입 활성화
            </p>
          ) : (
            <p className="text-[10px] text-muted-foreground/50">
              수동 주문 모드 — 헤더에서 자동매매 ON 가능
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
