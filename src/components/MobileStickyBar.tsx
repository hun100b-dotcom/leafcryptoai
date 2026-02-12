/**
 * MobileStickyBar - 모바일 하단 고정 액션 바
 * 엄지 한 손 조작을 위한 핵심 정보 + 액션 버튼
 */
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, BarChart3, Wallet, Bot, Menu } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

interface MobileStickyBarProps {
  totalPnL: number;
  winRate: number;
  activeSignals: number;
  className?: string;
}

export function MobileStickyBar({ totalPnL, winRate, activeSignals, className }: MobileStickyBarProps) {
  const location = useLocation();
  const isHome = location.pathname === '/';

  return (
    <motion.div
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 lg:hidden",
        "bg-card/95 backdrop-blur-lg border-t border-border",
        "safe-area-bottom",
        className
      )}
    >
      {/* PnL Summary Strip */}
      <div className="flex items-center justify-between px-4 py-1.5 border-b border-border/50 bg-accent/30">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-xs">
            <BarChart3 className="w-3 h-3 text-primary" />
            <span className="text-muted-foreground">승률</span>
            <span className="font-mono font-bold text-long">{winRate}%</span>
          </div>
          <div className="flex items-center gap-1 text-xs">
            {totalPnL >= 0 ? (
              <TrendingUp className="w-3 h-3 text-long" />
            ) : (
              <TrendingDown className="w-3 h-3 text-short" />
            )}
            <span className="text-muted-foreground">수익</span>
            <span className={cn("font-mono font-bold", totalPnL >= 0 ? "text-long" : "text-short")}>
              {totalPnL >= 0 ? '+' : ''}{totalPnL}%
            </span>
          </div>
        </div>
        {activeSignals > 0 && (
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/20 text-primary font-medium">
            {activeSignals} 활성
          </span>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-around px-2 py-2">
        <Link
          to="/"
          className={cn(
            "flex flex-col items-center gap-0.5 px-4 py-1 rounded-lg transition-colors",
            isHome ? "text-primary" : "text-muted-foreground"
          )}
        >
          <BarChart3 className="w-5 h-5" />
          <span className="text-[10px]">대시보드</span>
        </Link>
        <Link
          to="/positions"
          className={cn(
            "flex flex-col items-center gap-0.5 px-4 py-1 rounded-lg transition-colors",
            location.pathname === '/positions' ? "text-primary" : "text-muted-foreground"
          )}
        >
          <Wallet className="w-5 h-5" />
          <span className="text-[10px]">포지션</span>
        </Link>
        <Link
          to="/ai-mentor"
          className={cn(
            "flex flex-col items-center gap-0.5 px-4 py-1 rounded-lg transition-colors",
            location.pathname === '/ai-mentor' ? "text-primary" : "text-muted-foreground"
          )}
        >
          <Bot className="w-5 h-5" />
          <span className="text-[10px]">AI 멘토</span>
        </Link>
      </div>
    </motion.div>
  );
}
