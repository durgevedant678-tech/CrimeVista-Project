import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { InfoIcon } from 'lucide-react';
import { FilterBar } from '../components/filters/FilterBar';
import { DataScope } from '../components/layout/DataScope';
import { IntelMap, type MapFocus } from '../components/map/IntelMap';
import { MapPanel } from '../components/map/MapPanel';
import { MapSearch } from '../components/map/MapSearch';
import { HotspotIntelPanel } from '../components/hotspots/HotspotIntelPanel';
import { IncidentPanel } from '../components/incidents/IncidentPanel';
import { ErrorState } from '../components/ui/ErrorState';
import { EmptyState } from '../components/ui/EmptyState';
import { useCrimeMap, useHotspots } from '../hooks/useCrimeQueries';
import { useAssistant } from '../contexts/AssistantContext';
import type { MapIncident } from '../types/crime';

export function CrimeMap() {
  const [params, setParams] = useSearchParams();
  const crimeMap = useCrimeMap();
  const hotspots = useHotspots();
  const assistant = useAssistant();
  const [selectedArea, setSelectedArea] = useState<string | null>(params.get('area'));
  const [selectedIncident, setSelectedIncident] = useState<MapIncident | null>(null);
  const [focus, setFocus] = useState<MapFocus | null>(null);

  const incidents = crimeMap.data?.incidents ?? [];
  const hotspotList = hotspots.data?.hotspots ?? [];
  const selectedHotspot = hotspotList.find((hotspot) => hotspot.area === selectedArea) ?? null;

  // Deep links: ?incident=ID&lat=&lng=  or  ?area=NAME
  useEffect(() => {
    const id = params.get('incident');
    const lat = Number(params.get('lat'));
    const lng = Number(params.get('lng'));
    if (id && Number.isFinite(lat) && Number.isFinite(lng) && lat && lng) {
      setFocus({ latitude: lat, longitude: lng, zoom: 15.5 });
      const match = incidents.find((incident) => incident.id === id);
      if (match) {
        setSelectedIncident(match);
        setSelectedArea(null);
      }
    }
  }, [params, incidents]);

  useEffect(() => {
    const area = params.get('area');
    const hotspot = hotspotList.find((item) => item.area === area);
    if (hotspot?.latitude && hotspot.longitude) setFocus({ latitude: hotspot.latitude, longitude: hotspot.longitude, zoom: 13.4 });
  }, [params, hotspotList]);

  useEffect(() => {
    assistant.setSelectedIncident(selectedIncident?.id ?? null);
  }, [selectedIncident, assistant]);

  const selectArea = (area: string) => {
    const hotspot = hotspotList.find((item) => item.area === area);
    setSelectedIncident(null);
    setSelectedArea(area);
    assistant.setSelectedArea(area);
    if (hotspot?.latitude && hotspot.longitude) setFocus({ latitude: hotspot.latitude, longitude: hotspot.longitude, zoom: 13.4 });
  };
  const selectIncident = (incident: MapIncident) => {
    setSelectedArea(null);
    setSelectedIncident(incident);
    setFocus({ latitude: incident.latitude, longitude: incident.longitude, zoom: 15.5 });
  };
  const clearSelection = () => {
    setSelectedArea(null);
    setSelectedIncident(null);
    if (params.toString()) setParams({}, { replace: true });
  };

  const plotted = incidents.length;
  const missing = crimeMap.data?.missingLocationCount ?? 0;

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 flex-col gap-2.5 border-b border-line px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <h1 className="cv-page-title">Crime Map</h1>
          <p className="text-xs text-muted">
            <DataScope meta={crimeMap.data?.meta} />
          </p>
        </div>
        <FilterBar />
      </div>

      <div className="relative h-[calc(100vh-14rem)] min-h-[420px] flex-1">
        {crimeMap.isError ?
        <div className="flex h-full items-center justify-center">
            <ErrorState error={crimeMap.error} onRetry={() => crimeMap.refetch()} />
          </div> :

        <IntelMap
          incidents={incidents}
          hotspots={hotspotList}
          selectedArea={selectedArea}
          selectedIncidentId={selectedIncident?.id ?? null}
          onSelectArea={selectArea}
          onSelectIncident={selectIncident}
          focus={focus}
          loading={crimeMap.isFetching}
          defaultLayers={['heatmap', 'hotspots', 'extents']}
          topLeft={
          <>
                <MapSearch hotspots={hotspotList} incidents={incidents} onArea={selectArea} onIncident={selectIncident} />
                {crimeMap.data &&
            <div className="pointer-events-auto flex items-center gap-2 rounded-lg border border-line bg-surface/95 px-2.5 py-1.5 text-xs text-muted shadow-lift backdrop-blur">
                    <span>
                      <span className="font-semibold tabular-nums text-fg">{plotted.toLocaleString('en-US')}</span> plotted
                    </span>
                    {missing > 0 &&
              <span className="border-l border-line pl-2">
                        <span className="tabular-nums text-fg">{missing.toLocaleString('en-US')}</span> without coordinates
                      </span>
              }
                    {plotted >= 3000 &&
              <span className="flex items-center gap-1 border-l border-line pl-2" title="The map endpoint returns up to 3,000 located incidents. Narrow filters to see a specific set.">
                        <InfoIcon className="h-3.5 w-3.5" aria-hidden /> First 3,000 shown
                      </span>
              }
                  </div>
            }
              </>
          }
          panel={
          <MapPanel open={Boolean(selectedHotspot || selectedIncident)} panelKey={selectedHotspot?.area ?? selectedIncident?.id ?? 'none'}>
                {selectedHotspot && <HotspotIntelPanel hotspot={selectedHotspot} topCount={hotspotList[0]?.incidentCount ?? 0} onClose={clearSelection} />}
                {selectedIncident && !selectedHotspot && <IncidentPanel incident={selectedIncident} onClose={clearSelection} />}
              </MapPanel>
          } />

        }
        {crimeMap.data && plotted === 0 &&
        <div className="absolute inset-x-4 top-1/2 z-30 mx-auto max-w-sm -translate-y-1/2 rounded-2xl border border-line bg-surface shadow-pop">
            <EmptyState
            title={crimeMap.data.meta.filtered ? 'These incidents have no coordinates' : undefined}
            description={crimeMap.data.meta.filtered ? 'Matching records exist but none include a latitude and longitude.' : undefined} />

          </div>
        }
      </div>
    </div>);

}