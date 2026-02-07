import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle2, XCircle } from 'lucide-react';
import { UserPosition } from '@/hooks/useUserPositions';
import { cn } from '@/lib/utils';

interface ClosePositionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  position: UserPosition | null;
  currentPrice: number;
  onClose: (status: 'WIN' | 'LOSS', closePrice: number) => void;
}

export function ClosePositionDialog({ 
  open, 
  onOpenChange, 
  position, 
  currentPrice,
  onClose 
}: ClosePositionDialogProps) {
  const [closePrice, setClosePrice] = useState(currentPrice.toString());
  const [status, setStatus] = useState<'WIN' | 'LOSS'>('WIN');

  if (!position) return null;

  const price = parseFloat(closePrice) || currentPrice;
  const isLong = position.position === 'LONG';
  const pnl = isLong
    ? ((price - position.entryPrice) / position.entryPrice) * 100 * position.leverage
    : ((position.entryPrice - price) / position.entryPrice) * 100 * position.leverage;

  const handleClose = () => {
    onClose(status, price);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>포지션 청산</AlertDialogTitle>
          <AlertDialogDescription>
            {position.symbol} {position.position} 포지션을 청산합니다
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 py-4">
          {/* Close Price */}
          <div className="space-y-2">
            <Label>청산 가격 ($)</Label>
            <Input
              type="number"
              step="any"
              value={closePrice}
              onChange={(e) => setClosePrice(e.target.value)}
              placeholder={currentPrice.toString()}
            />
          </div>

          {/* PnL Preview */}
          <div className="trading-card p-4">
            <div className="text-sm text-muted-foreground mb-1">예상 수익률</div>
            <div className={cn(
              "text-2xl font-bold",
              pnl >= 0 ? "text-long" : "text-short"
            )}>
              {pnl >= 0 ? '+' : ''}{pnl.toFixed(2)}%
            </div>
          </div>

          {/* Status Selection */}
          <div className="space-y-2">
            <Label>청산 결과</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={status === 'WIN' ? 'default' : 'outline'}
                onClick={() => setStatus('WIN')}
                className={cn(
                  "gap-2",
                  status === 'WIN' && "bg-long hover:bg-long/90"
                )}
              >
                <CheckCircle2 className="w-4 h-4" />
                익절 (WIN)
              </Button>
              <Button
                type="button"
                variant={status === 'LOSS' ? 'default' : 'outline'}
                onClick={() => setStatus('LOSS')}
                className={cn(
                  "gap-2",
                  status === 'LOSS' && "bg-short hover:bg-short/90"
                )}
              >
                <XCircle className="w-4 h-4" />
                손절 (LOSS)
              </Button>
            </div>
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>취소</AlertDialogCancel>
          <Button onClick={handleClose}>청산 확인</Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
