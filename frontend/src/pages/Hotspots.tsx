import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRightIcon, ChevronDownIcon } from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { DataScope } from '../components/layout/DataScope';
import { FilterBar } from '../components/filters/FilterBar';
import { IntelMap, type MapFocus } from '../components/map/IntelMap';
import { MapPanel } from '../components/map/MapPanel';
import { HotspotList } from '../components/hotspots/HotspotList';
import { HotspotIntelPanel } from '../components/hotspots/HotspotIntelPanel';
import { RankedBars } from '../components/charts/RankedBars';
import { DonutChart } from '../components/charts/DonutChart';
import { Panel } from '../components/ui/Panel';
import { Badge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';
import { ErrorState } from '../components/ui/ErrorState';
import { BarsSkeleton, TableSkeleton } from '../components/ui/Skeleton';
import { useCrimeMap, useHotspots } from '../hooks/useCrimeQueries';
import { useChartPalette } from '../hooks/useChartPalette';
import { useFilters } from '../contexts/FilterContext';
import { useAssistant } from '../contexts/AssistantContext';
import { severityColor } from '../utils/chartTheme';
import { riskTone, TONE_DOT } from '../utils/tones';
import type { Hotspot } from '../types/crime';
import { cn } from '../utils/cn';

const RISK_ORDER = ['Very high', 'High', 'Elevated', 'Moderate'];

export function Hotspots() {
  const hotspots = useHotspots();
  const crimeMap = useCrimeMap();
  const palette = useChartPalette();
  const navigate = useNavigate();
  const { filters, toggleValue } = useFilters();
  const assistant = useAssistant();
  const [selectedArea, setSelectedArea] = useState<string | null>(null);
  const [focus, setFocus] = useState<MapFocus | null>(null);
  const [tableOpen, setTableOpen] = useState(false);

  const list = hotspots.data?.hotspots ?? [];
  const selected = list.find((hotspot) => hotspot.area === selectedArea) ?? null;
  const hasDensity = list.some((hotspot) => hotspot.densityPerSqKm !== null);
  const riskCounts = RISK_ORDER.map((risk) => ({ risk, count: list.filter((hotspot) => hotspot.riskLevel === risk).length }));

  const select = (hotspot: Hotspot) => {
    setSelectedArea(hotspot.area);
    assistant.setSelectedArea(hotspot.area);
    if (hotspot.latitude !== null && hotspot.longitude !== null) setFocus({ latitude: hotspot.latitude, longitude: hotspot.longitude, zoom: 13.6 });
  };

  return (
    <div className="pb-10">
      <PageHeader
        title="Hotspot Intelligence"
        description={
        <>
            Identify areas with high concentrations of recorded incidents. <DataScope meta={hotspots.data?.meta} />
          </>
        }>

        <FilterBar />
      </PageHeader>

      <div className="space-y-4 px-4 sm:px-6">
        {hotspots.isError ?
        <div className="cv-panel">
            <ErrorState error={hotspots.error} onRetry={() => hotspots.refetch()} />
          </div> :

        <div className="cv-panel grid overflow-hidden lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="relative h-[440px] lg:h-[620px]">
              <IntelMap
              incidents={crimeMap.data?.incidents ?? []}
              hotspots={list}
              selectedArea={selectedArea}
              onSelectArea={(area) => {
                const hotspot = list.find((item) => item.area === area);
                if (hotspot) select(hotspot);
              }}
              focus={focus}
              defaultLayers={['hotspots', 'extents', 'heatmap']}
              loading={hotspots.isFetching}
              panel={
              <MapPanel open={Boolean(selected)} panelKey={selected?.area ?? 'none'}>
                    {selected && <HotspotIntelPanel hotspot={selected} topCount={list[0]?.incidentCount ?? 0} onClose={() => setSelectedArea(null)} />}
                  </MapPanel>
              } />

            </div>
            <aside className="flex min-h-0 flex-col border-t border-line lg:border-l lg:border-t-0" aria-label="Hotspot ranking">
              <div className="border-b border-line px-4 py-3.5">
                <h2 className="cv-section-title">Ranking</h2>
                <div className="mt-2 flex h-2 overflow-hidden rounded-full bg-raised" aria-label="Areas by risk level">
                  {riskCounts.map(({ risk, count }) =>
                count ?
                <span
                  key={risk}
                  className={cn('h-full', TONE_DOT[riskTone(risk)])}
                  style={{ width: `${count / Math.max(1, list.length) * 100}%` }}
                  title={`${risk}: ${count}`} /> :

                null
                )}
                </div>
                <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
                  {riskCounts.map(({ risk, count }) =>
                <span key={risk} className="text-2xs text-muted">
                      <span className="font-semibold tabular-nums text-fg">{count}</span> {risk.toLowerCase()}
                    </span>
                )}
                </div>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2 lg:max-h-[540px]">
                {!hotspots.data ? <BarsSkeleton rows={10} /> : list.length === 0 ? <EmptyState /> : <HotspotList hotspots={list} selectedArea={selectedArea} onSelect={select} />}
              </div>
            </aside>
          </div>
        }

        <div className="cv-panel">
          <button
            type="button"
            onClick={() => setTableOpen(!tableOpen)}
            aria-expanded={tableOpen}
            className="cv-focus flex w-full items-center justify-between rounded-xl px-5 py-3.5 text-left">

            <span>
              <span className="cv-section-title block">Full ranking table</span>
              <span className="cv-caption">Every ranked area with share, high-severity count and dominant crime type</span>
            </span>
            <ChevronDownIcon className={cn('h-4 w-4 text-subtle transition-transform duration-200', tableOpen && 'rotate-180')} aria-hidden />
          </button>
          {tableOpen &&
          <div className="overflow-x-auto border-t border-line">
              {!hotspots.data ?
            <div className="px-5">
                  <TableSkeleton />
                </div> :

            <table className="w-full min-w-[720px] text-sm">
                  <thead>
                    <tr className="bg-raised/60 text-left text-xs text-muted">
                      <th scope="col" className="py-2 pl-5 pr-3 font-medium">Rank</th>
                      <th scope="col" className="py-2 pr-3 font-medium">Area</th>
                      <th scope="col" className="py-2 pr-3 text-right font-medium">Incidents</th>
                      <th scope="col" className="py-2 pr-3 text-right font-medium">Share</th>
                      {hasDensity && <th scope="col" className="py-2 pr-3 text-right font-medium">Per km²</th>}
                      <th scope="col" className="py-2 pr-3 text-right font-medium">High / critical</th>
                      <th scope="col" className="py-2 pr-3 font-medium">Dominant crime</th>
                      <th scope="col" className="py-2 pr-3 font-medium">Risk</th>
                      <th scope="col" className="py-2 pr-5" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {list.map((hotspot) =>
                <tr key={hotspot.area} className={cn('transition-colors duration-100 hover:bg-raised/50', hotspot.area === selectedArea && 'bg-primary/5')}>
                        <td className="py-2.5 pl-5 pr-3 font-mono text-xs text-subtle">{hotspot.rank}</td>
                        <td className="py-2.5 pr-3">
                          <button type="button" onClick={() => select(hotspot)} className="cv-focus rounded font-medium text-fg hover:text-primary">
                            {hotspot.area}
                          </button>
                        </td>
                        <td className="py-2.5 pr-3 text-right tabular-nums text-fg">{hotspot.incidentCount.toLocaleString('en-US')}</td>
                        <td className="py-2.5 pr-3 text-right tabular-nums text-muted">{hotspot.sharePct?.toFixed(1)}%</td>
                        {hasDensity && <td className="py-2.5 pr-3 text-right tabular-nums text-muted">{hotspot.densityPerSqKm ?? '—'}</td>}
                        <td className="py-2.5 pr-3 text-right tabular-nums text-muted">{hotspot.highSeverityCount.toLocaleString('en-US')}</td>
                        <td className="py-2.5 pr-3 text-muted">{hotspot.dominantCrimeType ?? '—'}</td>
                        <td className="py-2.5 pr-3">
                          <Badge tone={riskTone(hotspot.riskLevel)} dot>
                            {hotspot.riskLevel}
                          </Badge>
                        </td>
                        <td className="py-2.5 pr-5 text-right">
                          <button
                      type="button"
                      onClick={() => navigate(`/areas?area=${encodeURIComponent(hotspot.area)}`)}
                      aria-label={`Open ${hotspot.area} profile`}
                      className="cv-focus rounded p-1 text-subtle hover:text-primary">

                            <ArrowUpRightIcon className="h-4 w-4" aria-hidden />
                          </button>
                        </td>
                      </tr>
                )}
                  </tbody>
                </table>
            }
            </div>
          }
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Panel title="What drives these hotspots" description="Crime types across all ranked areas · click to filter">
            {!hotspots.data ?
            <BarsSkeleton /> :
            hotspots.data.crimeTypeBreakdown.length === 0 ?
            <EmptyState /> :

            <RankedBars
              ariaLabel="Crime type breakdown"
              data={hotspots.data.crimeTypeBreakdown}
              total={hotspots.data.meta.filtered}
              selected={filters.crimeType}
              onSelect={(label) => toggleValue('crimeType', label)}
              max={8} />

            }
          </Panel>
          <Panel title="Severity mix" description="Click a level to filter">
            {!hotspots.data ?
            <BarsSkeleton rows={4} /> :
            hotspots.data.severityBreakdown.length === 0 ?
            <EmptyState /> :

            <DonutChart
              data={hotspots.data.severityBreakdown}
              colorFor={(label) => severityColor(palette, label)}
              centerLabel="incidents"
              selected={filters.severity}
              onSelect={(label) => toggleValue('severity', label)} />

            }
          </Panel>
        </div>

        <p className="cv-caption px-1">
          Method: areas are ranked by recorded incident count under the active filters (top 15). Risk level compares each area with the busiest one —
          Very high ≥ 75%, High ≥ 50%, Elevated ≥ 30%, otherwise Moderate. Area size is not in the dataset, so density per km² is not shown.
        </p>
      </div>
    </div>);

}