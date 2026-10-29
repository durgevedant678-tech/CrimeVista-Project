import { useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import type { GeoJSONSource, Map as MapLibreMap, StyleSpecification } from 'maplibre-gl';
import { feature } from 'topojson-client';
import type { FeatureCollection, LineString, Point } from 'geojson';
import { useReducedMotion } from 'framer-motion';
import { MinusIcon, PlusIcon, RotateCcwIcon } from 'lucide-react';

type Position = [number, number];

const COUNTRIES_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-110m.json';
const START_CENTER: Position = [20, 18];
const EMPTY: FeatureCollection = { type: 'FeatureCollection', features: [] };

const REGION_ANCHORS: Position[] = [
  [-74, 40], [-46, -23], [2, 48], [13, 52], [3, 6], [31, 1],
  [36, -1], [55, 25], [72, 20], [103, 1], [116, 40], [139, 36],
];

function makeGraticule(): FeatureCollection<LineString> {
  const features: FeatureCollection<LineString>['features'] = [];
  for (let latitude = -75; latitude <= 75; latitude += 15) {
    const coordinates: Position[] = [];
    for (let longitude = -180; longitude <= 180; longitude += 5) coordinates.push([longitude, latitude]);
    features.push({ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates } });
  }
  for (let longitude = -180; longitude < 180; longitude += 30) {
    const coordinates: Position[] = [];
    for (let latitude = -85; latitude <= 85; latitude += 5) coordinates.push([longitude, latitude]);
    features.push({ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates } });
  }
  return { type: 'FeatureCollection', features };
}

