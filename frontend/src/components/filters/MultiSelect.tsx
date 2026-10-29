import React, { useId, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckIcon, ChevronDownIcon, SearchIcon } from 'lucide-react';
import { usePopover } from '../../hooks/usePopover';
import { cn } from '../../utils/cn';

interface MultiSelectProps {
  label: string;
  options: string[];
  value: string[];
  onChange: (value: string[]) => void;
  renderOption?: (option: string) => React.ReactNode;
  variant?: 'pill' | 'field';
}

export function MultiSelect({ label, options, value, onChange, renderOption, variant = 'pill' }: MultiSelectProps) {
  const { open, setOpen, ref } = usePopover();
  const [query, setQuery] = useState('');
  const listId = useId();
  const filtered = useMemo(
    () => options.filter((option) => option.toLowerCase().includes(query.trim().toLowerCase())),
    [options, query]
  );
  const toggle = (option: string) =>
  onChange(value.includes(option) ? value.filter((item) => item !== option) : [...value, option]);

  const summary = value.length === 0 ? 'All' : value.length === 1 ? value[0] : `${value.length} selected`;

  return (
    <div ref={ref} className={cn('relative', variant === 'field' && 'w-full')}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        className={cn(
          'cv-focus inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border text-xs transition-colors duration-150',
          variant === 'field' ? 'h-10 w-full justify-between px-3 text-sm' : 'h-8 px-2.5',
          value.length ? 'border-primary/35 bg-primary/10 text-fg' : 'border-line bg-surface text-muted hover:border-line-strong hover:text-fg'
        )}>

        <span className={cn(value.length ? 'text-muted' : '')}>{label}</span>
        <span className={cn('max-w-[9rem] truncate font-medium', value.length ? 'text-primary' : 'text-fg')}>{summary}</span>
        <ChevronDownIcon className={cn('h-3.5 w-3.5 transition-transform duration-150', open && 'rotate-180')} aria-hidden />
      </button>
      <AnimatePresence>
        {open &&
        <motion.div
          initial={{ opacity: 0, y: -4, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
          className={cn(
            'absolute left-0 top-full z-50 mt-1.5 origin-top-left rounded-xl border border-line bg-surface p-1.5 shadow-pop',
            variant === 'field' ? 'w-full' : 'w-60'
          )}>

            {options.length > 7 &&
          <div className="mb-1 flex items-center gap-2 border-b border-line px-2 pb-1.5">
                <SearchIcon className="h-3.5 w-3.5 text-subtle" aria-hidden />
                <input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={`Search ${label.toLowerCase()}`}
              aria-label={`Search ${label}`}
              className="h-7 flex-1 bg-transparent text-xs text-fg placeholder:text-subtle focus:outline-none" />

              </div>
          }
            <ul id={listId} role="listbox" aria-multiselectable="true" aria-label={label} className="max-h-64 overflow-y-auto">
              {filtered.map((option) => {
              const selected = value.includes(option);
              return (
                <li key={option}>
                    <button
                    type="button"
                    role="option"
                    aria-selected={selected}
                    onClick={() => toggle(option)}
                    className="cv-focus flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-sm text-fg transition-colors duration-100 hover:bg-raised">

                      <span
                      className={cn(
                        'flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors duration-100',
                        selected ? 'border-primary bg-primary text-on-primary' : 'border-line-strong'
                      )}>

                        {selected && <CheckIcon className="h-3 w-3" strokeWidth={3} aria-hidden />}
                      </span>
                      {renderOption ? renderOption(option) : <span className="truncate">{option}</span>}
                    </button>
                  </li>);

            })}
              {filtered.length === 0 && <li className="px-2 py-3 text-center text-xs text-subtle">No matches</li>}
            </ul>
            {value.length > 0 &&
          <div className="mt-1 border-t border-line px-1 pt-1.5">
                <button type="button" onClick={() => onChange([])} className="cv-focus rounded px-1 text-xs font-medium text-primary">
                  Clear {label.toLowerCase()}
                </button>
              </div>
          }
          </motion.div>
        }
      </AnimatePresence>
    </div>);

}