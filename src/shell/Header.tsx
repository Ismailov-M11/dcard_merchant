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
    <header className="h-14 glass-header flex items-center px-4 gap-3 shrink-0">
      <MobileSidebar />
      {title && (
        <div className="flex items-center gap-2.5">
          <span
            className="inline-block w-0.5 h-5 rounded-full shrink-0"
            style={{ background: 'linear-gradient(180deg, #D4A017 0%, rgba(180,130,10,0.45) 100%)' }}
          />
          <span className="font-semibold text-base text-foreground tracking-tight">{title}</span>
        </div>
      )}
      <div className="flex-1" />
      <ThemeSwitch />
      <NotificationsPopover />
      <div className="w-px h-5 bg-[rgba(210,158,24,0.35)] mx-1" />
      <ProfileMenu />
    </header>
  );
}
