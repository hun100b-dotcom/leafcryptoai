import { useState, useEffect, useCallback } from 'react';

interface PriceMap {
  [symbol: string]: number;
}

export function useBinancePrices(symbols: string[]) {
  const [prices, setPrices] = useState<PriceMap>({});
  const [isLoading, setIsLoading] = useState(true);

  const fetchPrices = useCallback(async () => {
    if (symbols.length === 0) {
      setIsLoading(false);
      return;
    }

    try {
      // Fetch all prices at once from Binance
      const response = await fetch('https://fapi.binance.com/fapi/v1/ticker/price');
      const data = await response.json();
      
      const priceMap: PriceMap = {};
      for (const item of data) {
        // Remove USDT suffix to match our symbol format
        const symbol = item.symbol.replace('USDT', '');
        if (symbols.includes(symbol)) {
          priceMap[symbol] = parseFloat(item.price);
        }
      }
      
      setPrices(priceMap);
    } catch (error) {
      console.error('Failed to fetch Binance prices:', error);
    } finally {
      setIsLoading(false);
    }
  }, [symbols.join(',')]);

  useEffect(() => {
    fetchPrices();
    
    // Poll every 3 seconds for real-time updates
    const interval = setInterval(fetchPrices, 3000);
    
    return () => clearInterval(interval);
  }, [fetchPrices]);

  const getPrice = useCallback((symbol: string): number | undefined => {
    return prices[symbol];
  }, [prices]);

  return { prices, getPrice, isLoading, refetch: fetchPrices };
}
