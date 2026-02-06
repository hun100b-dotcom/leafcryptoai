import { AISignal, CoinData } from '@/types/trading';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus, Target, Shield, Zap, Activity } from 'lucide-react';
import { motion } from 'framer-motion';

interface ActionCardProps {
  coin: CoinData;
  signal?: AISignal;
}

export function ActionCard({ coin, signal }: ActionCardProps) {
  const position = signal?.position || 'HOLD';
  
  const getPositionStyle = () => {
    switch (position) {
      case 'LONG':
        return 'border-long glow-long';
      case 'SHORT':
        return 'border-short glow-short';
      default:
        return 'border-border';
    }
  };

  const getPositionIcon = () => {
    switch (position) {
      case 'LONG':
        return <TrendingUp className="w-6 h-6" />;
      case 'SHORT':
        return <TrendingDown className="w-6 h-6" />;
      default:
        return <Minus className="w-6 h-6" />;
    }
  };

  const getPositionColor = () => {
    switch (position) {
      case 'LONG':
        return 'text-long bg-long/10';
      case 'SHORT':
        return 'text-short bg-short/10';
      default:
        return 'text-muted-foreground bg-muted';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "trading-card border-2 p-6 transition-all duration-300",
        getPositionStyle()
      )}
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={cn(
            "p-3 rounded-xl",
            getPositionColor()
          )}>
            {getPositionIcon()}
          </div>
          <div>
            <h3 className="text-2xl font-bold">{coin.symbol}/USDT</h3>
            <p className="text-sm text-muted-foreground">AI 포지션 가이드</p>
          </div>
        </div>
        
        <div className={cn(
          "px-4 py-2 rounded-full font-bold text-lg",
          position === 'LONG' && "bg-long text-long-foreground",
          position === 'SHORT' && "bg-short text-short-foreground",
          position === 'HOLD' && "bg-muted text-muted-foreground"
        )}>
          {position}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="trading-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Activity className="w-4 h-4" />
            <span className="text-xs uppercase tracking-wider">현재가</span>
          </div>
          <p className="font-mono text-xl font-bold">
            ${coin.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </p>
        </div>

        <div className="trading-card p-4">
          <div className="flex items-center gap-2 text-primary mb-2">
            <Zap className="w-4 h-4" />
            <span className="text-xs uppercase tracking-wider">레버리지</span>
          </div>
          <p className="font-mono text-xl font-bold text-primary">
            {signal?.leverage || 1}x
          </p>
        </div>

        <div className="trading-card p-4">
          <div className="flex items-center gap-2 text-long mb-2">
            <Target className="w-4 h-4" />
            <span className="text-xs uppercase tracking-wider">익절가 (TP)</span>
          </div>
          <p className="font-mono text-xl font-bold text-long">
            ${signal?.targetPrice?.toLocaleString() || '-'}
          </p>
        </div>

        <div className="trading-card p-4">
          <div className="flex items-center gap-2 text-short mb-2">
            <Shield className="w-4 h-4" />
            <span className="text-xs uppercase tracking-wider">손절가 (SL)</span>
          </div>
          <p className="font-mono text-xl font-bold text-short">
            ${signal?.stopLoss?.toLocaleString() || '-'}
          </p>
        </div>
      </div>

      {signal && (
        <div className="mt-4 p-4 rounded-lg bg-accent/50 border border-border">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse-glow" />
            <span className="text-xs text-muted-foreground uppercase tracking-wider">
              AI 분석 코멘트
            </span>
            <span className="ml-auto text-xs text-muted-foreground">
              신뢰도 {signal.confidence}%
            </span>
          </div>
          <p className="text-sm leading-relaxed">{signal.message}</p>
        </div>
      )}
    </motion.div>
  );
}
