import { motion } from 'framer-motion';
import { forwardRef, useState, useMemo } from 'react';
import { useAIManagedPositions, AIManagedPosition } from '@/hooks/useAIManagedPositions';
import { useBinancePrices } from '@/hooks/useBinancePrices';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, TrendingDown, Loader2, X, 
  CheckCircle2, XCircle, Clock, Wallet
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { toast } from 'sonner';

interface AIManagedPositionsPanelProps {
  // Removed currentPrice - we fetch prices per symbol now
}

export const AIManagedPositionsPanel = forwardRef<HTMLDivElement, AIManagedPositionsPanelProps>(
  function AIManagedPositionsPanel({ currentPrice }, ref) {
  const { positions, stats, isLoading, leaveSignal } = useAIManagedPositions();
  const [leavingId, setLeavingId] = useState<string | null>(null);

  const handleLeave = async (positionId: string) => {
    setLeavingId(positionId);
    const result = await leaveSignal(positionId);
    setLeavingId(null);

    if (result.success) {
      toast.success('포지션을 청산했습니다');
    } else {
      toast.error(result.error || '청산에 실패했습니다');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
      </div>
    );
  }

  const activePositions = positions.filter(p => p.status === 'ACTIVE');
  const closedPositions = positions.filter(p => p.status !== 'ACTIVE');

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="trading-card p-3">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Wallet className="w-4 h-4" />
            <span className="text-xs">활성 포지션</span>
          </div>
          <p className="text-xl font-bold">{stats.activePositions}</p>
          <p className="text-xs text-muted-foreground">
            ${stats.totalAllocated.toLocaleString()} 할당
          </p>
        </div>
        <div className="trading-card p-3">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <TrendingUp className="w-4 h-4" />
            <span className="text-xs">총 수익</span>
          </div>
          <p className={cn(
            "text-xl font-bold",
            stats.totalPnl >= 0 ? "text-long" : "text-short"
          )}>
            {stats.totalPnl >= 0 ? '+' : ''}{stats.totalPnl.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Active Positions */}
      {activePositions.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-muted-foreground">활성 포지션</h3>
          {activePositions.map((position, index) => (
            <ManagedPositionItem 
              key={position.id} 
              position={position} 
              index={index}
              onLeave={() => handleLeave(position.id)}
              isLeaving={leavingId === position.id}
              currentPrice={currentPrice}
            />
          ))}
        </div>
      )}

      {/* Closed Positions */}
      {closedPositions.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-muted-foreground">종료된 포지션</h3>
          {closedPositions.slice(0, 5).map((position, index) => (
            <ManagedPositionItem 
              key={position.id} 
              position={position} 
              index={index}
            />
          ))}
        </div>
      )}

      {positions.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p>함께 진입한 포지션이 없습니다</p>
          <p className="text-xs mt-1">AI 시그널에서 "함께 진입"을 눌러보세요</p>
        </div>
      )}
    </div>
  );
});

function ManagedPositionItem({ 
  position, 
  index,
  onLeave,
  isLeaving,
  currentPrice
}: { 
  position: AIManagedPosition; 
  index: number;
  onLeave?: () => void;
  isLeaving?: boolean;
  currentPrice?: number;
}) {
  const isActive = position.status === 'ACTIVE';
  
  // Calculate real-time PnL if active
  let displayPnl = position.currentPnl;
  if (isActive && currentPrice && position.signal) {
    const isLong = position.signal.position === 'LONG';
    displayPnl = isLong
      ? ((currentPrice - position.entryPrice) / position.entryPrice) * 100 * position.signal.leverage
      : ((position.entryPrice - currentPrice) / position.entryPrice) * 100 * position.signal.leverage;
  }

  const getStatusIcon = () => {
    switch (position.status) {
      case 'WIN':
        return <CheckCircle2 className="w-4 h-4 text-long" />;
      case 'LOSS':
        return <XCircle className="w-4 h-4 text-short" />;
      case 'ACTIVE':
        return <Clock className="w-4 h-4 text-primary animate-pulse" />;
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className={cn(
        "trading-card p-3 border-l-4",
        position.status === 'WIN' && "border-l-long",
        position.status === 'LOSS' && "border-l-short",
        position.status === 'ACTIVE' && "border-l-primary",
        position.status === 'CANCELLED' && "border-l-muted-foreground"
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm">
                {position.signal?.symbol || 'Unknown'}
              </span>
              {position.signal && (
                <span className={cn(
                  "text-xs px-1.5 py-0.5 rounded",
                  position.signal.position === 'LONG' 
                    ? "bg-long/20 text-long" 
                    : "bg-short/20 text-short"
                )}>
                  {position.signal.position}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              ${position.allocatedAsset.toLocaleString()} • {position.signal?.leverage || 1}x
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-right">
            <p className={cn(
              "font-semibold text-sm",
              displayPnl >= 0 ? "text-long" : "text-short"
            )}>
              {displayPnl >= 0 ? '+' : ''}{displayPnl.toFixed(2)}%
            </p>
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(position.createdAt, { addSuffix: true, locale: ko })}
            </p>
          </div>
          {isActive && onLeave && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onLeave}
              disabled={isLeaving}
              className="h-8 w-8 p-0"
            >
              {isLeaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <X className="w-4 h-4" />
              )}
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
