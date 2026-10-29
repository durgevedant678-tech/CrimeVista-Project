import React from 'react';
import { ArrowRightIcon, DatabaseIcon, FileCheck2Icon, MapIcon, TableIcon, UploadCloudIcon, EyeIcon } from 'lucide-react';
import { useChartPalette } from '../../hooks/useChartPalette';
import type { HelpVisual } from '../../data/helpTopics';

export function HelpVisualPanel({ visual }: {visual: HelpVisual;}) {
  const p = useChartPalette();
  if (!visual) return null;

  if (visual === 'severity') {
    return (
      <div className="grid grid-cols-4 gap-2" aria-hidden>
        {[
        ['Critical', p.danger],
        ['High', p.orange],
        ['Medium', p.amber],
        ['Low', p.axis]].
        map(([label, color], index) =>
        <div key={label} className="rounded-lg border border-line bg-surface p-2.5">
            <span className="block h-1.5 rounded-full" style={{ background: color, opacity: 1 - index * 0.12 }} />
            <span className="mt-2 block text-xs font-medium text-fg">{label}</span>
            <span className="text-2xs text-subtle">{index < 2 ? 'Counts as high-severity' : 'Standard'}</span>
          </div>
        )}
      </div>);

  }

  if (visual === 'risk') {
    return (
      <div aria-hidden>
        <div className="relative flex h-3 overflow-hidden rounded-full">
          <span className="w-[30%]" style={{ background: p.teal }} />
          <span className="w-[20%]" style={{ background: p.amber }} />
          <span className="w-[25%]" style={{ background: p.orange }} />
          <span className="w-[25%]" style={{ background: p.danger }} />
        </div>
        <div className="relative mt-1.5 h-4 text-2xs text-subtle">
          {[
          ['0%', 0],
          ['30%', 30],
          ['50%', 50],
          ['75%', 75],
          ['100% (busiest area)', 100]].
          map(([label, left]) =>
          <span key={label} className="absolute -translate-x-1/2 whitespace-nowrap last:-translate-x-full" style={{ left: `${left}%` }}>
              {label}
            </span>
          )}
        </div>
        <div className="mt-2 grid grid-cols-4 text-center text-2xs font-medium text-muted">
          <span>Moderate</span>
          <span>Elevated</span>
          <span>High</span>
          <span>Very high</span>
        </div>
      </div>);

  }

  if (visual === 'layers') {
    return (
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" aria-hidden>
        {[
        ['Heatmap', 'Density, severity-weighted'],
        ['Clusters', 'Counts that expand on click'],
        ['Incidents', 'One dot per record'],
        ['3D columns', 'Height = hotspot volume']].
        map(([label, hint]) =>
        <div key={label} className="rounded-lg border border-line bg-surface p-2.5">
            <MapIcon className="h-4 w-4 text-primary" />
            <span className="mt-1.5 block text-xs font-medium text-fg">{label}</span>
            <span className="text-2xs text-subtle">{hint}</span>
          </div>
        )}
      </div>);

  }

  const steps =
  visual === 'upload' ?
  [
  [UploadCloudIcon, 'Choose CSV'],
  [FileCheck2Icon, 'Validate'],
  [TableIcon, 'Preview'],
  [DatabaseIcon, 'Replace dataset']] :

  [
  [TableIcon, 'Incident records'],
  [DatabaseIcon, 'Analytics service'],
  [MapIcon, 'Map & hotspots'],
  [EyeIcon, 'Decisions']];


  return (
    <div className="flex flex-wrap items-center gap-2" aria-hidden>
      {steps.map(([Icon, label], index) => {
        const StepIcon = Icon as React.ElementType;
        return (
          <React.Fragment key={String(label)}>
            <span className="flex items-center gap-2 rounded-lg border border-line bg-surface px-2.5 py-1.5 text-xs font-medium text-fg">
              <StepIcon className="h-3.5 w-3.5 text-primary" />
              {String(label)}
            </span>
            {index < steps.length - 1 && <ArrowRightIcon className="h-3.5 w-3.5 text-subtle" />}
          </React.Fragment>);

      })}
    </div>);

}