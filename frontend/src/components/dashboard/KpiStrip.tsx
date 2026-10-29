import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowDownRightIcon, ArrowRightIcon, ArrowUpRightIcon, MapPinIcon, MinusIcon, ShieldAlertIcon, TagIcon, TrendingUpIcon } from 'lucide-react';
import { Sparkline } from '../charts/Sparkline';
import { Skeleton } from '../ui/Skeleton';
import { useFilters } from '../../contexts/FilterContext';
import type { Kpi, TimeSeriesPoint } from '../../types/crime';
import { cn } from '../../utils/cn';

interface KpiStripProps {
  kpis?: Kpi[];
  monthly?: TimeSeriesPoint[];
  loading?: boolean;
}

const ICONS: Record<string, React.ElementType> = {
  high_severity: ShieldAlertIcon,
  top_area: MapPinIcon,
  top_crime_type: TagIcon,
  incident_change: TrendingUpIcon
};

export function KpiStrip({ kpis, monthly = [], loading }: KpiStripProps) {
  const navigate = useNavigate();
  const { filters, applyFilters, toggleValue } = useFilters();

  if (loading || !kpis) {
    return (
      <div className="cv-panel grid grid-cols-2 gap-px overflow-hidden bg-line lg:grid-cols-6" role="status" aria-label="Loading indicators">
        <div className="col-span-2 space-y-3 bg-surface p-5">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-9 w-40" />
          <Skeleton className="h-10 w-full" />
        </div>
        {Array.from({ length: 4 }).map((_, index) =>
        <div key={index} className="space-y-2.5 bg-surface p-5">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-3 w-28" />
          </div>
        )}
      </div>);

  }

  const byId = Object.fromEntries(kpis.map((kpi) => [kpi.id, kpi]));
  const total = byId.total_incidents;
  const secondary = ['high_severity', 'incident_change', 'top_area', 'top_crime_type'].map((id) => byId[id]).filter(Boolean) as Kpi[];
  const highActive = filters.severity.includes('High') && filters.severity.includes('Critical');

  const actionFor = (kpi: Kpi): {run: () => void;hint: string;} | null => {
    switch (kpi.id) {
      case 'high_severity':
        return {
          hint: highActive ? 'Remove severity filter' : 'Filter to High + Critical',
          run: () => applyFilters({ severity: highActive ? [] : ['Critical', 'High'] })
        };
      case 'top_area':
        return kpi.value !== '—' ? { hint: 'Open area profile', run: () => navigate(`/areas?area=${encodeURIComponent(String(kpi.value))}`) } : null;
      case 'top_crime_type':
        return kpi.value !== '—' ?
        { hint: filters.crimeType.includes(String(kpi.value)) ? 'Remove filter' : 'Filter to this type', run: () => toggleValue('crimeType', String(kpi.value)) } :
        null;
      case 'incident_change':
        return { hint: 'Open trends', run: () => navigate('/trends') };
      default:
        return null;
    }
  };

  return (
    <motion.section
      aria-label="Key indicators"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
      className="cv-panel grid grid-cols-2 gap-px overflow-hidden bg-line lg:grid-cols-6">

      {total &&
      <button
        type="button"
        onClick={() => navigate('/map')}
        className="cv-focus group col-span-2 flex flex-col bg-surface p-5 text-left transition-colors duration-150 hover:bg-raised/60">

          <div className="flex items-center justify-between">
            <span className="cv-label">{total.label}</span>
            <span className="flex items-center gap-1 text-xs text-subtle transition-colors duration-150 group-hover:text-primary">
              Open map <ArrowRightIcon className="h-3.5 w-3.5" aria-hidden />
            </span>
          </div>
          <span className="mt-1 text-[2.125rem] font-semibold leading-tight tracking-tight tabular-nums text-fg">
            {Number(total.value).toLocaleString('en-US')}
          </span>
          <span className="cv-caption">{total.context}</span>
          {monthly.length > 1 &&
        <div className="mt-3">
              <Sparkline data={monthly} height={40} />
            </div>
        }
        </button>
      }
      {secondary.map((kpi) => {
        const Icon = ICONS[kpi.id] ?? TagIcon;
        const action = actionFor(kpi);
        const isText = typeof kpi.value === 'string' && !/^[+-]?\d/.test(kpi.value);
        return (
          <button
            key={kpi.id}
            type="button"
            disabled={!action}
            onClick={action?.run}
            title={action?.hint}
            className={cn(
              'cv-focus group flex min-w-0 flex-col bg-surface p-4 text-left transition-colors duration-150 sm:p-5',
              action && 'hover:bg-raised/60',
              kpi.id === 'high_severity' && highActive && 'bg-primary/5'
            )}>

            <span className="flex items-center gap-1.5">
              <Icon className={cn('h-3.5 w-3.5', kpi.tone === 'alert' ? 'text-orange' : 'text-subtle')} aria-hidden />
              <span className="cv-label truncate">{kpi.label}</span>
            </span>
            <span className={cn('mt-2 truncate font-semibold tracking-tight text-fg', isText ? 'text-lg' : 'cv-kpi')}>
              {typeof kpi.value === 'number' ? kpi.value.toLocaleString('en-US') : kpi.value}
            </span>
            <span className="mt-auto flex items-center gap-1 pt-1">
              {kpi.trend && <TrendGlyph direction={kpi.trend.direction} positive={kpi.trend.isPositive} />}
              <span className="cv-caption truncate">{kpi.context}</span>
            </span>
            {action && <span className="mt-1.5 text-2xs font-medium text-primary opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100">{action.hint} →</span>}
          </button>);

      })}
    </motion.section>);

}

function TrendGlyph({ direction, positive }: {direction: 'up' | 'down' | 'flat';positive: boolean;}) {
  const Icon = direction === 'up' ? ArrowUpRightIcon : direction === 'down' ? ArrowDownRightIcon : MinusIcon;
  return <Icon className={cn('h-3.5 w-3.5 shrink-0', direction === 'flat' ? 'text-subtle' : positive ? 'text-emerald' : 'text-orange')} aria-hidden />;
}