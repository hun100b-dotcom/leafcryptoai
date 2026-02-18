/**
 * EquityCurveMini - 대시보드용 미니 Equity Curve 차트
 */
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { EquityPoint, AI_INITIAL_SEED } from '@/hooks/useQuantMetrics';

interface EquityCurveMiniProps {
  data: EquityPoint[];
  height?: number;
}

export function EquityCurveMini({ data, height = 120 }: EquityCurveMiniProps) {
  if (data.length < 2) {
    return (
      <div className="flex items-center justify-center text-xs text-muted-foreground" style={{ height }}>
        거래 데이터 대기 중...
      </div>
    );
  }

  const currentAsset = data[data.length - 1]?.asset || AI_INITIAL_SEED;
  const isProfit = currentAsset >= AI_INITIAL_SEED;

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={isProfit ? 'hsl(var(--long))' : 'hsl(var(--short))'} stopOpacity={0.3} />
              <stop offset="95%" stopColor={isProfit ? 'hsl(var(--long))' : 'hsl(var(--short))'} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="date" hide />
          <YAxis hide domain={['auto', 'auto']} />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '6px',
              fontSize: '11px',
            }}
            formatter={(value: number) => [`$${value.toLocaleString()}`, '자산']}
          />
          <ReferenceLine y={AI_INITIAL_SEED} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" strokeOpacity={0.5} />
          <Area
            type="monotone"
            dataKey="asset"
            stroke={isProfit ? 'hsl(var(--long))' : 'hsl(var(--short))'}
            strokeWidth={1.5}
            fill="url(#equityGrad)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
