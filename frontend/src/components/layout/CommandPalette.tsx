import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { CornerDownLeftIcon, MapPinIcon, MoonIcon, SearchIcon, SparklesIcon } from 'lucide-react';
import { NAV_ITEMS } from '../../data/navigation';
import { useFilterOptions } from '../../hooks/useCrimeQueries';
import { useTheme } from '../../contexts/ThemeContext';
import { useAssistant } from '../../contexts/AssistantContext';
import { cn } from '../../utils/cn';

interface PaletteEntry {
  id: string;
  group: string;
  label: string;
  hint: string;
  icon: React.ReactNode;
  run: () => void;
}

export function CommandPalette({ open, onClose }: {open: boolean;onClose: () => void;}) {
  const navigate = useNavigate();
  const options = useFilterOptions();
  const { toggleTheme } = useTheme();
  const assistant = useAssistant();
  const [query, setQuery] = useState('');
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQuery('');
      setCursor(0);
      setTimeout(() => inputRef.current?.focus(), 20);
    }
  }, [open]);

  const entries = useMemo<PaletteEntry[]>(() => {
    const pages = NAV_ITEMS.map((item) => {
      const Icon = item.icon;
      return {
        id: `page-${item.to}`,
        group: 'Pages',
        label: item.label,
        hint: item.description,
        icon: <Icon className="h-4 w-4" />,
        run: () => navigate(item.to)
      };
    });
    const areas = (options.data?.areas ?? []).map((area) => ({
      id: `area-${area}`,
      group: 'Areas',
      label: area,
      hint: 'Open area profile',
      icon: <MapPinIcon className="h-4 w-4" />,
      run: () => navigate(`/areas?area=${encodeURIComponent(area)}`)
    }));
    const actions = [
    { id: 'ai', group: 'Actions', label: 'Ask CrimeVista AI', hint: 'Open assistant', icon: <SparklesIcon className="h-4 w-4" />, run: () => assistant.open() },
    { id: 'theme', group: 'Actions', label: 'Toggle theme', hint: 'Light / dark', icon: <MoonIcon className="h-4 w-4" />, run: toggleTheme }];

    const all = [...pages, ...areas, ...actions];
    const q = query.trim().toLowerCase();
    return q ? all.filter((entry) => `${entry.label} ${entry.hint}`.toLowerCase().includes(q)) : all;
  }, [options.data, query, navigate, assistant, toggleTheme]);

  useEffect(() => setCursor(0), [query]);

  const select = (entry: PaletteEntry) => {
    onClose();
    entry.run();
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setCursor((value) => Math.min(entries.length - 1, value + 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setCursor((value) => Math.max(0, value - 1));
    } else if (event.key === 'Enter' && entries[cursor]) {
      event.preventDefault();
      select(entries[cursor]);
    } else if (event.key === 'Escape') onClose();
  };

  let lastGroup = '';

  return (
    <AnimatePresence>
      {open &&
      <div className="fixed inset-0 z-[80] flex items-start justify-center px-4 pt-[12vh]">
          <motion.div
          className="absolute inset-0 bg-sunken/60 backdrop-blur-[2px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={onClose}
          aria-hidden />

          <motion.div
          role="dialog"
          aria-modal="true"
          aria-label="Search CrimeVista"
          initial={{ opacity: 0, scale: 0.96, y: -8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97 }}
          transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
          className="relative w-full max-w-lg overflow-hidden rounded-xl border border-line bg-surface shadow-pop">

            <div className="flex items-center gap-3 border-b border-line px-4">
              <SearchIcon className="h-4 w-4 text-subtle" aria-hidden />
              <input
              ref={inputRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Search areas, pages, actions…"
              aria-label="Search"
              role="combobox"
              aria-expanded="true"
              aria-controls="palette-results"
              aria-activedescendant={entries[cursor]?.id}
              className="h-12 flex-1 bg-transparent text-sm text-fg placeholder:text-subtle focus:outline-none" />

              <kbd className="rounded border border-line bg-raised px-1.5 font-mono text-2xs text-muted">Esc</kbd>
            </div>
            <ul id="palette-results" role="listbox" className="max-h-80 overflow-y-auto p-1.5">
              {entries.length === 0 && <li className="px-3 py-8 text-center text-sm text-subtle">No matches for “{query}”</li>}
              {entries.map((entry, index) => {
              const header = entry.group !== lastGroup ? entry.group : null;
              lastGroup = entry.group;
              return (
                <React.Fragment key={entry.id}>
                    {header && <li className="px-2.5 pb-1 pt-2.5 text-2xs font-medium text-subtle">{header}</li>}
                    <li
                    id={entry.id}
                    role="option"
                    aria-selected={index === cursor}
                    onMouseEnter={() => setCursor(index)}
                    onClick={() => select(entry)}
                    className={cn(
                      'flex cursor-pointer items-center gap-3 rounded-lg px-2.5 py-2 text-sm',
                      index === cursor ? 'bg-primary/10 text-fg' : 'text-muted'
                    )}>

                      <span className={cn(index === cursor ? 'text-primary' : 'text-subtle')}>{entry.icon}</span>
                      <span className="font-medium">{entry.label}</span>
                      <span className="cv-caption ml-auto truncate">{entry.hint}</span>
                      {index === cursor && <CornerDownLeftIcon className="h-3.5 w-3.5 text-subtle" aria-hidden />}
                    </li>
                  </React.Fragment>);

            })}
            </ul>
          </motion.div>
        </div>
      }
    </AnimatePresence>);

}