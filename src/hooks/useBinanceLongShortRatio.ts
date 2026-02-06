import { useState, useEffect, useCallback } from 'react';

interface LongShortRatioData {
  symbol: string;
  longRatio: number;
  shortRatio: number;
  longAccount: number;
  shortAccount: number;
  timestamp: number;
}

const BINANCE_FUTURES_API = 'https://fapi.binance.com/futures/data';

export function useBinanceLongShortRatio(symbol: string = 'BTC') {
  const [data, setData] = useState<LongShortRatioData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRatio = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Fetch top trader long/short ratio (accounts)
      const response = await fetch(
        `${BINANCE_FUTURES_API}/topLongShortAccountRatio?symbol=${symbol}USDT&period=5m&limit=1`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch long/short ratio');
      }
      
      const result = await response.json();
      
      if (result && result.length > 0) {
        const latestData = result[0];
        const longRatio = parseFloat(latestData.longAccount) * 100;
        const shortRatio = parseFloat(latestData.shortAccount) * 100;
        
        setData({
          symbol,
          longRatio: Math.round(longRatio * 10) / 10,
          shortRatio: Math.round(shortRatio * 10) / 10,
          longAccount: parseFloat(latestData.longAccount),
          shortAccount: parseFloat(latestData.shortAccount),
          timestamp: parseInt(latestData.timestamp),
        });
        setError(null);
      }
    } catch (err) {
      console.error('Failed to fetch long/short ratio:', err);
      setError('롱/숏 비율 데이터를 불러오는데 실패했습니다');
    } finally {
      setIsLoading(false);
    }
  }, [symbol]);

  useEffect(() => {
    fetchRatio();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchRatio, 30000);
    
    return () => clearInterval(interval);
  }, [fetchRatio]);

  return { data, isLoading, error, refetch: fetchRatio };
}
