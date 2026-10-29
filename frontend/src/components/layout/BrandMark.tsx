import { cn } from '../../utils/cn';

/** CrimeVista mark: a viewpoint "V" resolving onto a located point — raw data becoming a place. */
export function BrandMark({ className }: {className?: string;}) {
  return (
    <svg viewBox="0 0 32 32" className={cn('h-8 w-8', className)} aria-hidden>
      <rect width="32" height="32" rx="8" fill="rgb(var(--cv-primary))" />
      <path d="M8.5 9.5 L16 22.5 L23.5 9.5" fill="none" stroke="rgb(var(--cv-on-primary))" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="16" cy="22.5" r="2.4" fill="rgb(var(--cv-on-primary))" />
      <path d="M11.5 9.5 H20.5" stroke="rgb(var(--cv-on-primary))" strokeOpacity="0.45" strokeWidth="1.6" strokeLinecap="round" />
    </svg>);

}