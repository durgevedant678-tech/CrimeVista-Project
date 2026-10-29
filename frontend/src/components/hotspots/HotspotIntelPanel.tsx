import { useNavigate } from 'react-router-dom';
import { ArrowUpRightIcon, FilterIcon, SparklesIcon, XIcon } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { useFilters } from '../../contexts/FilterContext';
import { useAssistant } from '../../contexts/AssistantContext';
import { riskTone } from '../../utils/tones';
import { formatNumber, formatPct } from '../../utils/format';
import type { Hotspot } from '../../types/crime';

interface HotspotIntelPanelProps {
  hotspot: Hotspot;
  topCount: number;
  onClose?: () => void;
}

export function HotspotIntelPanel({ hotspot, topCount, onClose }: HotspotIntelPanelProps) {
  const navigate = useNavigate();
  const { filters, toggleValue } = useFilters();
  const assistant = useAssistant();
  const highPct = hotspot.incidentCount ? hotspot.highSeverityCount / hotspot.incidentCount * 100 : 0;
  const relative = topCount ? hotspot.incidentCount / topCount * 100 : 0;
  const filtered = filters.area.includes(hotspot.area);

  return (
    <div>
      <div className="flex items-start justify-between gap-3 border-b border-line px-4 py-3.5">
        <div className="min-w-0">
          <p className="cv-meta">HOTSPOT #{hotspot.rank}</p>
          <h3 className="mt-0.5 truncate text-base font-semibold text-fg">{hotspot.area}</h3>
          <div className="mt-1.5">
            <Badge tone={riskTone(hotspot.riskLevel)} dot>
              {hotspot.riskLevel} risk
            </Badge>
          </div>
        </div>
        {onClose &&
        <button type="button" onClick={onClose} aria-label="Close hotspot details" className="cv-focus rounded-md p-1 text-subtle hover:bg-raised hover:text-fg">
            <XIcon className="h-4 w-4" aria-hidden />
          </button>
        }
      </div>

      <dl className="grid grid-cols-2 gap-px bg-line">
        <Metric label="Incidents" value={formatNumber(hotspot.incidentCount)} />
        <Metric label="Share of filtered" value={formatPct(hotspot.sharePct)} />
        <Metric label="High / critical" value={formatNumber(hotspot.highSeverityCount)} sub={`${highPct.toFixed(1)}% of area`} />
        <Metric label="Dominant crime" value={hotspot.dominantCrimeType ?? '—'} small />
      </dl>

      <div className="space-y-3 px-4 py-3.5">
        <div>
          <div className="flex justify-between text-xs">
            <span className="text-muted">Relative to busiest area</span>
            <span className="tabular-nums font-medium text-fg">{relative.toFixed(0)}%</span>
          </div>
          <div className="relative mt-1.5 h-1.5 rounded-full bg-raised">
            <div className="h-full rounded-full bg-primary" style={{ width: `${relative}%` }} />
            {[30, 50, 75].map((mark) =>
            <span key={mark} className="absolute top-[-3px] h-3 w-px bg-line-strong" style={{ left: `${mark}%` }} aria-hidden />
            )}
          </div>
          <p className="cv-caption mt-1.5">Thresholds: Elevated 30% · High 50% · Very high 75% of the top area’s count.</p>
        </div>
        {hotspot.latitude !== null && hotspot.longitude !== null &&
        <p className="cv-meta">
            Centre of incidents {hotspot.latitude.toFixed(4)}, {hotspot.longitude.toFixed(4)}
          </p>
        }
        <div className="flex flex-col gap-1.5">
          <Button variant="primary" size="sm" onClick={() => navigate(`/areas?area=${encodeURIComponent(hotspot.area)}`)}>
            Open area profile
            <ArrowUpRightIcon className="h-3.5 w-3.5" aria-hidden />
          </Button>
          <div className="grid grid-cols-2 gap-1.5">
            <Button size="sm" onClick={() => toggleValue('area', hotspot.area)} leadingIcon={<FilterIcon className="h-3.5 w-3.5" />}>
              {filtered ? 'Remove filter' : 'Filter to area'}
            </Button>
            <Button
              size="sm"
              onClick={() => {
                assistant.setSelectedArea(hotspot.area);
                assistant.open('What is this hotspot?');
              }}
              leadingIcon={<SparklesIcon className="h-3.5 w-3.5" />}>

              Ask AI
            </Button>
          </div>
        </div>
      </div>
    </div>);

}

function Metric({ label, value, sub, small }: {label: string;value: string;sub?: string;small?: boolean;}) {
  return (
    <div className="bg-surface px-4 py-3">
      <dt className="cv-label">{label}</dt>
      <dd className={small ? 'mt-1 truncate text-sm font-semibold text-fg' : 'mt-0.5 text-lg font-semibold tabular-nums text-fg'}>{value}</dd>
      {sub && <dd className="cv-caption">{sub}</dd>}
    </div>);

}