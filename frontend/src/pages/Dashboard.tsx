import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRightIcon } from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { DataScope } from '../components/layout/DataScope';
import { FilterBar } from '../components/filters/FilterBar';
import { KpiStrip } from '../components/dashboard/KpiStrip';
import { InsightList } from '../components/dashboard/InsightList';
import { IntelMap, type MapFocus } from '../components/map/IntelMap';
import { MapPanel } from '../components/map/MapPanel';
import { HotspotList } from '../components/hotspots/HotspotList';
import { HotspotIntelPanel } from '../components/hotspots/HotspotIntelPanel';
import { IncidentPanel } from '../components/incidents/IncidentPanel';
import { IncidentTable } from '../components/incidents/IncidentTable';
import { TrendChart } from '../components/charts/TrendChart';
import { DonutChart } from '../components/charts/DonutChart';
import { RankedBars } from '../components/charts/RankedBars';
import { Panel } from '../components/ui/Panel';
import { EmptyState } from '../components/ui/EmptyState';
import { ErrorState } from '../components/ui/ErrorState';
import { BarsSkeleton, ChartSkeleton } from '../components/ui/Skeleton';
import { useCrimeMap, useDashboard, useFilterOptions, useHotspots } from '../hooks/useCrimeQueries';
import { useChartPalette } from '../hooks/useChartPalette';
import { useFilters } from '../contexts/FilterContext';
import { useAssistant } from '../contexts/AssistantContext';
import { severityColor } from '../utils/chartTheme';
import { formatDate, lastDayOfMonth } from '../utils/format';
import type { Hotspot, MapIncident } from '../types/crime';

