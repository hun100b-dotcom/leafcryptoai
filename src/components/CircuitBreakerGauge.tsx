/**
 * CircuitBreakerGauge - 서킷 브레이커 & 스트레스 레벨 게이지
 * 일일 누적 손실, 스트레스 레벨, 냉각기 상태를 시각화
 */
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { AlertTriangle, Shield, Thermometer, Snowflake } from 'lucide-react';
import { CircuitBreakerState } from '@/hooks/useCircuitBreaker';
import { Progress } from '@/components/ui/progress';

interface CircuitBreakerGaugeProps {
  state: CircuitBreakerState;
  className?: string;
  compact?: boolean;
}

export function CircuitBreakerGauge({ state, className, compact }: CircuitBreakerGaugeProps) {
  const stressColor = state.stressLevel >= 70
    ? 'text-short'
    : state.stressLevel >= 40
      ? 'text-warning'
      : 'text-long';

  const stressLabel = state.stressLevel >= 70
    ? '고위험'
    : state.stressLevel >= 40
      ? '주의'
      : '안정';

  if (compact) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        {state.isCoolingDown ? (
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 text-[10px] font-medium"
          >
            <Snowflake className="w-3 h-3" />
            냉각기
          </motion.div>
        ) : (
          <div className={cn(
            "flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium",
            state.stressLevel >= 70 ? "bg-short/20 text-short" :
            state.stressLevel >= 40 ? "bg-warning/20 text-warning" :
            "bg-long/20 text-long"
          )}>
            <Thermometer className="w-3 h-3" />
            {stressLabel} {state.stressLevel}%
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={cn("trading-card p-3 space-y-2", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-primary" />
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            Circuit Breaker
          </span>
        </div>
        {state.isCoolingDown && (
          <motion.div
            animate={{ opacity: [1, 0.5, 1] }}
            transition={{ repeat: Infinity, duration: 1 }}
            className="flex items-center gap-1 text-blue-400 text-[10px]"
          >
            <Snowflake className="w-3 h-3" />
            냉각기 활성화
          </motion.div>
        )}
      </div>

      {/* 스트레스 레벨 */}
      <div>
        <div className="flex items-center justify-between text-[10px] mb-1">
          <span className="text-muted-foreground">Stress Level</span>
          <span className={cn("font-mono font-semibold", stressColor)}>
            {state.stressLevel}%
          </span>
        </div>
        <Progress value={state.stressLevel} className="h-1.5" />
      </div>

      {/* 일일 손익 */}
      <div className="flex items-center justify-between text-[10px]">
        <span className="text-muted-foreground">일일 누적</span>
        <span className={cn(
          "font-mono font-semibold",
          state.dailyLoss >= 0 ? "text-long" : "text-short"
        )}>
          {state.dailyLoss >= 0 ? '+' : ''}{state.dailyLoss}%
        </span>
      </div>

      {/* 메타 정보 */}
      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
        <span>오늘 거래: {state.todayTrades}회</span>
        {state.consecutiveLosses > 0 && (
          <span className="text-short">
            <AlertTriangle className="w-3 h-3 inline mr-0.5" />
            {state.consecutiveLosses}연패
          </span>
        )}
      </div>

      {/* 신뢰도 조정 */}
      {state.confidenceMultiplier < 1 && (
        <div className="text-[10px] p-1.5 rounded bg-short/10 border border-short/20 text-short">
          신뢰도 ×{state.confidenceMultiplier.toFixed(2)} 보수적 조정 적용 중
        </div>
      )}
    </div>
  );
}
