import { AnimatePresence, motion } from 'framer-motion';
import { LayersIcon } from 'lucide-react';
import { usePopover } from '../../hooks/usePopover';
import type { Basemap, MapLayerKey } from './mapLayers';
import { cn } from '../../utils/cn';

const LAYER_OPTIONS: Array<{key: MapLayerKey;label: string;hint: string;}> = [
{ key: 'heatmap', label: 'Heatmap', hint: 'Severity-weighted density' },
{ key: 'clusters', label: 'Clusters', hint: 'Grouped incident counts' },
{ key: 'incidents', label: 'Incidents', hint: 'Every plotted record' },
{ key: 'hotspots', label: 'Hotspots', hint: 'Ranked area centres' },
{ key: 'extents', label: 'Hotspot extents', hint: 'Outline of observed incidents' }];


interface MapLayerMenuProps {
  layers: Set<MapLayerKey>;
  onToggle: (key: MapLayerKey) => void;
  basemap: Basemap;
  onBasemap: (basemap: Basemap) => void;
}

export function MapLayerMenu({ layers, onToggle, basemap, onBasemap }: MapLayerMenuProps) {
  const { open, setOpen, ref } = usePopover();
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label="Map layers"
        title="Map layers"
        className={cn(
          'cv-focus flex h-9 w-9 items-center justify-center rounded-lg text-muted transition-colors duration-150 hover:bg-raised hover:text-fg',
          open && 'bg-raised text-fg'
        )}>

        <LayersIcon className="h-4 w-4" aria-hidden />
      </button>
      <AnimatePresence>
        {open &&
        <motion.div
          role="dialog"
          aria-label="Map layers"
          initial={{ opacity: 0, x: 6, scale: 0.98 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
          className="absolute right-full top-0 z-30 mr-2 w-64 origin-top-right rounded-xl border border-line bg-surface p-1.5 shadow-pop">

            <p className="cv-label px-2 pb-1 pt-1.5">Layers</p>
            {LAYER_OPTIONS.map((option) => {
            const on = layers.has(option.key);
            return (
              <label key={option.key} className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-raised">
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm text-fg">{option.label}</span>
                    <span className="block text-2xs text-subtle">{option.hint}</span>
                  </span>
                  <input type="checkbox" className="peer sr-only" checked={on} onChange={() => onToggle(option.key)} />
                  <span
                  aria-hidden
                  className={cn(
                    'relative h-5 w-9 shrink-0 rounded-full transition-colors duration-150 peer-focus-visible:ring-2 peer-focus-visible:ring-primary/60',
                    on ? 'bg-primary' : 'bg-line-strong'
                  )}>

                    <span
                    className={cn(
                      'absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform duration-150 ease-out',
                      on ? 'translate-x-[18px]' : 'translate-x-0.5'
                    )} />

                  </span>
                </label>);

          })}
            <div className="my-1.5 h-px bg-line" />
            <p className="cv-label px-2 pb-1">Basemap</p>
            <div className="grid grid-cols-2 gap-1 p-1">
              {(
            [
            ['theme', 'Analytical'],
            ['streets', 'Streets']] as
            Array<[Basemap, string]>).
            map(([value, label]) =>
            <button
              key={value}
              type="button"
              onClick={() => onBasemap(value)}
              aria-pressed={basemap === value}
              className={cn(
                'cv-focus rounded-lg border px-2 py-1.5 text-xs font-medium transition-colors duration-150',
                basemap === value ? 'border-primary/40 bg-primary/10 text-primary' : 'border-line text-muted hover:text-fg'
              )}>

                  {label}
                </button>
            )}
            </div>
          </motion.div>
        }
      </AnimatePresence>
    </div>);

}