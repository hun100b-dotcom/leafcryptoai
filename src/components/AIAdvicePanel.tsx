import { motion } from 'framer-motion';
import { useAISignals, AIAdvice } from '@/hooks/useAISignals';
import { cn } from '@/lib/utils';
import { 
  Bell, AlertTriangle, TrendingUp, TrendingDown, 
  Info, Calendar, ExternalLink, Zap
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

export function AIAdvicePanel() {
  const { advices, isLoading } = useAISignals();

  const getAdviceIcon = (type: AIAdvice['adviceType']) => {
    switch (type) {
      case 'URGENT':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'WARNING':
        return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      case 'ENTRY':
        return <TrendingUp className="w-4 h-4 text-long" />;
      case 'EXIT':
        return <TrendingDown className="w-4 h-4 text-short" />;
      case 'EVENT':
        return <Calendar className="w-4 h-4 text-primary" />;
      default:
        return <Info className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getAdviceColor = (type: AIAdvice['adviceType']) => {
    switch (type) {
      case 'URGENT':
        return 'border-l-yellow-500 bg-yellow-500/5';
      case 'WARNING':
        return 'border-l-orange-500 bg-orange-500/5';
      case 'ENTRY':
        return 'border-l-long bg-long/5';
      case 'EXIT':
        return 'border-l-short bg-short/5';
      case 'EVENT':
        return 'border-l-primary bg-primary/5';
      default:
        return 'border-l-muted-foreground';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
      </div>
    );
  }

  // Separate urgent and normal advices
  const urgentAdvices = advices.filter(a => a.isUrgent);
  const normalAdvices = advices.filter(a => !a.isUrgent);

  return (
    <div className="space-y-4">
      {/* Urgent Alerts */}
      {urgentAdvices.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 px-2">
            <Zap className="w-4 h-4 text-yellow-500" />
            <span className="text-sm font-semibold text-yellow-500">긴급 알림</span>
          </div>
          {urgentAdvices.slice(0, 3).map((advice, index) => (
            <AdviceItem key={advice.id} advice={advice} index={index} isUrgent />
          ))}
        </div>
      )}

      {/* Normal Advices */}
      <div className="space-y-2">
        {urgentAdvices.length > 0 && (
          <div className="flex items-center gap-2 px-2 pt-2">
            <Bell className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-semibold text-muted-foreground">AI 조언</span>
          </div>
        )}
        {normalAdvices.length === 0 && urgentAdvices.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            아직 AI 조언이 없습니다
          </div>
        ) : (
          normalAdvices.slice(0, 10).map((advice, index) => (
            <AdviceItem key={advice.id} advice={advice} index={index} />
          ))
        )}
      </div>
    </div>
  );
}

function AdviceItem({ 
  advice, 
  index, 
  isUrgent = false 
}: { 
  advice: AIAdvice; 
  index: number;
  isUrgent?: boolean;
}) {
  const getAdviceIcon = (type: AIAdvice['adviceType']) => {
    switch (type) {
      case 'URGENT':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'WARNING':
        return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      case 'ENTRY':
        return <TrendingUp className="w-4 h-4 text-long" />;
      case 'EXIT':
        return <TrendingDown className="w-4 h-4 text-short" />;
      case 'EVENT':
        return <Calendar className="w-4 h-4 text-primary" />;
      default:
        return <Info className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getAdviceColor = (type: AIAdvice['adviceType']) => {
    switch (type) {
      case 'URGENT':
        return 'border-l-yellow-500 bg-yellow-500/5';
      case 'WARNING':
        return 'border-l-orange-500 bg-orange-500/5';
      case 'ENTRY':
        return 'border-l-long bg-long/5';
      case 'EXIT':
        return 'border-l-short bg-short/5';
      case 'EVENT':
        return 'border-l-primary bg-primary/5';
      default:
        return 'border-l-muted-foreground';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className={cn(
        "p-3 rounded-lg border-l-4",
        getAdviceColor(advice.adviceType),
        isUrgent && "animate-pulse"
      )}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5">
          {getAdviceIcon(advice.adviceType)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-sm">{advice.symbol}</span>
            {advice.priceAtTime && (
              <span className="text-xs text-muted-foreground">
                ${advice.priceAtTime.toLocaleString()}
              </span>
            )}
            {advice.triggeredBy && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-accent">
                {advice.triggeredBy === 'PRICE_SPIKE' ? '급변' : 
                 advice.triggeredBy === 'CRON' ? '정기' : 
                 advice.triggeredBy}
              </span>
            )}
          </div>
          <p className="text-sm text-foreground/90 whitespace-pre-wrap">
            {advice.adviceContent}
          </p>
          {advice.urgencyReason && (
            <p className="text-xs text-yellow-500/80 mt-1">
              ⚡ {advice.urgencyReason}
            </p>
          )}
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(advice.createdAt, { addSuffix: true, locale: ko })}
            </span>
            {advice.referenceUrl && (
              <a
                href={advice.referenceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <ExternalLink className="w-3 h-3" />
                참고
              </a>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
