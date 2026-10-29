import { useId, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { InfoIcon } from 'lucide-react';
import { cn } from '../../utils/cn';

interface InfoTipProps {
  content: string;
  side?: 'top' | 'bottom';
  className?: string;
}

export function InfoTip({ content, side = 'top', className }: InfoTipProps) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <span className={cn('relative inline-flex', className)}>
      <button
        type="button"
        aria-label="More information"
        aria-describedby={open ? id : undefined}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={() => setOpen((value) => !value)}
        className="cv-focus rounded text-subtle transition-colors duration-150 hover:text-muted">

        <InfoIcon className="h-3.5 w-3.5" aria-hidden />
      </button>
      <AnimatePresence>
        {open &&
        <motion.span
          id={id}
          role="tooltip"
          initial={{ opacity: 0, y: side === 'top' ? 4 : -4, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.97 }}
          transition={{ duration: 0.14, ease: [0.23, 1, 0.32, 1] }}
          className={cn(
            'pointer-events-none absolute left-1/2 z-50 w-64 -translate-x-1/2 rounded-lg border border-line bg-surface px-3 py-2 text-xs font-normal leading-relaxed text-muted shadow-pop',
            side === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'
          )}>

            {content}
          </motion.span>
        }
      </AnimatePresence>
    </span>);

}