import { CoinData } from '@/types/trading';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CoinListProps {
  coins: CoinData[];
  selectedSymbol: string;
  onSelectCoin: (symbol: string) => void;
}

export function CoinList({ coins, selectedSymbol, onSelectCoin }: CoinListProps) {
  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-border">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          선물 페어
        </h2>
      </div>
      
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {coins.map((coin) => (
          <button
            key={coin.symbol}
            onClick={() => onSelectCoin(coin.symbol)}
            className={cn(
              "w-full px-4 py-3 flex items-center justify-between transition-all duration-200 border-l-2",
              selectedSymbol === coin.symbol
                ? "bg-accent border-l-primary"
                : "border-l-transparent hover:bg-accent/50"
            )}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                <span className="text-xs font-bold text-primary">
                  {coin.symbol.slice(0, 2)}
                </span>
              </div>
              <div className="text-left">
                <p className="font-semibold text-sm">{coin.symbol}/USDT</p>
                <p className="text-xs text-muted-foreground">{coin.name}</p>
              </div>
            </div>
            
            <div className="text-right">
              <p className="font-mono text-sm font-medium">
                ${coin.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </p>
              <div className={cn(
                "flex items-center gap-1 text-xs font-medium",
                coin.change24h >= 0 ? "text-long" : "text-short"
              )}>
                {coin.change24h >= 0 ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                <span>{coin.change24h >= 0 ? '+' : ''}{coin.change24h}%</span>
              </div>
            </div>
          </button>
        ))}
      </div>
      
      <div className="p-4 border-t border-border">
        <div className="text-xs text-muted-foreground">
          <p className="font-semibold mb-2">AI 승률 순위</p>
          {coins
            .sort((a, b) => b.aiWinRate - a.aiWinRate)
            .slice(0, 3)
            .map((coin, i) => (
              <div key={coin.symbol} className="flex justify-between py-1">
                <span className="flex items-center gap-2">
                  <span className="text-primary font-bold">#{i + 1}</span>
                  {coin.symbol}
                </span>
                <span className="text-long font-mono">{coin.aiWinRate}%</span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
