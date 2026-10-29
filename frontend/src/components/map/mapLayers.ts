import type { ExpressionSpecification, GeoJSONSource, Map as MapLibreMap } from 'maplibre-gl';
import type { ChartPalette } from '../../utils/chartTheme';
import type { Theme } from '../../contexts/ThemeContext';

export type MapLayerKey = 'heatmap' | 'clusters' | 'incidents' | 'hotspots' | 'extents';
export type MapMode = '2d' | '3d';
export type Basemap = 'theme' | 'streets';

export const STYLE_URLS: Record<Theme | 'streets', string> = {
  light: 'https://tiles.openfreemap.org/styles/positron',
  dark: 'https://tiles.openfreemap.org/styles/dark',
  streets: 'https://tiles.openfreemap.org/styles/liberty'
};

export const LAYER_GROUPS: Record<MapLayerKey, string[]> = {
  heatmap: ['cv-heat'],
  clusters: ['cv-clusters', 'cv-cluster-count', 'cv-cluster-points'],
  incidents: ['cv-points'],
  hotspots: ['cv-hotspot-halo', 'cv-hotspots', 'cv-hotspot-labels'],
  extents: ['cv-extent-fill', 'cv-extent-line']
};

export const INTERACTIVE = {
  incidents: ['cv-points', 'cv-cluster-points'],
  hotspots: ['cv-hotspots', 'cv-columns', 'cv-hotspot-labels'],
  clusters: ['cv-clusters']
};

export interface MapSources {
  incidents: GeoJSON.FeatureCollection;
  hotspots: GeoJSON.FeatureCollection;
  columns: GeoJSON.FeatureCollection;
  extents: GeoJSON.FeatureCollection;
}

