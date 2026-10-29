import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronRightIcon, CompassIcon, MoonIcon, SearchIcon, SparklesIcon, SunIcon, UserIcon, ShieldCheckIcon, SettingsIcon, BookOpenIcon } from 'lucide-react';
import { findNavItem } from '../../data/navigation';
import { useTheme } from '../../contexts/ThemeContext';
import { useAssistant } from '../../contexts/AssistantContext';
import { useAuthSession } from '../../hooks/useCrimeQueries';
import { useDataSource } from '../../hooks/useDataSource';
import { startTour } from '../../utils/tour';
import { BrandMark } from './BrandMark';
import { cn } from '../../utils/cn';

interface TopBarProps {
  onOpenSearch: () => void;
}

export function TopBar({ onOpenSearch }: TopBarProps) {
  const { pathname } = useLocation();
  const match = findNavItem(pathname);
  const { theme, toggleTheme } = useTheme();
  const assistant = useAssistant();

  return (
    <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center gap-3 border-b border-line bg-canvas/85 px-4 backdrop-blur-md sm:px-6">
      <Link to="/dashboard" className="cv-focus flex items-center gap-2 rounded-md md:hidden" aria-label="CrimeVista home">
        <BrandMark className="h-7 w-7" />
      </Link>

      <nav aria-label="Breadcrumb" className="hidden min-w-0 items-center gap-1.5 text-sm md:flex">
        <span className="text-subtle">{match?.section ?? 'CrimeVista'}</span>
        <ChevronRightIcon className="h-3.5 w-3.5 text-subtle" aria-hidden />
        <span className="truncate font-medium text-fg" aria-current="page">
          {match?.item.label ?? 'Not found'}
        </span>
      </nav>
      <span className="truncate text-sm font-semibold md:hidden">{match?.item.label ?? 'CrimeVista'}</span>

      <div className="ml-auto flex items-center gap-1.5">
        <button
          type="button"
          onClick={onOpenSearch}
          className="cv-focus hidden h-9 w-64 items-center gap-2 rounded-lg border border-line bg-surface px-3 text-sm text-subtle transition-colors duration-150 hover:border-line-strong lg:flex">

          <SearchIcon className="h-4 w-4" aria-hidden />
          <span className="flex-1 text-left">Search areas, pages…</span>
          <kbd className="rounded border border-line bg-raised px-1.5 font-mono text-2xs text-muted">⌘K</kbd>
        </button>
        <button
          type="button"
          onClick={onOpenSearch}
          aria-label="Search"
          className="cv-focus flex h-9 w-9 items-center justify-center rounded-lg text-muted transition-colors duration-150 hover:bg-raised hover:text-fg lg:hidden">

          <SearchIcon className="h-[18px] w-[18px]" aria-hidden />
        </button>

        <button
          type="button"
          onClick={() => assistant.open()}
          className="cv-focus hidden h-9 items-center gap-2 rounded-lg border border-primary/25 bg-primary/10 px-3 text-sm font-medium text-primary transition-colors duration-150 hover:bg-primary/15 sm:flex">

          <SparklesIcon className="h-4 w-4" aria-hidden />
          Ask AI
        </button>

        <button
          type="button"
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          className="cv-focus flex h-9 w-9 items-center justify-center rounded-lg text-muted transition-colors duration-150 hover:bg-raised hover:text-fg">

          {theme === 'dark' ? <SunIcon className="h-[18px] w-[18px]" aria-hidden /> : <MoonIcon className="h-[18px] w-[18px]" aria-hidden />}
        </button>

        <ProfileMenu />
      </div>
    </header>);

}

function ProfileMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const session = useAuthSession();
  const source = useDataSource();
  const isAdmin = Boolean(session.data?.authenticated);

  useEffect(() => {
    if (!open) return;
    const onDown = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
        className={cn(
          'cv-focus flex h-9 w-9 items-center justify-center rounded-full border text-xs font-semibold transition-colors duration-150',
          isAdmin ? 'border-primary/30 bg-primary/15 text-primary' : 'border-line bg-surface text-muted hover:text-fg'
        )}>

        {isAdmin ? 'AD' : <UserIcon className="h-4 w-4" aria-hidden />}
      </button>
      <AnimatePresence>
        {open &&
        <motion.div
          role="menu"
          initial={{ opacity: 0, y: -4, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.97 }}
          transition={{ duration: 0.16, ease: [0.23, 1, 0.32, 1] }}
          className="absolute right-0 top-full z-50 mt-2 w-64 origin-top-right rounded-xl border border-line bg-surface p-1.5 shadow-pop">

            <div className="flex items-center gap-2.5 px-2.5 py-2">
              <ShieldCheckIcon className={cn('h-4 w-4', isAdmin ? 'text-emerald' : 'text-subtle')} aria-hidden />
              <div className="min-w-0">
                <p className="text-sm font-medium text-fg">{isAdmin ? 'Administrator' : 'Analyst (read-only)'}</p>
                <p className="cv-caption truncate">
                  {isAdmin ? 'Upload and reports enabled' : source === 'live' ? 'Sign in to upload or export' : 'Local session'}
                </p>
              </div>
            </div>
            <div className="my-1 h-px bg-line" />
            <MenuLink to="/settings" icon={<SettingsIcon className="h-4 w-4" />} label="Settings" onSelect={() => setOpen(false)} />
            <MenuLink to="/help" icon={<BookOpenIcon className="h-4 w-4" />} label="Help center" onSelect={() => setOpen(false)} />
            <button
            role="menuitem"
            type="button"
            onClick={() => {
              setOpen(false);
              startTour();
            }}
            className="cv-focus flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-muted transition-colors duration-150 hover:bg-raised hover:text-fg">

              <CompassIcon className="h-4 w-4" aria-hidden />
              Take the product tour
            </button>
          </motion.div>
        }
      </AnimatePresence>
    </div>);

}

function MenuLink({ to, icon, label, onSelect }: {to: string;icon: React.ReactNode;label: string;onSelect: () => void;}) {
  return (
    <Link
      role="menuitem"
      to={to}
      onClick={onSelect}
      className="cv-focus flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-muted transition-colors duration-150 hover:bg-raised hover:text-fg">

      {icon}
      {label}
    </Link>);

}