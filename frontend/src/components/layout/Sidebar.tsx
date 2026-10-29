import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronsLeftIcon, ChevronsRightIcon, SparklesIcon } from 'lucide-react';
import { NAV_SECTIONS } from '../../data/navigation';
import { useAssistant } from '../../contexts/AssistantContext';
import { useDataSource } from '../../hooks/useDataSource';
import { BrandMark } from './BrandMark';
import { cn } from '../../utils/cn';

interface SidebarProps {
  collapsed: boolean;
  onToggle?: () => void;
  onNavigate?: () => void;
  variant?: 'rail' | 'drawer';
}

const EASE = [0.23, 1, 0.32, 1] as const;

export function Sidebar({ collapsed, onToggle, onNavigate, variant = 'rail' }: SidebarProps) {
  const { pathname } = useLocation();
  const assistant = useAssistant();
  const source = useDataSource();
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <nav aria-label="Primary" className="flex h-full flex-col bg-rail text-rail-fg">
      <div className={cn('flex h-14 shrink-0 items-center gap-2.5 border-b border-rail-line', collapsed ? 'justify-center px-0' : 'px-4')}>
        <BrandMark className="h-7 w-7 shrink-0" />
        {!collapsed &&
        <div className="min-w-0 leading-tight">
            <p className="text-sm font-semibold tracking-[0.02em]">CRIMEVISTA</p>
            <p className="truncate text-2xs text-rail-muted">Urban crime intelligence</p>
          </div>
        }
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden px-2.5 py-3">
        {NAV_SECTIONS.map((section) =>
        <div key={section.title} className="mb-4">
            {!collapsed ?
          <p className="px-2.5 pb-1.5 text-2xs font-medium text-rail-muted">{section.title}</p> :

          <div className="mx-auto mb-2 h-px w-6 bg-rail-line" aria-hidden />
          }
            <ul className="space-y-0.5">
              {section.items.map((item) => {
              const active = pathname.startsWith(item.to);
              const Icon = item.icon;
              return (
                <li key={item.to} className="relative">
                    <NavLink
                    to={item.to}
                    onClick={onNavigate}
                    onMouseEnter={() => setHovered(item.to)}
                    onMouseLeave={() => setHovered(null)}
                    onFocus={() => setHovered(item.to)}
                    onBlur={() => setHovered(null)}
                    aria-current={active ? 'page' : undefined}
                    aria-label={collapsed ? item.label : undefined}
                    className={cn(
                      'group relative flex h-9 items-center gap-3 rounded-lg text-sm outline-none transition-colors duration-150',
                      'focus-visible:ring-2 focus-visible:ring-primary/70',
                      collapsed ? 'justify-center px-0' : 'px-2.5',
                      active ? 'text-rail-fg' : 'text-rail-muted hover:bg-rail-hover hover:text-rail-fg'
                    )}>

                      {active &&
                    <motion.span
                      layoutId={`nav-active-${variant}`}
                      className="absolute inset-0 rounded-lg bg-primary/15 ring-1 ring-inset ring-primary/25"
                      transition={{ type: 'spring', stiffness: 500, damping: 40 }} />

                    }
                      {active &&
                    <motion.span
                      layoutId={`nav-bar-${variant}`}
                      className="absolute -left-2.5 top-1.5 h-6 w-[3px] rounded-r-full bg-primary"
                      transition={{ type: 'spring', stiffness: 500, damping: 40 }} />

                    }
                      <Icon className={cn('relative h-[18px] w-[18px] shrink-0', active && 'text-primary')} aria-hidden />
                      {!collapsed && <span className="relative truncate font-medium">{item.label}</span>}
                    </NavLink>
                    <AnimatePresence>
                      {collapsed && hovered === item.to &&
                    <motion.span
                      role="tooltip"
                      initial={{ opacity: 0, x: -4 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.14, ease: EASE }}
                      className="pointer-events-none absolute left-full top-1/2 z-50 ml-3 -translate-y-1/2 whitespace-nowrap rounded-md border border-line bg-surface px-2.5 py-1.5 text-xs font-medium text-fg shadow-pop">

                          {item.label}
                        </motion.span>
                    }
                    </AnimatePresence>
                  </li>);

            })}
              {section.title === 'Intelligence' &&
            <li>
                  <button
                type="button"
                onClick={() => {
                  assistant.open();
                  onNavigate?.();
                }}
                aria-label={collapsed ? 'Open CrimeVista AI' : undefined}
                className={cn(
                  'flex h-9 w-full items-center gap-3 rounded-lg text-sm text-rail-muted outline-none transition-colors duration-150 hover:bg-rail-hover hover:text-rail-fg focus-visible:ring-2 focus-visible:ring-primary/70',
                  collapsed ? 'justify-center' : 'px-2.5'
                )}>

                    <SparklesIcon className="h-[18px] w-[18px] shrink-0" aria-hidden />
                    {!collapsed && <span className="font-medium">CrimeVista AI</span>}
                  </button>
                </li>
            }
            </ul>
          </div>
        )}
      </div>

      <div className={cn('shrink-0 border-t border-rail-line p-2.5', collapsed && 'flex flex-col items-center gap-2')}>
        <div className={cn('flex items-center gap-2 rounded-lg', collapsed ? 'justify-center py-1' : 'px-2.5 py-2')} title={sourceLabel(source)}>
          <span
            className={cn(
              'h-2 w-2 shrink-0 rounded-full',
              source === 'live' ? 'bg-emerald' : source === 'local' ? 'bg-primary' : 'animate-pulse bg-amber'
            )}
            aria-hidden />

          {!collapsed &&
          <div className="min-w-0 leading-tight">
              <p className="truncate text-xs font-medium text-rail-fg">{sourceLabel(source)}</p>
              <p className="truncate text-2xs text-rail-muted">{sourceHint(source)}</p>
            </div>
          }
        </div>
        {onToggle &&
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={!collapsed}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className={cn(
            'mt-1 flex h-8 items-center gap-2 rounded-lg text-xs text-rail-muted outline-none transition-colors duration-150 hover:bg-rail-hover hover:text-rail-fg focus-visible:ring-2 focus-visible:ring-primary/70',
            collapsed ? 'w-8 justify-center' : 'w-full px-2.5'
          )}>

            {collapsed ? <ChevronsRightIcon className="h-4 w-4" aria-hidden /> : <ChevronsLeftIcon className="h-4 w-4" aria-hidden />}
            {!collapsed && 'Collapse'}
          </button>
        }
      </div>
    </nav>);

}

function sourceLabel(source: string) {
  if (source === 'live') return 'Connected to API';
  if (source === 'local') return 'Local analytics engine';
  return 'Connecting…';
}

function sourceHint(source: string) {
  if (source === 'live') return 'CrimeVista server';
  if (source === 'local') return 'Configured example dataset';
  return 'Checking data service';
}