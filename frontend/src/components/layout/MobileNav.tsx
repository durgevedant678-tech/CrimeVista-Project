import { NavLink, useLocation } from 'react-router-dom';
import { MenuIcon } from 'lucide-react';
import { MOBILE_PRIMARY, NAV_ITEMS } from '../../data/navigation';
import { cn } from '../../utils/cn';

export function MobileNav({ onOpenMore }: {onOpenMore: () => void;}) {
  const { pathname } = useLocation();
  const items = NAV_ITEMS.filter((item) => MOBILE_PRIMARY.includes(item.to));
  const moreActive = !MOBILE_PRIMARY.some((path) => pathname.startsWith(path));

  return (
    <nav
      aria-label="Primary mobile"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden">

      <ul className="grid grid-cols-5">
        {items.map((item) => {
          const Icon = item.icon;
          const active = pathname.startsWith(item.to);
          return (
            <li key={item.to}>
              <NavLink
                to={item.to}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex h-14 flex-col items-center justify-center gap-1 text-2xs font-medium outline-none transition-colors duration-150 focus-visible:bg-raised',
                  active ? 'text-primary' : 'text-subtle'
                )}>

                <Icon className="h-5 w-5" aria-hidden />
                {item.label.replace('Crime ', '')}
              </NavLink>
            </li>);

        })}
        <li>
          <button
            type="button"
            onClick={onOpenMore}
            className={cn(
              'flex h-14 w-full flex-col items-center justify-center gap-1 text-2xs font-medium outline-none transition-colors duration-150 focus-visible:bg-raised',
              moreActive ? 'text-primary' : 'text-subtle'
            )}>

            <MenuIcon className="h-5 w-5" aria-hidden />
            More
          </button>
        </li>
      </ul>
    </nav>);

}