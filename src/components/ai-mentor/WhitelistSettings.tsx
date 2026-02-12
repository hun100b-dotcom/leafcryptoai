import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings, Check, X, Search, Coins } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface WhitelistSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

// Available coins for trading
const AVAILABLE_COINS = [
  { symbol: 'BTC', name: 'Bitcoin', icon: '₿' },
  { symbol: 'ETH', name: 'Ethereum', icon: 'Ξ' },
  { symbol: 'SOL', name: 'Solana', icon: '◎' },
  { symbol: 'XRP', name: 'Ripple', icon: '✕' },
  { symbol: 'DOGE', name: 'Dogecoin', icon: 'Ð' },
  { symbol: 'ADA', name: 'Cardano', icon: '₳' },
  { symbol: 'AVAX', name: 'Avalanche', icon: 'A' },
  { symbol: 'LINK', name: 'Chainlink', icon: '⬡' },
  { symbol: 'DOT', name: 'Polkadot', icon: '●' },
  { symbol: 'MATIC', name: 'Polygon', icon: '⬡' },
  { symbol: 'UNI', name: 'Uniswap', icon: '🦄' },
  { symbol: 'ATOM', name: 'Cosmos', icon: '⚛' },
  { symbol: 'LTC', name: 'Litecoin', icon: 'Ł' },
  { symbol: 'BCH', name: 'Bitcoin Cash', icon: '₿' },
  { symbol: 'APT', name: 'Aptos', icon: 'A' },
];

const STORAGE_KEY = 'ai_whitelist_coins';

export function WhitelistSettings({ isOpen, onClose }: WhitelistSettingsProps) {
  const [search, setSearch] = useState('');
  const [whitelist, setWhitelist] = useState<string[]>([]);

  // Load whitelist from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setWhitelist(JSON.parse(saved));
    } else {
      // Default: All coins enabled
      setWhitelist(AVAILABLE_COINS.map(c => c.symbol));
    }
  }, []);

  // Save whitelist to localStorage
  const saveWhitelist = (newList: string[]) => {
    setWhitelist(newList);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newList));
  };

  const toggleCoin = (symbol: string) => {
    if (whitelist.includes(symbol)) {
      if (whitelist.length === 1) {
        toast.error('최소 1개 이상의 코인을 선택해야 합니다');
        return;
      }
      saveWhitelist(whitelist.filter(s => s !== symbol));
    } else {
      saveWhitelist([...whitelist, symbol]);
    }
  };

  const selectAll = () => {
    saveWhitelist(AVAILABLE_COINS.map(c => c.symbol));
  };

  const deselectAll = () => {
    // Keep at least BTC
    saveWhitelist(['BTC']);
    toast.info('최소 1개(BTC)는 유지됩니다');
  };

  const filteredCoins = AVAILABLE_COINS.filter(coin =>
    coin.symbol.toLowerCase().includes(search.toLowerCase()) ||
    coin.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary" />
            AI 화이트리스트 설정
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Description */}
          <p className="text-sm text-muted-foreground">
            AI 멘토가 분석하고 진입할 코인 종목을 선택하세요. 
            선택된 코인만 시그널 생성 대상이 됩니다.
          </p>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="코인 검색..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={selectAll} className="flex-1">
              전체 선택
            </Button>
            <Button variant="outline" size="sm" onClick={deselectAll} className="flex-1">
              전체 해제
            </Button>
          </div>

          {/* Selected Count */}
          <div className="flex items-center gap-2 text-sm">
            <Coins className="w-4 h-4 text-primary" />
            <span className="text-muted-foreground">선택된 코인:</span>
            <Badge variant="secondary">{whitelist.length}개</Badge>
          </div>

          {/* Coin List */}
          <div className="max-h-[300px] overflow-y-auto space-y-2 scrollbar-thin">
            {filteredCoins.map((coin, index) => {
              const isSelected = whitelist.includes(coin.symbol);
              return (
                <motion.div
                  key={coin.symbol}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer",
                    isSelected 
                      ? "bg-primary/10 border-primary/30" 
                      : "bg-accent/30 border-transparent hover:border-border"
                  )}
                  onClick={() => toggleCoin(coin.symbol)}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-sm font-bold">
                      {coin.icon}
                    </span>
                    <div>
                      <p className="font-semibold">{coin.symbol}</p>
                      <p className="text-xs text-muted-foreground">{coin.name}</p>
                    </div>
                  </div>
                  <Switch
                    checked={isSelected}
                    onCheckedChange={() => toggleCoin(coin.symbol)}
                  />
                </motion.div>
              );
            })}
          </div>

          {/* Save Button */}
          <Button onClick={onClose} className="w-full">
            <Check className="w-4 h-4 mr-2" />
            저장하고 닫기
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
