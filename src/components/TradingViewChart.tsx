import { useEffect, useRef, memo } from 'react';

interface TradingViewChartProps {
  symbol: string;
}

function TradingViewChartComponent({ symbol }: TradingViewChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Clear previous widget
    containerRef.current.innerHTML = '';

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: `BINANCE:${symbol}USDT`,
      interval: '5',
      timezone: 'Asia/Seoul',
      theme: 'dark',
      style: '1',
      locale: 'kr',
      backgroundColor: 'rgba(11, 14, 17, 1)',
      gridColor: 'rgba(42, 46, 57, 0.3)',
      hide_top_toolbar: false,
      hide_legend: false,
      allow_symbol_change: false,
      save_image: false,
      calendar: false,
      hide_volume: false,
      support_host: 'https://www.tradingview.com',
    });

    containerRef.current.appendChild(script);

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [symbol]);

  return (
    <div className="tradingview-widget-container h-full" ref={containerRef}>
      <div className="tradingview-widget-container__widget h-full" />
    </div>
  );
}

export const TradingViewChart = memo(TradingViewChartComponent);
