import { AISignal } from '@/hooks/useAISignals';
import { CoinData } from '@/types/trading';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus, Target, Shield, Zap, Activity, Brain } from 'lucide-react';
import { MarketRegimeIndicator, detectMarketRegime } from './MarketRegimeIndicator';
import { QuantumConfidenceMatrix, computeConfidenceFactors } from './QuantumConfidenceMatrix';
import { CircuitBreakerGauge } from './CircuitBreakerGauge';
import { CircuitBreakerState } from '@/hooks/useCircuitBreaker';

interface ActionCardProps {
  coin: CoinData;
  activeAISignal?: AISignal | null;
  longRatio?: number;
  circuitBreaker?: CircuitBreakerState;
}

/**
 * ActionCard - Leaf-Master 핵심 액션 카드
 * 선택된 코인의 현재 상태, AI 시그널, 시장 국면, 신뢰도 매트릭스를 통합 표시
 */
export function ActionCard({ coin, activeAISignal, longRatio, circuitBreaker }: ActionCardProps) {
  const hasSignal = !!activeAISignal;
  const position = activeAISignal?.position || 'HOLD';
  const regime = detectMarketRegime(coin.change24h, longRatio);

  // Quantum Inference Matrix 산출
  const { factors, finalScore } = hasSignal
    ? computeConfidenceFactors(
        activeAISignal!.confidence,
        activeAISignal!.sentimentScore,
        coin.change24h,
        longRatio,
      )
    : { factors: { technical: 0, sentiment: 0, momentum: 0, macro: 0, riskReward: 0 }, finalScore: 0 };

  const getPositionStyle = () => {
    switch (position) {
      case 'LONG': return 'border-long glow-long';
      case 'SHORT': return 'border-short glow-short';
      default: return 'border-border';
    }
  };

  const getPositionIcon = () => {
    switch (position) {
      case 'LONG': return <TrendingUp className="w-6 h-6" />;
      case 'SHORT': return <TrendingDown className="w-6 h-6" />;
      default: return <Minus className="w-6 h-6" />;
    }
  };

  const getPositionColor = () => {
    switch (position) {
      case 'LONG': return 'text-long bg-long/10';
      case 'SHORT': return 'text-short bg-short/10';
      default: return 'text-muted-foreground bg-muted';
    }
  };

  return (
    <div
      className={cn(
        "trading-card border-2 p-5 transition-all",
        getPositionStyle()
      )}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={cn("p-2.5 rounded-xl", getPositionColor())}>
            {getPositionIcon()}
          </div>
          <div>
            <h3 className="text-xl font-bold">{coin.symbol}/USDT</h3>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Brain className="w-3 h-3" />
              Leaf-Master
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <MarketRegimeIndicator regime={regime} compact />
          <div className={cn(
            "px-3 py-1.5 rounded-lg font-bold text-sm",
            position === 'LONG' && "bg-long text-long-foreground",
            position === 'SHORT' && "bg-short text-short-foreground",
            position === 'HOLD' && "bg-muted text-muted-foreground"
          )}>
            {position}
          </div>
        </div>
      </div>

      {/* 가격 그리드 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-3 rounded-lg bg-accent/40 border border-border/60">
          <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
            <Activity className="w-3.5 h-3.5" />
            <span className="text-[11px] uppercase tracking-wider">현재가</span>
          </div>
          <p className="font-mono text-lg font-bold">${coin.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
        </div>
        <div className="p-3 rounded-lg bg-accent/40 border border-border/60">
          <div className="flex items-center gap-1.5 text-primary mb-1">
            <Zap className="w-3.5 h-3.5" />
            <span className="text-[11px] uppercase tracking-wider">레버</span>
          </div>
          <p className="font-mono text-lg font-bold text-primary">{activeAISignal?.leverage || '-'}x</p>
        </div>
        <div className="p-3 rounded-lg bg-accent/40 border border-border/60">
          <div className="flex items-center gap-1.5 text-long mb-1">
            <Target className="w-3.5 h-3.5" />
            <span className="text-[11px] uppercase tracking-wider">TP</span>
          </div>
          <p className="font-mono text-lg font-bold text-long">
            {activeAISignal?.targetPrice ? `$${activeAISignal.targetPrice.toLocaleString()}` : '-'}
          </p>
        </div>
        <div className="p-3 rounded-lg bg-accent/40 border border-border/60">
          <div className="flex items-center gap-1.5 text-short mb-1">
            <Shield className="w-3.5 h-3.5" />
            <span className="text-[11px] uppercase tracking-wider">SL</span>
          </div>
          <p className="font-mono text-lg font-bold text-short">
            {activeAISignal?.stopLoss ? `$${activeAISignal.stopLoss.toLocaleString()}` : '-'}
          </p>
        </div>
      </div>

      {/* 신뢰도 + 서킷브레이커 */}
      <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-3">
        {hasSignal && <QuantumConfidenceMatrix factors={factors} finalScore={finalScore} />}
        {circuitBreaker && <CircuitBreakerGauge state={circuitBreaker} />}
      </div>

      {hasSignal && activeAISignal.evidenceReasoning && (
        <div className="mt-4 p-3 rounded-lg bg-accent/40 border border-border/60">
          <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1.5">분석 코멘트</p>
          <p className="text-sm leading-relaxed">{activeAISignal.evidenceReasoning}</p>
        </div>
      )}

      {!hasSignal && (
        <div className="mt-4 p-4 rounded-lg bg-accent/30 border border-border/60 text-center">
          <p className="text-sm text-muted-foreground">현재 {coin.symbol} 활성 시그널 없음</p>
          <p className="text-xs text-muted-foreground mt-1">시장 분석 중</p>
        </div>
      )}
    </div>
  );
}
