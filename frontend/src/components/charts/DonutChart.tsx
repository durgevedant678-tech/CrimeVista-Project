import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { useChartPalette } from '../../hooks/useChartPalette';
import { ChartTooltip } from './ChartTooltip';
import type { CategoryCount } from '../../types/crime';
import { cn } from '../../utils/cn';

interface DonutChartProps {
  data: CategoryCount[];
  colorFor: (label: string) => string;
  centerLabel: string;
  onSelect?: (label: string) => void;
  selected?: string[];
  size?: number;
}

export function DonutChart({ data, colorFor, centerLabel, onSelect, selected = [], size = 168 }: DonutChartProps) {
  const p = useChartPalette();
  const total = data.reduce((sum, item) => sum + item.count, 0);
  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="count"
              nameKey="label"
              innerRadius="70%"
              outerRadius="100%"
              paddingAngle={1.5}
              stroke={p.surface}
              strokeWidth={2}
              animationDuration={500}
              onClick={(entry: {label?: string;}) => entry.label && onSelect?.(entry.label)}
              className={onSelect ? 'cursor-pointer' : undefined}>

              {data.map((item) =>
              <Cell key={item.label} fill={colorFor(item.label)} opacity={selected.length && !selected.includes(item.label) ? 0.35 : 1} />
              )}
            </Pie>
            <Tooltip content={<ChartTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-semibold tabular-nums text-fg">{total.toLocaleString('en-US')}</span>
          <span className="cv-caption">{centerLabel}</span>
        </div>
      </div>
      <ul className="w-full min-w-0 flex-1 space-y-0.5">
        {data.map((item) => {
          const share = total ? item.count / total * 100 : 0;
          const isSelected = selected.includes(item.label);
          const content =
          <>
              <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: colorFor(item.label) }} aria-hidden />
              <span className={cn('flex-1 truncate text-left', isSelected ? 'font-medium text-fg' : 'text-muted')}>{item.label}</span>
              <span className="tabular-nums text-fg">{item.count.toLocaleString('en-US')}</span>
              <span className="w-12 text-right text-xs tabular-nums text-subtle">{share.toFixed(1)}%</span>
            </>;

          return (
            <li key={item.label}>
              {onSelect ?
              <button
                type="button"
                onClick={() => onSelect(item.label)}
                aria-pressed={isSelected}
                className={cn(
                  'cv-focus flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors duration-150 hover:bg-raised',
                  isSelected && 'bg-primary/5'
                )}>

                  {content}
                </button> :

              <div className="flex items-center gap-2.5 px-2 py-1.5 text-sm">{content}</div>
              }
            </li>);

        })}
      </ul>
    </div>);

}