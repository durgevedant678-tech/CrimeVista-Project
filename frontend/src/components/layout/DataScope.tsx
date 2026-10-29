import { useFilters } from '../../contexts/FilterContext';
import type { DataMeta } from '../../types/crime';
import { formatNumber } from '../../utils/format';

/** One-line statement of what data the page is showing. */
export function DataScope({ meta, suffix }: {meta?: DataMeta;suffix?: string;}) {
  const { activeCount } = useFilters();
  if (!meta) return <span className="text-subtle">Loading records…</span>;
  return (
    <span>
      <span className="font-medium tabular-nums text-fg">{formatNumber(meta.filtered)}</span>
      {activeCount > 0 ? <> of {formatNumber(meta.total)} records match your filters</> : <> recorded incidents in the selected dataset</>}
      {suffix && <span className="text-subtle"> · {suffix}</span>}
    </span>);

}