function greatCircle(a: Position, b: Position, steps = 64): Position[] {
  const rad = Math.PI / 180;
  const deg = 180 / Math.PI;
  const lon1 = a[0] * rad;
  const lat1 = a[1] * rad;
  const lon2 = b[0] * rad;
  const lat2 = b[1] * rad;
  const distance = 2 * Math.asin(Math.sqrt(
    Math.sin((lat2 - lat1) / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin((lon2 - lon1) / 2) ** 2
  ));
  if (distance === 0) return [a, b];
  const coordinates: Position[] = [];
  let previousLongitude: number | null = null;
  for (let step = 0; step <= steps; step++) {
    const fraction = step / steps;
    const weightA = Math.sin((1 - fraction) * distance) / Math.sin(distance);
    const weightB = Math.sin(fraction * distance) / Math.sin(distance);
    const x = weightA * Math.cos(lat1) * Math.cos(lon1) + weightB * Math.cos(lat2) * Math.cos(lon2);
    const y = weightA * Math.cos(lat1) * Math.sin(lon1) + weightB * Math.cos(lat2) * Math.sin(lon2);
    const z = weightA * Math.sin(lat1) + weightB * Math.sin(lat2);
    const latitude = Math.atan2(z, Math.sqrt(x * x + y * y)) * deg;
    let longitude = Math.atan2(y, x) * deg;
    if (previousLongitude !== null) {
      while (longitude - previousLongitude > 180) longitude -= 360;
      while (longitude - previousLongitude < -180) longitude += 360;
    }
    previousLongitude = longitude;
    coordinates.push([longitude, latitude]);
  }
  return coordinates;
}

function getGlobeZoom(width: number, height: number): number {
  const radius = Math.max(120, Math.min(width, height) * 0.42);
  return Math.log2(radius * 2 * Math.PI / 512);
}

function buildLandingStyle(): StyleSpecification {
  const routes: FeatureCollection<LineString> = {
    type: 'FeatureCollection',
    features: [
      [0, 2, 8, 9], [1, 4, 6, 7], [2, 3, 10, 11], [0, 5, 8],
    ].map(([start, ...endpoints]) => {
      const coordinates = endpoints.reduce<Position[]>((path, endpoint) => {
        const from = path.length ? path[path.length - 1] : REGION_ANCHORS[start];
        path.push(...greatCircle(from, REGION_ANCHORS[endpoint]).slice(path.length ? 1 : 0));
        return path;
      }, []);
      return {
        type: 'Feature',
        properties: { color: '#00d9ff' },
        geometry: { type: 'LineString', coordinates },
      };
    }),
  };

  const points: FeatureCollection<Point> = {
    type: 'FeatureCollection',
    features: REGION_ANCHORS.map((coordinates, index) => ({
      type: 'Feature',
      properties: { color: index % 3 === 0 ? '#ff7a70' : '#29d5ff' },
      geometry: { type: 'Point', coordinates },
    })),
  };

  return {
    version: 8,
    projection: { type: 'globe' },
    sky: { 'atmosphere-blend': ['interpolate', ['linear'], ['zoom'], 0, 0.9, 4, 0.5, 7, 0] },
    sources: {
      countries: { type: 'geojson', data: EMPTY },
      graticule: { type: 'geojson', data: makeGraticule() },
      routes: { type: 'geojson', data: routes },
      points: { type: 'geojson', data: points },
    },
    layers: [
      { id: 'ocean', type: 'background', paint: { 'background-color': '#061224' } },
      { id: 'land', type: 'fill', source: 'countries', paint: { 'fill-color': '#0b2140', 'fill-opacity': 0.97 } },
      { id: 'graticule', type: 'line', source: 'graticule', paint: { 'line-color': '#2a6fa8', 'line-opacity': 0.23, 'line-width': 0.65 } },
      { id: 'border-glow', type: 'line', source: 'countries', paint: { 'line-color': '#00d9ff', 'line-opacity': 0.2, 'line-width': 3, 'line-blur': 3 } },
      { id: 'borders', type: 'line', source: 'countries', paint: { 'line-color': '#43cdeb', 'line-opacity': 0.6, 'line-width': 0.7 } },
      { id: 'routes-glow', type: 'line', source: 'routes', layout: { 'line-cap': 'round' }, paint: { 'line-color': ['get', 'color'], 'line-opacity': 0.18, 'line-width': 5, 'line-blur': 3 } },
      { id: 'routes', type: 'line', source: 'routes', layout: { 'line-cap': 'round' }, paint: { 'line-color': ['get', 'color'], 'line-opacity': 0.74, 'line-width': 1.1 } },
      { id: 'points-glow', type: 'circle', source: 'points', paint: { 'circle-radius': 8, 'circle-color': ['get', 'color'], 'circle-opacity': 0.17, 'circle-blur': 1 } },
      { id: 'points', type: 'circle', source: 'points', paint: { 'circle-radius': 2, 'circle-color': ['get', 'color'], 'circle-opacity': 0.95 } },
    ],
  };
}

export function InteractiveCrimeGlobe() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const readyRef = useRef(false);
  const reducedMotion = useReducedMotion();
  const reducedMotionRef = useRef(Boolean(reducedMotion));
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    reducedMotionRef.current = Boolean(reducedMotion);
  }, [reducedMotion]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const bounds = container.getBoundingClientRect();
    const initialZoom = getGlobeZoom(bounds.width || 600, bounds.height || 600);
    let map: MapLibreMap;
    try {
      map = new maplibregl.Map({
        container,
        style: buildLandingStyle(),
        center: START_CENTER,
        zoom: initialZoom,
        minZoom: initialZoom - 0.45,
        maxZoom: 5,
        attributionControl: false,
        renderWorldCopies: false,
        fadeDuration: 0,
        canvasContextAttributes: { antialias: true },
      });
    } catch (cause) {
      console.error('Unable to initialize landing globe', cause);
      setError(true);
      return;
    }

    mapRef.current = map;
    let cancelled = false;
    let visible = true;
    let interaction = false;
    let lastInteraction = performance.now();
    let frame = 0;
    let previousFrame = performance.now();

    map.getCanvas().setAttribute('aria-label', 'Interactive 3D globe. Drag to rotate and scroll to zoom.');

    map.on('load', () => {
      if (cancelled) return;
      readyRef.current = true;
      setReady(true);
      fetch(COUNTRIES_URL)
        .then((response) => {
          if (!response.ok) throw new Error(`Country boundaries request failed (${response.status})`);
          return response.json();
        })
        .then((topology) => {
          if (cancelled) return;
          const countries = feature(topology, topology.objects.countries);
          (map.getSource('countries') as GeoJSONSource | undefined)?.setData(countries);
        })
        .catch((cause: unknown) => {
          if (!cancelled) console.error('Unable to load globe country boundaries', cause);
        });
    });
    map.on('error', (event) => {
      if (!readyRef.current && !cancelled) {
        console.error('Landing globe failed to load', event.error);
        setError(true);
      }
    });

    const markInteraction = () => { lastInteraction = performance.now(); };
    const onPointerDown = () => {
      interaction = true;
      markInteraction();
    };
    const onPointerUp = () => {
      if (interaction) markInteraction();
      interaction = false;
    };
    const onWheel = () => markInteraction();
    container.addEventListener('pointerdown', onPointerDown);
    container.addEventListener('wheel', onWheel, { passive: true });
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);

    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; });
    observer.observe(container);

    const tick = (now: number) => {
      const elapsed = Math.min(64, now - previousFrame);
      previousFrame = now;
      if (
        readyRef.current &&
        !reducedMotionRef.current &&
        !interaction &&
        visible &&
        !document.hidden &&
        !map.isMoving() &&
        now - lastInteraction > 3500
      ) {
        const center = map.getCenter();
        map.setCenter([center.lng + 0.0018 * elapsed, center.lat]);
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);

    const resizeObserver = new ResizeObserver(() => map.resize());
    resizeObserver.observe(container);

    return () => {
      cancelled = true;
      readyRef.current = false;
      cancelAnimationFrame(frame);
      observer.disconnect();
      resizeObserver.disconnect();
      container.removeEventListener('pointerdown', onPointerDown);
      container.removeEventListener('wheel', onWheel);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
      map.remove();
      mapRef.current = null;
    };
  }, []);

  const zoom = (amount: number) => {
    mapRef.current?.easeTo({ zoom: (mapRef.current?.getZoom() ?? 1) + amount, duration: 260 });
  };
  const reset = () => mapRef.current?.flyTo({ center: START_CENTER, zoom: getGlobeZoom(780, 600), duration: 800 });

  return (
    <div className="showcase-globe" aria-label="Interactive 3D globe">
      <div ref={containerRef} className="showcase-globe-map" />
      {error && (
        <div className="showcase-globe-fallback" role="img" aria-label="Illustrative 3D globe visualization">
          <svg viewBox="0 0 400 400" aria-hidden="true">
            <circle cx="200" cy="200" r="168" />
            {[40, 80, 120, 160].map((radius) => <ellipse key={radius} cx="200" cy="200" rx={radius} ry="168" />)}
            {[-120, -60, 0, 60, 120].map((offset) => {
              const radius = Math.sqrt(168 * 168 - offset * offset);
              return <ellipse key={offset} cx="200" cy={200 + offset} rx={radius} ry={radius * 0.08} />;
            })}
            <path d="M150 150 Q 200 110 250 130 M210 230 Q 250 260 290 210 M130 250 Q 160 200 185 175" />
            {[[150, 150], [250, 130], [210, 230], [130, 250], [290, 210], [185, 175]].map(([x, y]) =>
              <circle key={`${x}-${y}`} cx={x} cy={y} r="3" className="fallback-dot" />)}
          </svg>
          <span>Interactive globe preview</span>
        </div>
      )}
      <div className={`showcase-globe-loader ${ready ? 'is-ready' : ''}`} aria-hidden="true">
        <div className="showcase-globe-loader-sphere" />
      </div>
      <div className="showcase-globe-controls" aria-label="Globe controls">
        <button type="button" onClick={() => zoom(-0.5)} aria-label="Zoom out"><MinusIcon /></button>
        <button type="button" onClick={reset} aria-label="Reset globe view"><RotateCcwIcon /></button>
        <button type="button" onClick={() => zoom(0.5)} aria-label="Zoom in"><PlusIcon /></button>
      </div>
    </div>
  );
}
