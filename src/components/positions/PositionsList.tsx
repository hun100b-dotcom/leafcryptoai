import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, TrendingDown, X, Loader2, 
  CheckCircle2, XCircle, Clock, MoreVertical,
  Trash2, DollarSign
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { toast } from 'sonner';
import { UserPosition } from '@/hooks/useUserPositions';
import { AIManagedPosition } from '@/hooks/useAIManagedPositions';
import { ClosePositionDialog } from './ClosePositionDialog';

interface PositionsListProps {
  type: 'ai' | 'manual';
  positions: (UserPosition | AIManagedPosition)[];
  getPrice: (symbol: string) => number | undefined;
  onLeave?: (id: string) => Promise<{ success: boolean; error?: string }>;
  onClose?: (id: string, status: 'WIN' | 'LOSS', closePrice: number) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

export function PositionsList({ 
  type, 
  positions, 
  getPrice, 
  onLeave, 
  onClose, 
  onDelete 
}: PositionsListProps) {
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [closeDialog, setCloseDialog] = useState<{ 
    open: boolean; 
    position: UserPosition | null;
    currentPrice: number;
  }>({ open: false, position: null, currentPrice: 0 });

  const activePositions = positions.filter(p => p.status === 'ACTIVE');
  const closedPositions = positions.filter(p => p.status !== 'ACTIVE');

  const handleLeave = async (id: string) => {
    if (!onLeave) return;
    setActionLoading(id);
    const result = await onLeave(id);
    setActionLoading(null);
    if (result.success) {
      toast.success('포지션을 청산했습니다');
    } else {
      toast.error(result.error || '청산에 실패했습니다');
    }
  };

  const handleDelete = async (id: string) => {
    if (!onDelete) return;
    setActionLoading(id);
    try {
      await onDelete(id);
      toast.success('포지션이 삭제되었습니다');
    } catch {
      toast.error('삭제에 실패했습니다');
    }
    setActionLoading(null);
  };

  const handleClosePosition = async (status: 'WIN' | 'LOSS', closePrice: number) => {
    if (!onClose || !closeDialog.position) return;
    setActionLoading(closeDialog.position.id);
    try {
      await onClose(closeDialog.position.id, status, closePrice);
      toast.success(status === 'WIN' ? '익절로 청산되었습니다' : '손절로 청산되었습니다');
      setCloseDialog({ open: false, position: null, currentPrice: 0 });
    } catch {
      toast.error('청산에 실패했습니다');
    }
    setActionLoading(null);
  };

  if (positions.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
          {type === 'ai' ? (
            <TrendingUp className="w-8 h-8" />
          ) : (
            <DollarSign className="w-8 h-8" />
          )}
        </div>
        <p className="text-lg font-medium">
          {type === 'ai' ? 'AI 함께 진입한 포지션이 없습니다' : '직접 진입한 포지션이 없습니다'}
        </p>
        <p className="text-sm mt-1">
          {type === 'ai' 
            ? 'AI 시그널에서 "함께 진입"을 눌러보세요' 
            : '우측 상단 "직접 진입" 버튼으로 추가하세요'
          }
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Active Positions */}
      {activePositions.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary animate-pulse" />
            활성 포지션 ({activePositions.length})
          </h3>
          <div className="grid gap-3">
            <AnimatePresence mode="popLayout">
              {activePositions.map((position, index) => (
                <PositionCard
                  key={position.id}
                  type={type}
                  position={position}
                  index={index}
                  currentPrice={getPrice(getSymbol(position))}
                  isLoading={actionLoading === position.id}
                  onLeave={type === 'ai' ? () => handleLeave(position.id) : undefined}
                  onClose={type === 'manual' ? (pos: UserPosition, price: number) => 
                    setCloseDialog({ open: true, position: pos, currentPrice: price }) : undefined}
                  onDelete={type === 'manual' ? () => handleDelete(position.id) : undefined}
                />
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Closed Positions */}
      {closedPositions.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground">
            종료된 포지션 ({closedPositions.length})
          </h3>
          <div className="grid gap-2">
            {closedPositions.slice(0, 10).map((position, index) => (
              <PositionCard
                key={position.id}
                type={type}
                position={position}
                index={index}
                isClosed
              />
            ))}
          </div>
        </div>
      )}

      {/* Close Position Dialog */}
      <ClosePositionDialog
        open={closeDialog.open}
        onOpenChange={(open) => setCloseDialog(prev => ({ ...prev, open }))}
        position={closeDialog.position}
        currentPrice={closeDialog.currentPrice}
        onClose={handleClosePosition}
      />
    </div>
  );
}

function isUserPosition(position: UserPosition | AIManagedPosition): position is UserPosition {
  return 'symbol' in position && 'position' in position;
}

function getSymbol(position: UserPosition | AIManagedPosition): string {
  if (isUserPosition(position)) return position.symbol;
  return (position as AIManagedPosition).signal?.symbol || 'BTC';
}

function getPositionType(position: UserPosition | AIManagedPosition): 'LONG' | 'SHORT' {
  if (isUserPosition(position)) return position.position;
  return (position as AIManagedPosition).signal?.position || 'LONG';
}

function getLeverage(position: UserPosition | AIManagedPosition): number {
  if (isUserPosition(position)) return position.leverage;
  return (position as AIManagedPosition).signal?.leverage || 1;
}

function getEntryPrice(position: UserPosition | AIManagedPosition): number {
  return position.entryPrice;
}

interface PositionCardProps {
  type: 'ai' | 'manual';
  position: UserPosition | AIManagedPosition;
  index: number;
  currentPrice?: number;
  isLoading?: boolean;
  isClosed?: boolean;
  onLeave?: () => void;
  onClose?: (position: UserPosition, currentPrice: number) => void;
  onDelete?: () => void;
}

function PositionCard({ 
  type, 
  position, 
  index, 
  currentPrice, 
  isLoading, 
  isClosed,
  onLeave, 
  onClose, 
  onDelete 
}: PositionCardProps) {
  const symbol = getSymbol(position);
  const posType = getPositionType(position);
  const leverage = getLeverage(position);
  const entryPrice = getEntryPrice(position);
  const isLong = posType === 'LONG';
  const isActive = position.status === 'ACTIVE';

  // Calculate real-time PnL
  let pnl = 0;
  if (isActive && currentPrice) {
    pnl = isLong
      ? ((currentPrice - entryPrice) / entryPrice) * 100 * leverage
      : ((entryPrice - currentPrice) / entryPrice) * 100 * leverage;
  } else if (!isActive) {
    // For closed positions, calculate from close price
    const closePrice = position.closePrice;
    if (closePrice) {
      pnl = isLong
        ? ((closePrice - entryPrice) / entryPrice) * 100 * leverage
        : ((entryPrice - closePrice) / entryPrice) * 100 * leverage;
    }
  }

  const getStatusIcon = () => {
    switch (position.status) {
      case 'WIN':
        return <CheckCircle2 className="w-5 h-5 text-long" />;
      case 'LOSS':
        return <XCircle className="w-5 h-5 text-short" />;
      case 'ACTIVE':
        return <Clock className="w-5 h-5 text-primary" />;
      default:
        return <Clock className="w-5 h-5 text-muted-foreground" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ delay: index * 0.03 }}
      className={cn(
        "trading-card p-4 border-l-4 transition-all",
        position.status === 'WIN' && "border-l-long bg-long/5",
        position.status === 'LOSS' && "border-l-short bg-short/5",
        position.status === 'ACTIVE' && "border-l-primary",
        position.status === 'CANCELLED' && "border-l-muted-foreground opacity-60"
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {getStatusIcon()}
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg">{symbol}</span>
              <span className={cn(
                "text-xs px-2 py-0.5 rounded-full font-medium",
                isLong ? "bg-long/20 text-long" : "bg-short/20 text-short"
              )}>
                {posType} {leverage}x
              </span>
              {type === 'ai' && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary">
                  AI
                </span>
              )}
            </div>
            <div className="text-sm text-muted-foreground flex items-center gap-2 mt-0.5">
              <span>진입: ${entryPrice.toLocaleString()}</span>
              {isActive && currentPrice && (
                <>
                  <span>→</span>
                  <span>현재: ${currentPrice.toLocaleString()}</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* PnL Display */}
          <div className="text-right">
            <p className={cn(
              "text-lg font-bold",
              pnl >= 0 ? "text-long" : "text-short"
            )}>
              {pnl >= 0 ? '+' : ''}{pnl.toFixed(2)}%
            </p>
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(position.createdAt, { addSuffix: true, locale: ko })}
            </p>
          </div>

          {/* Actions */}
          {isActive && !isClosed && (
            <>
              {type === 'ai' && onLeave && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onLeave}
                  disabled={isLoading}
                  className="gap-1"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <X className="w-4 h-4" />
                      청산
                    </>
                  )}
                </Button>
              )}
              {type === 'manual' && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="icon" variant="ghost" className="h-8 w-8">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem 
                      onClick={() => onClose?.(position as UserPosition, currentPrice || entryPrice)}
                      className="text-long"
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      청산하기
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={onDelete}
                      className="text-short"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      삭제
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}
