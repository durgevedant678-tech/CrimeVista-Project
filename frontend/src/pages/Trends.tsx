import { useMemo, useState } from 'react';
import { ArrowDownRightIcon, ArrowUpRightIcon, MinusIcon, BarChart3Icon, LineChartIcon } from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { DataScope } from '../components/layout/DataScope';
import { FilterBar } from '../components/filters/FilterBar';
import { TrendChart } from '../components/charts/TrendChart';
import { MultiSeriesChart } from '../components/charts/MultiSeriesChart';
import { SeasonalityChart } from '../components/charts/SeasonalityChart';
import { RankedBars } from '../components/charts/RankedBars';
import { Panel } from '../components/ui/Panel';
import { Segmented } from '../components/ui/Segmented';
import { EmptyState } from '../components/ui/EmptyState';
import { ErrorState } from '../components/ui/ErrorState';
import { BarsSkeleton, ChartSkeleton, Skeleton } from '../components/ui/Skeleton';
import { useTrends } from '../hooks/useCrimeQueries';
import { useFilters } from '../contexts/FilterContext';
import { buildObservations, seasonality } from '../utils/trendInsights';
import { formatSignedPct, lastDayOfMonth } from '../utils/format';
import { cn } from '../utils/cn';

type Dimension = 'crimeType' | 'severity' | 'area';

export function Trends() {
  const trends = useTrends();
  const { filters, toggleValue, setDateRange } = useFilters();
  const [dimension, setDimension] = useState<Dimension>('crimeType');
  const [chartType, setChartType] = useState<'line' | 'stacked'>('line');
  const data = trends.data;
  const empty = data && data.meta.filtered === 0;

  const seasonal = useMemo(() => data ? seasonality(data.monthly) : [], [data]);
  const observations = useMemo(
    () => data ? buildObservations(data.monthly, data.crimeTypeTrend, data.timeOfDay, data.comparison) : [],
    [data]
  );
  const series = data ? { crimeType: data.crimeTypeTrend, severity: data.severityTrend, area: data.areaTrend }[dimension] : null;
  const yearsCovered = new Set((data?.monthly ?? []).map((point) => point.date.slice(0, 4))).size;

  if (trends.isError) {
    return (
      <div className="p-6">
        <div className="cv-panel">
          <ErrorState error={trends.error} onRetry={() => trends.refetch()} />
        </div>
      </div>);

  }

  return (
    <div className="pb-10">
      <PageHeader title="Crime Trends" description={<DataScope meta={data?.meta} />}>
        <FilterBar />
      </PageHeader>

      <div className="space-y-4 px-4 sm:px-6">
        <ComparisonStrip comparison={data?.comparison ?? null} loading={!data} />

        <Panel title="Incident activity over time" description="Monthly recorded incidents · click a month to focus on it">
          {!data ? <ChartSkeleton height={320} /> : empty ? <EmptyState /> : <TrendChart data={data.monthly} height={320} showAverage onSelectMonth={(month) => setDateRange(month, lastDayOfMonth(month))} />}
        </Panel>

        <div className="grid gap-4 lg:grid-cols-12">
          <Panel
            title="Category comparison"
            description="Top series by volume, month by month"
            className="lg:col-span-8"
            actions={
            <Segmented
              label="Chart type"
              value={chartType}
              onChange={setChartType}
              options={[
              { value: 'line', label: 'Lines', icon: <LineChartIcon className="h-3.5 w-3.5" /> },
              { value: 'stacked', label: 'Stacked', icon: <BarChart3Icon className="h-3.5 w-3.5" /> }]
              } />

            }>

            <Segmented
              label="Compare by"
              value={dimension}
              onChange={setDimension}
              className="mb-3"
              options={[
              { value: 'crimeType', label: 'Crime type' },
              { value: 'severity', label: 'Severity' },
              { value: 'area', label: 'Area' }]
              } />

            {!series ? <ChartSkeleton height={300} /> : series.keys.length === 0 ? <EmptyState /> : <MultiSeriesChart series={series} type={chartType} colorBySeverity={dimension === 'severity'} />}
          </Panel>

          <Panel
            title="Key observations"
            description="Calculated from the trend data shown"
            info="Each statement is computed directly from the monthly series on this page — period comparison, peak month, largest 3-month shift, and peak time of day."
            className="lg:col-span-4">

            {!data ?
            <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, index) =>
              <div key={index} className="space-y-1.5">
                    <Skeleton className="h-3.5 w-3/4" />
                    <Skeleton className="h-3 w-full" />
                  </div>
              )}
              </div> :
            observations.length === 0 ?
            <EmptyState /> :

            <ol className="space-y-4">
                {observations.map((observation) =>
              <li key={observation.title} className="flex gap-3">
                    <span
                  className={cn(
                    'mt-1.5 h-2 w-2 shrink-0 rounded-full',
                    observation.tone === 'up' ? 'bg-orange' : observation.tone === 'down' ? 'bg-emerald' : 'bg-primary'
                  )}
                  aria-hidden />

                    <div>
                      <p className="text-sm font-medium text-fg">{observation.title}</p>
                      <p className="cv-caption mt-0.5 leading-relaxed">{observation.detail}</p>
                    </div>
                  </li>
              )}
              </ol>
            }
          </Panel>
        </div>

        <div className="grid gap-4 lg:grid-cols-12">
          <Panel
            title="Seasonality"
            description={yearsCovered ? `Average incidents per calendar month across ${yearsCovered} ${yearsCovered === 1 ? 'year' : 'years'} of data` : 'Average per calendar month'}
            className="lg:col-span-7">

            {!data ? <ChartSkeleton height={240} /> : empty ? <EmptyState /> : <SeasonalityChart data={seasonal} />}
          </Panel>
          <Panel title="Time of day" description="Click a period to filter" className="lg:col-span-5">
            {!data ?
            <BarsSkeleton rows={4} /> :
            empty ?
            <EmptyState /> :

            <RankedBars ariaLabel="Incidents by time of day" data={data.timeOfDay} selected={filters.timePeriod} onSelect={(label) => toggleValue('timePeriod', label)} />
            }
          </Panel>
        </div>
      </div>
    </div>);

}

