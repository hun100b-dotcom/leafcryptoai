import { motion } from 'framer-motion';
import { Zap, TrendingUp, Activity, BarChart3 } from 'lucide-react';

interface HeaderProps {
  totalWinRate: number;
  totalPnL: number;
}

export function Header({ totalWinRate, totalPnL }: HeaderProps) {
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

        <div className="flex items-center gap-6">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent/50 border border-border"
          >
            <BarChart3 className="w-4 h-4 text-primary" />
            <span className="text-xs text-muted-foreground">AI 승률</span>
            <span className="font-mono font-bold text-long">{totalWinRate}%</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-long/10 border border-long/30"
          >
            <TrendingUp className="w-4 h-4 text-long" />
            <span className="text-xs text-muted-foreground">누적 수익률</span>
            <span className="font-mono font-bold text-long">+{totalPnL}%</span>
          </motion.div>

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
