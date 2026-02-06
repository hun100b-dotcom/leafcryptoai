import { CoinData } from '@/types/trading';
import { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';

interface PriceChartProps {
  coin: CoinData;
}

// Generate mock candlestick data
function generateMockData(basePrice: number) {
  const data = [];
  let price = basePrice * 0.95;
  
  for (let i = 24; i >= 0; i--) {
    const change = (Math.random() - 0.48) * basePrice * 0.01;
    price = price + change;
    const time = new Date(Date.now() - i * 60 * 60 * 1000);
    
    data.push({
      time: time.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
      price: Math.round(price * 100) / 100,
      volume: Math.random() * 1000000000,
    });
  }
  
  return data;
}

export function PriceChart({ coin }: PriceChartProps) {
  const [data, setData] = useState(() => generateMockData(coin.price));

  useEffect(() => {
    setData(generateMockData(coin.price));
  }, [coin.symbol, coin.price]);

  const isPositive = coin.change24h >= 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="trading-card p-4 h-[300px]"
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold">{coin.symbol}/USDT</h3>
          <p className="text-xs text-muted-foreground">24시간 차트</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-mono font-bold">
            ${coin.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </p>
          <p className={isPositive ? "text-long text-sm font-medium" : "text-short text-sm font-medium"}>
            {isPositive ? '+' : ''}{coin.change24h}%
          </p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
              <stop 
                offset="5%" 
                stopColor={isPositive ? "hsl(158, 82%, 43%)" : "hsl(354, 91%, 62%)"} 
                stopOpacity={0.3}
              />
              <stop 
                offset="95%" 
                stopColor={isPositive ? "hsl(158, 82%, 43%)" : "hsl(354, 91%, 62%)"} 
                stopOpacity={0}
              />
            </linearGradient>
          </defs>
          <XAxis 
            dataKey="time" 
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'hsl(220, 9%, 53%)', fontSize: 10 }}
            interval="preserveStartEnd"
          />
          <YAxis 
            domain={['auto', 'auto']}
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'hsl(220, 9%, 53%)', fontSize: 10 }}
            tickFormatter={(value) => `$${value.toLocaleString()}`}
            orientation="right"
            width={80}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(220, 16%, 10%)',
              border: '1px solid hsl(220, 13%, 18%)',
              borderRadius: '8px',
              boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
            }}
            labelStyle={{ color: 'hsl(220, 9%, 53%)' }}
            formatter={(value: number) => [`$${value.toLocaleString()}`, '가격']}
          />
          <Area
            type="monotone"
            dataKey="price"
            stroke={isPositive ? "hsl(158, 82%, 43%)" : "hsl(354, 91%, 62%)"}
            strokeWidth={2}
            fill="url(#colorPrice)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
