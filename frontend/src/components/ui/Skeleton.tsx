import React from 'react';
import { cn } from '../../utils/cn';

export function Skeleton({ className, style }: {className?: string;style?: React.CSSProperties;}) {
  return <div className={cn('cv-skeleton rounded-md', className)} style={style} aria-hidden />;
}

const BAR_HEIGHTS = [42, 58, 50, 66, 72, 61, 80, 74, 68, 86, 78, 70];

export function ChartSkeleton({ height = 240 }: {height?: number;}) {
  return (
    <div className="flex items-end gap-2 pt-4" style={{ height }} role="status" aria-label="Loading chart">
      {BAR_HEIGHTS.map((value, index) =>
      <Skeleton key={index} className="flex-1 rounded-sm" style={{ height: `${value}%` }} />
      )}
    </div>);

}

export function BarsSkeleton({ rows = 6 }: {rows?: number;}) {
  return (
    <div className="space-y-3 py-1" role="status" aria-label="Loading">
      {Array.from({ length: rows }).map((_, index) =>
      <div key={index} className="space-y-1.5">
          <Skeleton className="h-3 w-1/3" />
          <Skeleton className="h-2 rounded-full" />
        </div>
      )}
    </div>);

}

export function TableSkeleton({ rows = 6 }: {rows?: number;}) {
  return (
    <div className="divide-y divide-line" role="status" aria-label="Loading records">
      {Array.from({ length: rows }).map((_, index) =>
      <div key={index} className="flex items-center gap-4 py-3">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 flex-1" />
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-24" />
        </div>
      )}
    </div>);

}