function rgba(hex: string, alpha: number): string {
  const value = hex.replace('#', '');
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

const riskColor = (p: ChartPalette): ExpressionSpecification => [
'match',
['get', 'risk'],
'Very high',
p.danger,
'High',
p.orange,
'Elevated',
p.amber,
p.teal];


const severityColor = (p: ChartPalette): ExpressionSpecification => [
'match',
['get', 'severity'],
'Critical',
p.danger,
'High',
p.orange,
'Medium',
p.amber,
p.axis];


export function installLayers(map: MapLibreMap, data: MapSources, palette: ChartPalette, theme: Theme) {
  const firstSymbol = map.getStyle().layers?.find((layer) => layer.type === 'symbol')?.id;
  const font = ['Noto Sans Regular'];

  map.addSource('cv-incidents', { type: 'geojson', data: data.incidents });
  map.addSource('cv-clustered', { type: 'geojson', data: data.incidents, cluster: true, clusterRadius: 54, clusterMaxZoom: 15 });
  map.addSource('cv-hotspots', { type: 'geojson', data: data.hotspots });
  map.addSource('cv-columns', { type: 'geojson', data: data.columns });
  map.addSource('cv-extents', { type: 'geojson', data: data.extents });

  if (map.getSource('openmaptiles')) {
    map.addLayer(
      {
        id: 'cv-buildings',
        type: 'fill-extrusion',
        source: 'openmaptiles',
        'source-layer': 'building',
        minzoom: 12.5,
        layout: { visibility: 'none' },
        paint: {
          'fill-extrusion-color': theme === 'dark' ? '#1A2B44' : '#D3DBE6',
          'fill-extrusion-height': ['coalesce', ['get', 'render_height'], 8],
          'fill-extrusion-base': ['coalesce', ['get', 'render_min_height'], 0],
          'fill-extrusion-opacity': 0.8
        }
      },
      firstSymbol
    );
  }

  map.addLayer(
    {
      id: 'cv-extent-fill',
      type: 'fill',
      source: 'cv-extents',
      paint: { 'fill-color': riskColor(palette), 'fill-opacity': ['case', ['boolean', ['feature-state', 'selected'], false], 0.16, 0.06] }
    },
    firstSymbol
  );
  map.addLayer(
    {
      id: 'cv-extent-line',
      type: 'line',
      source: 'cv-extents',
      paint: { 'line-color': riskColor(palette), 'line-width': 1.25, 'line-opacity': 0.7, 'line-dasharray': [2, 2] }
    },
    firstSymbol
  );

  map.addLayer(
    {
      id: 'cv-heat',
      type: 'heatmap',
      source: 'cv-incidents',
      maxzoom: 17,
      paint: {
        'heatmap-weight': ['get', 'weight'],
        'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 10, 0.7, 15, 1.6],
        'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 10, 14, 13, 26, 16, 40],
        'heatmap-opacity': theme === 'dark' ? 0.82 : 0.72,
        'heatmap-color': [
        'interpolate',
        ['linear'],
        ['heatmap-density'],
        0,
        'rgba(0,0,0,0)',
        0.12,
        rgba(palette.teal, 0.33),
        0.35,
        rgba(palette.teal, 0.67),
        0.6,
        palette.amber,
        0.82,
        palette.orange,
        1,
        palette.danger]

      }
    },
    firstSymbol
  );

  map.addLayer({
    id: 'cv-clusters',
    type: 'circle',
    source: 'cv-clustered',
    filter: ['has', 'point_count'],
    paint: {
      'circle-color': palette.primary,
      'circle-opacity': ['step', ['get', 'point_count'], 0.55, 50, 0.7, 200, 0.85],
      'circle-radius': ['step', ['get', 'point_count'], 13, 25, 17, 100, 22, 400, 28],
      'circle-stroke-width': 2,
      'circle-stroke-color': palette.surface
    }
  });
  map.addLayer({
    id: 'cv-cluster-count',
    type: 'symbol',
    source: 'cv-clustered',
    filter: ['has', 'point_count'],
    layout: { 'text-field': ['get', 'point_count_abbreviated'], 'text-font': font, 'text-size': 11 },
    paint: { 'text-color': theme === 'dark' ? '#04101E' : '#FFFFFF' }
  });
  map.addLayer({
    id: 'cv-cluster-points',
    type: 'circle',
    source: 'cv-clustered',
    filter: ['!', ['has', 'point_count']],
    paint: {
      'circle-color': severityColor(palette),
      'circle-radius': 5,
      'circle-stroke-width': 1.5,
      'circle-stroke-color': palette.surface
    }
  });

  map.addLayer({
    id: 'cv-points',
    type: 'circle',
    source: 'cv-incidents',
    paint: {
      'circle-color': severityColor(palette),
      'circle-radius': ['interpolate', ['linear'], ['zoom'], 10, 2, 14, 4.5, 17, 7],
      'circle-opacity': 0.85,
      'circle-stroke-width': ['interpolate', ['linear'], ['zoom'], 10, 0, 14, 1],
      'circle-stroke-color': palette.surface
    }
  });

  map.addLayer({
    id: 'cv-selected-point',
    type: 'circle',
    source: 'cv-incidents',
    filter: ['==', ['get', 'id'], ''],
    paint: {
      'circle-color': 'rgba(0,0,0,0)',
      'circle-radius': 11,
      'circle-stroke-width': 2.5,
      'circle-stroke-color': palette.primary
    }
  });

  map.addLayer({
    id: 'cv-columns',
    type: 'fill-extrusion',
    source: 'cv-columns',
    layout: { visibility: 'none' },
    paint: {
      'fill-extrusion-color': riskColor(palette),
      'fill-extrusion-height': ['get', 'height'],
      'fill-extrusion-base': 0,
      'fill-extrusion-opacity': 0.88
    }
  });

  map.addLayer({
    id: 'cv-hotspot-halo',
    type: 'circle',
    source: 'cv-hotspots',
    paint: {
      'circle-color': riskColor(palette),
      'circle-opacity': 0.14,
      'circle-radius': ['interpolate', ['linear'], ['zoom'], 10, ['*', ['sqrt', ['get', 'count']], 0.9], 14, ['*', ['sqrt', ['get', 'count']], 2.2]]
    }
  });
  map.addLayer({
    id: 'cv-hotspots',
    type: 'circle',
    source: 'cv-hotspots',
    paint: {
      'circle-color': riskColor(palette),
      'circle-radius': ['interpolate', ['linear'], ['get', 'rank'], 1, 9, 15, 6],
      'circle-stroke-width': 2,
      'circle-stroke-color': palette.surface
    }
  });
  map.addLayer({
    id: 'cv-hotspot-selected',
    type: 'circle',
    source: 'cv-hotspots',
    filter: ['==', ['get', 'area'], ''],
    paint: { 'circle-color': 'rgba(0,0,0,0)', 'circle-radius': 16, 'circle-stroke-width': 2.5, 'circle-stroke-color': palette.primary }
  });
  map.addLayer({
    id: 'cv-hotspot-labels',
    type: 'symbol',
    source: 'cv-hotspots',
    layout: {
      'text-field': ['get', 'label'],
      'text-font': font,
      'text-size': 11,
      'text-offset': [0, 1.5],
      'text-anchor': 'top',
      'text-optional': true
    },
    paint: {
      'text-color': palette.fg,
      'text-halo-color': palette.surface,
      'text-halo-width': 1.5
    }
  });
}

export function setVisibility(map: MapLibreMap, layers: Set<MapLayerKey>, mode: MapMode) {
  const set = (id: string, visible: boolean) => {
    if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', visible ? 'visible' : 'none');
  };
  (Object.keys(LAYER_GROUPS) as MapLayerKey[]).forEach((key) => {
    LAYER_GROUPS[key].forEach((id) => {
      const hideIn3d = mode === '3d' && (id === 'cv-hotspots' || id === 'cv-hotspot-halo');
      set(id, layers.has(key) && !hideIn3d);
    });
  });
  set('cv-columns', mode === '3d' && layers.has('hotspots'));
  set('cv-buildings', mode === '3d');
}

export function updateSources(map: MapLibreMap, data: MapSources) {
  (map.getSource('cv-incidents') as GeoJSONSource | undefined)?.setData(data.incidents);
  (map.getSource('cv-clustered') as GeoJSONSource | undefined)?.setData(data.incidents);
  (map.getSource('cv-hotspots') as GeoJSONSource | undefined)?.setData(data.hotspots);
  (map.getSource('cv-columns') as GeoJSONSource | undefined)?.setData(data.columns);
  (map.getSource('cv-extents') as GeoJSONSource | undefined)?.setData(data.extents);
}

export function setSelection(map: MapLibreMap, incidentId: string | null, area: string | null) {
  if (map.getLayer('cv-selected-point')) map.setFilter('cv-selected-point', ['==', ['get', 'id'], incidentId ?? '']);
  if (map.getLayer('cv-hotspot-selected')) map.setFilter('cv-hotspot-selected', ['==', ['get', 'area'], area ?? '']);
  if (map.getLayer('cv-extent-fill')) {
    map.setPaintProperty('cv-extent-fill', 'fill-opacity', ['case', ['==', ['get', 'area'], area ?? ''], 0.18, 0.05]);
  }
}