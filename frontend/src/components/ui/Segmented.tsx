import React, { useId } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

interface SegmentedProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: SegmentedOption<T>[];
  label: string;
  size?: 'sm' | 'md';
  className?: string;
}

export function Segmented<T extends string>({ value, onChange, options, label, size = 'sm', className }: SegmentedProps<T>) {
  const layoutId = useId();
  return (
    <div role="tablist" aria-label={label} className={cn('inline-flex rounded-lg border border-line bg-raised p-0.5', className)}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            role="tab"
            type="button"
            aria-selected={active}
            disabled={option.disabled}
            onClick={() => onChange(option.value)}
            className={cn(
              'cv-focus relative inline-flex items-center gap-1.5 whitespace-nowrap rounded-md font-medium transition-colors duration-150',
              size === 'sm' ? 'h-7 px-2.5 text-xs' : 'h-8 px-3 text-sm',
              active ? 'text-fg' : 'text-muted hover:text-fg',
              option.disabled && 'cursor-not-allowed opacity-40 hover:text-muted'
            )}>

            {active &&
            <motion.span
              layoutId={layoutId}
              className="absolute inset-0 rounded-md border border-line bg-surface shadow-panel"
              transition={{ type: 'spring', stiffness: 520, damping: 38 }} />

            }
            <span className="relative flex items-center gap-1.5">
              {option.icon}
              {option.label}
            </span>
          </button>);

      })}
    </div>);

}