function ComparisonStrip({ comparison, loading }: {comparison: {currentLabel: string;previousLabel: string;currentCount: number;previousCount: number;changePct: number | null;} | null;loading: boolean;}) {
  if (loading) {
    return (
      <div className="cv-panel grid gap-px overflow-hidden bg-line sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) =>
        <div key={index} className="space-y-2 bg-surface p-5">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-7 w-20" />
            <Skeleton className="h-3 w-36" />
          </div>
        )}
      </div>);

  }
  if (!comparison) return null;
  const change = comparison.changePct;
  const Icon = change === null || Math.abs(change) < 0.5 ? MinusIcon : change > 0 ? ArrowUpRightIcon : ArrowDownRightIcon;
  return (
    <section aria-label="90-day comparison" className="cv-panel grid gap-px overflow-hidden bg-line sm:grid-cols-3">
      <div className="bg-surface p-5">
        <p className="cv-label">Latest 90 days</p>
        <p className="cv-kpi mt-1">{comparison.currentCount.toLocaleString('en-US')}</p>
        <p className="cv-caption">{comparison.currentLabel}</p>
      </div>
      <div className="bg-surface p-5">
        <p className="cv-label">Previous 90 days</p>
        <p className="cv-kpi mt-1 text-muted">{comparison.previousCount.toLocaleString('en-US')}</p>
        <p className="cv-caption">{comparison.previousLabel}</p>
      </div>
      <div className="bg-surface p-5">
        <p className="cv-label">Change</p>
        <p className={cn('cv-kpi mt-1 flex items-center gap-1', change === null ? 'text-muted' : change > 0 ? 'text-orange' : 'text-emerald')}>
          <Icon className="h-5 w-5" aria-hidden />
          {formatSignedPct(change)}
        </p>
        <p className="cv-caption">{change === null ? 'No prior-period data' : change > 0 ? 'More incidents than the prior period' : 'Fewer incidents than the prior period'}</p>
      </div>
    </section>);

}