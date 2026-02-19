import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Zap, TrendingUp, Activity, BarChart3, Wifi, WifiOff, HelpCircle, Wallet, Bot, Monitor, Smartphone, Clock, RefreshCw, Loader2 } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { useViewMode } from '@/contexts/ViewModeContext';
import { toast } from 'sonner';

interface HeaderProps {
  totalWinRate: number;
  totalPnL: number;
  totalSignals: number;
  isConnected?: boolean;
  onOpenPerformance?: () => void;
}

function useNextReviewCountdown() {
  const [timeLeft, setTimeLeft] = useState('');
  
  useEffect(() => {
    const update = () => {
      const now = new Date();
      const next = new Date(now);
      next.setUTCHours(24, 0, 0, 0);
      const diff = next.getTime() - now.getTime();
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  return timeLeft;
}

export function Header({ totalWinRate, totalPnL, totalSignals, isConnected = true, onOpenPerformance }: HeaderProps) {
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
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
        }
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

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur-sm">
      <div className="px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-2"
          >
            <Link to="/" className="flex items-center gap-2">
              <div className="relative">
                <Zap className="w-7 h-7 sm:w-8 sm:h-8 text-primary" />
                <span className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-long animate-pulse" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold tracking-tight">
                  LEAF<span className="text-primary">-MASTER</span>
                </h1>
                <p className="text-xs text-muted-foreground">
                  Quantitative Trading Engine
                </p>
              </div>
            </Link>
          </motion.div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-3 flex-wrap justify-end">
          {/* Self-Review Countdown with Trigger Button */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-violet-500/10 border border-violet-500/20 text-xs"
          >
            <Clock className="w-3 h-3 text-violet-400" />
            <span className="hidden sm:inline text-muted-foreground">복기:</span>
            <span className="font-mono font-bold text-violet-400">{countdown}</span>
            <button
              onClick={handleTriggerSelfReview}
              disabled={isReviewing}
              className="ml-1 p-0.5 rounded hover:bg-violet-500/20 transition-colors"
              title="즉시 자기복기 실행"
            >
              {isReviewing ? (
                <Loader2 className="w-3 h-3 text-violet-400 animate-spin" />
              ) : (
                <RefreshCw className="w-3 h-3 text-violet-400" />
              )}
            </button>
          </motion.div>

          {/* View Mode Toggle - Always visible */}
          <div className="flex items-center border border-border rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('pc')}
              className={`p-1.5 transition-colors ${viewMode === 'pc' ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:bg-accent'}`}
              title="PC Ver."
            >
              <Monitor className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('mobile')}
              className={`p-1.5 transition-colors ${viewMode === 'mobile' ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:bg-accent'}`}
              title="Mobile Ver."
            >
              <Smartphone className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* AI Mentor Asset Link */}
          <Link to="/ai-mentor">
            <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs">
              <Bot className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">AI 멘토</span>
            </Button>
          </Link>

          {/* My Positions Link */}
          <Link to="/positions">
            <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs">
              <Wallet className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">내 포지션</span>
            </Button>
          </Link>

          {/* Connection Status */}
          <div className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium ${
            isConnected 
              ? 'bg-long/10 text-long border border-long/30' 
              : 'bg-short/10 text-short border border-short/30'
          }`}>
            {isConnected ? (
              <>
                <Wifi className="w-3 h-3" />
                <span>Live</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3 h-3" />
                <span>Reconnecting</span>
              </>
            )}
          </div>

          {/* Win Rate */}
          <motion.button
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={onOpenPerformance}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-accent/50 border border-border hover:bg-accent hover:border-primary/50 transition-all cursor-pointer group h-8"
          >
            <BarChart3 className="w-3.5 h-3.5 text-primary" />
            <span className="hidden md:inline text-xs text-muted-foreground">승률</span>
            <span className="font-mono font-bold text-xs text-long">{totalWinRate}%</span>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="w-3 h-3 text-muted-foreground hover:text-primary transition-colors hidden sm:block" />
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs">
                <div className="space-y-2 text-xs">
                  <p className="font-semibold">AI 승률 측정 기준</p>
                  <p>TP 선도달 시 <span className="text-long">승리</span>, SL 선도달 시 <span className="text-short">패배</span></p>
                  <p className="text-muted-foreground">총 {totalSignals}개 시그널 기준</p>
                </div>
              </TooltipContent>
            </Tooltip>
          </motion.button>

          {/* P&L */}
          <motion.button
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={onOpenPerformance}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition-all cursor-pointer h-8 ${
              totalPnL >= 0 
                ? 'bg-long/10 border-long/30 hover:bg-long/20' 
                : 'bg-short/10 border-short/30 hover:bg-short/20'
            }`}
          >
            <TrendingUp className={`w-3.5 h-3.5 ${totalPnL >= 0 ? 'text-long' : 'text-short'}`} />
            <span className="hidden md:inline text-xs text-muted-foreground">PnL</span>
            <span className={`font-mono font-bold text-xs ${totalPnL >= 0 ? 'text-long' : 'text-short'}`}>
              {totalPnL >= 0 ? '+' : ''}{totalPnL}%
            </span>
          </motion.button>

          <Activity className="w-4 h-4 text-long animate-pulse hidden sm:block" />
        </div>
      </div>
    </header>
  );
}
