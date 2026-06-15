import { useLocation } from 'react-router-dom';
import { MobileSidebar } from './MobileSidebar';
import { NotificationsPopover } from './NotificationsPopover';
import { ProfileMenu } from './ProfileMenu';
import { ThemeSwitch } from './ThemeSwitch';
import { NAV_ITEMS } from './nav';

function usePageTitle() {
  const { pathname } = useLocation();
  if (pathname === '/') return NAV_ITEMS[0].label;
  return NAV_ITEMS.find(n => n.path !== '/' && pathname.startsWith(n.path))?.label ?? '';
}

export function Header() {
  const title = usePageTitle();
  return (
    <header className="h-14 ios-header flex items-center px-4 gap-3 shrink-0">
      <MobileSidebar />

      {title && (
        <span className="font-bold text-base text-[var(--ios-text-primary)] tracking-tight">
          {title}
        </span>
      )}

      <div className="flex-1" />

      <ThemeSwitch />
      <NotificationsPopover />
      <div className="w-px h-5 bg-[var(--ios-border)] mx-1" />
      <ProfileMenu />
    </header>
  );
}
