import { useState } from 'react';
import { AISignal } from '@/hooks/useAISignals';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Bot, TrendingUp, TrendingDown, Minus, CheckCircle2, XCircle, Clock, Zap, ExternalLink, RefreshCw, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { JoinSignalButton } from './JoinSignalButton';
import { SelfReflectingAnimation } from './SelfReflectingAnimation';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface AITimelineEnhancedProps {
  signals: AISignal[];
  userAsset: number;
}

export function AITimelineEnhanced({ signals, userAsset }: AITimelineEnhancedProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [noEntryReason, setNoEntryReason] = useState<string | null>(null);

  const handleRefreshSignal = async () => {
    setIsRefreshing(true);
    setNoEntryReason(null);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-signal-generator`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
        }
      );

      const result = await response.json();

      if (result.success && result.signal) {
        toast.success(`새 시그널 생성: ${result.signal.symbol} ${result.signal.position}`);
      } else if (result.message?.includes('All coins have active signals')) {
        setNoEntryReason('현재 모든 코인에 활성 시그널이 있어 추가 포지션을 제안하지 않습니다.');
      } else if (result.message?.includes('decided not to create')) {
        setNoEntryReason('현재 시장 상황이 진입에 적합하지 않습니다. 변동성이 낮거나 명확한 방향성이 없어 대기를 권장합니다.');
      } else {
        setNoEntryReason(result.message || '현재 진입 타이밍이 좋지 않습니다. 시장 상황을 모니터링 중입니다.');
      }
    } catch (err) {
      console.error('Failed to refresh signal:', err);
      toast.error('시그널 생성에 실패했습니다');
    } finally {
      setIsRefreshing(false);
    }
  };

  const getStatusIcon = (status: AISignal['status']) => {
    switch (status) {
      case 'WIN':
        return <CheckCircle2 className="w-4 h-4 text-long" />;
      case 'LOSS':
        return <XCircle className="w-4 h-4 text-short" />;
      case 'ACTIVE':
        return <Clock className="w-4 h-4 text-primary animate-pulse" />;
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getPositionIcon = (position: AISignal['position']) => {
    switch (position) {
      case 'LONG':
        return <TrendingUp className="w-4 h-4" />;
      case 'SHORT':
        return <TrendingDown className="w-4 h-4" />;
      default:
        return <Minus className="w-4 h-4" />;
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Bot className="w-4 h-4 text-primary" />
            <span className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full bg-long animate-pulse" />
          </div>
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Leaf-Master 리딩
          </h2>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleRefreshSignal}
          disabled={isRefreshing}
          className="h-7 px-2 text-xs"
        >
          {isRefreshing ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <RefreshCw className="w-3 h-3" />
          )}
          <span className="ml-1">새로고침</span>
        </Button>
      </div>

      {/* Self-Reflecting Animation */}
      <SelfReflectingAnimation isActive={isRefreshing} className="mx-3 mt-3" />

      {/* No Entry Reason */}
      {!isRefreshing && noEntryReason && (
        <div className="mx-3 mt-3 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-sm text-yellow-500">
          <div className="flex items-start gap-2">
            <Zap className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <p>{noEntryReason}</p>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-4">
        {signals.map((signal, index) => (
          <motion.div
            key={signal.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className={cn(
              "trading-card p-4 border-l-4",
              signal.position === 'LONG' && "border-l-long",
              signal.position === 'SHORT' && "border-l-short",
              signal.position === 'HOLD' && "border-l-muted-foreground"
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className={cn(
                  "flex items-center gap-1 px-2 py-1 rounded text-xs font-bold",
                  signal.position === 'LONG' && "bg-long/20 text-long",
                  signal.position === 'SHORT' && "bg-short/20 text-short",
                  signal.position === 'HOLD' && "bg-muted text-muted-foreground"
                )}>
                  {getPositionIcon(signal.position)}
                  {signal.position}
                </span>
                <span className="font-semibold text-sm">{signal.symbol}</span>
                {signal.isUrgent && (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-yellow-500/20 text-yellow-500">
                    <Zap className="w-3 h-3" />
                    긴급
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {getStatusIcon(signal.status)}
                {signal.pnlPercent !== null && signal.status !== 'ACTIVE' && (
                  <span className={cn(
                    "text-sm font-semibold",
                    signal.pnlPercent >= 0 ? "text-long" : "text-short"
                  )}>
                    {signal.pnlPercent >= 0 ? '+' : ''}{signal.pnlPercent.toFixed(1)}%
                  </span>
                )}
              </div>
            </div>

            {/* Sentiment Score */}
            {signal.sentimentScore !== null && (
              <div className="mb-3">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-muted-foreground">인간지표</span>
                  <span className={cn(
                    signal.sentimentScore > 0 ? "text-long" : signal.sentimentScore < 0 ? "text-short" : "text-muted-foreground"
                  )}>
                    {signal.sentimentScore > 0 ? '+' : ''}{signal.sentimentScore}
                  </span>
                </div>
                <Progress 
                  value={50 + signal.sentimentScore / 2} 
                  className="h-1.5"
                />
              </div>
            )}

            {/* Evidence */}
            {signal.evidenceReasoning && (
              <p className="text-sm leading-relaxed mb-3 text-foreground/90">
                {signal.evidenceReasoning}
              </p>
            )}

            {/* Price Info */}
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="bg-accent/50 rounded px-2 py-1">
                <span className="text-muted-foreground">진입</span>
                <p className="font-mono font-semibold">${signal.entryPrice.toLocaleString()}</p>
              </div>
              <div className="bg-long/10 rounded px-2 py-1">
                <span className="text-long/80">TP</span>
                <p className="font-mono font-semibold text-long">${signal.targetPrice.toLocaleString()}</p>
              </div>
              <div className="bg-short/10 rounded px-2 py-1">
                <span className="text-short/80">SL</span>
                <p className="font-mono font-semibold text-short">${signal.stopLoss.toLocaleString()}</p>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span>레버리지 {signal.leverage}x</span>
                <span>신뢰도 {signal.confidence}%</span>
                {signal.referenceUrl && (
                  <a
                    href={signal.referenceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-primary hover:underline"
                  >
                    <ExternalLink className="w-3 h-3" />
                    참고
                  </a>
                )}
              </div>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(signal.createdAt, { addSuffix: true, locale: ko })}
              </span>
            </div>

            {/* Join Button */}
            {signal.status === 'ACTIVE' && (
              <div className="mt-3 pt-3 border-t border-border">
                <JoinSignalButton signal={signal} userAsset={userAsset} />
              </div>
            )}
          </motion.div>
        ))}

        {signals.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            아직 AI 시그널이 없습니다
          </div>
        )}
      </div>
    </div>
  );
}
