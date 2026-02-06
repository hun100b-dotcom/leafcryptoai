import { useState } from 'react';
import { motion } from 'framer-motion';
import { useUserPositions, UserPosition } from '@/hooks/useUserPositions';
import { useBinancePrice } from '@/hooks/useBinancePrice';
import { cn } from '@/lib/utils';
import {
  Plus, TrendingUp, TrendingDown, X, Loader2,
  CheckCircle2, XCircle, Wallet, Target, ShieldAlert, RefreshCw
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface UserPositionsTabProps {
  symbol: string;
  currentPrice: number;
}

export function UserPositionsTab({ symbol, currentPrice }: UserPositionsTabProps) {
  const { positions, stats, settings, isLoading, addPosition, closePosition, deletePosition, updateInitialAsset, refetch } = useUserPositions();
  const { coins } = useBinancePrice();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isAssetOpen, setIsAssetOpen] = useState(false);
  const [newAsset, setNewAsset] = useState(settings.initialAsset.toString());
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Build price map from coins
  const prices: { [key: string]: number } = {};
  coins.forEach(coin => {
    prices[coin.symbol] = coin.price;
  });

  const [form, setForm] = useState({
    symbol: symbol,
    position: 'LONG' as 'LONG' | 'SHORT',
    entryPrice: '',
    targetPrice: '',
    stopLoss: '',
    leverage: '10',
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
    toast.success('포지션 데이터를 새로고침했습니다');
  };

  const handleAddPosition = async () => {
    try {
      await addPosition({
        symbol: form.symbol,
        position: form.position,
        entryPrice: parseFloat(form.entryPrice),
        targetPrice: parseFloat(form.targetPrice),
        stopLoss: parseFloat(form.stopLoss),
        leverage: parseInt(form.leverage),
      });
      toast.success('포지션이 추가되었습니다');
      setIsAddOpen(false);
      setForm({
        symbol: symbol,
        position: 'LONG',
        entryPrice: '',
        targetPrice: '',
        stopLoss: '',
        leverage: '10',
      });
    } catch (err) {
      toast.error('포지션 추가에 실패했습니다');
    }
  };

  const handleClosePosition = async (pos: UserPosition, status: 'WIN' | 'LOSS') => {
    const price = prices[pos.symbol] || currentPrice;
    await closePosition(pos.id, status, price);
    toast.success(`포지션이 ${status === 'WIN' ? '익절' : '손절'} 처리되었습니다`);
  };

  const handleDeletePosition = async (id: string) => {
    if (!confirm('이 포지션을 삭제하시겠습니까?')) return;
    await deletePosition(id);
    toast.success('포지션이 삭제되었습니다');
  };

  const handleUpdateAsset = async () => {
    const amount = parseFloat(newAsset);
    if (isNaN(amount) || amount <= 0) {
      toast.error('올바른 금액을 입력하세요');
      return;
    }
    await updateInitialAsset(amount);
    toast.success('초기 자산이 업데이트되었습니다');
    setIsAssetOpen(false);
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-card">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const activePositions = positions.filter(p => p.status === 'ACTIVE');
  const completedPositions = positions.filter(p => p.status !== 'ACTIVE');

  return (
    <div className="h-full flex flex-col bg-card">
      {/* Stats Header - 패딩 없이 바로 시작 */}
      <div className="grid grid-cols-3 gap-2 p-3 border-b border-border">
        <Dialog open={isAssetOpen} onOpenChange={setIsAssetOpen}>
          <DialogTrigger asChild>
            <button className="p-3 rounded-lg bg-accent/50 text-center hover:bg-accent/70 transition-colors">
              <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                <Wallet className="w-3 h-3" />
                <span className="text-[10px]">초기자산</span>
              </div>
              <p className="text-sm font-bold">${settings.initialAsset.toLocaleString()}</p>
            </button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[320px]">
            <DialogHeader>
              <DialogTitle>초기 자산 설정</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <Input
                type="number"
                value={newAsset}
                onChange={(e) => setNewAsset(e.target.value)}
                placeholder="초기 자산 (USD)"
              />
              <Button onClick={handleUpdateAsset} className="w-full">저장</Button>
            </div>
          </DialogContent>
        </Dialog>

        <div className="p-3 rounded-lg bg-accent/50 text-center">
          <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
            <Target className="w-3 h-3" />
            <span className="text-[10px]">현재자산</span>
          </div>
          <p className={cn(
            "text-sm font-bold",
            stats.currentAsset >= settings.initialAsset ? "text-long" : "text-short"
          )}>
            ${stats.currentAsset.toLocaleString()}
          </p>
        </div>

        <div className="p-3 rounded-lg bg-accent/50 text-center">
          <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
            <ShieldAlert className="w-3 h-3" />
            <span className="text-[10px]">승률</span>
          </div>
          <p className={cn(
            "text-sm font-bold",
            stats.winRate >= 50 ? "text-long" : stats.winRate > 0 ? "text-short" : "text-muted-foreground"
          )}>
            {stats.winRate}%
          </p>
          <p className="text-[9px] text-muted-foreground">{stats.wins}W / {stats.losses}L</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 p-3 border-b border-border">
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="flex-1">
              <Plus className="w-4 h-4 mr-1" />
              포지션 추가
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[360px]">
            <DialogHeader>
              <DialogTitle>새 포지션 추가</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 pt-4">
              <Input
                value={form.symbol}
                onChange={(e) => setForm({ ...form, symbol: e.target.value.toUpperCase() })}
                placeholder="심볼 (BTC)"
              />
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={form.position === 'LONG' ? 'default' : 'outline'}
                  onClick={() => setForm({ ...form, position: 'LONG' })}
                  className={form.position === 'LONG' ? 'bg-long hover:bg-long/90' : ''}
                >
                  <TrendingUp className="w-4 h-4 mr-1" />
                  LONG
                </Button>
                <Button
                  variant={form.position === 'SHORT' ? 'default' : 'outline'}
                  onClick={() => setForm({ ...form, position: 'SHORT' })}
                  className={form.position === 'SHORT' ? 'bg-short hover:bg-short/90' : ''}
                >
                  <TrendingDown className="w-4 h-4 mr-1" />
                  SHORT
                </Button>
              </div>
              <Input
                type="number"
                value={form.entryPrice}
                onChange={(e) => setForm({ ...form, entryPrice: e.target.value })}
                placeholder="진입가"
              />
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="number"
                  value={form.targetPrice}
                  onChange={(e) => setForm({ ...form, targetPrice: e.target.value })}
                  placeholder="목표가 (TP)"
                />
                <Input
                  type="number"
                  value={form.stopLoss}
                  onChange={(e) => setForm({ ...form, stopLoss: e.target.value })}
                  placeholder="손절가 (SL)"
                />
              </div>
              <Input
                type="number"
                value={form.leverage}
                onChange={(e) => setForm({ ...form, leverage: e.target.value })}
                placeholder="레버리지"
              />
              <Button onClick={handleAddPosition} className="w-full">추가</Button>
            </div>
          </DialogContent>
        </Dialog>

        <Button size="sm" variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
          {isRefreshing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
        </Button>
      </div>

      {/* Positions List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin">
        {/* Active Positions */}
        {activePositions.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground font-semibold">활성 포지션</p>
            {activePositions.map((pos, idx) => (
              <PositionCard
                key={pos.id}
                position={pos}
                index={idx}
                currentPrice={prices[pos.symbol] || currentPrice}
                onClose={handleClosePosition}
                onDelete={handleDeletePosition}
              />
            ))}
          </div>
        )}

        {/* Completed Positions */}
        {completedPositions.length > 0 && (
          <div className="space-y-2 mt-4">
            <p className="text-xs text-muted-foreground font-semibold">완료된 포지션</p>
            {completedPositions.slice(0, 10).map((pos, idx) => (
              <CompletedPositionCard key={pos.id} position={pos} index={idx} />
            ))}
          </div>
        )}

        {positions.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm">
            등록된 포지션이 없습니다
          </div>
        )}
      </div>
    </div>
  );
}

function PositionCard({
  position,
  index,
  currentPrice,
  onClose,
  onDelete,
}: {
  position: UserPosition;
  index: number;
  currentPrice: number;
  onClose: (pos: UserPosition, status: 'WIN' | 'LOSS') => void;
  onDelete: (id: string) => void;
}) {
  const pnlPercent = position.position === 'LONG'
    ? ((currentPrice - position.entryPrice) / position.entryPrice) * 100 * position.leverage
    : ((position.entryPrice - currentPrice) / position.entryPrice) * 100 * position.leverage;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={cn(
        "p-3 rounded-lg border-l-4",
        position.position === 'LONG' ? "border-l-long bg-long/5" : "border-l-short bg-short/5"
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className={cn(
            "text-xs font-bold px-2 py-0.5 rounded",
            position.position === 'LONG' ? "bg-long/20 text-long" : "bg-short/20 text-short"
          )}>
            {position.position}
          </span>
          <span className="font-semibold text-sm">{position.symbol}</span>
          <span className="text-xs text-muted-foreground">{position.leverage}x</span>
        </div>
        <button onClick={() => onDelete(position.id)} className="p-1 hover:bg-accent rounded">
          <X className="w-3 h-3 text-muted-foreground" />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2 text-xs mb-2">
        <div className="bg-accent/50 rounded px-2 py-1">
          <span className="text-muted-foreground">진입</span>
          <p className="font-mono font-semibold">${position.entryPrice.toLocaleString()}</p>
        </div>
        <div className="bg-long/10 rounded px-2 py-1">
          <span className="text-long/80">TP</span>
          <p className="font-mono font-semibold text-long">${position.targetPrice.toLocaleString()}</p>
        </div>
        <div className="bg-short/10 rounded px-2 py-1">
          <span className="text-short/80">SL</span>
          <p className="font-mono font-semibold text-short">${position.stopLoss.toLocaleString()}</p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-xs">
          <span className="text-muted-foreground mr-1">현재가:</span>
          <span className="font-mono">${currentPrice.toLocaleString()}</span>
          <span className={cn("ml-2 font-bold", pnlPercent >= 0 ? "text-long" : "text-short")}>
            ({pnlPercent >= 0 ? '+' : ''}{pnlPercent.toFixed(2)}%)
          </span>
        </div>
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" className="h-7 text-xs text-long hover:text-long hover:bg-long/10" onClick={() => onClose(position, 'WIN')}>
            익절
          </Button>
          <Button size="sm" variant="ghost" className="h-7 text-xs text-short hover:text-short hover:bg-short/10" onClick={() => onClose(position, 'LOSS')}>
            손절
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

function CompletedPositionCard({ position, index }: { position: UserPosition; index: number }) {
  const isWin = position.status === 'WIN';
  const pnlPercent = position.position === 'LONG'
    ? (((position.closePrice || position.entryPrice) - position.entryPrice) / position.entryPrice) * 100 * position.leverage
    : ((position.entryPrice - (position.closePrice || position.entryPrice)) / position.entryPrice) * 100 * position.leverage;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03 }}
      className={cn(
        "p-2 rounded-lg border-l-4 flex items-center justify-between",
        isWin ? "border-l-long bg-long/5" : "border-l-short bg-short/5"
      )}
    >
      <div className="flex items-center gap-2">
        {isWin ? (
          <CheckCircle2 className="w-3 h-3 text-long" />
        ) : (
          <XCircle className="w-3 h-3 text-short" />
        )}
        <span className="font-semibold text-xs">{position.symbol}</span>
        <span className={cn(
          "text-[10px] px-1 py-0.5 rounded",
          position.position === 'LONG' ? "bg-long/20 text-long" : "bg-short/20 text-short"
        )}>
          {position.position}
        </span>
      </div>
      <div className="text-right">
        <p className={cn(
          "font-bold text-xs",
          pnlPercent >= 0 ? "text-long" : "text-short"
        )}>
          {pnlPercent >= 0 ? '+' : ''}{pnlPercent.toFixed(2)}%
        </p>
        <p className="text-[9px] text-muted-foreground">
          {formatDistanceToNow(position.createdAt, { addSuffix: true, locale: ko })}
        </p>
      </div>
    </motion.div>
  );
}
