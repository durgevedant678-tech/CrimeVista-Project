import { useNavigate } from 'react-router-dom';
import { ArrowUpRightIcon, SparklesIcon, XIcon } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { useAssistant } from '../../contexts/AssistantContext';
import { severityTone } from '../../utils/tones';
import { formatDate } from '../../utils/format';
import type { MapIncident } from '../../types/crime';

export function IncidentPanel({ incident, onClose }: {incident: MapIncident;onClose?: () => void;}) {
  const navigate = useNavigate();
  const assistant = useAssistant();
  return (
    <div>
      <div className="flex items-start justify-between gap-3 border-b border-line px-4 py-3.5">
        <div className="min-w-0">
          <p className="cv-meta">{incident.id}</p>
          <h3 className="mt-0.5 text-base font-semibold text-fg">{incident.crimeType}</h3>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            <Badge tone={severityTone(incident.severity)} dot>
              {incident.severity}
            </Badge>
            <Badge>{formatDate(incident.date)}</Badge>
          </div>
        </div>
        {onClose &&
        <button type="button" onClick={onClose} aria-label="Close incident details" className="cv-focus rounded-md p-1 text-subtle hover:bg-raised hover:text-fg">
            <XIcon className="h-4 w-4" aria-hidden />
          </button>
        }
      </div>
      <dl className="space-y-2.5 px-4 py-3.5 text-sm">
        <Row label="Area" value={incident.area} />
        <Row label="Location" value={`${incident.latitude.toFixed(5)}, ${incident.longitude.toFixed(5)}`} mono />
        {incident.description &&
        <div>
            <dt className="cv-label">Description</dt>
            <dd className="mt-0.5 leading-relaxed text-fg">{incident.description}</dd>
          </div>
        }
      </dl>
      <div className="grid grid-cols-2 gap-1.5 border-t border-line px-4 py-3">
        <Button size="sm" onClick={() => navigate(`/areas?area=${encodeURIComponent(incident.area)}`)}>
          Area profile
          <ArrowUpRightIcon className="h-3.5 w-3.5" aria-hidden />
        </Button>
        <Button
          size="sm"
          onClick={() => {
            assistant.setSelectedIncident(incident.id);
            assistant.setSelectedArea(incident.area);
            assistant.open('How do I inspect an incident?');
          }}
          leadingIcon={<SparklesIcon className="h-3.5 w-3.5" />}>

          Ask AI
        </Button>
      </div>
    </div>);

}

function Row({ label, value, mono }: {label: string;value: string;mono?: boolean;}) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="cv-label">{label}</dt>
      <dd className={mono ? 'font-mono text-xs text-fg' : 'text-right font-medium text-fg'}>{value}</dd>
    </div>);

}