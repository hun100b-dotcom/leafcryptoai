import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAIManagedPositions } from '@/hooks/useAIManagedPositions';
import { AISignal } from '@/hooks/useAISignals';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { UserPlus, Loader2, X, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface JoinSignalButtonProps {
  signal: AISignal;
  userAsset?: number;
}

export function JoinSignalButton({ signal, userAsset = 1000 }: JoinSignalButtonProps) {
  const { joinSignal, positions } = useAIManagedPositions();
  const [isOpen, setIsOpen] = useState(false);
  const [allocatedPercent, setAllocatedPercent] = useState(10);
  const [isLoading, setIsLoading] = useState(false);

  // Check if already joined
  const alreadyJoined = positions.some(
    p => p.signalId === signal.id && p.status === 'ACTIVE'
  );

  const allocatedAmount = (userAsset * allocatedPercent) / 100;

  const handleJoin = async () => {
    if (allocatedPercent <= 0 || allocatedPercent > 100) {
      toast.error('유효한 비율을 입력해주세요');
      return;
    }

    setIsLoading(true);
    const result = await joinSignal(signal.id, allocatedAmount);
    setIsLoading(false);

    if (result.success) {
      toast.success(`${signal.symbol} ${signal.position}에 함께 진입했습니다!`);
      setIsOpen(false);
    } else {
      toast.error(result.error || '함께 진입에 실패했습니다');
    }
  };

  if (alreadyJoined) {
    return (
      <div className="flex items-center gap-2 text-sm text-primary">
        <UserPlus className="w-4 h-4" />
        <span>함께 진입 중</span>
      </div>
    );
  }

  if (signal.status !== 'ACTIVE') {
    return null;
  }

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2"
      >
        <UserPlus className="w-4 h-4" />
        함께 진입
      </Button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="trading-card p-6 max-w-md w-full"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">함께 진입하기</h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-accent rounded"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Signal Info */}
              <div className={cn(
                "p-4 rounded-lg mb-6",
                signal.position === 'LONG' ? "bg-long/10" : "bg-short/10"
              )}>
                <div className="flex items-center gap-3 mb-3">
                  {signal.position === 'LONG' ? (
                    <TrendingUp className="w-6 h-6 text-long" />
                  ) : (
                    <TrendingDown className="w-6 h-6 text-short" />
                  )}
                  <div>
                    <p className="font-semibold">{signal.symbol} {signal.position}</p>
                    <p className="text-sm text-muted-foreground">{signal.leverage}x 레버리지</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">진입가</span>
                    <p className="font-mono">${signal.entryPrice.toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-long/80">목표가</span>
                    <p className="font-mono text-long">${signal.targetPrice.toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-short/80">손절가</span>
                    <p className="font-mono text-short">${signal.stopLoss.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Allocation */}
              <div className="space-y-4 mb-6">
                <div>
                  <Label>자산 할당 비율</Label>
                  <div className="flex items-center gap-2 mt-2">
                    <Input
                      type="number"
                      min={1}
                      max={100}
                      value={allocatedPercent}
                      onChange={e => setAllocatedPercent(Number(e.target.value))}
                      className="w-24"
                    />
                    <span className="text-muted-foreground">%</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  {[10, 25, 50, 100].map(percent => (
                    <Button
                      key={percent}
                      size="sm"
                      variant={allocatedPercent === percent ? "default" : "outline"}
                      onClick={() => setAllocatedPercent(percent)}
                    >
                      {percent}%
                    </Button>
                  ))}
                </div>

                <div className="p-3 bg-accent/50 rounded-lg">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">할당 금액</span>
                    <span className="font-semibold">${allocatedAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm mt-1">
                    <span className="text-muted-foreground">내 자산</span>
                    <span>${userAsset.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Warning */}
              <div className="flex items-start gap-2 p-3 bg-yellow-500/10 rounded-lg mb-6">
                <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-yellow-500/90">
                  AI가 자동으로 익절/손절을 관리합니다. 진입 후 취소할 수 있지만, 현재 가격에서 청산됩니다.
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setIsOpen(false)}
                >
                  취소
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleJoin}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    '함께 진입'
                  )}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
