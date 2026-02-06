import { useState, useEffect, useCallback } from 'react';
import { CoinData } from '@/types/trading';

const BINANCE_WS_URL = 'wss://stream.binance.com:9443/ws';
const BINANCE_REST_URL = 'https://api.binance.com/api/v3';

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

  // Fetch initial prices via REST API
  const fetchInitialPrices = useCallback(async () => {
    try {
      const response = await fetch(`${BINANCE_REST_URL}/ticker/24hr`);
      if (!response.ok) throw new Error('Failed to fetch prices');
      
      const data: Array<{
        symbol: string;
        lastPrice: string;
        priceChangePercent: string;
        volume: string;
      }> = await response.json();

      const priceMap = new Map<string, CoinData>();
      
      COIN_SYMBOLS.forEach((symbol) => {
        const ticker = data.find(t => t.symbol === `${symbol}USDT`);
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
    } catch (err) {
      console.error('Failed to fetch initial prices:', err);
      setError('가격 데이터를 불러오는데 실패했습니다');
    }
  }, []);

  // Connect to WebSocket for real-time updates
  useEffect(() => {
    fetchInitialPrices();

    const streams = COIN_SYMBOLS.map(s => `${s.toLowerCase()}usdt@ticker`).join('/');
    const ws = new WebSocket(`${BINANCE_WS_URL}/${streams}`);

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

    ws.onerror = (event) => {
      console.error('WebSocket error:', event);
      setError('실시간 연결 오류');
      setIsConnected(false);
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
    };

    return () => {
      ws.close();
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
