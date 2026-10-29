import { useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FilterIcon, MapIcon, SparklesIcon, MapPinOffIcon, ArrowDownRightIcon, ArrowUpRightIcon, MinusIcon } from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { FilterBar } from '../components/filters/FilterBar';
import { AreaPicker } from '../components/areas/AreaPicker';
import { IntelMap } from '../components/map/IntelMap';
import { TrendChart } from '../components/charts/TrendChart';
import { RankedBars } from '../components/charts/RankedBars';
import { DonutChart } from '../components/charts/DonutChart';
import { Panel } from '../components/ui/Panel';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { ErrorState } from '../components/ui/ErrorState';
import { BarsSkeleton, ChartSkeleton, Skeleton } from '../components/ui/Skeleton';
import { useAreaProfile, useCrimeMap, useFilterOptions, useHotspots } from '../hooks/useCrimeQueries';
import { useChartPalette } from '../hooks/useChartPalette';
import { useFilters } from '../contexts/FilterContext';
import { useAssistant } from '../contexts/AssistantContext';
import { severityColor } from '../utils/chartTheme';
import { riskTone } from '../utils/tones';
import { cn } from '../utils/cn';

export function Areas() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const palette = useChartPalette();
  const { filters, applyFilters } = useFilters();
  const assistant = useAssistant();
  const options = useFilterOptions();
  const cityFilters = useMemo(() => ({ ...filters, area: [] }), [filters]);
  const hotspots = useHotspots(cityFilters);
  const crimeMap = useCrimeMap();

  const hotspotList = hotspots.data?.hotspots ?? [];
  const area = params.get('area') ?? hotspotList[0]?.area ?? options.data?.areas[0] ?? null;
  const profile = useAreaProfile(area);
  const hotspot = hotspotList.find((item) => item.area === area) ?? null;
  const data = profile.data;
  const cityTotal = hotspots.data?.meta.filtered ?? 0;

  useEffect(() => {
    assistant.setSelectedArea(area);
  }, [area, assistant]);

  const selectArea = (next: string) => setParams({ area: next });
  const focus = useMemo(
    () => data?.location ? { latitude: data.location.latitude, longitude: data.location.longitude, zoom: 13.2 } : null,
    [data?.location]
  );
  const notFound = (profile.error as {status?: number;} | null)?.status === 404;
  const empty = data && data.totalIncidents === 0;
  const kpis = data?.kpis ?? [];
  const change = kpis.find((kpi) => kpi.id === 'incident_change');

  return (
    <div className="pb-10">
      <PageHeader title="Area Explorer" description="Explore an area and compare it with others in the dataset">
        <FilterBar exclude={['area']} />
      </PageHeader>

      <div className="grid gap-4 px-4 sm:px-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="cv-panel hidden overflow-hidden lg:block lg:h-[calc(100vh-196px)] lg:sticky lg:top-4" aria-label="Choose an area">
          <AreaPicker areas={options.data?.areas ?? []} hotspots={hotspotList} selected={area} onSelect={selectArea} loading={!hotspots.data} />
        </aside>

        <div className="min-w-0 space-y-4">
          <label className="block lg:hidden">
            <span className="cv-label">Area</span>
            <select value={area ?? ''} onChange={(event) => selectArea(event.target.value)} className="cv-input mt-1 h-10">
              {(options.data?.areas ?? []).map((name) =>
              <option key={name} value={name}>
                  {name}
                </option>
              )}
            </select>
          </label>

          {notFound ?
          <div className="cv-panel">
              <EmptyState icon={<MapPinOffIcon className="h-5 w-5" />} title={`“${area}” isn’t in the active dataset`} description="Choose another area from the list." showClearFilters={false} />
            </div> :
          profile.isError ?
          <div className="cv-panel">
              <ErrorState error={profile.error} onRetry={() => profile.refetch()} />
            </div> :

          <>
              <section className="cv-panel grid overflow-hidden xl:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]" aria-label="Area summary">
                <div className="flex flex-col p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    {hotspot && <span className="cv-meta">RANK #{hotspot.rank} OF {hotspotList.length}</span>}
                    {hotspot &&
                  <Badge tone={riskTone(hotspot.riskLevel)} dot>
                        {hotspot.riskLevel} risk
                      </Badge>
                  }
                  </div>
                  <h2 className="mt-1.5 text-2xl font-semibold tracking-tight text-fg">{area ?? '—'}</h2>
                  {!data ?
                <div className="mt-4 space-y-2">
                      <Skeleton className="h-9 w-32" />
                      <Skeleton className="h-3 w-48" />
                    </div> :

                <div className="mt-4 flex items-end gap-6">
                      <div>
                        <p className="cv-label">Incidents</p>
                        <p className="text-[2rem] font-semibold leading-tight tabular-nums text-fg">{data.totalIncidents.toLocaleString('en-US')}</p>
                      </div>
                      {cityTotal > 0 &&
                  <div className="pb-1.5">
                          <p className="cv-label">Share of city</p>
                          <p className="text-lg font-semibold tabular-nums text-fg">{(data.totalIncidents / cityTotal * 100).toFixed(1)}%</p>
                        </div>
                  }
                    </div>
                }

                  <dl className="mt-5 grid grid-cols-1 gap-3 border-t border-line pt-4 sm:grid-cols-3">
                    {!data ?
                  Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-10" />) :
                  kpis.map((kpi) =>
                  <div key={kpi.id} className="min-w-0">
                            <dt className="cv-label truncate">{kpi.label}</dt>
                            <dd className="mt-0.5 flex items-center gap-1 truncate text-sm font-semibold text-fg">
                              {kpi.id === 'incident_change' && change?.trend &&
                      <TrendIcon direction={change.trend.direction} positive={change.trend.isPositive} />
                      }
                              {typeof kpi.value === 'number' ? kpi.value.toLocaleString('en-US') : kpi.value}
                            </dd>
                            <dd className="cv-caption truncate">{kpi.context}</dd>
                          </div>
                  )}
                  </dl>

                  <div className="mt-auto flex flex-wrap gap-2 pt-5">
                    <Button size="sm" variant="primary" onClick={() => navigate(`/map?area=${encodeURIComponent(area ?? '')}`)} leadingIcon={<MapIcon className="h-3.5 w-3.5" />}>
                      Investigate on map
                    </Button>
                    <Button size="sm" onClick={() => area && applyFilters({ area: [area] })} leadingIcon={<FilterIcon className="h-3.5 w-3.5" />} disabled={filters.area.length === 1 && filters.area[0] === area}>
                      Focus all views
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => assistant.open('How do I compare this area to the city?')} leadingIcon={<SparklesIcon className="h-3.5 w-3.5" />}>
                      Ask AI
                    </Button>
                  </div>
                </div>
                <div className="relative h-[300px] border-t border-line xl:h-auto xl:min-h-[360px] xl:border-l xl:border-t-0">
                  <IntelMap
                  variant="embedded"
                  incidents={crimeMap.data?.incidents ?? []}
                  hotspots={hotspotList}
                  selectedArea={area}
                  onSelectArea={selectArea}
                  focus={focus}
                  defaultLayers={['hotspots', 'extents']}
                  legendOpen={false} />

                </div>
              </section>

              <Panel title="Monthly incidents" description={`Recorded incidents in ${area ?? 'this area'} per month`}>
                {!data ? <ChartSkeleton height={240} /> : empty ? <EmptyState /> : <TrendChart data={data.monthly} height={240} showAverage />}
              </Panel>

              <div className="grid gap-4 xl:grid-cols-2">
                <Panel title="Crime types" description="What is recorded here">
                  {!data ? <BarsSkeleton /> : empty ? <EmptyState /> : <RankedBars ariaLabel="Crime types in area" data={data.crimeTypes} total={data.totalIncidents} max={8} />}
                </Panel>
                <Panel title="Severity" description="How serious incidents are">
                  {!data ?
                <BarsSkeleton rows={4} /> :
                empty ?
                <EmptyState /> :

                <DonutChart data={data.severity} colorFor={(label) => severityColor(palette, label)} centerLabel="incidents" />
                }
                </Panel>
              </div>

              <div className="grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
                <Panel title="Compared with other areas" description="Incident count, top areas under current filters · click to switch">
                  {!data ?
                <BarsSkeleton rows={8} /> :

                <RankedBars ariaLabel="Area comparison" data={data.areaComparison} highlight={area} onSelect={selectArea} total={cityTotal || undefined} />
                }
                </Panel>
                <Panel title="Time of day" description="When incidents happen here">
                  {!data ? <BarsSkeleton rows={4} /> : empty ? <EmptyState /> : <RankedBars ariaLabel="Time of day in area" data={data.timeOfDay} total={data.totalIncidents} />}
                </Panel>
              </div>
            </>
          }
        </div>
      </div>
    </div>);

}

function TrendIcon({ direction, positive }: {direction: 'up' | 'down' | 'flat';positive: boolean;}) {
  const Icon = direction === 'up' ? ArrowUpRightIcon : direction === 'down' ? ArrowDownRightIcon : MinusIcon;
  return <Icon className={cn('h-3.5 w-3.5', direction === 'flat' ? 'text-subtle' : positive ? 'text-emerald' : 'text-orange')} aria-hidden />;
}