import { MobileSidebar } from './MobileSidebar';
import { NotificationsPopover } from './NotificationsPopover';
import { ProfileMenu } from './ProfileMenu';
import { ThemeSwitch } from './ThemeSwitch';
import { Separator } from '@/components/ui/separator';

export function Header() {
  return (
    <header className="h-14 border-b bg-background flex items-center px-4 gap-2 shrink-0">
      <MobileSidebar />
      <div className="flex-1" />
      <ThemeSwitch />
      <NotificationsPopover />
      <Separator orientation="vertical" className="h-6" />
      <ProfileMenu />
    </header>
  );
}
