import { MobileSidebar } from './MobileSidebar';
import { NotificationsPopover } from './NotificationsPopover';
import { ProfileMenu } from './ProfileMenu';
import { ThemeSwitch } from './ThemeSwitch';

export function Header() {
  return (
    <header className="h-14 glass-header flex items-center px-4 gap-2 shrink-0">
      <MobileSidebar />
      <div className="flex-1" />
      <ThemeSwitch />
      <NotificationsPopover />
      <div className="w-px h-5 bg-[rgba(210,158,24,0.35)] mx-1" />
      <ProfileMenu />
    </header>
  );
}
