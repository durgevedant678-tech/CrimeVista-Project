import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeftIcon, ArrowRightIcon, XIcon } from 'lucide-react';
import { TOUR_STEPS } from '../../data/tourSteps';
import { Button } from '../ui/Button';
import { BrandMark } from '../layout/BrandMark';
import { cn } from '../../utils/cn';

export function OnboardingTour({ open, onClose }: {open: boolean;onClose: () => void;}) {
  const [index, setIndex] = useState(0);
  const navigate = useNavigate();
  const step = TOUR_STEPS[index];
  const last = index === TOUR_STEPS.length - 1;

  useEffect(() => {
    if (open) setIndex(0);
  }, [open]);

  useEffect(() => {
    if (open && step.route) navigate(step.route);
  }, [open, step, navigate]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'ArrowRight') setIndex((value) => Math.min(TOUR_STEPS.length - 1, value + 1));
      if (event.key === 'ArrowLeft') setIndex((value) => Math.max(0, value - 1));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const Icon = step.icon;

  return (
    <AnimatePresence>
      {open &&
      <motion.div
        role="dialog"
        aria-modal="false"
        aria-label="Product tour"
        initial={{ opacity: 0, y: 12, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 8, scale: 0.97 }}
        transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
        className="fixed bottom-20 left-1/2 z-[75] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 overflow-hidden rounded-2xl border border-line bg-surface shadow-pop md:bottom-8">

          <div className="flex items-center justify-between border-b border-line px-5 py-3">
            <div className="flex items-center gap-2">
              <BrandMark className="h-5 w-5" />
              <span className="text-xs font-medium text-muted">
                Tour · {index + 1} of {TOUR_STEPS.length}
              </span>
            </div>
            <button type="button" onClick={onClose} aria-label="Close tour" className="cv-focus rounded-md p-1 text-subtle hover:text-fg">
              <XIcon className="h-4 w-4" aria-hidden />
            </button>
          </div>
          <AnimatePresence mode="wait">
            <motion.div
            key={step.title}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
            className="px-5 py-5">

              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <h3 className="mt-3 text-base font-semibold text-fg">{step.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{step.body}</p>
              {step.tip && <p className="mt-3 rounded-lg bg-raised px-3 py-2 text-xs text-muted">{step.tip}</p>}
            </motion.div>
          </AnimatePresence>
          <div className="flex items-center justify-between border-t border-line px-5 py-3">
            <div className="flex gap-1" aria-hidden>
              {TOUR_STEPS.map((_, dot) =>
            <span key={dot} className={cn('h-1.5 rounded-full transition-[width,background-color] duration-200', dot === index ? 'w-5 bg-primary' : 'w-1.5 bg-line-strong')} />
            )}
            </div>
            <div className="flex gap-2">
              {index > 0 &&
            <Button size="sm" variant="ghost" onClick={() => setIndex(index - 1)} leadingIcon={<ArrowLeftIcon className="h-3.5 w-3.5" />}>
                  Back
                </Button>
            }
              <Button size="sm" variant="primary" onClick={() => last ? onClose() : setIndex(index + 1)}>
                {last ? 'Finish' : 'Next'}
                {!last && <ArrowRightIcon className="h-3.5 w-3.5" aria-hidden />}
              </Button>
            </div>
          </div>
        </motion.div>
      }
    </AnimatePresence>);

}