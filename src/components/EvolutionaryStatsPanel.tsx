/**
 * EvolutionaryStatsPanel - 자기 진화형 학습 엔진 UI
 * Dual-Memory, Evolutionary Stats, Kelly Criterion, Self-Correction 시각화
 */
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Sword, Shield, Eye, Crosshair, Dna, BarChart3, Sparkles } from 'lucide-react';
import { EvolutionaryStats, KellyCriterionResult, DualMemory } from '@/hooks/useEvolutionaryEngine';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface EvolutionaryStatsPanelProps {
  stats: EvolutionaryStats;
  kelly: KellyCriterionResult;
  memory: DualMemory;
}

const statConfig = [
  { key: 'riskManagement' as const, label: '리스크 관리', icon: Shield, color: 'text-blue-400' },
  { key: 'trendFollowing' as const, label: '추세 추종', icon: Sword, color: 'text-long' },
  { key: 'counterTrend' as const, label: '역추세 대응', icon: Crosshair, color: 'text-purple-400' },
  { key: 'regimeDetection' as const, label: '국면 판단력', icon: Eye, color: 'text-primary' },
];

export function EvolutionaryStatsPanel({ stats, kelly, memory }: EvolutionaryStatsPanelProps) {
  return (
    <div className="space-y-4">
      {/* Evolutionary Stats */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Dna className="w-5 h-5 text-violet-500" />
            진화 스탯
            <span className="text-sm text-muted-foreground font-normal ml-auto">
              종합 Lv.{stats.overall}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {statConfig.map(({ key, label, icon: Icon, color }) => (
            <div key={key}>
              <div className="flex items-center justify-between text-sm mb-1">
                <div className="flex items-center gap-2">
                  <Icon className={cn("w-4 h-4", color)} />
                  <span>{label}</span>
                </div>
                <span className={cn("font-mono font-semibold", color)}>
                  {stats[key]}
                </span>
              </div>
              <Progress value={stats[key]} className="h-2" />
            </div>
          ))}

          {/* 획득 스킬 */}
          {stats.newSkills.length > 0 && (
            <div className="pt-2 border-t border-border">
              <div className="flex items-center gap-1.5 mb-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-xs text-muted-foreground">획득 스킬</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <AnimatePresence>
                  {stats.newSkills.map(skill => (
                    <motion.span
                      key={skill}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="text-[10px] px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30"
                    >
                      ✨ {skill}
                    </motion.span>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Kelly Criterion */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="w-5 h-5 text-primary" />
            Kelly Criterion
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
              <p className="text-[10px] text-muted-foreground">최적 투입 비중</p>
              <p className="text-xl font-bold font-mono text-primary">
                {(kelly.optimalFraction * 100).toFixed(1)}%
              </p>
            </div>
            <div className="p-3 rounded-lg bg-accent/50">
              <p className="text-[10px] text-muted-foreground">R/R 비율</p>
              <p className="text-xl font-bold font-mono">
                1:{kelly.riskRewardRatio.toFixed(2)}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-long/10">
              <p className="text-[10px] text-muted-foreground">평균 수익</p>
              <p className="text-lg font-bold font-mono text-long">
                +{kelly.avgWinAmount}%
              </p>
            </div>
            <div className="p-3 rounded-lg bg-short/10">
              <p className="text-[10px] text-muted-foreground">평균 손실</p>
              <p className="text-lg font-bold font-mono text-short">
                -{kelly.avgLossAmount}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dual Memory */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Brain className="w-5 h-5 text-violet-500" />
            Dual-Memory System
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-violet-500/10 border border-violet-500/20">
              <p className="text-[10px] text-violet-400 mb-1">단기 메모리 (최근 10회)</p>
              <p className="text-sm font-mono">승률 {memory.shortTerm.winRate.toFixed(0)}%</p>
              <p className="text-xs text-muted-foreground">평균 PnL {memory.shortTerm.avgPnl}%</p>
              <p className="text-[10px] text-muted-foreground mt-1">{memory.shortTerm.bestStrategy}</p>
            </div>
            <div className="p-3 rounded-lg bg-accent/50 border border-border">
              <p className="text-[10px] text-muted-foreground mb-1">장기 메모리 (전체)</p>
              <p className="text-sm font-mono">승률 {memory.longTerm.winRate.toFixed(0)}%</p>
              <p className="text-xs text-muted-foreground">평균 PnL {memory.longTerm.avgPnl}%</p>
              <p className="text-[10px] text-muted-foreground mt-1">{memory.longTerm.dominantRegime} 국면</p>
            </div>
          </div>

          {/* Self-Correction 가중치 조정 */}
          {memory.weightAdjustments.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[10px] text-muted-foreground font-semibold">🧠 Self-Correction 가중치 조정</p>
              {memory.weightAdjustments.map((adj, i) => (
                <div key={i} className="text-[10px] p-2 rounded bg-accent/30 border border-border/50">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="font-medium">{adj.factor}</span>
                    <span className="font-mono">
                      {(adj.originalWeight * 100).toFixed(0)}% → {(adj.adjustedWeight * 100).toFixed(0)}%
                    </span>
                  </div>
                  <p className="text-muted-foreground">{adj.reason}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
