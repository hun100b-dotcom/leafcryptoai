import { useState, useEffect, useCallback } from 'react';
import { CoinData } from '@/types/trading';
import { supabase } from '@/integrations/supabase/client';

const BINANCE_WS_URL = 'wss://stream.binance.com:9443/ws';

const COIN_SYMBOLS = ['BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'DOGE', 'ADA', 'AVAX'];

interface BinanceTickerData {
  s: string; // Symbol
  c: string; // Current price
  P: string; // Price change percent
  v: string; // Volume
}

export function useBinancePrice() {
  const [prices, setPrices] = useState<Map<string, CoinData>>(new Map());
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch initial prices via Edge Function (CORS proxy)
  const fetchInitialPrices = useCallback(async () => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('binance-proxy', {
        body: null,
        headers: { 'Content-Type': 'application/json' },
      });
      
      // Use query params approach
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/binance-proxy?endpoint=ticker`,
        {
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
        }
      );
      
      if (!response.ok) throw new Error('Failed to fetch prices');
      
      const tickerData: Array<{
        symbol: string;
        lastPrice: string;
        priceChangePercent: string;
        volume: string;
      }> = await response.json();

      const priceMap = new Map<string, CoinData>();
      
      COIN_SYMBOLS.forEach((symbol) => {
        const ticker = tickerData.find(t => t.symbol === `${symbol}USDT`);
        if (ticker) {
          priceMap.set(symbol, {
            symbol,
            name: getFullName(symbol),
            price: parseFloat(ticker.lastPrice),
            change24h: parseFloat(ticker.priceChangePercent),
            volume24h: parseFloat(ticker.volume) * parseFloat(ticker.lastPrice),
            aiWinRate: getAIWinRate(symbol),
          });
        }
      });

      setPrices(priceMap);
      setError(null);
      setIsConnected(true);
    } catch (err) {
      console.error('Failed to fetch initial prices:', err);
      setError('가격 데이터를 불러오는데 실패했습니다');
      setIsConnected(false);
    }
  }, []);

  // Fetch prices on mount and set up polling (WebSocket may be blocked by CORS)
  useEffect(() => {
    fetchInitialPrices();

    // Poll every 5 seconds as fallback
    const interval = setInterval(fetchInitialPrices, 5000);

    // Try WebSocket connection
    const streams = COIN_SYMBOLS.map(s => `${s.toLowerCase()}usdt@ticker`).join('/');
    let ws: WebSocket | null = null;
    
    try {
      ws = new WebSocket(`${BINANCE_WS_URL}/${streams}`);

      ws.onopen = () => {
        console.log('Binance WebSocket connected');
        setIsConnected(true);
        setError(null);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as BinanceTickerData;
          const symbol = data.s.replace('USDT', '');
          
          if (COIN_SYMBOLS.includes(symbol)) {
            setPrices(prev => {
              const newMap = new Map(prev);
              newMap.set(symbol, {
                symbol,
                name: getFullName(symbol),
                price: parseFloat(data.c),
                change24h: parseFloat(data.P),
                volume24h: parseFloat(data.v) * parseFloat(data.c),
                aiWinRate: getAIWinRate(symbol),
              });
              return newMap;
            });
          }
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err);
        }
      };

      ws.onerror = () => {
        console.log('WebSocket not available, using polling fallback');
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
      };
    } catch (e) {
      console.log('WebSocket not supported, using polling');
    }

    return () => {
      clearInterval(interval);
      ws?.close();
    };
  }, [fetchInitialPrices]);

  const getCoins = useCallback((): CoinData[] => {
    return COIN_SYMBOLS.map(symbol => 
      prices.get(symbol) || {
        symbol,
        name: getFullName(symbol),
        price: 0,
        change24h: 0,
        volume24h: 0,
        aiWinRate: getAIWinRate(symbol),
      }
    );
  }, [prices]);

  return {
    prices,
    coins: getCoins(),
    isConnected,
    error,
    refetch: fetchInitialPrices,
  };
}

function getFullName(symbol: string): string {
  const names: Record<string, string> = {
    BTC: 'Bitcoin',
    ETH: 'Ethereum',
    SOL: 'Solana',
    BNB: 'BNB',
    XRP: 'Ripple',
    DOGE: 'Dogecoin',
    ADA: 'Cardano',
    AVAX: 'Avalanche',
  };
  return names[symbol] || symbol;
}

function getAIWinRate(symbol: string): number {
  // Mock AI win rates - in production, this would come from the database
  const rates: Record<string, number> = {
    BTC: 78,
    ETH: 72,
    SOL: 81,
    BNB: 69,
    XRP: 65,
    DOGE: 58,
    ADA: 62,
    AVAX: 70,
  };
  return rates[symbol] || 60;
}
