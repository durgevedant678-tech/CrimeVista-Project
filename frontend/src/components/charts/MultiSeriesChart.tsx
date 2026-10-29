import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useChartPalette } from '../../hooks/useChartPalette';
import { ChartTooltip } from './ChartTooltip';
import { formatMonth, formatMonthShort } from '../../utils/format';
import { severityColor } from '../../utils/chartTheme';
import type { MultiSeries } from '../../types/crime';

interface MultiSeriesChartProps {
  series: MultiSeries;
  type: 'line' | 'stacked';
  height?: number;
  colorBySeverity?: boolean;
}

export function MultiSeriesChart({ series, type, height = 300, colorBySeverity }: MultiSeriesChartProps) {
  const p = useChartPalette();
  const colorFor = (key: string, index: number) => colorBySeverity ? severityColor(p, key) : p.series[index % p.series.length];
  const common = {
    data: series.points,
    margin: { top: 8, right: 8, bottom: 0, left: -12 }
  };
  const axes =
  <>
      <CartesianGrid stroke={p.grid} vertical={false} />
      <XAxis dataKey="period" tickFormatter={formatMonthShort} tick={{ fill: p.axis, fontSize: 11 }} axisLine={false} tickLine={false} minTickGap={28} />
      <YAxis tick={{ fill: p.axis, fontSize: 11 }} axisLine={false} tickLine={false} width={48} allowDecimals={false} />
      <Tooltip content={<ChartTooltip labelFormatter={formatMonth} />} cursor={type === 'stacked' ? { fill: p.grid, opacity: 0.5 } : { stroke: p.axis, strokeDasharray: '3 3' }} />
      <Legend
      iconType="circle"
      iconSize={8}
      wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
      formatter={(value) => <span style={{ color: p.muted }}>{value}</span>} />

    </>;


  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        {type === 'line' ?
        <LineChart {...common}>
            {axes}
            {series.keys.map((key, index) =>
          <Line
            key={key}
            type="monotone"
            dataKey={key}
            stroke={colorFor(key, index)}
            strokeWidth={index === 0 ? 2.25 : 1.5}
            dot={false}
            activeDot={{ r: 3.5 }}
            animationDuration={500} />

          )}
          </LineChart> :

        <BarChart {...common}>
            {axes}
            {series.keys.map((key, index) =>
          <Bar key={key} dataKey={key} stackId="a" fill={colorFor(key, index)} animationDuration={500} maxBarSize={22} />
          )}
          </BarChart>
        }
      </ResponsiveContainer>
    </div>);

}