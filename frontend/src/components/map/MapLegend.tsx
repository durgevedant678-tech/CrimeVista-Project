import { useState } from 'react';
import { ChevronDownIcon } from 'lucide-react';
import { useChartPalette } from '../../hooks/useChartPalette';
import type { MapLayerKey, MapMode } from './mapLayers';
import { cn } from '../../utils/cn';

interface MapLegendProps {
  layers: Set<MapLayerKey>;
  mode: MapMode;
  defaultOpen?: boolean;
}

export function MapLegend({ layers, mode, defaultOpen = true }: MapLegendProps) {
  const p = useChartPalette();
  const [open, setOpen] = useState(defaultOpen);
  const showSeverity = layers.has('incidents') || layers.has('clusters');

  return (
    <div className="pointer-events-auto w-52 rounded-xl border border-line bg-surface/95 text-xs shadow-lift backdrop-blur">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="cv-focus flex w-full items-center justify-between rounded-xl px-3 py-2 font-medium text-fg">

        Legend
        <ChevronDownIcon className={cn('h-3.5 w-3.5 text-subtle transition-transform duration-150', open && 'rotate-180')} aria-hidden />
      </button>
      {open &&
      <div className="space-y-3 border-t border-line px-3 pb-3 pt-2.5">
          {layers.has('heatmap') &&
        <div>
              <p className="cv-label mb-1.5">Incident density (severity-weighted)</p>
              <div className="flex h-2 overflow-hidden rounded-full">
                {[`${p.teal}66`, p.teal, p.amber, p.orange, p.danger].map((color) =>
            <span key={color} className="flex-1" style={{ background: color }} />
            )}
              </div>
              <div className="mt-1 flex justify-between text-2xs text-subtle">
                <span>Lower</span>
                <span>Higher</span>
              </div>
            </div>
        }
          {showSeverity &&
        <div>
              <p className="cv-label mb-1.5">Incident severity</p>
              <div className="grid grid-cols-2 gap-1">
                {[
            ['Critical', p.danger],
            ['High', p.orange],
            ['Medium', p.amber],
            ['Low', p.axis]].
            map(([label, color]) =>
            <span key={label} className="flex items-center gap-1.5 text-muted">
                    <span className="h-2 w-2 rounded-full" style={{ background: color }} aria-hidden />
                    {label}
                  </span>
            )}
              </div>
            </div>
        }
          {layers.has('hotspots') &&
        <div>
              <p className="cv-label mb-1.5">{mode === '3d' ? 'Hotspot columns (height = incidents)' : 'Hotspot risk level'}</p>
              <div className="grid grid-cols-2 gap-1">
                {[
            ['Very high', p.danger],
            ['High', p.orange],
            ['Elevated', p.amber],
            ['Moderate', p.teal]].
            map(([label, color]) =>
            <span key={label} className="flex items-center gap-1.5 text-muted">
                    <span className={cn('h-2.5 w-2.5', mode === '3d' ? 'rounded-sm' : 'rounded-full')} style={{ background: color }} aria-hidden />
                    {label}
                  </span>
            )}
              </div>
            </div>
        }
          {layers.has('extents') &&
        <p className="flex items-center gap-2 text-muted">
              <span className="h-0 w-5 border-t-2 border-dashed border-muted" aria-hidden />
              Observed incident extent
            </p>
        }
        </div>
      }
    </div>);

}