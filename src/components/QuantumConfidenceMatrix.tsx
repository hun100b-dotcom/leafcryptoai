import { motion } from 'framer-motion';
import { Brain, BarChart3, Users, Zap, Shield, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

export interface ConfidenceFactors {
  technical: number;    // 기술적 분석 (RSI, MACD, MA 등)
  sentiment: number;    // 시장 심리 (롱/숏 비율)
  momentum: number;     // 모멘텀 (가격 변동률)
  macro: number;        // 거시 지표 (DXY, 나스닥 상관관계)
  riskReward: number;   // 리스크/리워드 비율
}

interface QuantumConfidenceMatrixProps {
  factors: ConfidenceFactors;
  finalScore: number;
  className?: string;
}

const FACTOR_CONFIG = [
  { key: 'technical' as const, label: '기술적 분석', icon: BarChart3, weight: 0.30 },
  { key: 'sentiment' as const, label: '시장 심리', icon: Users, weight: 0.20 },
  { key: 'momentum' as const, label: '모멘텀', icon: TrendingUp, weight: 0.20 },
  { key: 'macro' as const, label: '거시 지표', icon: Zap, weight: 0.15 },
  { key: 'riskReward' as const, label: 'R/R 비율', icon: Shield, weight: 0.15 },
];

/**
 * Quantum Inference Matrix - 가중치 기반 신뢰도 점수 시각화
 * S = Σ(W_i × Factor_i) 공식으로 최종 점수 산출
 */
export function QuantumConfidenceMatrix({ factors, finalScore, className }: QuantumConfidenceMatrixProps) {
  const getScoreColor = (score: number) => {
    if (score >= 75) return 'text-long';
    if (score >= 50) return 'text-primary';
    if (score >= 30) return 'text-muted-foreground';
    return 'text-short';
  };

  const getBarColor = (score: number) => {
    if (score >= 75) return 'bg-long';
    if (score >= 50) return 'bg-primary';
    if (score >= 30) return 'bg-muted-foreground';
    return 'bg-short';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('rounded-lg border border-border bg-card/50 p-4', className)}
    >
      {/* 헤더: 최종 점수 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-primary" />
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Quantum Inference Matrix
          </span>
        </div>
        <motion.span
          key={finalScore}
          initial={{ scale: 1.3, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={cn('font-mono text-lg font-bold', getScoreColor(finalScore))}
        >
          {finalScore}
          <span className="text-[10px] text-muted-foreground ml-0.5">/ 100</span>
        </motion.span>
      </div>

      {/* 개별 팩터 바 */}
      <div className="space-y-2">
        {FACTOR_CONFIG.map(({ key, label, icon: Icon, weight }, i) => {
          const value = factors[key];
          return (
            <motion.div
              key={key}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              className="flex items-center gap-2"
            >
              <Icon className="w-3 h-3 text-muted-foreground flex-shrink-0" />
              <span className="text-[10px] text-muted-foreground w-16 flex-shrink-0">{label}</span>
              <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${value}%` }}
                  transition={{ duration: 0.8, delay: i * 0.1 }}
                  className={cn('h-full rounded-full', getBarColor(value))}
                />
              </div>
              <span className={cn('font-mono text-[10px] w-8 text-right', getScoreColor(value))}>
                {value}
              </span>
              <span className="text-[9px] text-muted-foreground/50 w-6">
                ×{weight}
              </span>
            </motion.div>
          );
        })}
      </div>

      {/* 수식 */}
      <div className="mt-3 pt-2 border-t border-border">
        <p className="text-[9px] text-muted-foreground font-mono text-center">
          S = {FACTOR_CONFIG.map(f => `${f.weight}×${factors[f.key]}`).join(' + ')} = <span className={cn('font-bold', getScoreColor(finalScore))}>{finalScore}</span>
        </p>
      </div>
    </motion.div>
  );
}

/**
 * AI 시그널의 confidence + sentimentScore + change24h 등으로 
 * Quantum Inference Matrix 팩터를 역산
 */
export function computeConfidenceFactors(
  confidence: number,
  sentimentScore: number | null,
  change24h: number,
  longRatio?: number,
): { factors: ConfidenceFactors; finalScore: number } {
  // 기술적 분석: confidence 기반
  const technical = Math.min(100, Math.max(0, confidence));

  // 시장 심리: 롱/숏 비율 기반 (극단이면 역발상 점수 높음)
  const sentiment = sentimentScore !== null
    ? Math.min(100, Math.max(0, 50 + sentimentScore / 2))
    : (longRatio !== undefined
      ? Math.min(100, Math.max(0, 100 - Math.abs(longRatio - 50) * 2))
      : 50);

  // 모멘텀: 변동률 기반
  const absChange = Math.abs(change24h);
  const momentum = Math.min(100, absChange * 15);

  // 거시 지표: 시뮬레이션 (실제로는 DXY, 나스닥 데이터 필요)
  const macro = Math.min(100, Math.max(20, 50 + change24h * 3));

  // 리스크/리워드: confidence 기반 보정
  const riskReward = Math.min(100, Math.max(20, confidence * 0.8 + absChange * 5));

  // 가중 합산
  const finalScore = Math.round(
    technical * 0.30 +
    sentiment * 0.20 +
    momentum * 0.20 +
    macro * 0.15 +
    riskReward * 0.15
  );

  return {
    factors: {
      technical: Math.round(technical),
      sentiment: Math.round(sentiment),
      momentum: Math.round(momentum),
      macro: Math.round(macro),
      riskReward: Math.round(riskReward),
    },
    finalScore,
  };
}
