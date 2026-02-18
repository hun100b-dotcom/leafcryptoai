/**
 * QuantMetricsBar - 대시보드 상단 전문 금융 지표 바
 * MDD, Sharpe Ratio, Profit Factor, ATR, Equity 요약
 */
import { motion } from 'framer-motion';
import { TrendingDown, BarChart3, Shield, Activity, DollarSign } from 'lucide-react';
import { QuantMetrics, AI_INITIAL_SEED } from '@/hooks/useQuantMetrics';
import { cn } from '@/lib/utils';

interface QuantMetricsBarProps {
  metrics: QuantMetrics;
  compact?: boolean;
}

export function QuantMetricsBar({ metrics, compact = false }: QuantMetricsBarProps) {
  const items = [
    {
      label: 'Equity',
      value: `$${metrics.currentAsset.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
      icon: DollarSign,
      color: metrics.currentAsset >= AI_INITIAL_SEED ? 'text-long' : 'text-short',
    },
    {
      label: 'MDD',
      value: `-${metrics.mdd.toFixed(1)}%`,
      icon: TrendingDown,
      color: 'text-short',
    },
    {
      label: 'Sharpe',
      value: metrics.sharpeRatio.toFixed(2),
      icon: BarChart3,
      color: metrics.sharpeRatio >= 1 ? 'text-long' : 'text-muted-foreground',
    },
    {
      label: 'PF',
      value: metrics.profitFactor >= 999 ? '∞' : metrics.profitFactor.toFixed(2),
      icon: Shield,
      color: metrics.profitFactor >= 1.5 ? 'text-long' : 'text-muted-foreground',
    },
    {
      label: 'ATR',
      value: `${metrics.atr.toFixed(1)}%`,
      icon: Activity,
      color: 'text-muted-foreground',
    },
  ];

  if (compact) {
    return (
      <div className="flex items-center gap-3 overflow-x-auto scrollbar-thin py-1">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-1 text-[10px] whitespace-nowrap">
            <span className="text-muted-foreground">{item.label}</span>
            <span className={cn("font-mono font-bold", item.color)}>{item.value}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid grid-cols-5 gap-2"
    >
      {items.map((item, i) => {
        const Icon = item.icon;
        return (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="p-2 rounded-lg bg-accent/50 border border-border text-center"
          >
            <div className="flex items-center justify-center gap-1 mb-1">
              <Icon className={cn("w-3 h-3", item.color)} />
              <span className="text-[10px] text-muted-foreground">{item.label}</span>
            </div>
            <p className={cn("text-sm font-bold font-mono", item.color)}>{item.value}</p>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
