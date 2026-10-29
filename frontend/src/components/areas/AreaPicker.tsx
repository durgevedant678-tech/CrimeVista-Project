import { useMemo, useState } from 'react';
import { SearchIcon } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { BarsSkeleton } from '../ui/Skeleton';
import { riskTone } from '../../utils/tones';
import type { Hotspot } from '../../types/crime';
import { cn } from '../../utils/cn';

interface AreaPickerProps {
  areas: string[];
  hotspots: Hotspot[];
  selected: string | null;
  onSelect: (area: string) => void;
  loading?: boolean;
}

export function AreaPicker({ areas, hotspots, selected, onSelect, loading }: AreaPickerProps) {
  const [query, setQuery] = useState('');
  const rows = useMemo(() => {
    const byArea = new Map(hotspots.map((hotspot) => [hotspot.area, hotspot]));
    const ranked = hotspots.map((hotspot) => hotspot.area);
    const rest = areas.filter((area) => !byArea.has(area)).sort();
    return [...ranked, ...rest].
    filter((area) => area.toLowerCase().includes(query.trim().toLowerCase())).
    map((area) => ({ area, hotspot: byArea.get(area) ?? null }));
  }, [areas, hotspots, query]);

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-line p-3">
        <div className="flex h-9 items-center gap-2 rounded-lg border border-line bg-raised px-2.5 focus-within:border-primary/50">
          <SearchIcon className="h-4 w-4 text-subtle" aria-hidden />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Find an area"
            aria-label="Find an area"
            className="h-full min-w-0 flex-1 bg-transparent text-sm text-fg placeholder:text-subtle focus:outline-none" />

        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-1.5">
        {loading ?
        <div className="p-2">
            <BarsSkeleton rows={8} />
          </div> :

        <ul role="listbox" aria-label="Areas">
            {rows.map(({ area, hotspot }) => {
            const active = area === selected;
            return (
              <li key={area}>
                  <button
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => onSelect(area)}
                  className={cn(
                    'cv-focus relative flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors duration-150',
                    active ? 'bg-primary/10' : 'hover:bg-raised'
                  )}>

                    {active && <span className="absolute inset-y-2 left-0 w-[3px] rounded-r-full bg-primary" aria-hidden />}
                    <span className="w-5 text-right font-mono text-2xs text-subtle">{hotspot?.rank ?? '—'}</span>
                    <span className={cn('min-w-0 flex-1 truncate text-sm', active ? 'font-semibold text-fg' : 'text-fg')}>{area}</span>
                    {hotspot &&
                  <>
                        <span className="text-xs tabular-nums text-muted">{hotspot.incidentCount.toLocaleString('en-US')}</span>
                        <Badge tone={riskTone(hotspot.riskLevel)} className="hidden w-[68px] justify-center sm:inline-flex">
                          {hotspot.riskLevel}
                        </Badge>
                      </>
                  }
                  </button>
                </li>);

          })}
            {rows.length === 0 && <li className="px-3 py-6 text-center text-xs text-subtle">No area matches “{query}”</li>}
          </ul>
        }
      </div>
    </div>);

}