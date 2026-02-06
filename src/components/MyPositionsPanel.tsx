import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, TrendingDown, Plus, X, Wallet, Target, 
  CheckCircle2, XCircle, Trash2, Edit2, DollarSign
} from 'lucide-react';
import { useUserPositions, UserPosition } from '@/hooks/useUserPositions';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

interface MyPositionsPanelProps {
  symbol: string;
  currentPrice: number;
}

export function MyPositionsPanel({ symbol, currentPrice }: MyPositionsPanelProps) {
  const { positions, settings, stats, addPosition, closePosition, deletePosition, updateInitialAsset } = useUserPositions();
  const [isAddingPosition, setIsAddingPosition] = useState(false);
  const [isEditingAsset, setIsEditingAsset] = useState(false);
  const [assetInput, setAssetInput] = useState(settings.initialAsset.toString());
  
  // Form state
  const [form, setForm] = useState({
    position: 'LONG' as 'LONG' | 'SHORT',
    entryPrice: currentPrice.toString(),
    targetPrice: '',
    stopLoss: '',
    leverage: '10',
    message: '',
  });

  const activePositions = positions.filter(p => p.status === 'ACTIVE');
  const completedPositions = positions.filter(p => p.status !== 'ACTIVE');

  const handleAddPosition = async () => {
    try {
      await addPosition({
        symbol,
        position: form.position,
        entryPrice: parseFloat(form.entryPrice),
        targetPrice: parseFloat(form.targetPrice),
        stopLoss: parseFloat(form.stopLoss),
        leverage: parseInt(form.leverage),
        message: form.message,
      });
      setIsAddingPosition(false);
      setForm({
        position: 'LONG',
        entryPrice: currentPrice.toString(),
        targetPrice: '',
        stopLoss: '',
        leverage: '10',
        message: '',
      });
    } catch (err) {
      console.error('Failed to add position:', err);
    }
  };

  const handleSaveAsset = async () => {
    const amount = parseFloat(assetInput);
    if (!isNaN(amount) && amount > 0) {
      await updateInitialAsset(amount);
      setIsEditingAsset(false);
    }
  };

  return (
    <div className="trading-card h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-primary" />
            <h3 className="font-bold">내 포지션</h3>
          </div>
          <button
            onClick={() => setIsAddingPosition(true)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary/20 hover:bg-primary/30 text-primary text-xs font-medium transition-colors"
          >
            <Plus className="w-3 h-3" />
            포지션 추가
          </button>
        </div>

        {/* Asset & Stats */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-2 rounded-lg bg-accent/50">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">시작 자산</span>
              {isEditingAsset ? (
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={assetInput}
                    onChange={e => setAssetInput(e.target.value)}
                    className="w-16 px-1 py-0.5 rounded bg-background border border-border text-right text-xs"
                  />
                  <button onClick={handleSaveAsset} className="text-long">
                    <CheckCircle2 className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <button onClick={() => setIsEditingAsset(true)} className="flex items-center gap-1 font-mono font-bold">
                  ${settings.initialAsset.toLocaleString()}
                  <Edit2 className="w-2.5 h-2.5 text-muted-foreground" />
                </button>
              )}
            </div>
          </div>
          <div className="p-2 rounded-lg bg-accent/50">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">현재 자산</span>
              <span className={cn("font-mono font-bold", stats.totalPnL >= 0 ? "text-long" : "text-short")}>
                ${stats.currentAsset.toLocaleString()}
              </span>
            </div>
          </div>
          <div className="p-2 rounded-lg bg-accent/50">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">내 승률</span>
              <span className="font-mono font-bold text-primary">{stats.winRate}%</span>
            </div>
          </div>
          <div className="p-2 rounded-lg bg-accent/50">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">수익률</span>
              <span className={cn("font-mono font-bold", stats.totalPnL >= 0 ? "text-long" : "text-short")}>
                {stats.totalPnL >= 0 ? '+' : ''}{stats.totalPnL}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Active Positions */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
        {activePositions.length === 0 && completedPositions.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm">
            <Target className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p>아직 포지션이 없습니다</p>
            <p className="text-xs mt-1">포지션을 추가하여 AI와 경쟁해보세요!</p>
          </div>
        )}

        {activePositions.map(pos => (
          <PositionCard
            key={pos.id}
            position={pos}
            currentPrice={currentPrice}
            onClose={closePosition}
            onDelete={deletePosition}
          />
        ))}

        {completedPositions.length > 0 && (
          <>
            <div className="text-xs text-muted-foreground uppercase tracking-wider pt-2">
              완료된 포지션
            </div>
            {completedPositions.slice(0, 5).map(pos => (
              <PositionCard
                key={pos.id}
                position={pos}
                currentPrice={currentPrice}
                onClose={closePosition}
                onDelete={deletePosition}
              />
            ))}
          </>
        )}
      </div>

      {/* Add Position Modal */}
      <AnimatePresence>
        {isAddingPosition && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-background/90 backdrop-blur-sm z-10 p-4 overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-bold">새 포지션 추가</h4>
              <button onClick={() => setIsAddingPosition(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Position Type */}
              <div className="flex gap-2">
                <button
                  onClick={() => setForm(f => ({ ...f, position: 'LONG' }))}
                  className={cn(
                    "flex-1 py-3 rounded-lg font-bold transition-all",
                    form.position === 'LONG'
                      ? "bg-long text-black"
                      : "bg-accent border border-border text-muted-foreground"
                  )}
                >
                  <TrendingUp className="w-4 h-4 inline mr-1" />
                  LONG
                </button>
                <button
                  onClick={() => setForm(f => ({ ...f, position: 'SHORT' }))}
                  className={cn(
                    "flex-1 py-3 rounded-lg font-bold transition-all",
                    form.position === 'SHORT'
                      ? "bg-short text-white"
                      : "bg-accent border border-border text-muted-foreground"
                  )}
                >
                  <TrendingDown className="w-4 h-4 inline mr-1" />
                  SHORT
                </button>
              </div>

              {/* Entry Price */}
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">진입가 ($)</label>
                <input
                  type="number"
                  value={form.entryPrice}
                  onChange={e => setForm(f => ({ ...f, entryPrice: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg bg-accent border border-border focus:border-primary focus:outline-none"
                />
              </div>

              {/* TP / SL */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-long mb-1 block">익절가 (TP)</label>
                  <input
                    type="number"
                    value={form.targetPrice}
                    onChange={e => setForm(f => ({ ...f, targetPrice: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg bg-accent border border-border focus:border-long focus:outline-none"
                    placeholder="목표가"
                  />
                </div>
                <div>
                  <label className="text-xs text-short mb-1 block">손절가 (SL)</label>
                  <input
                    type="number"
                    value={form.stopLoss}
                    onChange={e => setForm(f => ({ ...f, stopLoss: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg bg-accent border border-border focus:border-short focus:outline-none"
                    placeholder="손절가"
                  />
                </div>
              </div>

              {/* Leverage */}
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">레버리지</label>
                <select
                  value={form.leverage}
                  onChange={e => setForm(f => ({ ...f, leverage: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg bg-accent border border-border focus:border-primary focus:outline-none"
                >
                  {[1, 2, 3, 5, 10, 20, 25, 50, 75, 100].map(l => (
                    <option key={l} value={l}>{l}x</option>
                  ))}
                </select>
              </div>

              {/* Memo */}
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">메모 (선택)</label>
                <input
                  type="text"
                  value={form.message}
                  onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg bg-accent border border-border focus:border-primary focus:outline-none"
                  placeholder="진입 근거 등..."
                />
              </div>

              <button
                onClick={handleAddPosition}
                disabled={!form.entryPrice || !form.targetPrice || !form.stopLoss}
                className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-bold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                포지션 추가
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function PositionCard({ 
  position, 
  currentPrice, 
  onClose, 
  onDelete 
}: { 
  position: UserPosition; 
  currentPrice: number;
  onClose: (id: string, status: 'WIN' | 'LOSS', price: number) => void;
  onDelete: (id: string) => void;
}) {
  const isActive = position.status === 'ACTIVE';
  
  // Calculate unrealized P&L for active positions
  let pnl = 0;
  if (position.status === 'WIN') {
    pnl = position.position === 'LONG'
      ? ((position.targetPrice - position.entryPrice) / position.entryPrice) * 100 * position.leverage
      : ((position.entryPrice - position.targetPrice) / position.entryPrice) * 100 * position.leverage;
  } else if (position.status === 'LOSS') {
    pnl = position.position === 'LONG'
      ? ((position.stopLoss - position.entryPrice) / position.entryPrice) * 100 * position.leverage
      : ((position.entryPrice - position.stopLoss) / position.entryPrice) * 100 * position.leverage;
  } else if (isActive) {
    pnl = position.position === 'LONG'
      ? ((currentPrice - position.entryPrice) / position.entryPrice) * 100 * position.leverage
      : ((position.entryPrice - currentPrice) / position.entryPrice) * 100 * position.leverage;
  }
  pnl = Math.round(pnl * 10) / 10;

  return (
    <div className={cn(
      "p-3 rounded-lg border transition-all",
      position.status === 'WIN' && "bg-long/10 border-long/30",
      position.status === 'LOSS' && "bg-short/10 border-short/30",
      isActive && "bg-accent/50 border-border hover:border-primary/50"
    )}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className={cn(
            "p-1.5 rounded",
            position.position === 'LONG' ? "bg-long/20" : "bg-short/20"
          )}>
            {position.position === 'LONG' ? (
              <TrendingUp className="w-3 h-3 text-long" />
            ) : (
              <TrendingDown className="w-3 h-3 text-short" />
            )}
          </div>
          <span className="font-semibold text-sm">{position.symbol}/USDT</span>
          <span className="text-xs text-muted-foreground">{position.leverage}x</span>
        </div>
        <div className={cn(
          "text-sm font-mono font-bold",
          pnl >= 0 ? "text-long" : "text-short"
        )}>
          {pnl >= 0 ? '+' : ''}{pnl}%
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-xs mb-2">
        <div>
          <span className="text-muted-foreground">진입</span>
          <p className="font-mono">${position.entryPrice.toLocaleString()}</p>
        </div>
        <div>
          <span className="text-long">TP</span>
          <p className="font-mono text-long">${position.targetPrice.toLocaleString()}</p>
        </div>
        <div>
          <span className="text-short">SL</span>
          <p className="font-mono text-short">${position.stopLoss.toLocaleString()}</p>
        </div>
      </div>

      {isActive ? (
        <div className="flex gap-2 mt-2">
          <button
            onClick={() => onClose(position.id, 'WIN', currentPrice)}
            className="flex-1 py-1.5 rounded bg-long/20 text-long text-xs font-medium hover:bg-long/30 transition-colors"
          >
            <CheckCircle2 className="w-3 h-3 inline mr-1" />
            익절
          </button>
          <button
            onClick={() => onClose(position.id, 'LOSS', currentPrice)}
            className="flex-1 py-1.5 rounded bg-short/20 text-short text-xs font-medium hover:bg-short/30 transition-colors"
          >
            <XCircle className="w-3 h-3 inline mr-1" />
            손절
          </button>
          <button
            onClick={() => onDelete(position.id)}
            className="px-2 py-1.5 rounded bg-muted text-muted-foreground text-xs hover:bg-destructive/20 hover:text-destructive transition-colors"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between mt-2 text-xs">
          <span className={cn(
            "px-2 py-0.5 rounded font-bold",
            position.status === 'WIN' ? "bg-long/20 text-long" : "bg-short/20 text-short"
          )}>
            {position.status === 'WIN' ? '✓ 익절' : '✗ 손절'}
          </span>
          <span className="text-muted-foreground">
            {formatDistanceToNow(position.createdAt, { addSuffix: true, locale: ko })}
          </span>
        </div>
      )}
    </div>
  );
}
