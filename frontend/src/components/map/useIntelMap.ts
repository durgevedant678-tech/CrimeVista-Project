import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import type { GeoJSONSource, Map as MapLibreMap, MapGeoJSONFeature } from 'maplibre-gl';
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import { NAGPUR_CENTER } from '../../api/config';
import { CHART_PALETTES } from '../../utils/chartTheme';
import { hotspotColumns, hotspotExtents, hotspotsToGeoJSON, incidentsToGeoJSON } from '../../utils/geo';
import type { Theme } from '../../contexts/ThemeContext';
import type { Hotspot, MapIncident } from '../../types/crime';
import {
  INTERACTIVE,
  STYLE_URLS,
  installLayers,
  setSelection,
  setVisibility,
  updateSources,
  type Basemap,
  type MapLayerKey,
  type MapMode,
  type MapSources } from
'./mapLayers';

export interface MapFocus {
  longitude: number;
  latitude: number;
  zoom?: number;
}

interface UseIntelMapArgs {
  container: React.RefObject<HTMLDivElement>;
  incidents: MapIncident[];
  hotspots: Hotspot[];
  theme: Theme;
  basemap: Basemap;
  mode: MapMode;
  layers: Set<MapLayerKey>;
  selectedIncidentId: string | null;
  selectedArea: string | null;
  focus: MapFocus | null;
  onSelectIncident?: (incident: MapIncident) => void;
  onSelectArea?: (area: string) => void;
}

const INITIAL_VIEW = { center: NAGPUR_CENTER, zoom: 11.3, pitch: 0, bearing: 0 };

maplibregl.setWorkerUrl(maplibreWorkerUrl);

