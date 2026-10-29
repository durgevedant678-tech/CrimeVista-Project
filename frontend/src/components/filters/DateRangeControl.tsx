import { useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CalendarIcon, ChevronDownIcon } from 'lucide-react';
import { usePopover } from '../../hooks/usePopover';
import { formatDate, shiftDays } from '../../utils/format';
import { cn } from '../../utils/cn';

interface DateRangeControlProps {
  start: string | null;
  end: string | null;
  min: string | null;
  max: string | null;
  onChange: (start: string | null, end: string | null) => void;
  variant?: 'pill' | 'field';
}

export function DateRangeControl({ start, end, min, max, onChange, variant = 'pill' }: DateRangeControlProps) {
  const { open, setOpen, ref } = usePopover();

  const presets = useMemo(() => {
    if (!max) return [];
    const list: Array<{label: string;start: string | null;end: string | null;}> = [
    { label: 'All recorded data', start: null, end: null },
    { label: 'Last 30 days of data', start: shiftDays(max, -29), end: max },
    { label: 'Last 90 days of data', start: shiftDays(max, -89), end: max },
    { label: 'Last 12 months of data', start: shiftDays(max, -364), end: max }];

    const firstYear = Number((min ?? max).slice(0, 4));
    const lastYear = Number(max.slice(0, 4));
    for (let year = lastYear; year >= firstYear; year -= 1) {
      list.push({ label: String(year), start: `${year}-01-01`, end: `${year}-12-31` });
    }
    return list;
  }, [min, max]);

  const active = start || end;
  const summary = active ? `${start ? formatDate(start) : 'Start'} – ${end ? formatDate(end) : 'Latest'}` : 'All time';

  return (
    <div ref={ref} className={cn('relative', variant === 'field' && 'w-full')}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={cn(
          'cv-focus inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border text-xs transition-colors duration-150',
          variant === 'field' ? 'h-10 w-full px-3 text-sm' : 'h-8 px-2.5',
          active ? 'border-primary/35 bg-primary/10 text-primary' : 'border-line bg-surface text-fg hover:border-line-strong'
        )}>

        <CalendarIcon className="h-3.5 w-3.5" aria-hidden />
        <span className="font-medium">{summary}</span>
        <ChevronDownIcon className={cn('ml-auto h-3.5 w-3.5 transition-transform duration-150', open && 'rotate-180')} aria-hidden />
      </button>
      <AnimatePresence>
        {open &&
        <motion.div
          role="dialog"
          aria-label="Date range"
          initial={{ opacity: 0, y: -4, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
          className={cn(
            'absolute left-0 top-full z-50 mt-1.5 origin-top-left rounded-xl border border-line bg-surface shadow-pop',
            variant === 'field' ? 'w-full' : 'w-[320px]'
          )}>

            <div className="grid grid-cols-2 gap-1 p-1.5">
              {presets.map((preset) => {
              const selected = preset.start === start && preset.end === end;
              return (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => {
                    onChange(preset.start, preset.end);
                    setOpen(false);
                  }}
                  className={cn(
                    'cv-focus rounded-lg px-2.5 py-1.5 text-left text-xs transition-colors duration-100',
                    selected ? 'bg-primary/10 font-medium text-primary' : 'text-fg hover:bg-raised'
                  )}>

                    {preset.label}
                  </button>);

            })}
            </div>
            <div className="grid grid-cols-2 gap-2 border-t border-line p-3">
              <label className="space-y-1">
                <span className="cv-label">From</span>
                <input
                type="date"
                value={start ?? ''}
                min={min ?? undefined}
                max={end ?? max ?? undefined}
                onChange={(event) => onChange(event.target.value || null, end)}
                className="cv-input h-8 px-2 text-xs" />

              </label>
              <label className="space-y-1">
                <span className="cv-label">To</span>
                <input
                type="date"
                value={end ?? ''}
                min={start ?? min ?? undefined}
                max={max ?? undefined}
                onChange={(event) => onChange(start, event.target.value || null)}
                className="cv-input h-8 px-2 text-xs" />

              </label>
              {max && <p className="cv-caption col-span-2">Data available {formatDate(min)} – {formatDate(max)}</p>}
            </div>
          </motion.div>
        }
      </AnimatePresence>
    </div>);

}