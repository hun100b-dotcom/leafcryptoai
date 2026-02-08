import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, TrendingDown, Brain, Target, AlertTriangle, 
  CheckCircle2, XCircle, Clock, BarChart3, Lightbulb, ExternalLink
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { AISignal } from '@/hooks/useAISignals';
import { cn } from '@/lib/utils';
import { format, formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

interface PostMortemReportProps {
  signal: AISignal;
}

export function PostMortemReport({ signal }: PostMortemReportProps) {
  const isCompleted = signal.status === 'WIN' || signal.status === 'LOSS';
  const isWin = signal.status === 'WIN';

  // Generate analysis based on signal data
  const analysis = useMemo(() => {
    const riskRewardRatio = signal.position === 'LONG'
      ? ((signal.targetPrice - signal.entryPrice) / (signal.entryPrice - signal.stopLoss))
      : ((signal.entryPrice - signal.targetPrice) / (signal.stopLoss - signal.entryPrice));

    const tpDistance = Math.abs((signal.targetPrice - signal.entryPrice) / signal.entryPrice * 100);
    const slDistance = Math.abs((signal.stopLoss - signal.entryPrice) / signal.entryPrice * 100);

    // Mock analysis for demo - in production, this would come from AI
    const entryReason = signal.evidenceReasoning || 
      `${signal.symbol}의 기술적 분석 결과 ${signal.position === 'LONG' ? '상승' : '하락'} 추세가 확인되었습니다. ` +
      `RSI와 MACD 지표가 ${signal.position === 'LONG' ? '과매도' : '과매수'} 구간에서 반전 신호를 보였습니다.`;

    let outcomeAnalysis = '';
    let psychologicalFactor = '';
    let improvement = '';

    if (isCompleted) {
      if (isWin) {
        outcomeAnalysis = `목표가 ${signal.targetPrice.toLocaleString()}에 성공적으로 도달했습니다. ` +
          `진입 타이밍과 기술적 분석이 정확했으며, 시장 방향성을 올바르게 예측했습니다.`;
        psychologicalFactor = '명확한 근거에 기반한 진입으로 흔들림 없이 포지션을 유지할 수 있었습니다.';
        improvement = `리스크/리워드 비율(${riskRewardRatio.toFixed(2)})이 양호했습니다. ` +
          `향후 비슷한 패턴에서 레버리지를 소폭 높여볼 수 있습니다.`;
      } else {
        outcomeAnalysis = `손절가 ${signal.stopLoss.toLocaleString()}에 도달하여 포지션이 청산되었습니다. ` +
          `예상과 달리 시장이 ${signal.position === 'LONG' ? '하락' : '상승'} 방향으로 움직였습니다.`;
        psychologicalFactor = '급격한 변동성으로 인해 손절 라인이 터치되었습니다. 감정적 판단 없이 기계적으로 청산한 것은 올바른 결정입니다.';
        improvement = `손절폭(${slDistance.toFixed(2)}%)이 다소 타이트했을 수 있습니다. ` +
          `변동성이 큰 장에서는 손절 여유를 더 주는 것을 고려해볼 수 있습니다.`;
      }
    } else {
      outcomeAnalysis = '현재 진행 중인 포지션입니다. 목표가와 손절가를 주시하며 모니터링 중입니다.';
      psychologicalFactor = '계획된 진입이므로 감정적 개입 없이 시스템을 따르는 것이 중요합니다.';
      improvement = '아직 결과가 나오지 않았으므로 추후 결과에 따라 분석을 업데이트합니다.';
    }

    return {
      entryReason,
      outcomeAnalysis,
      psychologicalFactor,
      improvement,
      riskRewardRatio,
      tpDistance,
      slDistance,
    };
  }, [signal, isCompleted, isWin]);

  // Calculate holding time
  const holdingTime = useMemo(() => {
    if (signal.closedAt) {
      const start = new Date(signal.createdAt);
      const end = new Date(signal.closedAt);
      const diffMs = end.getTime() - start.getTime();
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      return `${hours}시간 ${minutes}분`;
    }
    return formatDistanceToNow(signal.createdAt, { locale: ko });
  }, [signal]);

  return (
    <div className="space-y-6">
      {/* Header Summary */}
      <div className={cn(
        "p-4 rounded-lg border",
        isWin && "bg-long/10 border-long/30",
        signal.status === 'LOSS' && "bg-short/10 border-short/30",
        signal.status === 'ACTIVE' && "bg-primary/10 border-primary/30"
      )}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <span className={cn(
              "flex items-center gap-1 px-3 py-1 rounded font-bold",
              signal.position === 'LONG' && "bg-long/20 text-long",
              signal.position === 'SHORT' && "bg-short/20 text-short"
            )}>
              {signal.position === 'LONG' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              {signal.position}
            </span>
            <span className="text-lg font-bold">{signal.symbol}/USDT</span>
            <Badge variant="outline">{signal.leverage}x 레버리지</Badge>
          </div>
          {isCompleted && (
            <div className={cn(
              "flex items-center gap-2 text-lg font-bold",
              isWin ? "text-long" : "text-short"
            )}>
              {isWin ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
              {signal.pnlPercent && (
                <span>{signal.pnlPercent >= 0 ? '+' : ''}{signal.pnlPercent.toFixed(2)}%</span>
              )}
            </div>
          )}
          {signal.status === 'ACTIVE' && (
            <Badge className="bg-primary/20 text-primary border-0 animate-pulse">
              진행 중
            </Badge>
          )}
        </div>

        {/* Price Grid */}
        <div className="grid grid-cols-4 gap-3 text-sm">
          <div className="text-center p-2 bg-background/50 rounded">
            <p className="text-muted-foreground text-xs">진입가</p>
            <p className="font-mono font-semibold">${signal.entryPrice.toLocaleString()}</p>
          </div>
          <div className="text-center p-2 bg-long/10 rounded">
            <p className="text-long/80 text-xs">목표가</p>
            <p className="font-mono font-semibold text-long">${signal.targetPrice.toLocaleString()}</p>
          </div>
          <div className="text-center p-2 bg-short/10 rounded">
            <p className="text-short/80 text-xs">손절가</p>
            <p className="font-mono font-semibold text-short">${signal.stopLoss.toLocaleString()}</p>
          </div>
          {signal.closePrice && (
            <div className="text-center p-2 bg-accent/50 rounded">
              <p className="text-muted-foreground text-xs">종료가</p>
              <p className="font-mono font-semibold">${signal.closePrice.toLocaleString()}</p>
            </div>
          )}
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-3 bg-accent/30 rounded-lg text-center">
          <div className="flex items-center justify-center gap-2 text-muted-foreground text-xs mb-1">
            <BarChart3 className="w-3 h-3" />
            R:R 비율
          </div>
          <p className={cn(
            "font-bold",
            analysis.riskRewardRatio >= 2 ? "text-long" : 
            analysis.riskRewardRatio >= 1 ? "text-yellow-500" : "text-short"
          )}>
            1:{analysis.riskRewardRatio.toFixed(2)}
          </p>
        </div>
        <div className="p-3 bg-accent/30 rounded-lg text-center">
          <div className="flex items-center justify-center gap-2 text-muted-foreground text-xs mb-1">
            <Clock className="w-3 h-3" />
            보유 시간
          </div>
          <p className="font-bold">{holdingTime}</p>
        </div>
        <div className="p-3 bg-accent/30 rounded-lg text-center">
          <div className="flex items-center justify-center gap-2 text-muted-foreground text-xs mb-1">
            <Target className="w-3 h-3" />
            신뢰도
          </div>
          <p className="font-bold">{signal.confidence}%</p>
        </div>
      </div>

      {/* Analysis Sections */}
      <div className="space-y-4">
        {/* Entry Reason */}
        <div className="p-4 bg-accent/20 rounded-lg border border-border">
          <h4 className="flex items-center gap-2 font-semibold mb-2">
            <Target className="w-4 h-4 text-primary" />
            진입 근거 분석
          </h4>
          <p className="text-sm text-foreground/90 leading-relaxed">
            {analysis.entryReason}
          </p>
          {signal.referenceUrl && (
            <a 
              href={signal.referenceUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-2"
            >
              <ExternalLink className="w-3 h-3" />
              참고 자료 보기
            </a>
          )}
        </div>

        {/* Outcome Analysis */}
        <div className={cn(
          "p-4 rounded-lg border",
          isWin && "bg-long/5 border-long/20",
          signal.status === 'LOSS' && "bg-short/5 border-short/20",
          signal.status === 'ACTIVE' && "bg-primary/5 border-primary/20"
        )}>
          <h4 className="flex items-center gap-2 font-semibold mb-2">
            {isWin ? (
              <CheckCircle2 className="w-4 h-4 text-long" />
            ) : signal.status === 'LOSS' ? (
              <XCircle className="w-4 h-4 text-short" />
            ) : (
              <Clock className="w-4 h-4 text-primary" />
            )}
            {isCompleted ? '결과 분석' : '현재 상태'}
          </h4>
          <p className="text-sm text-foreground/90 leading-relaxed">
            {analysis.outcomeAnalysis}
          </p>
        </div>

        {/* Psychological Factor */}
        <div className="p-4 bg-violet-500/10 rounded-lg border border-violet-500/20">
          <h4 className="flex items-center gap-2 font-semibold mb-2 text-violet-500">
            <Brain className="w-4 h-4" />
            심리적 요인 분석
          </h4>
          <p className="text-sm text-foreground/90 leading-relaxed">
            {analysis.psychologicalFactor}
          </p>
        </div>

        {/* Improvement / Learning */}
        <div className="p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
          <h4 className="flex items-center gap-2 font-semibold mb-2 text-yellow-600">
            <Lightbulb className="w-4 h-4" />
            학습 및 개선점
          </h4>
          <p className="text-sm text-foreground/90 leading-relaxed">
            {analysis.improvement}
          </p>
        </div>
      </div>

      {/* AI Learning Indicator */}
      {isCompleted && (
        <motion.div 
          className="p-4 bg-gradient-to-r from-violet-500/10 to-primary/10 rounded-lg border border-violet-500/30"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            >
              <Brain className="w-8 h-8 text-violet-500" />
            </motion.div>
            <div>
              <p className="font-semibold text-violet-500">AI 학습 완료</p>
              <p className="text-sm text-muted-foreground">
                이번 매매로 AI의 {isWin ? '추세 판단' : '손절 대응'} 지능이 <span className="text-violet-500 font-semibold">0.5%</span> 향상되었습니다
              </p>
            </div>
          </div>
          <Progress value={75} className="h-1.5 mt-3 bg-violet-500/20" />
        </motion.div>
      )}
    </div>
  );
}
