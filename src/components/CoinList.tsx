import { CoinData } from '@/types/trading';
import { TrendingUp, TrendingDown, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CoinListProps {
  coins: CoinData[];
  selectedSymbol: string;
  onSelectCoin: (symbol: string) => void;
}

/** 코인 심볼에 따른 포인트 색상 */
function coinAccent(symbol: string) {
  const map: Record<string, string> = {
    BTC: 'text-[#F7931A]',
    ETH: 'text-[#627EEA]',
    BNB: 'text-[#F3BA2F]',
    SOL: 'text-[#9945FF]',
    XRP: 'text-[#00AAE4]',
    ADA: 'text-[#0033AD]',
    DOGE: 'text-[#C2A633]',
    AVAX: 'text-[#E84142]',
  };
  return map[symbol] ?? 'text-primary';
}

/** 가격 포맷 */
function formatPrice(price: number): string {
  if (price >= 10_000) return price.toLocaleString(undefined, { maximumFractionDigits: 0 });
  if (price >= 1) return price.toLocaleString(undefined, { maximumFractionDigits: 2 });
  return price.toLocaleString(undefined, { maximumFractionDigits: 4 });
}

export function CoinList({ coins, selectedSymbol, onSelectCoin }: CoinListProps) {
  return (
    <div className="flex flex-col">
      {/* ── Header ── */}
      <div className="panel-section-header flex-shrink-0">
        <Star className="w-3 h-3 text-primary" />
        <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Watchlist
        </span>
        <span className="ml-auto text-[9px] text-muted-foreground/40 font-mono">USDT-M</span>
      </div>

      {/* ── Column Labels ── */}
      <div className="flex items-center px-3 py-1.5 border-b border-border/40">
        <span className="text-[9px] text-muted-foreground/40 uppercase tracking-wider w-20">코인</span>
        <span className="text-[9px] text-muted-foreground/40 uppercase tracking-wider flex-1 text-right">현재가</span>
        <span className="text-[9px] text-muted-foreground/40 uppercase tracking-wider w-14 text-right">24H</span>
      </div>

      {/* ── Coin Rows ── */}
      <div>
        {coins.map((coin) => {
          const isSelected = selectedSymbol === coin.symbol;
          const isUp = coin.change24h >= 0;

          return (
            <button
              key={coin.symbol}
              onClick={() => onSelectCoin(coin.symbol)}
              className={cn('coin-row', isSelected && 'selected')}
            >
              {/* Symbol + Name */}
              <div className="flex items-center gap-2 w-20 flex-shrink-0">
                {/* Color Dot */}
                <div
                  className={cn(
                    'w-1.5 h-1.5 rounded-full flex-shrink-0',
                    isSelected ? 'bg-primary' : 'bg-muted-foreground/20',
                  )}
                />
                <div className="text-left min-w-0">
                  <p className={cn('text-xs font-semibold leading-none', coinAccent(coin.symbol))}>
                    {coin.symbol}
                  </p>
                  <p className="text-[9px] text-muted-foreground/50 truncate mt-0.5 leading-none">
                    {coin.name}
                  </p>
                </div>
              </div>

              {/* Price */}
              <div className="flex-1 text-right">
                <p className="font-mono text-[11px] font-medium text-foreground/90">
                  ${formatPrice(coin.price)}
                </p>
              </div>

              {/* 24H Change */}
              <div className={cn('w-14 text-right flex items-center justify-end gap-0.5', isUp ? 'text-long' : 'text-short')}>
                {isUp ? (
                  <TrendingUp className="w-2.5 h-2.5 flex-shrink-0" />
                ) : (
                  <TrendingDown className="w-2.5 h-2.5 flex-shrink-0" />
                )}
                <span className="font-mono text-[10px] font-medium">
                  {isUp ? '+' : ''}{coin.change24h.toFixed(1)}%
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* ── AI Win Rate Leaderboard ── */}
      <div className="border-t border-border/40 p-3">
        <p className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground/50 mb-2">
          AI 승률 TOP3
        </p>
        <div className="space-y-1.5">
          {coins
            .filter((c) => c.aiWinRate > 0)
            .sort((a, b) => b.aiWinRate - a.aiWinRate)
            .slice(0, 3)
            .map((coin, i) => (
              <button
                key={coin.symbol}
                onClick={() => onSelectCoin(coin.symbol)}
                className="w-full flex items-center justify-between hover:opacity-80 transition-opacity"
              >
                <div className="flex items-center gap-1.5">
                  <span
                    className={cn(
                      'text-[9px] font-bold w-4',
                      i === 0 ? 'text-primary' : i === 1 ? 'text-muted-foreground' : 'text-muted-foreground/60',
                    )}
                  >
                    #{i + 1}
                  </span>
                  <span className={cn('text-[10px] font-semibold', coinAccent(coin.symbol))}>
                    {coin.symbol}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-12 h-1 bg-accent/60 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-long rounded-full"
                      style={{ width: `${coin.aiWinRate}%` }}
                    />
                  </div>
                  <span className="font-mono text-[10px] text-long font-medium w-8 text-right">
                    {coin.aiWinRate}%
                  </span>
                </div>
              </button>
            ))}
        </div>
      </div>
    </div>
  );
}
