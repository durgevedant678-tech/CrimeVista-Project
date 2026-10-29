import React from 'react';
import { cn } from '../../utils/cn';
import type { Tone } from '../../utils/tones';

const STYLES: Record<Tone, string> = {
  neutral: 'bg-raised text-muted border-line',
  primary: 'bg-primary/10 text-primary border-primary/20',
  teal: 'bg-teal/10 text-teal border-teal/20',
  amber: 'bg-amber/10 text-amber border-amber/25',
  orange: 'bg-orange/10 text-orange border-orange/25',
  danger: 'bg-danger/10 text-danger border-danger/25',
  emerald: 'bg-emerald/10 text-emerald border-emerald/20'
};

interface BadgeProps {
  tone?: Tone;
  children: React.ReactNode;
  dot?: boolean;
  className?: string;
}

export function Badge({ tone = 'neutral', children, dot, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md border px-1.5 py-0.5 text-2xs font-medium',
        STYLES[tone],
        className
      )}>

      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />}
      {children}
    </span>);

}