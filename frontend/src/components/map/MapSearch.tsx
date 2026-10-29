import { useMemo, useState } from 'react';
import { FileSearchIcon, MapPinIcon, SearchIcon, XIcon } from 'lucide-react';
import { usePopover } from '../../hooks/usePopover';
import type { Hotspot, MapIncident } from '../../types/crime';
import { cn } from '../../utils/cn';

interface MapSearchProps {
  hotspots: Hotspot[];
  incidents: MapIncident[];
  onArea: (area: string) => void;
  onIncident: (incident: MapIncident) => void;
  className?: string;
}

export function MapSearch({ hotspots, incidents, onArea, onIncident, className }: MapSearchProps) {
  const { open, setOpen, ref } = usePopover();
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();

  const results = useMemo(() => {
    if (!q) return { areas: hotspots.slice(0, 6), incidents: [] as MapIncident[] };
    return {
      areas: hotspots.filter((hotspot) => hotspot.area.toLowerCase().includes(q)).slice(0, 6),
      incidents: q.length >= 3 ? incidents.filter((incident) => incident.id.toLowerCase().includes(q)).slice(0, 5) : []
    };
  }, [q, hotspots, incidents]);

  return (
    <div ref={ref} className={cn('pointer-events-auto relative w-full sm:w-72', className)}>
      <div className="flex h-10 items-center gap-2 rounded-xl border border-line bg-surface/95 px-3 shadow-lift backdrop-blur focus-within:border-primary/50">
        <SearchIcon className="h-4 w-4 shrink-0 text-subtle" aria-hidden />
        <input
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search area or incident ID"
          aria-label="Search the map"
          className="h-full min-w-0 flex-1 bg-transparent text-sm text-fg placeholder:text-subtle focus:outline-none" />

        {query &&
        <button type="button" onClick={() => setQuery('')} aria-label="Clear search" className="cv-focus rounded text-subtle hover:text-fg">
            <XIcon className="h-4 w-4" aria-hidden />
          </button>
        }
      </div>
      {open && (results.areas.length > 0 || results.incidents.length > 0 || q) &&
      <div className="absolute left-0 right-0 top-full z-30 mt-1.5 max-h-80 overflow-y-auto rounded-xl border border-line bg-surface p-1.5 shadow-pop">
          {results.areas.length > 0 && <p className="cv-label px-2 pb-1 pt-1">Areas</p>}
          {results.areas.map((hotspot) =>
        <button
          key={hotspot.area}
          type="button"
          onClick={() => {
            onArea(hotspot.area);
            setOpen(false);
          }}
          className="cv-focus flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-sm text-fg hover:bg-raised">

              <MapPinIcon className="h-3.5 w-3.5 text-subtle" aria-hidden />
              <span className="flex-1 truncate">{hotspot.area}</span>
              <span className="cv-meta">#{hotspot.rank}</span>
            </button>
        )}
          {results.incidents.length > 0 && <p className="cv-label px-2 pb-1 pt-2">Incidents</p>}
          {results.incidents.map((incident) =>
        <button
          key={incident.id}
          type="button"
          onClick={() => {
            onIncident(incident);
            setOpen(false);
          }}
          className="cv-focus flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-sm text-fg hover:bg-raised">

              <FileSearchIcon className="h-3.5 w-3.5 text-subtle" aria-hidden />
              <span className="font-mono text-xs">{incident.id}</span>
              <span className="cv-caption ml-auto truncate">{incident.crimeType}</span>
            </button>
        )}
          {q && results.areas.length === 0 && results.incidents.length === 0 &&
        <p className="px-2 py-3 text-center text-xs text-subtle">No plotted area or incident matches “{query}”</p>
        }
        </div>
      }
    </div>);

}