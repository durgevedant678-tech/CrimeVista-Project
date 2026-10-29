import { Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useChartPalette } from '../../hooks/useChartPalette';
import { ChartTooltip } from './ChartTooltip';
import { formatMonth, formatMonthShort } from '../../utils/format';
import type { TimeSeriesPoint } from '../../types/crime';

interface TrendChartProps {
  data: TimeSeriesPoint[];
  height?: number;
  onSelectMonth?: (month: string) => void;
  highlightMonth?: string | null;
  showAverage?: boolean;
}

export function TrendChart({ data, height = 260, onSelectMonth, highlightMonth, showAverage }: TrendChartProps) {
  const p = useChartPalette();
  const average = data.length ? data.reduce((sum, point) => sum + point.count, 0) / data.length : 0;
  return (
    <div style={{ height }} className={onSelectMonth ? 'cursor-pointer' : undefined}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 8, right: 8, bottom: 0, left: -12 }}
          onClick={(state) => {
            const label = (state as {activeLabel?: string;} | null)?.activeLabel;
            if (label && onSelectMonth) onSelectMonth(label);
          }}>

          <CartesianGrid stroke={p.grid} vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={formatMonthShort}
            tick={{ fill: p.axis, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            minTickGap={28} />

          <YAxis tick={{ fill: p.axis, fontSize: 11 }} axisLine={false} tickLine={false} width={48} allowDecimals={false} />
          <Tooltip content={<ChartTooltip labelFormatter={formatMonth} />} cursor={{ stroke: p.axis, strokeDasharray: '3 3' }} />
          {showAverage && average > 0 &&
          <ReferenceLine y={average} stroke={p.axis} strokeDasharray="4 4" label={{ value: 'Avg', fill: p.axis, fontSize: 10, position: 'insideTopRight' }} />
          }
          {highlightMonth && <ReferenceLine x={highlightMonth} stroke={p.primary} strokeWidth={1.5} />}
          <Area
            type="monotone"
            dataKey="count"
            stroke={p.primary}
            strokeWidth={2}
            fill={p.primary}
            fillOpacity={0.1}
            activeDot={{ r: 4, strokeWidth: 2, stroke: p.surface }}
            animationDuration={500}
            animationEasing="ease-out" />

        </AreaChart>
      </ResponsiveContainer>
    </div>);

}