export function Dashboard() {
  const dashboard = useDashboard();
  const hotspots = useHotspots();
  const crimeMap = useCrimeMap();
  const options = useFilterOptions();
  const palette = useChartPalette();
  const { filters, toggleValue, setDateRange } = useFilters();
  const assistant = useAssistant();

  const [selectedArea, setSelectedArea] = useState<string | null>(null);
  const [selectedIncident, setSelectedIncident] = useState<MapIncident | null>(null);
  const [focus, setFocus] = useState<MapFocus | null>(null);

  const hotspotList = hotspots.data?.hotspots ?? [];
  const selectedHotspot = hotspotList.find((hotspot) => hotspot.area === selectedArea) ?? null;
  const highRiskCount = hotspotList.filter((hotspot) => hotspot.riskLevel === 'Very high' || hotspot.riskLevel === 'High').length;
  const data = dashboard.data;
  const empty = data && data.meta.filtered === 0;

  const selectHotspot = (hotspot: Hotspot) => {
    setSelectedIncident(null);
    setSelectedArea(hotspot.area);
    assistant.setSelectedArea(hotspot.area);
    if (hotspot.latitude !== null && hotspot.longitude !== null) setFocus({ latitude: hotspot.latitude, longitude: hotspot.longitude, zoom: 13.2 });
  };
  const selectArea = (area: string) => {
    const hotspot = hotspotList.find((item) => item.area === area);
    if (hotspot) selectHotspot(hotspot);
  };

  const monthFocus = filters.startDate && filters.endDate && filters.startDate.endsWith('-01') && lastDayOfMonth(filters.startDate) === filters.endDate ? filters.startDate : null;

  const plottedNote = useMemo(() => {
    if (!crimeMap.data) return '';
    const plotted = crimeMap.data.incidents.length;
    return `${plotted.toLocaleString('en-US')} incidents plotted${plotted >= 3000 ? ' (server limit)' : ''}`;
  }, [crimeMap.data]);

  return (
    <div className="pb-10">
      <PageHeader
        title="Urban Crime Intelligence"
        description={<DataScope meta={data?.meta} suffix={options.data?.dateRange.max ? `data through ${formatDate(options.data.dateRange.max)}` : undefined} />}>

        <FilterBar />
      </PageHeader>

      <div className="space-y-4 px-4 sm:px-6">
        {dashboard.isError ?
        <div className="cv-panel">
            <ErrorState error={dashboard.error} onRetry={() => dashboard.refetch()} />
          </div> :

        <KpiStrip kpis={data?.kpis} monthly={data?.monthly} loading={dashboard.isLoading} />
        }

        <div className="grid gap-4 lg:grid-cols-12">
          <section className="cv-panel flex flex-col overflow-hidden lg:col-span-8" aria-labelledby="geo-title">
            <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 sm:px-5">
              <div>
                <h2 id="geo-title" className="cv-section-title">
                  Geographic intelligence
                </h2>
                <p className="cv-caption">{plottedNote || 'Plotting incidents…'} · heat weighted by severity</p>
              </div>
              <Link to="/map" className="cv-focus inline-flex items-center gap-1 rounded text-xs font-medium text-primary">
                Open Crime Map <ArrowRightIcon className="h-3.5 w-3.5" aria-hidden />
              </Link>
            </div>
            <div className="relative h-[420px] border-t border-line lg:h-[500px]">
              <IntelMap
                incidents={crimeMap.data?.incidents ?? []}
                hotspots={hotspotList}
                selectedArea={selectedArea}
                selectedIncidentId={selectedIncident?.id ?? null}
                onSelectArea={selectArea}
                onSelectIncident={(incident) => {
                  setSelectedArea(null);
                  setSelectedIncident(incident);
                }}
                focus={focus}
                loading={crimeMap.isFetching}
                legendOpen={false}
                panel={
                <MapPanel open={Boolean(selectedHotspot || selectedIncident)} panelKey={selectedHotspot?.area ?? selectedIncident?.id ?? 'none'}>
                    {selectedHotspot &&
                  <HotspotIntelPanel hotspot={selectedHotspot} topCount={hotspotList[0]?.incidentCount ?? 0} onClose={() => setSelectedArea(null)} />
                  }
                    {selectedIncident && !selectedHotspot && <IncidentPanel incident={selectedIncident} onClose={() => setSelectedIncident(null)} />}
                  </MapPanel>
                } />

            </div>
          </section>

          <Panel
            title="Top hotspots"
            description={hotspots.data ? `${highRiskCount} of ${hotspotList.length} areas at High or Very high risk` : 'Ranking areas…'}
            info="Areas ranked by incident count under your filters. Risk level is relative to the busiest area."
            className="lg:col-span-4"
            actions={
            <Link to="/hotspots" className="cv-focus inline-flex items-center gap-1 rounded text-xs font-medium text-primary">
                All <ArrowRightIcon className="h-3.5 w-3.5" aria-hidden />
              </Link>
            }
            bodyClassName="px-2 sm:px-3">

            {hotspots.isError ?
            <ErrorState error={hotspots.error} onRetry={() => hotspots.refetch()} compact /> :
            !hotspots.data ?
            <BarsSkeleton rows={8} /> :
            hotspotList.length === 0 ?
            <EmptyState /> :

            <HotspotList hotspots={hotspotList} selectedArea={selectedArea} onSelect={selectHotspot} limit={8} />
            }
          </Panel>
        </div>

        <div className="grid gap-4 lg:grid-cols-12">
          <Panel
            title="Incident activity"
            description="Monthly recorded incidents · click a month to focus every view on it"
            className="lg:col-span-8"
            actions={
            monthFocus ?
            <button type="button" onClick={() => setDateRange(null, null)} className="cv-focus rounded text-xs font-medium text-primary">
                  Show all months
                </button> :

            <Link to="/trends" className="cv-focus inline-flex items-center gap-1 rounded text-xs font-medium text-primary">
                  Trends <ArrowRightIcon className="h-3.5 w-3.5" aria-hidden />
                </Link>

            }>

            {!data ?
            <ChartSkeleton height={260} /> :
            empty ?
            <EmptyState /> :

            <TrendChart
              data={data.monthly}
              height={260}
              showAverage
              highlightMonth={monthFocus}
              onSelectMonth={(month) => setDateRange(month, lastDayOfMonth(month))} />

            }
          </Panel>

          <Panel title="Severity" description="Click a level to filter" className="lg:col-span-4">
            {!data ?
            <BarsSkeleton rows={4} /> :
            empty ?
            <EmptyState /> :

            <DonutChart
              data={data.severity}
              colorFor={(label) => severityColor(palette, label)}
              centerLabel="incidents"
              selected={filters.severity}
              onSelect={(label) => toggleValue('severity', label)}
              size={150} />

            }
          </Panel>
        </div>

        <div className="grid gap-4 lg:grid-cols-12">
          <Panel title="Crime types" description="Top categories · click to filter" className="lg:col-span-5">
            {!data ?
            <BarsSkeleton rows={8} /> :
            empty ?
            <EmptyState /> :

            <RankedBars
              ariaLabel="Incidents by crime type"
              data={data.crimeTypes}
              total={data.meta.filtered}
              selected={filters.crimeType}
              onSelect={(label) => toggleValue('crimeType', label)} />

            }
          </Panel>
          <Panel title="Time of day" description="When incidents are recorded" className="lg:col-span-3">
            {!data ?
            <BarsSkeleton rows={4} /> :
            empty ?
            <EmptyState /> :

            <RankedBars
              ariaLabel="Incidents by time of day"
              data={data.timeOfDay}
              total={data.meta.filtered}
              selected={filters.timePeriod}
              onSelect={(label) => toggleValue('timePeriod', label)} />

            }
          </Panel>
          <Panel
            title="Key observations"
            description="Calculated from the filtered records"
            info="These statements are generated by the analytics service from counts in the current dataset — not predictions."
            className="lg:col-span-4">

            {!data ? <BarsSkeleton rows={4} /> : empty ? <EmptyState /> : <InsightList insights={data.insights} />}
          </Panel>
        </div>

        <Panel title="Latest incident records" description="Expand a row for details or to locate it on the map">
          <IncidentTable filteredTotal={data?.meta.filtered} />
        </Panel>
      </div>
    </div>);

}