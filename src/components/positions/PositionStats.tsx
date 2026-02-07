import { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Wallet, TrendingUp, TrendingDown, Target, 
  Percent, Edit3, Check, X 
} from 'lucide-react';
import { UserSettings } from '@/hooks/useUserPositions';

interface PositionStatsProps {
  userStats: {
    totalPositions: number;
    completedPositions: number;
    wins: number;
    losses: number;
    winRate: number;
    totalPnL: number;
    currentAsset: number;
  };
  aiStats: {
    totalPositions: number;
    activePositions: number;
    totalAllocated: number;
    totalPnl: number;
  };
  settings: UserSettings;
  onUpdateInitialAsset: (amount: number) => Promise<void>;
}

export function PositionStats({ 
  userStats, 
  aiStats, 
  settings, 
  onUpdateInitialAsset 
}: PositionStatsProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(settings.initialAsset.toString());

  const handleSave = async () => {
    const amount = parseFloat(editValue);
    if (!isNaN(amount) && amount > 0) {
      await onUpdateInitialAsset(amount);
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditValue(settings.initialAsset.toString());
    setIsEditing(false);
  };

  const totalPnlPercent = settings.initialAsset > 0 
    ? ((userStats.currentAsset - settings.initialAsset) / settings.initialAsset) * 100 
    : 0;

  const stats = [
    {
      label: '초기 자산',
      value: isEditing ? (
        <div className="flex items-center gap-2">
          <Input
            type="number"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="w-24 h-8 text-sm"
            autoFocus
          />
          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleSave}>
            <Check className="w-4 h-4 text-long" />
          </Button>
          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleCancel}>
            <X className="w-4 h-4 text-short" />
          </Button>
        </div>
      ) : (
        <span className="flex items-center gap-2">
          ${settings.initialAsset.toLocaleString()}
          <Button 
            size="icon" 
            variant="ghost" 
            className="h-6 w-6" 
            onClick={() => setIsEditing(true)}
          >
            <Edit3 className="w-3 h-3" />
          </Button>
        </span>
      ),
      icon: Wallet,
      color: 'text-primary',
    },
    {
      label: '현재 자산',
      value: `$${userStats.currentAsset.toLocaleString()}`,
      subValue: totalPnlPercent !== 0 ? (
        <span className={cn(
          "text-xs",
          totalPnlPercent >= 0 ? "text-long" : "text-short"
        )}>
          {totalPnlPercent >= 0 ? '+' : ''}{totalPnlPercent.toFixed(1)}%
        </span>
      ) : null,
      icon: TrendingUp,
      color: totalPnlPercent >= 0 ? 'text-long' : 'text-short',
    },
    {
      label: '직접 진입 수익률',
      value: `${userStats.totalPnL >= 0 ? '+' : ''}${userStats.totalPnL.toFixed(1)}%`,
      subValue: `${userStats.wins}W / ${userStats.losses}L`,
      icon: Target,
      color: userStats.totalPnL >= 0 ? 'text-long' : 'text-short',
    },
    {
      label: 'AI 함께진입 수익',
      value: `${aiStats.totalPnl >= 0 ? '+' : ''}${aiStats.totalPnl.toFixed(1)}%`,
      subValue: `${aiStats.activePositions} 활성 포지션`,
      icon: Percent,
      color: aiStats.totalPnl >= 0 ? 'text-long' : 'text-short',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className="trading-card p-4"
        >
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <stat.icon className={cn("w-4 h-4", stat.color)} />
            <span className="text-xs">{stat.label}</span>
          </div>
          <div className={cn("text-xl font-bold", stat.color)}>
            {stat.value}
          </div>
          {stat.subValue && (
            <div className="text-xs text-muted-foreground mt-1">
              {stat.subValue}
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
}
