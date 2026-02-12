import { AISignal } from '@/hooks/useAISignals';
import { CoinData } from '@/types/trading';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus, Target, Shield, Zap, Activity, Brain } from 'lucide-react';
import { motion } from 'framer-motion';
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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "trading-card border-2 p-6 transition-all duration-300",
        getPositionStyle()
      )}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={cn("p-3 rounded-xl", getPositionColor())}>
            {getPositionIcon()}
          </div>
          <div>
            <h3 className="text-2xl font-bold">{coin.symbol}/USDT</h3>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <Brain className="w-3 h-3" />
              Leaf-Master 포지션 가이드
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* 시장 국면 뱃지 */}
          <MarketRegimeIndicator regime={regime} compact />
          
          <div className={cn(
            "px-4 py-2 rounded-full font-bold text-lg",
            position === 'LONG' && "bg-long text-long-foreground",
            position === 'SHORT' && "bg-short text-short-foreground",
            position === 'HOLD' && "bg-muted text-muted-foreground"
          )}>
            {position}
          </div>
        </div>
      </div>

      {/* 가격 정보 그리드 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="trading-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Activity className="w-4 h-4" />
            <span className="text-xs uppercase tracking-wider">현재가</span>
          </div>
          <p className="font-mono text-xl font-bold">
            ${coin.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </p>
        </div>

        <div className="trading-card p-4">
          <div className="flex items-center gap-2 text-primary mb-2">
            <Zap className="w-4 h-4" />
            <span className="text-xs uppercase tracking-wider">레버리지</span>
          </div>
          <p className="font-mono text-xl font-bold text-primary">
            {activeAISignal?.leverage || '-'}x
          </p>
        </div>

        <div className="trading-card p-4">
          <div className="flex items-center gap-2 text-long mb-2">
            <Target className="w-4 h-4" />
            <span className="text-xs uppercase tracking-wider">익절가 (TP)</span>
          </div>
          <p className="font-mono text-xl font-bold text-long">
            {activeAISignal?.targetPrice
              ? `$${activeAISignal.targetPrice.toLocaleString()}`
              : '-'}
          </p>
        </div>

        <div className="trading-card p-4">
          <div className="flex items-center gap-2 text-short mb-2">
            <Shield className="w-4 h-4" />
            <span className="text-xs uppercase tracking-wider">손절가 (SL)</span>
          </div>
          <p className="font-mono text-xl font-bold text-short">
            {activeAISignal?.stopLoss
              ? `$${activeAISignal.stopLoss.toLocaleString()}`
              : '-'}
          </p>
        </div>
      </div>

      {/* Quantum Confidence Matrix */}
      {hasSignal && (
        <div className="mt-4">
          <QuantumConfidenceMatrix factors={factors} finalScore={finalScore} />
        </div>
      )}

      {/* AI 분석 코멘트 */}
      {hasSignal && activeAISignal.evidenceReasoning && (
        <div className="mt-4 p-4 rounded-lg bg-accent/50 border border-border">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse-glow" />
            <span className="text-xs text-muted-foreground uppercase tracking-wider">
              Leaf-Master 분석 코멘트
            </span>
          </div>
          <p className="text-sm leading-relaxed">{activeAISignal.evidenceReasoning}</p>
        </div>
      )}

      {!hasSignal && (
        <div className="mt-4 p-4 rounded-lg bg-muted/50 border border-border text-center">
          <p className="text-sm text-muted-foreground">
            현재 {coin.symbol}에 대한 활성 시그널이 없습니다
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Leaf-Master가 시장을 분석 중입니다. 우측 탭에서 새로고침을 눌러보세요.
          </p>
        </div>
      )}
    </motion.div>
  );
}