export function useIntelMap(args: UseIntelMapArgs) {
  const { container, incidents, hotspots, theme, basemap, mode, layers, selectedIncidentId, selectedArea, focus } = args;
  const mapRef = useRef<MapLibreMap | null>(null);
  const [ready, setReady] = useState(false);
  const [styleTick, setStyleTick] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const sources = useMemo<MapSources>(
    () => ({
      incidents: incidentsToGeoJSON(incidents),
      hotspots: hotspotsToGeoJSON(hotspots),
      columns: hotspotColumns(hotspots),
      extents: hotspotExtents(hotspots, incidents)
    }),
    [incidents, hotspots]
  );

  const latest = useRef({ sources, theme, layers, mode, selectedIncidentId, selectedArea, incidents, args });
  latest.current = { sources, theme, layers, mode, selectedIncidentId, selectedArea, incidents, args };

  const styleUrl = basemap === 'streets' ? STYLE_URLS.streets : STYLE_URLS[theme];

  // Initialise once
  useEffect(() => {
    if (!container.current) return;
    let map: MapLibreMap;
    try {
      map = new maplibregl.Map({
        container: container.current,
        style: styleUrl,
        ...INITIAL_VIEW,
        maxPitch: 70,
        attributionControl: { compact: true },
        dragRotate: true
      });
    } catch {
      setError('Your browser could not start the map. WebGL may be disabled.');
      return;
    }
    mapRef.current = map;

    const popup = new maplibregl.Popup({ closeButton: false, closeOnClick: false, offset: 10 });

    map.on('style.load', () => {
      const current = latest.current;
      installLayers(map, current.sources, CHART_PALETTES[current.theme], current.theme);
      setVisibility(map, current.layers, current.mode);
      setSelection(map, current.selectedIncidentId, current.selectedArea);
      setStyleTick((tick) => tick + 1);
    });
    map.on('load', () => setReady(true));
    map.on('error', (event) => {
      console.error('CrimeVista map error', event.error);
    });
    map.on('click', 'cv-clusters', async (event) => {
      const feature = event.features?.[0];
      if (!feature) return;
      const source = map.getSource('cv-clustered') as GeoJSONSource;
      try {
        const zoom = await source.getClusterExpansionZoom(feature.properties.cluster_id as number);
        map.easeTo({ center: (feature.geometry as GeoJSON.Point).coordinates as [number, number], zoom, duration: 500 });
      } catch {

        // ignore
      }});

    const selectIncident = (feature?: MapGeoJSONFeature) => {
      if (!feature) return;
      const id = String(feature.properties.id);
      const incident = latest.current.incidents.find((item) => item.id === id);
      if (incident) latest.current.args.onSelectIncident?.(incident);
    };
    INTERACTIVE.incidents.forEach((layer) => {
      map.on('click', layer, (event) => selectIncident(event.features?.[0]));
      map.on('mousemove', layer, (event) => {
        const feature = event.features?.[0];
        if (!feature) return;
        const node = document.createElement('div');
        const title = document.createElement('div');
        title.style.fontWeight = '600';
        title.textContent = String(feature.properties.crimeType);
        const meta = document.createElement('div');
        meta.style.opacity = '0.7';
        meta.textContent = `${feature.properties.severity} · ${feature.properties.area} · ${feature.properties.date}`;
        node.append(title, meta);
        popup.setLngLat((feature.geometry as GeoJSON.Point).coordinates as [number, number]).setDOMContent(node).addTo(map);
      });
      map.on('mouseleave', layer, () => popup.remove());
    });
    INTERACTIVE.hotspots.forEach((layer) => {
      map.on('click', layer, (event) => {
        const area = event.features?.[0]?.properties.area;
        if (area) latest.current.args.onSelectArea?.(String(area));
      });
    });
    [...INTERACTIVE.incidents, ...INTERACTIVE.hotspots, ...INTERACTIVE.clusters].forEach((layer) => {
      map.on('mouseenter', layer, () => {
        map.getCanvas().style.cursor = 'pointer';
      });
      map.on('mouseleave', layer, () => {
        map.getCanvas().style.cursor = '';
      });
    });

    const observer = new ResizeObserver(() => map.resize());
    observer.observe(container.current);

    return () => {
      observer.disconnect();
      popup.remove();
      map.remove();
      mapRef.current = null;
      setReady(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Theme / basemap → swap style (custom layers re-installed on style.load)
  const firstStyle = useRef(true);
  useEffect(() => {
    if (firstStyle.current) {
      firstStyle.current = false;
      return;
    }
    mapRef.current?.setStyle(styleUrl, { diff: false });
  }, [styleUrl]);

  useEffect(() => {
    const map = mapRef.current;
    if (map && styleTick > 0) updateSources(map, sources);
  }, [sources, styleTick]);

  useEffect(() => {
    const map = mapRef.current;
    if (map && styleTick > 0) setVisibility(map, layers, mode);
  }, [layers, mode, styleTick]);

  useEffect(() => {
    const map = mapRef.current;
    if (map && styleTick > 0) setSelection(map, selectedIncidentId, selectedArea);
  }, [selectedIncidentId, selectedArea, styleTick]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.easeTo(mode === '3d' ? { pitch: 58, bearing: -24, duration: 600 } : { pitch: 0, bearing: 0, duration: 500 });
  }, [mode]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !focus) return;
    map.flyTo({ center: [focus.longitude, focus.latitude], zoom: focus.zoom ?? 13.4, speed: 1.4, curve: 1.3, essential: true });
  }, [focus]);

  const zoomIn = useCallback(() => mapRef.current?.zoomIn({ duration: 200 }), []);
  const zoomOut = useCallback(() => mapRef.current?.zoomOut({ duration: 200 }), []);
  const resetView = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    map.flyTo({ ...INITIAL_VIEW, pitch: latest.current.mode === '3d' ? 58 : 0, bearing: latest.current.mode === '3d' ? -24 : 0, speed: 1.6 });
  }, []);
  const resize = useCallback(() => mapRef.current?.resize(), []);

  return { ready, error, zoomIn, zoomOut, resetView, resize };
}