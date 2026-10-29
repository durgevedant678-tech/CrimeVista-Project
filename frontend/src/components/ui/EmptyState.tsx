import React from 'react';
import { SearchXIcon } from 'lucide-react';
import { Button } from './Button';
import { useFilters } from '../../contexts/FilterContext';
import { cn } from '../../utils/cn';

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  showClearFilters?: boolean;
  className?: string;
}

export function EmptyState({
  title = 'No incidents match your current filters',
  description = 'Try widening the date range or removing a filter.',
  icon,
  action,
  showClearFilters = true,
  className
}: EmptyStateProps) {
  const { activeCount, resetFilters } = useFilters();
  return (
    <div className={cn('flex flex-col items-center justify-center px-6 py-10 text-center', className)}>
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full border border-line bg-raised text-subtle">
        {icon ?? <SearchXIcon className="h-5 w-5" aria-hidden />}
      </div>
      <p className="text-sm font-medium text-fg">{title}</p>
      <p className="cv-caption mt-1 max-w-xs">{description}</p>
      <div className="mt-4 flex gap-2">
        {showClearFilters && activeCount > 0 &&
        <Button size="sm" variant="secondary" onClick={resetFilters}>
            Clear filters
          </Button>
        }
        {action}
      </div>
    </div>);

}