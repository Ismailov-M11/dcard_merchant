import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/cn';
import { NAV_ITEMS } from './nav';
import { ScrollArea } from '@/components/ui/scroll-area';

export function Sidebar() {
  return (
    <aside className="w-60 shrink-0 glass-sidebar flex flex-col h-full">
      {/* Logo */}
      <div className="h-14 flex items-center px-5 border-b border-[#1A3F75]/10">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-2xl bg-[#1A3F75] flex items-center justify-center shadow-lg shadow-[#1A3F75]/25">
            <span className="text-white text-xs font-bold tracking-wider">D</span>
          </div>
          <span className="text-foreground font-semibold text-sm tracking-wide">DCard Merchant</span>
        </div>
      </div>

      <ScrollArea className="flex-1 py-3">
        <nav className="px-3 space-y-0.5">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-all',
                  isActive
                    ? 'bg-[#1A3F75] text-white shadow-sm shadow-[#1A3F75]/20'
                    : 'text-foreground/60 hover:bg-[#1A3F75]/12 hover:text-foreground',
                )
              }
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </ScrollArea>

      <div className="h-px bg-gradient-to-r from-transparent via-[#1A3F75]/20 to-transparent" />
    </aside>
  );
}
