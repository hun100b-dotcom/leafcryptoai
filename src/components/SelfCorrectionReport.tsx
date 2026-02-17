/**
 * SelfCorrectionReport - AI 자가 수정 결과를 대시보드에 표시
 * 듀얼 메모리 시스템의 가중치 조정 내역을 시각화 (게임 요소 제거)
 */
import { motion } from 'framer-motion';
import { Brain, ArrowRight } from 'lucide-react';
import { WeightAdjustment, EvolutionaryStats } from '@/hooks/useEvolutionaryEngine';
import { cn } from '@/lib/utils';

interface SelfCorrectionReportProps {
  adjustments: WeightAdjustment[];
  stats: EvolutionaryStats;
  compact?: boolean;
}

export function SelfCorrectionReport({ adjustments, stats, compact = false }: SelfCorrectionReportProps) {
  if (adjustments.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      className={cn(
        "rounded-lg border border-violet-500/30 bg-violet-500/5 overflow-hidden",
        compact ? "p-2" : "p-3"
      )}
    >
      {/* 헤더 */}
      <div className="flex items-center gap-2 mb-2">
        <Brain className="w-4 h-4 text-violet-500" />
        <span className="text-xs font-bold text-violet-400">Leaf-Master Self-Correction Report</span>
      </div>

      {/* 가중치 조정 내역 */}
      <div className="space-y-1.5 mb-2">
        {adjustments.map((adj, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="flex items-center gap-2 text-[11px] bg-background/50 rounded px-2 py-1"
          >
            <span className="text-muted-foreground font-medium min-w-[60px]">{adj.factor}</span>
            <span className="font-mono text-short">{(adj.originalWeight * 100).toFixed(0)}%</span>
            <ArrowRight className="w-3 h-3 text-muted-foreground" />
            <span className={cn(
              "font-mono font-bold",
              adj.adjustedWeight > adj.originalWeight ? "text-long" : "text-short"
            )}>
              {(adj.adjustedWeight * 100).toFixed(0)}%
            </span>
            {!compact && (
              <span className="text-muted-foreground ml-1 truncate">{adj.reason}</span>
            )}
          </motion.div>
        ))}
      </div>

      {/* Factor scores summary (no game elements) */}
      {!compact && (
        <div className="grid grid-cols-4 gap-1 mt-2 pt-2 border-t border-border/50">
          {[
            { label: '리스크', value: stats.riskManagement },
            { label: '추세', value: stats.trendFollowing },
            { label: '역추세', value: stats.counterTrend },
            { label: '국면', value: stats.regimeDetection },
          ].map(s => (
            <div key={s.label} className="text-center">
              <div className="text-[9px] text-muted-foreground">{s.label}</div>
              <div className={cn(
                "text-xs font-bold font-mono",
                s.value >= 70 ? "text-long" : s.value >= 50 ? "text-primary" : "text-muted-foreground"
              )}>
                {s.value}
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}