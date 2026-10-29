import React, { useState } from 'react';
import { SlidersHorizontalIcon, XIcon } from 'lucide-react';
import { useFilters } from '../../contexts/FilterContext';
import { useFilterOptions } from '../../hooks/useCrimeQueries';
import { MultiSelect } from './MultiSelect';
import { DateRangeControl } from './DateRangeControl';
import { Sheet } from '../ui/Sheet';
import { Button } from '../ui/Button';
import { Skeleton } from '../ui/Skeleton';
import { severityTone, TONE_DOT } from '../../utils/tones';
import type { MultiFilterKey } from '../../types/crime';
import { cn } from '../../utils/cn';

interface FilterBarProps {
  exclude?: MultiFilterKey[];
  className?: string;
  trailing?: React.ReactNode;
}

interface FieldDef {
  key: MultiFilterKey;
  label: string;
  options: string[];
  render?: (option: string) => React.ReactNode;
}

const severityOption = (option: string) =>
<span className="flex items-center gap-2">
    <span className={cn('h-2 w-2 rounded-full', TONE_DOT[severityTone(option)])} aria-hidden />
    {option}
  </span>;


export function FilterBar({ exclude = [], className, trailing }: FilterBarProps) {
  const { filters, setValues, setDateRange, resetFilters, activeCount } = useFilters();
  const options = useFilterOptions();
  const [sheetOpen, setSheetOpen] = useState(false);

  const allFields: FieldDef[] = [
  { key: 'crimeType', label: 'Crime type', options: options.data?.crimeTypes ?? [] },
  { key: 'area', label: 'Area', options: options.data?.areas ?? [] },
  { key: 'severity', label: 'Severity', options: options.data?.severities ?? [], render: severityOption },
  { key: 'timePeriod', label: 'Time of day', options: options.data?.timePeriods ?? [] },
  { key: 'status', label: 'Status', options: options.data?.statuses ?? [] }];

  const fields = allFields.filter((field) => !exclude.includes(field.key));

  const controls = (variant: 'pill' | 'field') =>
  <>
      <DateRangeControl
      variant={variant}
      start={filters.startDate}
      end={filters.endDate}
      min={options.data?.dateRange.min ?? null}
      max={options.data?.dateRange.max ?? null}
      onChange={setDateRange} />

      {fields.map((field) =>
    <MultiSelect
      key={field.key}
      variant={variant}
      label={field.label}
      options={field.options}
      value={filters[field.key]}
      onChange={(value) => setValues(field.key, value)}
      renderOption={field.render} />

    )}
    </>;


  return (
    <div className={cn('flex items-center gap-2', className)} role="group" aria-label="Filters">
      <div className="hidden flex-wrap items-center gap-1.5 md:flex">
        {options.isLoading ?
        Array.from({ length: 5 }).map((_, index) => <Skeleton key={index} className="h-8 w-28 rounded-lg" />) :

        <>
            {controls('pill')}
            {activeCount > 0 &&
          <button
            type="button"
            onClick={resetFilters}
            className="cv-focus inline-flex h-8 items-center gap-1 rounded-lg px-2 text-xs font-medium text-muted transition-colors duration-150 hover:text-fg">

                <XIcon className="h-3.5 w-3.5" aria-hidden />
                Clear all
              </button>
          }
          </>
        }
      </div>

      <Button
        size="sm"
        variant="secondary"
        className={cn('md:hidden', activeCount > 0 && 'border-primary/35 text-primary')}
        onClick={() => setSheetOpen(true)}
        leadingIcon={<SlidersHorizontalIcon className="h-3.5 w-3.5" aria-hidden />}>

        Filters{activeCount > 0 ? ` · ${activeCount}` : ''}
      </Button>
      {trailing && <div className="ml-auto flex items-center gap-2">{trailing}</div>}

      <Sheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="Filters"
        description="Applied across every page"
        side="bottom"
        footer={
        <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={resetFilters} disabled={activeCount === 0}>
              Clear all
            </Button>
            <Button variant="primary" className="flex-1" onClick={() => setSheetOpen(false)}>
              Show results
            </Button>
          </div>
        }>

        <div className="flex flex-col gap-3 p-5">{controls('field')}</div>
      </Sheet>
    </div>);

}