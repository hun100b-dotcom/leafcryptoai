import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, TrendingUp, TrendingDown } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { UserPosition } from '@/hooks/useUserPositions';

const SYMBOLS = ['BTC', 'ETH', 'SOL', 'XRP', 'DOGE', 'ADA', 'AVAX', 'DOT', 'LINK', 'MATIC'];
const LEVERAGE_OPTIONS = [1, 2, 3, 5, 10, 20, 25, 50];

interface AddPositionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (position: Omit<UserPosition, 'id' | 'createdAt' | 'status'>) => Promise<void>;
}

export function AddPositionModal({ isOpen, onClose, onAdd }: AddPositionModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({
    symbol: 'BTC',
    position: 'LONG' as 'LONG' | 'SHORT',
    entryPrice: '',
    targetPrice: '',
    stopLoss: '',
    leverage: 10,
    message: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const entryPrice = parseFloat(form.entryPrice);
    const targetPrice = parseFloat(form.targetPrice);
    const stopLoss = parseFloat(form.stopLoss);

    if (isNaN(entryPrice) || isNaN(targetPrice) || isNaN(stopLoss)) {
      toast.error('가격을 올바르게 입력해주세요');
      return;
    }

    // Validate TP/SL based on position
    if (form.position === 'LONG') {
      if (targetPrice <= entryPrice) {
        toast.error('롱 포지션의 익절가는 진입가보다 높아야 합니다');
        return;
      }
      if (stopLoss >= entryPrice) {
        toast.error('롱 포지션의 손절가는 진입가보다 낮아야 합니다');
        return;
      }
    } else {
      if (targetPrice >= entryPrice) {
        toast.error('숏 포지션의 익절가는 진입가보다 낮아야 합니다');
        return;
      }
      if (stopLoss <= entryPrice) {
        toast.error('숏 포지션의 손절가는 진입가보다 높아야 합니다');
        return;
      }
    }

    setIsLoading(true);
    try {
      await onAdd({
        symbol: form.symbol,
        position: form.position,
        entryPrice,
        targetPrice,
        stopLoss,
        leverage: form.leverage,
        message: form.message || undefined,
      });
      toast.success('포지션이 추가되었습니다');
      onClose();
      // Reset form
      setForm({
        symbol: 'BTC',
        position: 'LONG',
        entryPrice: '',
        targetPrice: '',
        stopLoss: '',
        leverage: 10,
        message: '',
      });
    } catch {
      toast.error('포지션 추가에 실패했습니다');
    }
    setIsLoading(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">직접 진입</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Symbol Select */}
          <div className="space-y-2">
            <Label>심볼</Label>
            <Select 
              value={form.symbol} 
              onValueChange={(v) => setForm(prev => ({ ...prev, symbol: v }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SYMBOLS.map(s => (
                  <SelectItem key={s} value={s}>{s}/USDT</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Position Type */}
          <div className="space-y-2">
            <Label>포지션</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={form.position === 'LONG' ? 'default' : 'outline'}
                className={cn(
                  "gap-2",
                  form.position === 'LONG' && "bg-long hover:bg-long/90"
                )}
                onClick={() => setForm(prev => ({ ...prev, position: 'LONG' }))}
              >
                <TrendingUp className="w-4 h-4" />
                LONG
              </Button>
              <Button
                type="button"
                variant={form.position === 'SHORT' ? 'default' : 'outline'}
                className={cn(
                  "gap-2",
                  form.position === 'SHORT' && "bg-short hover:bg-short/90"
                )}
                onClick={() => setForm(prev => ({ ...prev, position: 'SHORT' }))}
              >
                <TrendingDown className="w-4 h-4" />
                SHORT
              </Button>
            </div>
          </div>

          {/* Prices */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label>진입가 ($)</Label>
              <Input
                type="number"
                step="any"
                placeholder="0.00"
                value={form.entryPrice}
                onChange={(e) => setForm(prev => ({ ...prev, entryPrice: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label className="text-long">익절가 ($)</Label>
              <Input
                type="number"
                step="any"
                placeholder="0.00"
                value={form.targetPrice}
                onChange={(e) => setForm(prev => ({ ...prev, targetPrice: e.target.value }))}
                className="border-long/30 focus:border-long"
                required
              />
            </div>
            <div className="space-y-2">
              <Label className="text-short">손절가 ($)</Label>
              <Input
                type="number"
                step="any"
                placeholder="0.00"
                value={form.stopLoss}
                onChange={(e) => setForm(prev => ({ ...prev, stopLoss: e.target.value }))}
                className="border-short/30 focus:border-short"
                required
              />
            </div>
          </div>

          {/* Leverage */}
          <div className="space-y-2">
            <Label>레버리지</Label>
            <div className="flex flex-wrap gap-2">
              {LEVERAGE_OPTIONS.map(lev => (
                <Button
                  key={lev}
                  type="button"
                  size="sm"
                  variant={form.leverage === lev ? 'default' : 'outline'}
                  onClick={() => setForm(prev => ({ ...prev, leverage: lev }))}
                >
                  {lev}x
                </Button>
              ))}
            </div>
          </div>

          {/* Memo */}
          <div className="space-y-2">
            <Label>메모 (선택)</Label>
            <Textarea
              placeholder="포지션에 대한 메모를 입력하세요..."
              value={form.message}
              onChange={(e) => setForm(prev => ({ ...prev, message: e.target.value }))}
              rows={2}
            />
          </div>

          {/* Submit */}
          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              취소
            </Button>
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : '진입하기'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
