import React, { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { XIcon } from 'lucide-react';
import { cn } from '../../utils/cn';

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  side?: 'right' | 'bottom' | 'left';
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  hideHeader?: boolean;
}

const EASE = [0.23, 1, 0.32, 1] as const;

/** Accessible modal drawer / bottom sheet with focus trap and Escape-to-close. */
export function Sheet({ open, onClose, title, description, side = 'right', children, footer, className, hideHeader }: SheetProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    restoreRef.current = document.activeElement as HTMLElement;
    const timer = setTimeout(() => {
      const target = panelRef.current?.querySelector<HTMLElement>('[data-autofocus]') ?? panelRef.current;
      target?.focus();
    }, 30);
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'Tab' && panelRef.current) {
        const focusable = panelRef.current.querySelectorAll<HTMLElement>(
          'a[href],button:not([disabled]),input:not([disabled]),select,textarea,[tabindex]:not([tabindex="-1"])'
        );
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('keydown', onKey);
      restoreRef.current?.focus?.();
    };
  }, [open, onClose]);

  const motionProps =
  side === 'bottom' ?
  { initial: { y: '100%' }, animate: { y: 0 }, exit: { y: '100%' } } :
  side === 'left' ?
  { initial: { x: '-100%' }, animate: { x: 0 }, exit: { x: '-100%' } } :
  { initial: { x: '100%' }, animate: { x: 0 }, exit: { x: '100%' } };

  return (
    <AnimatePresence>
      {open &&
      <div className="fixed inset-0 z-[70]">
          <motion.div
          className="absolute inset-0 bg-sunken/60 backdrop-blur-[2px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          aria-hidden />

          <motion.div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label={title}
          tabIndex={-1}
          {...motionProps}
          transition={{ duration: 0.26, ease: EASE }}
          drag={side === 'bottom' ? 'y' : false}
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={{ top: 0, bottom: 0.6 }}
          onDragEnd={(_, info) => {
            if (side === 'bottom' && info.offset.y > 120) onClose();
          }}
          className={cn(
            'absolute flex flex-col bg-surface shadow-pop outline-none',
            side === 'right' && 'inset-y-0 right-0 w-full max-w-md border-l border-line',
            side === 'left' && 'inset-y-0 left-0 w-[280px] border-r border-line',
            side === 'bottom' && 'inset-x-0 bottom-0 max-h-[88vh] rounded-t-2xl border-t border-line',
            className
          )}>

            {side === 'bottom' && <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-line-strong" aria-hidden />}
            {!hideHeader &&
          <div className="flex shrink-0 items-start justify-between gap-3 border-b border-line px-5 py-4">
                <div>
                  <h2 className="cv-section-title text-base">{title}</h2>
                  {description && <p className="cv-caption mt-0.5">{description}</p>}
                </div>
                <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="cv-focus -mr-1 rounded-md p-1.5 text-muted transition-colors duration-150 hover:bg-raised hover:text-fg">

                  <XIcon className="h-4 w-4" aria-hidden />
                </button>
              </div>
          }
            <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
            {footer && <div className="shrink-0 border-t border-line px-5 py-3">{footer}</div>}
          </motion.div>
        </div>
      }
    </AnimatePresence>);

}