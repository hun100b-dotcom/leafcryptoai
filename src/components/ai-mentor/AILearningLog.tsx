import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, Brain, TrendingUp, TrendingDown, ChevronRight,
  Target, AlertTriangle, CheckCircle2, XCircle, Zap
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AISignal } from '@/hooks/useAISignals';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { PostMortemReport } from './PostMortemReport';

interface AILearningLogProps {
  signals: AISignal[];
}

export function AILearningLog({ signals }: AILearningLogProps) {
  const [selectedSignal, setSelectedSignal] = useState<AISignal | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'win' | 'loss'>('all');

  const completedSignals = signals.filter(s => s.status === 'WIN' || s.status === 'LOSS');
  const activeSignals = signals.filter(s => s.status === 'ACTIVE');

  const filteredSignals = signals.filter(s => {
    if (filter === 'all') return true;
    if (filter === 'active') return s.status === 'ACTIVE';
    if (filter === 'win') return s.status === 'WIN';
    if (filter === 'loss') return s.status === 'LOSS';
    return true;
  });

  // Stats for header

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              AI 학습 로그
            </div>
            <div className="flex items-center gap-2 text-sm font-normal">
              <Brain className="w-4 h-4 text-violet-500" />
              <span className="text-muted-foreground">분석 완료:</span>
              <span className="text-violet-500 font-semibold">{completedSignals.length}건</span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex gap-2 flex-wrap">
            {[
              { key: 'all', label: '전체', count: signals.length },
              { key: 'active', label: '진행 중', count: activeSignals.length },
              { key: 'win', label: '수익', count: completedSignals.filter(s => s.status === 'WIN').length },
              { key: 'loss', label: '손절', count: completedSignals.filter(s => s.status === 'LOSS').length },
            ].map(item => (
              <Button
                key={item.key}
                variant={filter === item.key ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter(item.key as typeof filter)}
                className="gap-1"
              >
                {item.label}
                <Badge variant="secondary" className="ml-1 text-xs">
                  {item.count}
                </Badge>
              </Button>
            ))}
          </div>

          {/* Signal List */}
          <div className="space-y-3 max-h-[500px] overflow-y-auto scrollbar-thin">
            {filteredSignals.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                해당 조건의 시그널이 없습니다
              </p>
            ) : (
              filteredSignals.map((signal, index) => (
                <motion.div
                  key={signal.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={cn(
                    "p-4 rounded-lg border cursor-pointer transition-all hover:bg-accent/50",
                    signal.status === 'WIN' && "border-long/30 bg-long/5",
                    signal.status === 'LOSS' && "border-short/30 bg-short/5",
                    signal.status === 'ACTIVE' && "border-primary/30 bg-primary/5"
                  )}
                  onClick={() => setSelectedSignal(signal)}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold",
                        signal.position === 'LONG' && "bg-long/20 text-long",
                        signal.position === 'SHORT' && "bg-short/20 text-short"
                      )}>
                        {signal.position === 'LONG' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {signal.position}
                      </span>
                      <span className="font-semibold">{signal.symbol}</span>
                      <span className="text-xs text-muted-foreground">
                        {signal.leverage}x
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {signal.status === 'WIN' && (
                        <Badge className="bg-long/20 text-long border-0">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          +{signal.pnlPercent?.toFixed(1)}%
                        </Badge>
                      )}
                      {signal.status === 'LOSS' && (
                        <Badge className="bg-short/20 text-short border-0">
                          <XCircle className="w-3 h-3 mr-1" />
                          {signal.pnlPercent?.toFixed(1)}%
                        </Badge>
                      )}
                      {signal.status === 'ACTIVE' && (
                        <Badge className="bg-primary/20 text-primary border-0">
                          <Zap className="w-3 h-3 mr-1 animate-pulse" />
                          진행 중
                        </Badge>
                      )}
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>

                  {/* Price Info */}
                  <div className="grid grid-cols-3 gap-2 text-xs mb-2">
                    <div>
                      <span className="text-muted-foreground">진입가</span>
                      <p className="font-mono">${signal.entryPrice.toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-long">목표가</span>
                      <p className="font-mono text-long">${signal.targetPrice.toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-short">손절가</span>
                      <p className="font-mono text-short">${signal.stopLoss.toLocaleString()}</p>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>신뢰도 {signal.confidence}%</span>
                    <span>
                      {formatDistanceToNow(signal.createdAt, { addSuffix: true, locale: ko })}
                    </span>
                  </div>

          {/* Post-Mortem indicator for completed trades */}
                  {(signal.status === 'WIN' || signal.status === 'LOSS') && (
                    <div className="mt-2 pt-2 border-t border-border">
                      <div className="flex items-center gap-2 text-xs">
                        <Brain className="w-3 h-3 text-violet-500" />
                        <span className="text-violet-500">
                          클릭하여 Post-Mortem 상세 분석 보기
                        </span>
                      </div>
                    </div>
                  )}
                </motion.div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Post-Mortem Report Dialog */}
      <Dialog open={!!selectedSignal} onOpenChange={() => setSelectedSignal(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              거래 상세 분석 리포트
            </DialogTitle>
          </DialogHeader>
          {selectedSignal && (
            <PostMortemReport signal={selectedSignal} />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
