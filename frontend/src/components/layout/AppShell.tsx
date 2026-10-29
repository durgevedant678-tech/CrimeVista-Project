import { useCallback, useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { MobileNav } from './MobileNav';
import { CommandPalette } from './CommandPalette';
import { Sheet } from '../ui/Sheet';
import { AssistantDrawer } from '../assistant/AssistantDrawer';
import { AssistantLauncher } from '../assistant/AssistantLauncher';
import { OnboardingTour } from '../help/OnboardingTour';
import { onTourRequest } from '../../utils/tour';
import { cn } from '../../utils/cn';

const COLLAPSE_KEY = 'crimevista.sidebar.collapsed';

function initialCollapsed(): boolean {
  try {
    const stored = window.localStorage.getItem(COLLAPSE_KEY);
    if (stored !== null) return stored === 'true';
  } catch {

    // ignore
  }return window.innerWidth < 1280;
}

export function AppShell() {
  const { pathname } = useLocation();
  const [collapsed, setCollapsed] = useState(initialCollapsed);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [tourOpen, setTourOpen] = useState(false);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((value) => {
      try {
        window.localStorage.setItem(COLLAPSE_KEY, String(!value));
      } catch {

        // ignore
      }return !value;
    });
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setSearchOpen((value) => !value);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => onTourRequest(() => setTourOpen(true)), []);
  useEffect(() => setDrawerOpen(false), [pathname]);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-canvas">
      <a
        href="#main"
        className="sr-only z-[100] rounded-md bg-primary px-3 py-2 text-sm font-medium text-on-primary focus:not-sr-only focus:fixed focus:left-3 focus:top-3">

        Skip to content
      </a>

      <aside
        className={cn(
          'hidden shrink-0 border-r border-rail-line transition-[width] duration-200 ease-out md:block',
          collapsed ? 'w-[68px]' : 'w-[240px]'
        )}>

        <Sidebar collapsed={collapsed} onToggle={toggleCollapsed} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar onOpenSearch={() => setSearchOpen(true)} />
        <main id="main" tabIndex={-1} className="relative min-h-0 flex-1 overflow-y-auto pb-14 outline-none md:pb-0">
          <Outlet />
        </main>
      </div>

      <MobileNav onOpenMore={() => setDrawerOpen(true)} />
      <Sheet open={drawerOpen} onClose={() => setDrawerOpen(false)} title="Navigation" side="left" hideHeader className="bg-rail">
        <Sidebar collapsed={false} onNavigate={() => setDrawerOpen(false)} variant="drawer" />
      </Sheet>

      <AssistantLauncher />
      <AssistantDrawer />
      <CommandPalette open={searchOpen} onClose={() => setSearchOpen(false)} />
      <OnboardingTour open={tourOpen} onClose={() => setTourOpen(false)} />
    </div>);

}