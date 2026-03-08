import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Zap,
  TrendingUp,
  BarChart3,
  Wifi,
  WifiOff,
  HelpCircle,
  Wallet,
  Bot,
  Monitor,
  Smartphone,
  Clock,
  RefreshCw,
  Loader2,
  Power,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { useViewMode } from '@/contexts/ViewModeContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface HeaderProps {
  totalWinRate: number;
  totalPnL: number;
  totalSignals: number;
  isConnected?: boolean;
  onOpenPerformance?: () => void;
  /** 자동매매 ON/OFF 상태 */
  autoTradingEnabled: boolean;
  /** 자동매매 토글 핸들러 */
  onToggleAutoTrading: (enabled: boolean) => void;
}

function useNextReviewCountdown() {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      const next = new Date(now);
      next.setUTCHours(24, 0, 0, 0);
      const diff = next.getTime() - now.getTime();
      const h = Math.floor(diff / 3_600_000);
      const m = Math.floor((diff % 3_600_000) / 60_000);
      const s = Math.floor((diff % 60_000) / 1_000);
      setTimeLeft(
        `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`,
      );
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  return timeLeft;
}

export function Header({
  totalWinRate,
  totalPnL,
  totalSignals,
  isConnected = true,
  onOpenPerformance,
  autoTradingEnabled,
  onToggleAutoTrading,
}: HeaderProps) {
  const { viewMode, setViewMode } = useViewMode();
  const countdown = useNextReviewCountdown();
  const [isReviewing, setIsReviewing] = useState(false);

  const handleTriggerSelfReview = async () => {
    setIsReviewing(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-self-review`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
        },
      );
      const result = await response.json();
      if (result.success) {
        toast.success('자기복기 완료! AI가 최근 매매를 분석했습니다.');
      } else {
        toast.info(result.message || '복기할 종료된 시그널이 없습니다.');
      }
    } catch (err) {
      console.error('Self-review error:', err);
      toast.error('자기복기 실행에 실패했습니다.');
    } finally {
      setIsReviewing(false);
    }
  };

  const handleToggle = () => {
    const next = !autoTradingEnabled;
    onToggleAutoTrading(next);
    if (next) {
      toast.success('자동매매 활성화 — AI 시그널 발생 시 자동 진입합니다');
    } else {
      toast.info('자동매매 비활성화 — 수동 모드');
    }
  };

  return (
    <header className="flex-shrink-0 z-50 glass-bar">
      <div className="px-4 sm:px-5 py-2.5 flex items-center justify-between gap-3">

        {/* ── Logo ── */}
        <Link to="/" className="flex items-center gap-2 flex-shrink-0">
          <div className="relative">
            <Zap className="w-5 h-5 text-primary" />
            <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-long animate-pulse" />
          </div>
          <div className="hidden sm:block leading-none">
            <h1 className="text-[13px] font-bold tracking-tight">
              LEAF<span className="text-primary">-MASTER</span>
            </h1>
            <p className="text-[9px] text-muted-foreground tracking-wider">QUANT ENGINE</p>
          </div>
        </Link>

        {/* ── Auto-Trading Toggle (가장 중요한 요소 — 중앙 배치) ── */}
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={handleToggle}
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all duration-200 select-none',
                  autoTradingEnabled
                    ? 'bg-long/12 border-long/35 hover:bg-long/18'
                    : 'bg-muted/50 border-border hover:bg-accent/60',
                )}
              >
                {/* Power Icon */}
                <Power
                  className={cn(
                    'w-3.5 h-3.5 transition-colors',
                    autoTradingEnabled ? 'text-long' : 'text-muted-foreground',
                  )}
                />

                {/* Toggle Switch Visual */}
                <div
                  className={cn(
                    'relative h-4 w-7 rounded-full transition-colors duration-200',
                    autoTradingEnabled ? 'bg-long' : 'bg-muted',
                  )}
                  style={autoTradingEnabled ? { boxShadow: '0 0 8px hsl(158 80% 42% / 0.45)' } : {}}
                >
                  <span
                    className={cn(
                      'absolute top-0.5 h-3 w-3 rounded-full bg-white shadow-sm transition-transform duration-200',
                      autoTradingEnabled ? 'translate-x-3.5' : 'translate-x-0.5',
                    )}
                  />
                </div>

                {/* Label */}
                <span
                  className={cn(
                    'text-xs font-bold tracking-wide',
                    autoTradingEnabled ? 'text-long' : 'text-muted-foreground',
                  )}
                >
                  {autoTradingEnabled ? 'AUTO ON' : 'AUTO OFF'}
                </span>

                {/* Live Pulse Dot */}
                {autoTradingEnabled && (
                  <span className="w-1.5 h-1.5 rounded-full bg-long animate-auto-trade flex-shrink-0" />
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p className="text-xs font-semibold">자동 매매 스위치</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {autoTradingEnabled
                  ? 'AI 시그널 발생 시 자동으로 포지션 진입'
                  : '수동 모드 — 버튼 클릭 시 자동 진입 활성화'}
              </p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* ── Center: Stats ── */}
        <div className="hidden md:flex items-center gap-1.5">
          <button
            onClick={onOpenPerformance}
            className="metric-pill hover:border-primary/30 transition-colors"
          >
            <BarChart3 className="w-3 h-3 text-primary" />
            <span className="text-muted-foreground">승률</span>
            <span className="font-mono font-bold text-long">{totalWinRate}%</span>
          </button>

          <button
            onClick={onOpenPerformance}
            className={cn(
              'metric-pill transition-colors',
              totalPnL >= 0
                ? 'hover:border-long/30 text-long'
                : 'hover:border-short/30 text-short',
            )}
          >
            <TrendingUp className="w-3 h-3" />
            <span className="font-mono font-bold">
              {totalPnL >= 0 ? '+' : ''}{totalPnL}%
            </span>
          </button>

          <div
            className={cn(
              'metric-pill',
              isConnected ? 'text-long' : 'text-short',
            )}
          >
            {isConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            <span>{isConnected ? 'Live' : 'Offline'}</span>
          </div>
        </div>

        {/* ── Right: Tools ── */}
        <div className="flex items-center gap-1.5">
          {/* View Mode Toggle */}
          <div className="hidden sm:flex items-center rounded-md border border-border/80 overflow-hidden">
            <button
              onClick={() => setViewMode('pc')}
              className={cn(
                'p-1.5 transition-colors',
                viewMode === 'pc'
                  ? 'bg-primary/15 text-primary'
                  : 'text-muted-foreground hover:bg-accent/40',
              )}
              title="PC 모드"
            >
              <Monitor className="w-3 h-3" />
            </button>
            <button
              onClick={() => setViewMode('mobile')}
              className={cn(
                'p-1.5 transition-colors',
                viewMode === 'mobile'
                  ? 'bg-primary/15 text-primary'
                  : 'text-muted-foreground hover:bg-accent/40',
              )}
              title="모바일 모드"
            >
              <Smartphone className="w-3 h-3" />
            </button>
          </div>

          {/* Self-Review Timer */}
          <div className="hidden lg:flex items-center gap-1.5 px-2 py-1.5 rounded-md bg-violet-500/8 border border-violet-500/20">
            <Clock className="w-3 h-3 text-violet-400" />
            <span className="font-mono text-[10px] font-bold text-violet-400">{countdown}</span>
            <button
              onClick={handleTriggerSelfReview}
              disabled={isReviewing}
              className="p-0.5 rounded hover:bg-violet-500/20 transition-colors"
              title="즉시 자기복기"
            >
              {isReviewing ? (
                <Loader2 className="w-2.5 h-2.5 text-violet-400 animate-spin" />
              ) : (
                <RefreshCw className="w-2.5 h-2.5 text-violet-400" />
              )}
            </button>
          </div>

          <div className="h-4 w-px bg-border/60 hidden sm:block" />

          <Link to="/ai-mentor">
            <Button variant="ghost" size="sm" className="gap-1.5 h-7 text-[11px] px-2">
              <Bot className="w-3 h-3" />
              <span className="hidden sm:inline">AI 멘토</span>
            </Button>
          </Link>

          <Link to="/positions">
            <Button variant="ghost" size="sm" className="gap-1.5 h-7 text-[11px] px-2">
              <Wallet className="w-3 h-3" />
              <span className="hidden sm:inline">포지션</span>
            </Button>
          </Link>

          <Tooltip>
            <TooltipTrigger asChild>
              <HelpCircle className="w-3 h-3 text-muted-foreground/50 hover:text-primary transition-colors hidden md:block cursor-help" />
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-xs">
              <p className="text-xs font-semibold">AI 승률 기준</p>
              <p className="text-xs text-muted-foreground mt-1">
                TP 도달=승리, SL 도달=패배 (총 {totalSignals}건)
              </p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </header>
  );
}
