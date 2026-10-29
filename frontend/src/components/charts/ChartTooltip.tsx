
interface TooltipEntry {
  name?: string | number;
  value?: number | string;
  color?: string;
  dataKey?: string | number;
}

interface ChartTooltipProps {
  active?: boolean;
  label?: string | number;
  payload?: TooltipEntry[];
  labelFormatter?: (label: string) => string;
  unit?: string;
}

export function ChartTooltip({ active, label, payload, labelFormatter, unit = 'incidents' }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  const rows = [...payload].sort((a, b) => Number(b.value) - Number(a.value));
  return (
    <div className="min-w-[160px] rounded-lg border border-line bg-surface px-3 py-2 text-xs shadow-pop">
      {label !== undefined && <p className="mb-1.5 font-medium text-fg">{labelFormatter ? labelFormatter(String(label)) : label}</p>}
      <div className="space-y-1">
        {rows.map((entry) =>
        <div key={String(entry.dataKey ?? entry.name)} className="flex items-center gap-2">
            <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: entry.color }} aria-hidden />
            <span className="flex-1 truncate text-muted">{rows.length > 1 ? entry.name : unit}</span>
            <span className="font-medium tabular-nums text-fg">{Number(entry.value).toLocaleString('en-US')}</span>
          </div>
        )}
      </div>
    </div>);

}