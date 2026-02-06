import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, TrendingDown, Plus, X, Wallet, Target, 
  CheckCircle2, XCircle, Trash2, Edit2, BarChart3, 
  LineChart, ArrowUpRight, ArrowDownRight, Trophy
} from 'lucide-react';
import { useUserPositions, UserPosition } from '@/hooks/useUserPositions';
import { useAISignals } from '@/hooks/useAISignals';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AIManagedPositionsPanel } from './AIManagedPositionsPanel';

interface MyPositionsPanelProps {
  symbol: string;
  currentPrice: number;
}

export function MyPositionsPanel({ symbol, currentPrice }: MyPositionsPanelProps) {
  const { positions, settings, stats, addPosition, closePosition, deletePosition, updateInitialAsset } = useUserPositions();
  const { stats: aiStats } = useAISignals();
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

  // Asset change calculation
  const assetChange = useMemo(() => {
    const change = stats.currentAsset - settings.initialAsset;
    const changePercent = ((change / settings.initialAsset) * 100).toFixed(2);
    return { change, changePercent };
  }, [stats.currentAsset, settings.initialAsset]);

  // Calculate profit amount for a position
  const calculateProfitAmount = (pnlPercent: number, leverage: number) => {
    const positionValue = settings.initialAsset / 10; // Assume 10% of asset per position
    const profitAmount = positionValue * (pnlPercent / 100);
    return profitAmount;
  };

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
    <div className="h-full flex flex-col">
      {/* Enhanced Stats Header */}
      <div className="p-4 border-b border-border space-y-3">
        {/* Main Asset Display */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Wallet className="w-4 h-4" />
              <span>현재 자산</span>
            </div>
            <p className={cn(
              "text-2xl font-bold mt-1",
              stats.totalPnL >= 0 ? "text-long" : "text-short"
            )}>
              ${stats.currentAsset.toLocaleString()}
            </p>
            <div className="flex items-center gap-1 text-sm mt-0.5">
              {assetChange.change >= 0 ? (
                <ArrowUpRight className="w-4 h-4 text-long" />
              ) : (
                <ArrowDownRight className="w-4 h-4 text-short" />
              )}
              <span className={cn(
                assetChange.change >= 0 ? "text-long" : "text-short"
              )}>
                ${Math.abs(assetChange.change).toLocaleString()} ({assetChange.changePercent}%)
              </span>
            </div>
          </div>
          <button
            onClick={() => setIsAddingPosition(true)}
            className="flex items-center gap-1 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium transition-colors hover:bg-primary/90"
          >
            <Plus className="w-4 h-4" />
            포지션 추가
          </button>
        </div>

        {/* Initial Asset Edit */}
        <div className="flex items-center justify-between p-2 rounded-lg bg-accent/50">
          <span className="text-xs text-muted-foreground">시작 자산</span>
          {isEditingAsset ? (
            <div className="flex items-center gap-1">
              <input
                type="number"
                value={assetInput}
                onChange={e => setAssetInput(e.target.value)}
                className="w-20 px-2 py-1 rounded bg-background border border-border text-right text-xs"
              />
              <button onClick={handleSaveAsset} className="p-1 text-long hover:bg-long/20 rounded">
                <CheckCircle2 className="w-4 h-4" />
              </button>
              <button onClick={() => setIsEditingAsset(false)} className="p-1 text-muted-foreground hover:bg-accent rounded">
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button onClick={() => setIsEditingAsset(true)} className="flex items-center gap-1 font-mono font-semibold text-sm">
              ${settings.initialAsset.toLocaleString()}
              <Edit2 className="w-3 h-3 text-muted-foreground" />
            </button>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-2 text-xs">
          <div className="p-2 rounded-lg bg-accent/50 text-center">
            <span className="text-muted-foreground">승률</span>
            <p className="font-bold text-primary mt-0.5">{stats.winRate}%</p>
          </div>
          <div className="p-2 rounded-lg bg-accent/50 text-center">
            <span className="text-muted-foreground">수익률</span>
            <p className={cn("font-bold mt-0.5", stats.totalPnL >= 0 ? "text-long" : "text-short")}>
              {stats.totalPnL >= 0 ? '+' : ''}{stats.totalPnL}%
            </p>
          </div>
          <div className="p-2 rounded-lg bg-accent/50 text-center">
            <span className="text-muted-foreground">거래수</span>
            <p className="font-bold mt-0.5">{stats.completedPositions}</p>
          </div>
          <div className="p-2 rounded-lg bg-accent/50 text-center">
            <span className="text-muted-foreground">활성</span>
            <p className="font-bold mt-0.5">{activePositions.length}</p>
          </div>
        </div>

        {/* AI Comparison */}
        <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-primary" />
              <span className="text-xs font-medium">AI 멘토 비교</span>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <div>
                <span className="text-muted-foreground">AI 승률</span>
                <span className={cn("ml-1 font-bold", aiStats.winRate >= stats.winRate ? "text-primary" : "text-muted-foreground")}>
                  {aiStats.winRate.toFixed(1)}%
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">AI 수익</span>
                <span className={cn("ml-1 font-bold", aiStats.totalPnl >= 0 ? "text-long" : "text-short")}>
                  {aiStats.totalPnl >= 0 ? '+' : ''}{aiStats.totalPnl.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
          {stats.winRate > aiStats.winRate && stats.completedPositions >= 3 && (
            <p className="text-xs text-long mt-2">🎉 축하합니다! AI보다 높은 승률을 기록 중입니다!</p>
          )}
        </div>
      </div>

      {/* Tabs: My Positions / AI Managed */}
      <Tabs defaultValue="my" className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="w-full grid grid-cols-2 mx-4 mt-2" style={{ width: 'calc(100% - 2rem)' }}>
          <TabsTrigger value="my" className="text-xs">
            <BarChart3 className="w-3 h-3 mr-1" />
            내 포지션
          </TabsTrigger>
          <TabsTrigger value="managed" className="text-xs">
            <LineChart className="w-3 h-3 mr-1" />
            함께 진입
          </TabsTrigger>
        </TabsList>

        <TabsContent value="my" className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin m-0">
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
              initialAsset={settings.initialAsset}
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
                  initialAsset={settings.initialAsset}
                />
              ))}
            </>
          )}
        </TabsContent>

        <TabsContent value="managed" className="flex-1 overflow-y-auto p-4 m-0">
          <AIManagedPositionsPanel currentPrice={currentPrice} />
        </TabsContent>
      </Tabs>

      {/* Add Position Modal */}
      <AnimatePresence>
        {isAddingPosition && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-background/95 backdrop-blur-sm z-10 p-4 overflow-y-auto"
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
                      ? "bg-long text-long-foreground"
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
                      ? "bg-short text-short-foreground"
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
  onDelete,
  initialAsset
}: { 
  position: UserPosition; 
  currentPrice: number;
  onClose: (id: string, status: 'WIN' | 'LOSS', price: number) => void;
  onDelete: (id: string) => void;
  initialAsset: number;
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

  // Calculate profit amount (10% of asset per position)
  const positionValue = initialAsset / 10;
  const profitAmount = positionValue * (pnl / 100);

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
        <div className="text-right">
          <div className={cn(
            "text-sm font-mono font-bold",
            pnl >= 0 ? "text-long" : "text-short"
          )}>
            {pnl >= 0 ? '+' : ''}{pnl}%
          </div>
          <div className={cn(
            "text-xs font-mono",
            profitAmount >= 0 ? "text-long/80" : "text-short/80"
          )}>
            {profitAmount >= 0 ? '+' : ''}{profitAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}$
          </div>
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
