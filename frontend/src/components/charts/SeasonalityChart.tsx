import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useChartPalette } from '../../hooks/useChartPalette';
import type { SeasonalPoint } from '../../utils/trendInsights';

export function SeasonalityChart({ data, height = 240 }: {data: SeasonalPoint[];height?: number;}) {
  const p = useChartPalette();
  const max = Math.max(...data.map((point) => point.average));
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
          <CartesianGrid stroke={p.grid} vertical={false} />
          <XAxis dataKey="month" tick={{ fill: p.axis, fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: p.axis, fontSize: 11 }} axisLine={false} tickLine={false} width={48} allowDecimals={false} />
          <Tooltip
            cursor={{ fill: p.grid, opacity: 0.5 }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const point = payload[0].payload as SeasonalPoint;
              return (
                <div className="rounded-lg border border-line bg-surface px-3 py-2 text-xs shadow-pop">
                  <p className="font-medium text-fg">{point.month}</p>
                  <p className="text-muted">
                    <span className="font-medium tabular-nums text-fg">{point.average.toLocaleString('en-US')}</span> avg incidents · {point.years}{' '}
                    {point.years === 1 ? 'year' : 'years'}
                  </p>
                </div>);

            }} />

          <Bar dataKey="average" radius={[3, 3, 0, 0]} maxBarSize={28} animationDuration={500}>
            {data.map((point) =>
            <Cell key={point.month} fill={point.average === max ? p.primary : `${p.primary}66`} />
            )}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>);

}