import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/cn';
import { NAV_ITEMS } from './nav';
import { ScrollArea } from '@/components/ui/scroll-area';

export function Sidebar() {
  return (
    <aside className="w-60 shrink-0 bg-sidebar flex flex-col h-full">
      <div className="h-14 flex items-center px-4 border-b border-sidebar-border">
        <span className="text-sidebar-foreground font-bold text-lg tracking-tight">DCard Merchant</span>
      </div>
      <ScrollArea className="flex-1 py-2">
        <nav className="px-2 space-y-0.5">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                )
              }
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </ScrollArea>
    </aside>
  );
}
