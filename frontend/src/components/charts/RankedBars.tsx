import { motion } from 'framer-motion';
import { CheckIcon } from 'lucide-react';
import type { CategoryCount } from '../../types/crime';
import { cn } from '../../utils/cn';

interface RankedBarsProps {
  data: CategoryCount[];
  total?: number;
  onSelect?: (label: string) => void;
  selected?: string[];
  highlight?: string | null;
  colorFor?: (label: string) => string;
  max?: number;
  ariaLabel: string;
}

/** Horizontal ranked bars — readable labels, exact counts, optional click-to-filter. */
export function RankedBars({ data, total, onSelect, selected = [], highlight, colorFor, max, ariaLabel }: RankedBarsProps) {
  const top = Math.max(1, ...data.map((item) => item.count));
  const sum = total ?? data.reduce((acc, item) => acc + item.count, 0);
  const rows = max ? data.slice(0, max) : data;
  const Tag = onSelect ? 'button' : 'div';

  return (
    <ul className="space-y-1" aria-label={ariaLabel}>
      {rows.map((item, index) => {
        const isSelected = selected.includes(item.label);
        const isHighlight = highlight === item.label;
        const share = sum ? item.count / sum * 100 : 0;
        return (
          <li key={item.label}>
            <Tag
              {...onSelect ?
              { type: 'button' as const, onClick: () => onSelect(item.label), 'aria-pressed': isSelected, title: `Filter by ${item.label}` } :
              {}}
              className={cn(
                'group block w-full rounded-lg px-2 py-1.5 text-left',
                onSelect && 'cv-focus transition-colors duration-150 hover:bg-raised',
                (isSelected || isHighlight) && 'bg-primary/5'
              )}>

              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className={cn('flex min-w-0 items-center gap-1.5 truncate', isHighlight || isSelected ? 'font-medium text-fg' : 'text-fg/90')}>
                  {isSelected && <CheckIcon className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />}
                  <span className="truncate">{item.label}</span>
                </span>
                <span className="shrink-0 tabular-nums">
                  <span className="font-medium text-fg">{item.count.toLocaleString('en-US')}</span>
                  <span className="ml-1.5 text-xs text-subtle">{share.toFixed(1)}%</span>
                </span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-raised">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: colorFor ? colorFor(item.label) : undefined }}
                  initial={{ width: 0 }}
                  animate={{ width: `${item.count / top * 100}%` }}
                  transition={{ duration: 0.45, delay: Math.min(index * 0.03, 0.24), ease: [0.23, 1, 0.32, 1] }}>

                  {!colorFor && <span className={cn('block h-full', isHighlight || isSelected ? 'bg-primary' : 'bg-primary/60')} />}
                </motion.div>
              </div>
            </Tag>
          </li>);

      })}
    </ul>);

}