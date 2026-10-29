import { motion } from 'framer-motion';
import { Badge } from '../ui/Badge';
import { riskTone, TONE_DOT } from '../../utils/tones';
import type { Hotspot } from '../../types/crime';
import { cn } from '../../utils/cn';

interface HotspotListProps {
  hotspots: Hotspot[];
  selectedArea: string | null;
  onSelect: (hotspot: Hotspot) => void;
  limit?: number;
  dense?: boolean;
}

export function HotspotList({ hotspots, selectedArea, onSelect, limit, dense }: HotspotListProps) {
  const rows = limit ? hotspots.slice(0, limit) : hotspots;
  const top = Math.max(1, hotspots[0]?.incidentCount ?? 1);
  return (
    <ol className="space-y-0.5" aria-label="Hotspots ranked by incident count">
      {rows.map((hotspot, index) => {
        const active = hotspot.area === selectedArea;
        const highPct = hotspot.incidentCount ? hotspot.highSeverityCount / hotspot.incidentCount * 100 : 0;
        return (
          <motion.li
            key={hotspot.area}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: Math.min(index * 0.035, 0.3), ease: [0.23, 1, 0.32, 1] }}>

            <button
              type="button"
              onClick={() => onSelect(hotspot)}
              aria-pressed={active}
              className={cn(
                'cv-focus group relative flex w-full items-center gap-3 rounded-lg px-2.5 text-left transition-colors duration-150',
                dense ? 'py-2' : 'py-2.5',
                active ? 'bg-primary/10' : 'hover:bg-raised'
              )}>

              {active && <span className="absolute inset-y-2 left-0 w-[3px] rounded-r-full bg-primary" aria-hidden />}
              <span className={cn('w-5 shrink-0 text-right font-mono text-xs tabular-nums', index < 3 ? 'text-fg' : 'text-subtle')}>
                {hotspot.rank}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className="truncate text-sm font-medium text-fg">{hotspot.area}</span>
                  {!dense &&
                  <Badge tone={riskTone(hotspot.riskLevel)} className="hidden xl:inline-flex">
                      {hotspot.riskLevel}
                    </Badge>
                  }
                </span>
                <span className="mt-1 flex items-center gap-2">
                  <span className="h-1 flex-1 overflow-hidden rounded-full bg-raised">
                    <span
                      className={cn('block h-full rounded-full', TONE_DOT[riskTone(hotspot.riskLevel)])}
                      style={{ width: `${hotspot.incidentCount / top * 100}%` }} />

                  </span>
                  {!dense && <span className="cv-caption shrink-0 tabular-nums">{highPct.toFixed(0)}% high-sev</span>}
                </span>
              </span>
              <span className="shrink-0 text-right">
                <span className="block text-sm font-semibold tabular-nums text-fg">{hotspot.incidentCount.toLocaleString('en-US')}</span>
                <span className="block text-2xs tabular-nums text-subtle">{hotspot.sharePct?.toFixed(1)}%</span>
              </span>
            </button>
          </motion.li>);

      })}
    </ol>);

}