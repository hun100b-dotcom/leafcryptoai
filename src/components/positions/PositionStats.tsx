import { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Wallet, TrendingUp, ArrowUpCircle, ArrowDownCircle,
  Percent, Edit3, Check, X, PiggyBank, DollarSign, Trash2, Loader2
} from 'lucide-react';
import { UserSettings } from '@/hooks/useUserPositions';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface PositionStatsProps {
  userStats: {
    totalPositions: number;
    completedPositions: number;
    wins: number;
    losses: number;
    winRate: number;
    totalPnL: number;
    currentAsset: number;
    unrealizedPnL?: number;
    activeMargin?: number;
    availableMargin?: number;
  };
  aiStats: {
    totalPositions: number;
    activePositions: number;
    totalAllocated: number;
    totalPnl: number;
  };
  settings: UserSettings;
  onUpdateInitialAsset: (amount: number) => Promise<void>;
  onDeposit: (amount: number) => Promise<void>;
  onWithdraw: (amount: number) => Promise<void>;
  onRefetch?: () => void;
}

export function PositionStats({ 
  userStats, 
  aiStats, 
  settings, 
  onUpdateInitialAsset,
  onDeposit,
  onWithdraw,
  onRefetch
}: PositionStatsProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(settings.initialAsset.toString());
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [isResettingAI, setIsResettingAI] = useState(false);
  const [isResettingManual, setIsResettingManual] = useState(false);
  const [isResettingAll, setIsResettingAll] = useState(false);

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

  const handleDeposit = async () => {
    const amount = parseFloat(depositAmount);
    if (!isNaN(amount) && amount > 0) {
      await onDeposit(amount);
      setDepositAmount('');
      setIsDepositOpen(false);
    }
  };

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    if (!isNaN(amount) && amount > 0 && amount <= settings.initialAsset) {
      await onWithdraw(amount);
      setWithdrawAmount('');
      setIsWithdrawOpen(false);
    }
  };

  // Reset functions
  const handleResetAIPositions = async () => {
    setIsResettingAI(true);
    try {
      const { error } = await supabase.functions.invoke('ai-reset-data', {
        body: { user_id: 'anonymous', reset_type: 'ai_only' }
      });
      if (error) throw error;
      toast.success('AI 함께진입 기록이 초기화되었습니다');
      onRefetch?.();
    } catch (err) {
      toast.error('초기화에 실패했습니다');
    } finally {
      setIsResettingAI(false);
    }
  };

  const handleResetManualPositions = async () => {
    setIsResettingManual(true);
    try {
      const { error } = await supabase.functions.invoke('ai-reset-data', {
        body: { user_id: 'default_user', reset_type: 'manual_only' }
      });
      if (error) throw error;
      toast.success('직접 진입 기록이 초기화되었습니다');
      onRefetch?.();
    } catch (err) {
      toast.error('초기화에 실패했습니다');
    } finally {
      setIsResettingManual(false);
    }
  };

  const handleResetAll = async () => {
    setIsResettingAll(true);
    try {
      const { error } = await supabase.functions.invoke('ai-reset-data', {
        body: { user_id: 'anonymous', reset_type: 'all' }
      });
      if (error) throw error;
      toast.success('모든 거래 기록이 초기화되었습니다');
      onRefetch?.();
      window.location.reload();
    } catch (err) {
      toast.error('초기화에 실패했습니다');
    } finally {
      setIsResettingAll(false);
    }
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
      subValue: (
        <div className="flex flex-col gap-1">
          {totalPnlPercent !== 0 && (
            <span className={cn(
              "text-xs",
              totalPnlPercent >= 0 ? "text-long" : "text-short"
            )}>
              {totalPnlPercent >= 0 ? '+' : ''}{totalPnlPercent.toFixed(2)}%
            </span>
          )}
          {userStats.unrealizedPnL !== undefined && userStats.unrealizedPnL !== 0 && (
            <span className={cn(
              "text-xs",
              userStats.unrealizedPnL >= 0 ? "text-long" : "text-short"
            )}>
              미실현: {userStats.unrealizedPnL >= 0 ? '+' : ''}${userStats.unrealizedPnL.toFixed(2)}
            </span>
          )}
        </div>
      ),
      icon: TrendingUp,
      color: totalPnlPercent >= 0 ? 'text-long' : 'text-short',
    },
    {
      label: '사용 증거금',
      value: `$${(userStats.activeMargin || 0).toLocaleString()}`,
      subValue: (
        <span className="text-xs text-muted-foreground">
          가용: ${(userStats.availableMargin || settings.initialAsset).toLocaleString()}
        </span>
      ),
      icon: PiggyBank,
      color: 'text-primary',
    },
    {
      label: '총 수익률',
      value: `${userStats.totalPnL >= 0 ? '+' : ''}${userStats.totalPnL.toFixed(1)}%`,
      subValue: `${userStats.wins}W / ${userStats.losses}L (${userStats.winRate}%)`,
      icon: Percent,
      color: userStats.totalPnL >= 0 ? 'text-long' : 'text-short',
    },
  ];

  return (
    <div className="space-y-4">
      {/* Deposit/Withdraw Buttons */}
      <div className="flex gap-2 justify-end">
        <Dialog open={isDepositOpen} onOpenChange={setIsDepositOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <ArrowDownCircle className="w-4 h-4 text-long" />
              입금
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>자산 입금</DialogTitle>
              <DialogDescription>
                모의 투자 자산에 금액을 추가합니다.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-muted-foreground" />
                <Input
                  type="number"
                  placeholder="입금할 금액"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                {[100, 500, 1000, 5000].map((amount) => (
                  <Button
                    key={amount}
                    variant="outline"
                    size="sm"
                    onClick={() => setDepositAmount(amount.toString())}
                  >
                    +${amount}
                  </Button>
                ))}
              </div>
              <Button 
                onClick={handleDeposit} 
                className="w-full"
                disabled={!depositAmount || parseFloat(depositAmount) <= 0}
              >
                입금하기
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={isWithdrawOpen} onOpenChange={setIsWithdrawOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <ArrowUpCircle className="w-4 h-4 text-short" />
              출금
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>자산 출금</DialogTitle>
              <DialogDescription>
                모의 투자 자산에서 금액을 출금합니다.
                현재 잔액: ${settings.initialAsset.toLocaleString()}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-muted-foreground" />
                <Input
                  type="number"
                  placeholder="출금할 금액"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  max={settings.initialAsset}
                />
              </div>
              <div className="flex gap-2">
                {[10, 25, 50, 100].map((percent) => (
                  <Button
                    key={percent}
                    variant="outline"
                    size="sm"
                    onClick={() => setWithdrawAmount((settings.initialAsset * percent / 100).toFixed(2))}
                  >
                    {percent}%
                  </Button>
                ))}
              </div>
              <Button 
                onClick={handleWithdraw} 
                className="w-full"
                disabled={!withdrawAmount || parseFloat(withdrawAmount) <= 0 || parseFloat(withdrawAmount) > settings.initialAsset}
              >
                출금하기
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Grid */}
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

      {/* Reset Buttons Section */}
      <div className="mt-6 p-4 border border-destructive/20 rounded-lg bg-destructive/5">
        <h4 className="text-sm font-medium text-destructive mb-3 flex items-center gap-2">
          <Trash2 className="w-4 h-4" />
          데이터 초기화
        </h4>
        <p className="text-xs text-muted-foreground mb-4">
          거래 기록을 삭제합니다. 이 작업은 되돌릴 수 없습니다.
        </p>
        <div className="flex flex-wrap gap-2">
          {/* Reset AI Positions */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="border-destructive/50 text-destructive hover:bg-destructive/10">
                {isResettingAI ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                함께진입 초기화
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>함께진입 기록 초기화</AlertDialogTitle>
                <AlertDialogDescription>
                  AI 시그널과 함께 진입한 모든 포지션 기록이 삭제됩니다.
                  AI 승률과 수익률 통계도 함께 초기화됩니다.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>취소</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleResetAIPositions}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  초기화
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Reset Manual Positions */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="border-destructive/50 text-destructive hover:bg-destructive/10">
                {isResettingManual ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                직접진입 초기화
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>직접진입 기록 초기화</AlertDialogTitle>
                <AlertDialogDescription>
                  직접 진입한 모든 포지션 기록이 삭제됩니다.
                  수익률 통계도 함께 초기화됩니다.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>취소</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleResetManualPositions}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  초기화
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Reset All */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                {isResettingAll ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                전체 초기화
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>⚠️ 전체 데이터 초기화</AlertDialogTitle>
                <AlertDialogDescription className="space-y-2">
                  <span className="block">다음 데이터가 모두 삭제됩니다:</span>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    <li>AI 함께진입 포지션</li>
                    <li>직접진입 포지션</li>
                    <li>AI 시그널 기록</li>
                    <li>AI 성과 통계</li>
                    <li>AI 조언 기록</li>
                  </ul>
                  <span className="block font-medium text-destructive">이 작업은 되돌릴 수 없습니다!</span>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>취소</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleResetAll}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  전체 초기화
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}
