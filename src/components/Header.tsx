import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Zap, TrendingUp, Activity, BarChart3, Wifi, WifiOff, HelpCircle, Wallet } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  totalWinRate: number;
  totalPnL: number;
  totalSignals: number;
  isConnected?: boolean;
  onOpenPerformance?: () => void;
}

export function Header({ totalWinRate, totalPnL, totalSignals, isConnected = true, onOpenPerformance }: HeaderProps) {
  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm">
      <div className="px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-2"
          >
            <div className="relative">
              <Zap className="w-8 h-8 text-primary" />
              <span className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-long animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">
                LEAD MASTER<span className="text-primary">: CRYPTO</span>
              </h1>
              <p className="text-xs text-muted-foreground">
                AI가 당신의 롱/숏을 리드합니다
              </p>
            </div>
          </motion.div>
        </div>

        <div className="flex items-center gap-3">
          {/* My Positions Link */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Link to="/positions">
              <Button variant="outline" size="sm" className="gap-2">
                <Wallet className="w-4 h-4" />
                내 포지션
              </Button>
            </Link>
          </motion.div>

          {/* Connection Status */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
              isConnected 
                ? 'bg-long/10 text-long border border-long/30' 
                : 'bg-short/10 text-short border border-short/30'
            }`}
          >
            {isConnected ? (
              <>
                <Wifi className="w-3 h-3" />
                <span>Binance Live</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3 h-3" />
                <span>Reconnecting...</span>
              </>
            )}
          </motion.div>

          {/* Win Rate - Clickable with Tooltip */}
          <motion.button
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            onClick={onOpenPerformance}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent/50 border border-border hover:bg-accent hover:border-primary/50 transition-all cursor-pointer group"
          >
            <BarChart3 className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
            <span className="text-xs text-muted-foreground">AI 승률</span>
            <span className="font-mono font-bold text-long">{totalWinRate}%</span>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="w-3.5 h-3.5 text-muted-foreground hover:text-primary transition-colors" />
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs">
                <div className="space-y-2 text-xs">
                  <p className="font-semibold">AI 승률 측정 기준</p>
                  <p>진입가 대비 목표가(TP) 선도달 시 <span className="text-long">승리</span>, 손절가(SL) 선도달 시 <span className="text-short">패배</span>로 판정</p>
                  <p className="font-mono bg-accent/50 p-1 rounded">
                    Win Rate = (성공 ÷ 전체) × 100
                  </p>
                  <p className="text-muted-foreground">총 {totalSignals}개 시그널 기준</p>
                </div>
              </TooltipContent>
            </Tooltip>
          </motion.button>

          {/* P&L - Clickable */}
          <motion.button
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            onClick={onOpenPerformance}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all cursor-pointer group ${
              totalPnL >= 0 
                ? 'bg-long/10 border-long/30 hover:bg-long/20 hover:border-long/50' 
                : 'bg-short/10 border-short/30 hover:bg-short/20 hover:border-short/50'
            }`}
          >
            <TrendingUp className={`w-4 h-4 group-hover:scale-110 transition-transform ${totalPnL >= 0 ? 'text-long' : 'text-short'}`} />
            <span className="text-xs text-muted-foreground">누적 수익률</span>
            <span className={`font-mono font-bold ${totalPnL >= 0 ? 'text-long' : 'text-short'}`}>
              {totalPnL >= 0 ? '+' : ''}{totalPnL}%
            </span>
          </motion.button>

          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex items-center gap-2"
          >
            <Activity className="w-4 h-4 text-long animate-pulse" />
            <span className="text-xs font-medium">LIVE</span>
          </motion.div>
        </div>
      </div>
    </header>
  );
}
