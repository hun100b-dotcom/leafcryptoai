import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Area, ComposedChart } from 'recharts';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

interface AssetHistoryItem {
  date: Date;
  asset: number;
  pnl: number;
}

interface AIGrowthChartProps {
  assetHistory: AssetHistoryItem[];
  initialSeed: number;
}

export function AIGrowthChart({ assetHistory, initialSeed }: AIGrowthChartProps) {
  const chartData = useMemo(() => {
    if (assetHistory.length === 0) {
      // Generate mock data for demonstration
      const mockData = [];
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      
      let currentAsset = initialSeed;
      for (let i = 0; i <= 30; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        
        // Random walk with slight upward bias
        const change = (Math.random() - 0.45) * 500;
        currentAsset = Math.max(currentAsset + change, initialSeed * 0.8);
        
        mockData.push({
          date: format(date, 'MM/dd', { locale: ko }),
          asset: Math.round(currentAsset),
          pnl: ((currentAsset - initialSeed) / initialSeed * 100).toFixed(2),
        });
      }
      return mockData;
    }

    return assetHistory.map((item, index) => ({
      date: format(item.date, 'MM/dd', { locale: ko }),
      asset: Math.round(item.asset),
      pnl: item.pnl.toFixed(2),
      tradeNumber: index + 1,
    }));
  }, [assetHistory, initialSeed]);

  const currentAsset = chartData[chartData.length - 1]?.asset || initialSeed;
  const returnPercent = ((currentAsset - initialSeed) / initialSeed * 100);

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex items-center justify-between p-4 bg-accent/30 rounded-lg">
        <div>
          <p className="text-sm text-muted-foreground">현재 자산</p>
          <p className="text-xl font-bold font-mono">
            ${currentAsset.toLocaleString()}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">총 수익률</p>
          <p className={`text-xl font-bold font-mono ${returnPercent >= 0 ? 'text-long' : 'text-short'}`}>
            {returnPercent >= 0 ? '+' : ''}{returnPercent.toFixed(2)}%
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="assetGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              tickFormatter={(value) => `$${(value / 1000).toFixed(1)}k`}
              tickLine={false}
              axisLine={false}
              domain={['auto', 'auto']}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                padding: '12px',
              }}
              formatter={(value: number, name: string) => {
                if (name === 'asset') return [`$${value.toLocaleString()}`, '자산'];
                return [value, name];
              }}
              labelFormatter={(label) => `날짜: ${label}`}
            />
            <ReferenceLine 
              y={initialSeed} 
              stroke="hsl(var(--muted-foreground))" 
              strokeDasharray="5 5"
              label={{ value: '초기 시드', fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
            />
            <Area 
              type="monotone" 
              dataKey="asset" 
              stroke="transparent"
              fill="url(#assetGradient)" 
            />
            <Line 
              type="monotone" 
              dataKey="asset" 
              stroke="hsl(var(--primary))" 
              strokeWidth={2}
              dot={{ fill: 'hsl(var(--primary))', strokeWidth: 0, r: 3 }}
              activeDot={{ r: 5, fill: 'hsl(var(--primary))' }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="w-3 h-0.5 bg-primary" />
          <span>AI 자산</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-0.5 border-t border-dashed border-muted-foreground" />
          <span>초기 시드 ($10,000)</span>
        </div>
      </div>
    </div>
  );
}
