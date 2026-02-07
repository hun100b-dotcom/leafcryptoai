import { useState } from 'react';
import { useAISignals } from '@/hooks/useAISignals';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { Trophy, TrendingUp, BarChart3, Zap, Trash2, RefreshCw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export function AIPerformanceTab() {
  const { stats, refetch } = useAISignals();
  const [isResetting, setIsResetting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
    toast.success('데이터를 새로고침했습니다');
  };

  const handleReset = async () => {
    if (!confirm('모든 AI 거래 기록을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) return;
    
    setIsResetting(true);
    try {
      const { error } = await supabase.functions.invoke('ai-reset-data', {
        body: { user_id: 'anonymous' }
      });
      
      if (error) throw error;
      
      toast.success('모든 기록이 초기화되었습니다');
      window.location.reload();
    } catch (err) {
      toast.error('초기화에 실패했습니다');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="bg-card">
      {/* Stats Grid - 상단 바로 시작 */}
      <div className="grid grid-cols-2 gap-2 p-3 border-b border-border">
        <StatCard 
          icon={Trophy} 
          label="승률" 
          value={`${stats.winRate.toFixed(1)}%`}
          color={stats.winRate >= 50 ? 'text-long' : 'text-short'}
        />
        <StatCard 
          icon={TrendingUp} 
          label="총 수익률" 
          value={`${stats.totalPnl >= 0 ? '+' : ''}${stats.totalPnl.toFixed(1)}%`}
          color={stats.totalPnl >= 0 ? 'text-long' : 'text-short'}
        />
        <StatCard 
          icon={BarChart3} 
          label="총 거래" 
          value={`${stats.totalSignals}건`}
          sub={`${stats.wins}W / ${stats.losses}L`}
        />
        <StatCard 
          icon={Zap} 
          label="평균 레버리지" 
          value={`${stats.avgLeverage.toFixed(1)}x`}
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 p-3 border-b border-border">
        <Button 
          size="sm" 
          variant="outline" 
          onClick={handleRefresh} 
          disabled={isRefreshing}
          className="flex-1"
        >
          {isRefreshing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-1" />}
          새로고침
        </Button>
        <Button 
          size="sm" 
          variant="destructive" 
          onClick={handleReset} 
          disabled={isResetting}
          className="flex-1"
        >
          {isResetting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4 mr-1" />}
          전체 초기화
        </Button>
      </div>

      {/* Info */}
      <div className="p-3 text-xs text-muted-foreground">
        <p>• 승률과 수익률은 완료된 거래 기준입니다</p>
        <p>• 전체 초기화 시 모든 AI 시그널과 포지션이 삭제됩니다</p>
      </div>
    </div>
  );
}

function StatCard({ 
  icon: Icon, 
  label, 
  value, 
  sub, 
  color 
}: { 
  icon: React.ElementType; 
  label: string; 
  value: string; 
  sub?: string;
  color?: string;
}) {
  return (
    <div className="p-3 rounded-lg bg-accent/50">
      <div className="flex items-center gap-1 text-muted-foreground mb-1">
        <Icon className="w-3 h-3" />
        <span className="text-[10px]">{label}</span>
      </div>
      <p className={cn("text-sm font-bold", color)}>{value}</p>
      {sub && <p className="text-[9px] text-muted-foreground">{sub}</p>}
    </div>
  );
}
