import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

export type MarketRegime = 'BULL' | 'BEAR' | 'SIDEWAYS' | 'VOLATILE';

interface MarketRegimeIndicatorProps {
  regime: MarketRegime;
  className?: string;
  compact?: boolean;
}

const REGIME_CONFIG: Record<MarketRegime, {
  label: string;
  description: string;
  icon: React.ReactNode;
  colorClass: string;
  bgClass: string;
  borderClass: string;
}> = {
  BULL: {
    label: '상승 추세',
    description: '강한 매수 모멘텀 감지. 추세 추종 전략 활성화.',
    icon: <TrendingUp className="w-4 h-4" />,
    colorClass: 'text-long',
    bgClass: 'bg-long/10',
    borderClass: 'border-long/40',
  },
  BEAR: {
    label: '하락 추세',
    description: '매도 압력 우세. 숏 편향 전략 & 리스크 축소.',
    icon: <TrendingDown className="w-4 h-4" />,
    colorClass: 'text-short',
    bgClass: 'bg-short/10',
    borderClass: 'border-short/40',
  },
  SIDEWAYS: {
    label: '횡보 구간',
    description: '방향성 불확실. 레인지 전략 & 낮은 레버리지 적용.',
    icon: <Minus className="w-4 h-4" />,
    colorClass: 'text-muted-foreground',
    bgClass: 'bg-muted/50',
    borderClass: 'border-border',
  },
  VOLATILE: {
    label: '고변동성',
    description: '급격한 가격 변동. 손절 범위 1.5배 확대, 포지션 사이즈 축소.',
    icon: <Zap className="w-4 h-4" />,
    colorClass: 'text-primary',
    bgClass: 'bg-primary/10',
    borderClass: 'border-primary/40',
  },
};

/**
 * 시장 국면(Market Regime) 표시기
 * 현재 시장 상태를 Bull/Bear/Sideways/Volatile로 분류하여 표시
 */
export function MarketRegimeIndicator({ regime, className, compact = false }: MarketRegimeIndicatorProps) {
  const config = REGIME_CONFIG[regime];

  if (compact) {
    return (
      <motion.span
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={cn(
          'inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border',
          config.bgClass, config.colorClass, config.borderClass,
          className,
        )}
      >
        {config.icon}
        {config.label}
      </motion.span>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'rounded-lg border p-3',
        config.bgClass, config.borderClass, className,
      )}
    >
      <div className="flex items-center gap-2 mb-1">
        <span className={cn('p-1 rounded', config.bgClass, config.colorClass)}>
          {config.icon}
        </span>
        <span className={cn('text-xs font-bold uppercase tracking-wider', config.colorClass)}>
          시장 국면: {config.label}
        </span>
      </div>
      <p className="text-[11px] text-muted-foreground leading-relaxed">{config.description}</p>
    </motion.div>
  );
}

/**
 * 24h 변동률과 롱/숏 비율로 시장 국면 판별
 */
export function detectMarketRegime(change24h: number, longRatio?: number): MarketRegime {
  const absChange = Math.abs(change24h);

  // 변동성이 5% 이상이면 VOLATILE
  if (absChange >= 5) return 'VOLATILE';

  // 변동률 3% 이상이면 추세 판단
  if (change24h >= 3) return 'BULL';
  if (change24h <= -3) return 'BEAR';

  // 롱/숏 비율로 보조 판단
  if (longRatio !== undefined) {
    if (longRatio > 60 && change24h > 1) return 'BULL';
    if (longRatio < 40 && change24h < -1) return 'BEAR';
  }

  // 변동률 1.5% 이내면 횡보
  if (absChange < 1.5) return 'SIDEWAYS';

  // 나머지는 약한 추세
  return change24h > 0 ? 'BULL' : 'BEAR';
}
