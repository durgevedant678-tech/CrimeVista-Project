import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon, MapIcon } from 'lucide-react';
import { useCrimeRecords } from '../../hooks/useCrimeQueries';
import { useFilters } from '../../contexts/FilterContext';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { EmptyState } from '../ui/EmptyState';
import { ErrorState } from '../ui/ErrorState';
import { TableSkeleton } from '../ui/Skeleton';
import { severityTone } from '../../utils/tones';
import { formatDate, formatNumber } from '../../utils/format';
import { cn } from '../../utils/cn';

const PAGE_SIZE = 10;

/** Records from GET /crimes. The API orders by date ascending, so "newest first" reads from the last page. */
export function IncidentTable({ filteredTotal }: {filteredTotal?: number;}) {
  const navigate = useNavigate();
  const { filters } = useFilters();
  const lastPage = Math.max(1, Math.ceil((filteredTotal ?? 0) / PAGE_SIZE));
  const [page, setPage] = useState<number | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => setPage(null), [filters, filteredTotal]);
  const current = page ?? lastPage;
  const query = useCrimeRecords(current, PAGE_SIZE, filteredTotal !== undefined);
  const items = [...(query.data?.items ?? [])].reverse();
  const displayPage = lastPage - current + 1;

  if (query.isError) return <ErrorState error={query.error} onRetry={() => query.refetch()} compact />;
  if (filteredTotal === 0) return <EmptyState />;
  if (!query.data) return <TableSkeleton rows={6} />;

  return (
    <div>
      <div className="-mx-4 overflow-x-auto sm:-mx-5">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-y border-line bg-raised/60 text-left text-xs text-muted">
              <th scope="col" className="w-8 py-2 pl-4 sm:pl-5" />
              <th scope="col" className="py-2 pr-4 font-medium">Date</th>
              <th scope="col" className="py-2 pr-4 font-medium">Crime type</th>
              <th scope="col" className="py-2 pr-4 font-medium">Area</th>
              <th scope="col" className="py-2 pr-4 font-medium">Severity</th>
              <th scope="col" className="py-2 pr-4 font-medium">Status</th>
              <th scope="col" className="py-2 pr-4 font-medium sm:pr-5">Time</th>
            </tr>
          </thead>
          <tbody className={cn('divide-y divide-line transition-opacity duration-150', query.isFetching && 'opacity-60')}>
            {items.map((item) => {
              const open = expanded === item.id;
              return (
                <React.Fragment key={item.id}>
                  <tr
                    className="cursor-pointer transition-colors duration-100 hover:bg-raised/60"
                    onClick={() => setExpanded(open ? null : item.id)}>

                    <td className="py-2.5 pl-4 sm:pl-5">
                      <button
                        type="button"
                        aria-expanded={open}
                        aria-label={open ? 'Collapse record' : 'Expand record'}
                        onClick={(event) => {
                          event.stopPropagation();
                          setExpanded(open ? null : item.id);
                        }}
                        className="cv-focus rounded text-subtle">

                        <ChevronDownIcon className={cn('h-4 w-4 transition-transform duration-150', open && 'rotate-180')} aria-hidden />
                      </button>
                    </td>
                    <td className="whitespace-nowrap py-2.5 pr-4 tabular-nums text-muted">{formatDate(item.date)}</td>
                    <td className="py-2.5 pr-4 font-medium text-fg">{item.crimeType}</td>
                    <td className="py-2.5 pr-4 text-fg">{item.area}</td>
                    <td className="py-2.5 pr-4">
                      <Badge tone={severityTone(item.severity)} dot>
                        {item.severity}
                      </Badge>
                    </td>
                    <td className="whitespace-nowrap py-2.5 pr-4 text-muted">{item.status ?? '—'}</td>
                    <td className="py-2.5 pr-4 text-muted sm:pr-5">{item.timePeriod ?? '—'}</td>
                  </tr>
                  <AnimatePresence initial={false}>
                    {open &&
                    <tr>
                        <td colSpan={7} className="p-0">
                          <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
                          className="overflow-hidden bg-raised/40">

                            <div className="flex flex-wrap items-start justify-between gap-4 px-4 py-3 sm:px-5 sm:pl-12">
                              <div className="max-w-xl space-y-1">
                                <p className="cv-meta">{item.id}</p>
                                <p className="text-sm text-fg">{item.description ?? 'No description recorded.'}</p>
                                {item.latitude !== null && item.longitude !== null &&
                              <p className="cv-meta">
                                    {item.latitude.toFixed(5)}, {item.longitude.toFixed(5)}
                                  </p>
                              }
                              </div>
                              {item.latitude !== null &&
                            <Button size="sm" onClick={() => navigate(`/map?incident=${encodeURIComponent(item.id)}&lat=${item.latitude}&lng=${item.longitude}`)} leadingIcon={<MapIcon className="h-3.5 w-3.5" />}>
                                  Show on map
                                </Button>
                            }
                            </div>
                          </motion.div>
                        </td>
                      </tr>
                    }
                  </AnimatePresence>
                </React.Fragment>);

            })}
          </tbody>
        </table>
      </div>
      <div className="mt-3 flex items-center justify-between gap-3 text-xs text-muted">
        <span>
          Newest first · page {displayPage} of {formatNumber(lastPage)}
        </span>
        <div className="flex gap-1">
          <Button size="icon-sm" variant="ghost" aria-label="Newer records" disabled={current >= lastPage} onClick={() => setPage(Math.min(lastPage, current + 1))}>
            <ChevronLeftIcon className="h-4 w-4" />
          </Button>
          <Button size="icon-sm" variant="ghost" aria-label="Older records" disabled={current <= 1} onClick={() => setPage(Math.max(1, current - 1))}>
            <ChevronRightIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>);

}