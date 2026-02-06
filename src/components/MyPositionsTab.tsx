import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, TrendingDown, Plus, X, Wallet, Target, 
  CheckCircle2, XCircle, Trash2, Edit2, BarChart3, 
  LineChart, ArrowUpRight, ArrowDownRight, Trophy, Bot
} from 'lucide-react';
import { useUserPositions, UserPosition } from '@/hooks/useUserPositions';
import { useAISignals } from '@/hooks/useAISignals';
import { usePositionAIComment } from '@/hooks/usePositionAIComment';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AIManagedPositionsPanel } from './AIManagedPositionsPanel';

interface MyPositionsTabProps {
  symbol: string;
  currentPrice: number;
}

export function MyPositionsTab({ symbol, currentPrice }: MyPositionsTabProps) {
  const { positions, settings, stats, addPosition, closePosition, deletePosition, updateInitialAsset } = useUserPositions();
  const { stats: aiStats } = useAISignals();
  const { comments, updateAllComments, getComment } = usePositionAIComment();
  const [isAddingPosition, setIsAddingPosition] = useState(false);
  const [isEditingAsset, setIsEditingAsset] = useState(false);
  const [assetInput, setAssetInput] = useState(settings.initialAsset.toString());

  const activePositions = useMemo(() => positions.filter(p => p.status === 'ACTIVE'), [positions]);
  const completedPositions = useMemo(() => positions.filter(p => p.status !== 'ACTIVE'), [positions]);

  // Update AI comments for active positions
  useEffect(() => {
    if (activePositions.length > 0 && currentPrice > 0) {
      const positionsWithPrice = activePositions.map(p => {
        const posCurrentPrice = p.symbol === symbol ? currentPrice : p.entryPrice;
        const pnl = p.position === 'LONG'
          ? ((posCurrentPrice - p.entryPrice) / p.entryPrice) * 100 * p.leverage
          : ((p.entryPrice - posCurrentPrice) / p.entryPrice) * 100 * p.leverage;
        
        return {
          id: p.id,
          symbol: p.symbol,
          position: p.position,
          entryPrice: p.entryPrice,
          targetPrice: p.targetPrice,
          stopLoss: p.stopLoss,
          leverage: p.leverage,
          currentPrice: posCurrentPrice,
          pnlPercent: pnl,
        };
      });
      updateAllComments(positionsWithPrice);
    }
  }, [activePositions, currentPrice, symbol, updateAllComments]);
  
  const [form, setForm] = useState({
    position: 'LONG' as 'LONG' | 'SHORT',
    entryPrice: currentPrice.toString(),
    targetPrice: '',
    stopLoss: '',
    leverage: '10',
    message: '',
  });

  const assetChange = useMemo(() => {
    const change = stats.currentAsset - settings.initialAsset;
    const changePercent = ((change / settings.initialAsset) * 100).toFixed(2);
    return { change, changePercent };
  }, [stats.currentAsset, settings.initialAsset]);

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
    <div className="h-full flex flex-col relative">
      {/* Header Stats - Flush to top */}
      <div className="p-3 border-b border-border space-y-2">
        {/* Main Asset Display */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1 text-muted-foreground text-xs">
              <Wallet className="w-3 h-3" />
              <span>현재 자산</span>
            </div>
            <p className={cn(
              "text-xl font-bold",
              stats.totalPnL >= 0 ? "text-long" : "text-short"
            )}>
              ${stats.currentAsset.toLocaleString()}
            </p>
            <div className="flex items-center gap-1 text-xs">
              {assetChange.change >= 0 ? (
                <ArrowUpRight className="w-3 h-3 text-long" />
              ) : (
                <ArrowDownRight className="w-3 h-3 text-short" />
              )}
              <span className={assetChange.change >= 0 ? "text-long" : "text-short"}>
                ${Math.abs(assetChange.change).toFixed(0)} ({assetChange.changePercent}%)
              </span>
            </div>
          </div>
          <button
            onClick={() => setIsAddingPosition(true)}
            className="flex items-center gap-1 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium"
          >
            <Plus className="w-3 h-3" />
            추가
          </button>
        </div>

        {/* Initial Asset Edit */}
        <div className="flex items-center justify-between p-2 rounded bg-accent/50 text-xs">
          <span className="text-muted-foreground">시작 자산</span>
          {isEditingAsset ? (
            <div className="flex items-center gap-1">
              <input
                type="number"
                value={assetInput}
                onChange={e => setAssetInput(e.target.value)}
                className="w-16 px-1 py-0.5 rounded bg-background border border-border text-right text-xs"
              />
              <button onClick={handleSaveAsset} className="p-0.5 text-long hover:bg-long/20 rounded">
                <CheckCircle2 className="w-3 h-3" />
              </button>
              <button onClick={() => setIsEditingAsset(false)} className="p-0.5 text-muted-foreground">
                <X className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <button onClick={() => setIsEditingAsset(true)} className="flex items-center gap-1 font-mono font-semibold">
              ${settings.initialAsset.toLocaleString()}
              <Edit2 className="w-2.5 h-2.5 text-muted-foreground" />
            </button>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-1.5 text-[10px]">
          <div className="p-1.5 rounded bg-accent/50 text-center">
            <span className="text-muted-foreground block">승률</span>
            <span className="font-bold text-primary">{stats.winRate}%</span>
          </div>
          <div className="p-1.5 rounded bg-accent/50 text-center">
            <span className="text-muted-foreground block">수익률</span>
            <span className={cn("font-bold", stats.totalPnL >= 0 ? "text-long" : "text-short")}>
              {stats.totalPnL >= 0 ? '+' : ''}{stats.totalPnL}%
            </span>
          </div>
          <div className="p-1.5 rounded bg-accent/50 text-center">
            <span className="text-muted-foreground block">거래</span>
            <span className="font-bold">{stats.completedPositions}</span>
          </div>
          <div className="p-1.5 rounded bg-accent/50 text-center">
            <span className="text-muted-foreground block">활성</span>
            <span className="font-bold">{activePositions.length}</span>
          </div>
        </div>

        {/* AI Comparison */}
        <div className="p-2 rounded bg-primary/5 border border-primary/20">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1">
              <Trophy className="w-3 h-3 text-primary" />
              <span className="font-medium">AI 비교</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">승률</span>
              <span className={cn("font-bold", aiStats.winRate >= stats.winRate ? "text-primary" : "text-muted-foreground")}>
                {aiStats.winRate.toFixed(1)}%
              </span>
              <span className="text-muted-foreground">수익</span>
              <span className={cn("font-bold", aiStats.totalPnl >= 0 ? "text-long" : "text-short")}>
                {aiStats.totalPnl >= 0 ? '+' : ''}{aiStats.totalPnl.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Inner Tabs */}
      <Tabs defaultValue="my" className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="w-full grid grid-cols-2 m-0 rounded-none border-b border-border h-8">
          <TabsTrigger value="my" className="text-xs h-7">
            <BarChart3 className="w-3 h-3 mr-1" />
            내 포지션
          </TabsTrigger>
          <TabsTrigger value="managed" className="text-xs h-7">
            <LineChart className="w-3 h-3 mr-1" />
            함께 진입
          </TabsTrigger>
        </TabsList>

        <TabsContent value="my" className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin m-0">
          {activePositions.length === 0 && completedPositions.length === 0 && (
            <div className="text-center py-6 text-muted-foreground text-sm">
              <Target className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>포지션이 없습니다</p>
              <p className="text-xs mt-1">포지션을 추가해보세요!</p>
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
              aiComment={getComment(pos.id)}
            />
          ))}

          {completedPositions.length > 0 && (
            <>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider pt-2">
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

        <TabsContent value="managed" className="flex-1 overflow-y-auto p-3 m-0">
          <AIManagedPositionsPanel />
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
              <h4 className="font-bold text-sm">새 포지션 추가</h4>
              <button onClick={() => setIsAddingPosition(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex gap-2">
                <button
                  onClick={() => setForm(f => ({ ...f, position: 'LONG' }))}
                  className={cn(
                    "flex-1 py-2.5 rounded-lg font-bold text-sm transition-all",
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
                    "flex-1 py-2.5 rounded-lg font-bold text-sm transition-all",
                    form.position === 'SHORT'
                      ? "bg-short text-short-foreground"
                      : "bg-accent border border-border text-muted-foreground"
                  )}
                >
                  <TrendingDown className="w-4 h-4 inline mr-1" />
                  SHORT
                </button>
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1 block">진입가 ($)</label>
                <input
                  type="number"
                  value={form.entryPrice}
                  onChange={e => setForm(f => ({ ...f, entryPrice: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg bg-accent border border-border focus:border-primary focus:outline-none text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-long mb-1 block">익절가 (TP)</label>
                  <input
                    type="number"
                    value={form.targetPrice}
                    onChange={e => setForm(f => ({ ...f, targetPrice: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg bg-accent border border-border focus:border-long focus:outline-none text-sm"
                    placeholder="목표가"
                  />
                </div>
                <div>
                  <label className="text-xs text-short mb-1 block">손절가 (SL)</label>
                  <input
                    type="number"
                    value={form.stopLoss}
                    onChange={e => setForm(f => ({ ...f, stopLoss: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg bg-accent border border-border focus:border-short focus:outline-none text-sm"
                    placeholder="손절가"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1 block">레버리지</label>
                <select
                  value={form.leverage}
                  onChange={e => setForm(f => ({ ...f, leverage: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg bg-accent border border-border focus:border-primary focus:outline-none text-sm"
                >
                  {[1, 2, 3, 5, 10, 20, 25, 50, 75, 100].map(l => (
                    <option key={l} value={l}>{l}x</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1 block">메모 (선택)</label>
                <input
                  type="text"
                  value={form.message}
                  onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg bg-accent border border-border focus:border-primary focus:outline-none text-sm"
                  placeholder="진입 근거..."
                />
              </div>

              <button
                onClick={handleAddPosition}
                disabled={!form.entryPrice || !form.targetPrice || !form.stopLoss}
                className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-bold text-sm disabled:opacity-50"
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

interface AIComment {
  positionId: string;
  comment: string;
  sentiment: 'positive' | 'neutral' | 'negative' | 'urgent';
  timestamp: Date;
}

function PositionCard({ 
  position, 
  currentPrice, 
  onClose, 
  onDelete,
  initialAsset,
  aiComment
}: { 
  position: UserPosition; 
  currentPrice: number;
  onClose: (id: string, status: 'WIN' | 'LOSS', price: number) => void;
  onDelete: (id: string) => void;
  initialAsset: number;
  aiComment?: AIComment;
}) {
  const isActive = position.status === 'ACTIVE';
  
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

  const profitAmount = (initialAsset / 10) * (pnl / 100);

  const getSentimentStyle = (sentiment?: string) => {
    switch (sentiment) {
      case 'positive': return 'border-long/50 bg-long/5 text-long';
      case 'negative': return 'border-short/50 bg-short/5 text-short';
      case 'urgent': return 'border-yellow-500/50 bg-yellow-500/5 text-yellow-500 animate-pulse';
      default: return 'border-border bg-accent/30 text-muted-foreground';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "p-3 rounded-lg border",
        isActive ? "border-border bg-card" : "border-border/50 bg-card/50 opacity-80"
      )}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          {position.position === 'LONG' ? (
            <TrendingUp className="w-4 h-4 text-long" />
          ) : (
            <TrendingDown className="w-4 h-4 text-short" />
          )}
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-sm">{position.symbol}</span>
              <span className={cn(
                "text-[10px] px-1 py-0.5 rounded",
                position.position === 'LONG' ? "bg-long/20 text-long" : "bg-short/20 text-short"
              )}>
                {position.position}
              </span>
              <span className="text-[10px] text-muted-foreground">{position.leverage}x</span>
            </div>
            <p className="text-[10px] text-muted-foreground">
              진입 ${position.entryPrice.toLocaleString()}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className={cn(
            "font-bold text-sm",
            pnl >= 0 ? "text-long" : "text-short"
          )}>
            {pnl >= 0 ? '+' : ''}{pnl.toFixed(2)}%
          </p>
          <p className={cn(
            "text-xs",
            profitAmount >= 0 ? "text-long/80" : "text-short/80"
          )}>
            {profitAmount >= 0 ? '+' : ''}${Math.abs(profitAmount).toFixed(2)}
          </p>
        </div>
      </div>

      {/* AI Comment */}
      {isActive && aiComment && (
        <div className={cn(
          "p-2 rounded border text-xs mt-2",
          getSentimentStyle(aiComment.sentiment)
        )}>
          <div className="flex items-center gap-1 mb-0.5">
            <Bot className="w-3 h-3" />
            <span className="font-medium">AI 분석</span>
          </div>
          <p>{aiComment.comment}</p>
        </div>
      )}

      {/* TP/SL Info */}
      <div className="flex items-center gap-3 text-[10px] mt-2">
        <span className="text-long">TP ${position.targetPrice.toLocaleString()}</span>
        <span className="text-short">SL ${position.stopLoss.toLocaleString()}</span>
      </div>

      {/* Actions for active positions */}
      {isActive && (
        <div className="flex gap-2 mt-2 pt-2 border-t border-border">
          <button
            onClick={() => onClose(position.id, 'WIN', position.targetPrice)}
            className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded bg-long/10 text-long text-xs font-medium hover:bg-long/20"
          >
            <CheckCircle2 className="w-3 h-3" />
            익절
          </button>
          <button
            onClick={() => onClose(position.id, 'LOSS', position.stopLoss)}
            className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded bg-short/10 text-short text-xs font-medium hover:bg-short/20"
          >
            <XCircle className="w-3 h-3" />
            손절
          </button>
          <button
            onClick={() => onDelete(position.id)}
            className="px-2 py-1.5 rounded bg-accent text-muted-foreground hover:bg-destructive/20 hover:text-destructive"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Completed status */}
      {!isActive && (
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-border text-xs">
          <span className={cn(
            "flex items-center gap-1",
            position.status === 'WIN' ? "text-long" : "text-short"
          )}>
            {position.status === 'WIN' ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
            {position.status === 'WIN' ? '익절 완료' : '손절 처리'}
          </span>
          <span className="text-muted-foreground">
            {position.closedAt && formatDistanceToNow(new Date(position.closedAt), { addSuffix: true, locale: ko })}
          </span>
        </div>
      )}
    </motion.div>
  );
}
