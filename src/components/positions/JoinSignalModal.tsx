import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { 
  Bot, TrendingUp, TrendingDown, Loader2, 
  Target, Shield, Zap, CheckCircle2 
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { AISignal } from '@/hooks/useAISignals';
import { useAIManagedPositions } from '@/hooks/useAIManagedPositions';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

interface JoinSignalModalProps {
  isOpen: boolean;
  onClose: () => void;
  signals: AISignal[];
  userAsset: number;
}

export function JoinSignalModal({ isOpen, onClose, signals, userAsset }: JoinSignalModalProps) {
  const [selectedSignal, setSelectedSignal] = useState<AISignal | null>(null);
  const [allocationPercent, setAllocationPercent] = useState(25);
  const [isJoining, setIsJoining] = useState(false);
  const { joinSignal } = useAIManagedPositions();

  const allocatedAmount = (userAsset * allocationPercent) / 100;

  const handleJoin = async () => {
    if (!selectedSignal) return;
    
    setIsJoining(true);
    const result = await joinSignal(selectedSignal.id, allocatedAmount);
    setIsJoining(false);

    if (result.success) {
      toast.success(`${selectedSignal.symbol} 시그널에 함께 진입했습니다`);
      onClose();
      setSelectedSignal(null);
      setAllocationPercent(25);
    } else {
      toast.error(result.error || '진입에 실패했습니다');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <Bot className="w-5 h-5 text-primary" />
            AI 시그널 함께 진입
          </DialogTitle>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {!selectedSignal ? (
            <motion.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-3 mt-4"
            >
              <p className="text-sm text-muted-foreground">
                참여할 AI 시그널을 선택하세요
              </p>
              {signals.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Bot className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>현재 활성화된 AI 시그널이 없습니다</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
                  {signals.map((signal) => (
                    <motion.button
                      key={signal.id}
                      onClick={() => setSelectedSignal(signal)}
                      className={cn(
                        "w-full trading-card p-4 text-left transition-all hover:border-primary/50",
                        "border-l-4",
                        signal.position === 'LONG' ? "border-l-long" : "border-l-short"
                      )}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {signal.position === 'LONG' ? (
                            <TrendingUp className="w-5 h-5 text-long" />
                          ) : (
                            <TrendingDown className="w-5 h-5 text-short" />
                          )}
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold">{signal.symbol}</span>
                              <span className={cn(
                                "text-xs px-2 py-0.5 rounded-full",
                                signal.position === 'LONG' 
                                  ? "bg-long/20 text-long" 
                                  : "bg-short/20 text-short"
                              )}>
                                {signal.position} {signal.leverage}x
                              </span>
                            </div>
                            <div className="text-xs text-muted-foreground mt-0.5">
                              진입: ${signal.entryPrice.toLocaleString()} • 
                              신뢰도 {signal.confidence}%
                            </div>
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(signal.createdAt, { addSuffix: true, locale: ko })}
                        </span>
                      </div>
                    </motion.button>
                  ))}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="config"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6 mt-4"
            >
              {/* Selected Signal Summary */}
              <div className={cn(
                "trading-card p-4 border-l-4",
                selectedSignal.position === 'LONG' ? "border-l-long" : "border-l-short"
              )}>
                <div className="flex items-center gap-3 mb-4">
                  {selectedSignal.position === 'LONG' ? (
                    <TrendingUp className="w-6 h-6 text-long" />
                  ) : (
                    <TrendingDown className="w-6 h-6 text-short" />
                  )}
                  <div>
                    <span className="font-bold text-lg">{selectedSignal.symbol}</span>
                    <span className={cn(
                      "ml-2 text-sm px-2 py-0.5 rounded-full",
                      selectedSignal.position === 'LONG' 
                        ? "bg-long/20 text-long" 
                        : "bg-short/20 text-short"
                    )}>
                      {selectedSignal.position} {selectedSignal.leverage}x
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">진입가</p>
                      <p className="font-mono">${selectedSignal.entryPrice.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-long" />
                    <div>
                      <p className="text-xs text-muted-foreground">익절가</p>
                      <p className="font-mono text-long">${selectedSignal.targetPrice.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-short" />
                    <div>
                      <p className="text-xs text-muted-foreground">손절가</p>
                      <p className="font-mono text-short">${selectedSignal.stopLoss.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Asset Allocation */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">할당 자산</span>
                  <span className="text-2xl font-bold text-primary">
                    ${allocatedAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </span>
                </div>
                
                <Slider
                  value={[allocationPercent]}
                  onValueChange={([v]) => setAllocationPercent(v)}
                  min={10}
                  max={100}
                  step={5}
                  className="py-4"
                />
                
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>10%</span>
                  <span className="font-medium text-foreground">{allocationPercent}%</span>
                  <span>100%</span>
                </div>

                {/* Quick Select Buttons */}
                <div className="flex gap-2">
                  {[10, 25, 50, 100].map((percent) => (
                    <Button
                      key={percent}
                      type="button"
                      size="sm"
                      variant={allocationPercent === percent ? 'default' : 'outline'}
                      onClick={() => setAllocationPercent(percent)}
                      className="flex-1"
                    >
                      {percent}%
                    </Button>
                  ))}
                </div>

                <p className="text-xs text-muted-foreground text-center">
                  현재 자산: ${userAsset.toLocaleString()} 중 {allocationPercent}% 할당
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setSelectedSignal(null)}
                  className="flex-1"
                >
                  다른 시그널 선택
                </Button>
                <Button 
                  onClick={handleJoin} 
                  disabled={isJoining}
                  className="flex-1 gap-2"
                >
                  {isJoining ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      함께 진입
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
