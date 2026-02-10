import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings, Check, X, Search, Coins, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface WhitelistSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

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

const DEFAULT_USER_ID = 'default_user';

export function WhitelistSettings({ isOpen, onClose }: WhitelistSettingsProps) {
  const [search, setSearch] = useState('');
  const [whitelist, setWhitelist] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Load whitelist from DB
  useEffect(() => {
    if (!isOpen) return;
    
    const loadWhitelist = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('user_settings')
          .select('whitelist_coins')
          .eq('user_id', DEFAULT_USER_ID)
          .single();

        if (error && error.code !== 'PGRST116') throw error;

        if (data?.whitelist_coins) {
          setWhitelist(data.whitelist_coins as string[]);
        } else {
          setWhitelist(AVAILABLE_COINS.map(c => c.symbol));
        }
      } catch (err) {
        console.error('Failed to load whitelist:', err);
        setWhitelist(AVAILABLE_COINS.map(c => c.symbol));
      } finally {
        setIsLoading(false);
      }
    };

    loadWhitelist();
  }, [isOpen]);

  // Save whitelist to DB
  const saveWhitelist = async (newList: string[]) => {
    setWhitelist(newList);
    try {
      const { data: existing } = await supabase
        .from('user_settings')
        .select('id')
        .eq('user_id', DEFAULT_USER_ID)
        .single();

      if (existing) {
        await supabase
          .from('user_settings')
          .update({ whitelist_coins: newList, updated_at: new Date().toISOString() } as any)
          .eq('user_id', DEFAULT_USER_ID);
      } else {
        await supabase
          .from('user_settings')
          .insert({ user_id: DEFAULT_USER_ID, whitelist_coins: newList } as any);
      }
    } catch (err) {
      console.error('Failed to save whitelist:', err);
    }
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
          <p className="text-sm text-muted-foreground">
            AI 멘토가 분석하고 진입할 코인 종목을 선택하세요. 
            선택된 코인만 시그널 생성 대상이 됩니다.
          </p>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="코인 검색..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={selectAll} className="flex-1">
              전체 선택
            </Button>
            <Button variant="outline" size="sm" onClick={deselectAll} className="flex-1">
              전체 해제
            </Button>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <Coins className="w-4 h-4 text-primary" />
            <span className="text-muted-foreground">선택된 코인:</span>
            <Badge variant="secondary">{whitelist.length}개</Badge>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
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
          )}

          <Button onClick={onClose} className="w-full">
            <Check className="w-4 h-4 mr-2" />
            저장하고 닫기
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
