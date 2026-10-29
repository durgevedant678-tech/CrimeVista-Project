import { Area, AreaChart, ResponsiveContainer } from 'recharts';
import { useChartPalette } from '../../hooks/useChartPalette';
import type { TimeSeriesPoint } from '../../types/crime';

export function Sparkline({ data, height = 44 }: {data: TimeSeriesPoint[];height?: number;}) {
  const p = useChartPalette();
  return (
    <div style={{ height }} aria-hidden>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
          <Area type="monotone" dataKey="count" stroke={p.primary} strokeWidth={1.5} fill={p.primary} fillOpacity={0.12} isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>);

}