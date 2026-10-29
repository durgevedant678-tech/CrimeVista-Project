import React, { useCallback, useEffect, useRef, useState } from 'react';
import 'maplibre-gl/dist/maplibre-gl.css';
import { AnimatePresence, motion } from 'framer-motion';
import { LocateFixedIcon, Maximize2Icon, Minimize2Icon, MinusIcon, PlusIcon, MapIcon } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useIntelMap, type MapFocus } from './useIntelMap';
import { MapLegend } from './MapLegend';
import { MapLayerMenu } from './MapLayerMenu';
import type { Basemap, MapLayerKey, MapMode } from './mapLayers';
import type { Hotspot, MapIncident } from '../../types/crime';
import { cn } from '../../utils/cn';

export type { MapFocus };

interface IntelMapProps {
  incidents: MapIncident[];
  hotspots: Hotspot[];
  selectedIncidentId?: string | null;
  selectedArea?: string | null;
  onSelectIncident?: (incident: MapIncident) => void;
  onSelectArea?: (area: string) => void;
  focus?: MapFocus | null;
  defaultLayers?: MapLayerKey[];
  defaultMode?: MapMode;
  variant?: 'workspace' | 'embedded';
  loading?: boolean;
  topLeft?: React.ReactNode;
  panel?: React.ReactNode;
  legendOpen?: boolean;
  className?: string;
}

export function IntelMap({
  incidents,
  hotspots,
  selectedIncidentId = null,
  selectedArea = null,
  onSelectIncident,
  onSelectArea,
  focus = null,
  defaultLayers = ['heatmap', 'hotspots'],
  defaultMode = '2d',
  variant = 'workspace',
  loading,
  topLeft,
  panel,
  legendOpen = true,
  className
}: IntelMapProps) {
  const { theme } = useTheme();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [layers, setLayers] = useState<Set<MapLayerKey>>(() => new Set(defaultLayers));
  const [mode, setMode] = useState<MapMode>(defaultMode);
  const [basemap, setBasemap] = useState<Basemap>('theme');
  const [fullscreen, setFullscreen] = useState(false);

  const map = useIntelMap({
    container: containerRef,
    incidents,
    hotspots,
    theme,
    basemap,
    mode,
    layers,
    selectedIncidentId,
    selectedArea,
    focus,
    onSelectIncident,
    onSelectArea
  });

  const toggleLayer = useCallback((key: MapLayerKey) => {
    setLayers((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);else
      next.add(key);
      return next;
    });
  }, []);

  useEffect(() => {
    const onChange = () => {
      setFullscreen(document.fullscreenElement === wrapperRef.current);
      setTimeout(map.resize, 50);
    };
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, [map.resize]);

  const toggleFullscreen = () => {
    if (document.fullscreenElement) void document.exitFullscreen();else
    void wrapperRef.current?.requestFullscreen?.();
  };

  const embedded = variant === 'embedded';

  return (
    <div ref={wrapperRef} className={cn('relative isolate h-full w-full overflow-hidden bg-sunken', className)}>
      <div ref={containerRef} className="h-full w-full" role="region" aria-label="Urban crime map" />

      <AnimatePresence>
        {!map.ready && !map.error &&
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="absolute inset-0 z-10 flex items-center justify-center bg-sunken"
          role="status">

            <div
            className="absolute inset-0 opacity-40"
            style={{
              backgroundImage:
              'linear-gradient(rgb(var(--cv-line)) 1px, transparent 1px), linear-gradient(90deg, rgb(var(--cv-line)) 1px, transparent 1px)',
              backgroundSize: '48px 48px'
            }}
            aria-hidden />

            <div className="relative flex items-center gap-2.5 rounded-full border border-line bg-surface px-4 py-2 text-xs font-medium text-muted shadow-lift">
              <MapIcon className="h-4 w-4 animate-pulse text-primary" aria-hidden />
              Loading city basemap…
            </div>
          </motion.div>
        }
      </AnimatePresence>

      {map.error &&
      <div className="absolute inset-0 z-10 flex items-center justify-center bg-sunken p-6 text-center" role="alert">
          <div>
            <p className="text-sm font-medium text-fg">The map couldn’t load</p>
            <p className="cv-caption mt-1">{map.error}</p>
          </div>
        </div>
      }

      {map.ready && loading &&
      <div className="absolute left-1/2 top-3 z-20 -translate-x-1/2 rounded-full border border-line bg-surface/95 px-3 py-1.5 text-xs font-medium text-muted shadow-lift" role="status">
          Updating incidents…
        </div>
      }

      {topLeft && <div className="pointer-events-none absolute left-3 right-16 top-3 z-20 flex flex-col items-start gap-2">{topLeft}</div>}

      <div className="absolute right-3 top-3 z-20 flex flex-col gap-2">
        <div className="flex flex-col rounded-xl border border-line bg-surface/95 p-0.5 shadow-lift backdrop-blur">
          <ControlButton label="Zoom in" onClick={map.zoomIn}>
            <PlusIcon className="h-4 w-4" />
          </ControlButton>
          <ControlButton label="Zoom out" onClick={map.zoomOut}>
            <MinusIcon className="h-4 w-4" />
          </ControlButton>
          <ControlButton label="Reset view" onClick={map.resetView}>
            <LocateFixedIcon className="h-4 w-4" />
          </ControlButton>
        </div>
        <div className="flex flex-col rounded-xl border border-line bg-surface/95 p-0.5 shadow-lift backdrop-blur">
          <button
            type="button"
            onClick={() => setMode(mode === '2d' ? '3d' : '2d')}
            aria-pressed={mode === '3d'}
            aria-label={mode === '3d' ? 'Switch to 2D view' : 'Switch to 3D view'}
            title={mode === '3d' ? '2D view' : '3D view'}
            className={cn(
              'cv-focus flex h-9 w-9 items-center justify-center rounded-lg text-xs font-semibold transition-colors duration-150',
              mode === '3d' ? 'bg-primary/15 text-primary' : 'text-muted hover:bg-raised hover:text-fg'
            )}>

            {mode === '3d' ? '2D' : '3D'}
          </button>
          {!embedded && <MapLayerMenu layers={layers} onToggle={toggleLayer} basemap={basemap} onBasemap={setBasemap} />}
          <ControlButton label={fullscreen ? 'Exit fullscreen' : 'Fullscreen'} onClick={toggleFullscreen}>
            {fullscreen ? <Minimize2Icon className="h-4 w-4" /> : <Maximize2Icon className="h-4 w-4" />}
          </ControlButton>
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-8 left-3 z-20 hidden sm:block">
        <MapLegend layers={layers} mode={mode} defaultOpen={legendOpen} />
      </div>

      {panel}
    </div>);

}

function ControlButton({ label, onClick, children }: {label: string;onClick: () => void;children: React.ReactNode;}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="cv-focus flex h-9 w-9 items-center justify-center rounded-lg text-muted transition-colors duration-150 hover:bg-raised hover:text-fg">

      {children}
    </button>);

}