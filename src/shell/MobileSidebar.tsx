import { useState } from 'react';
import { Menu } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { cn } from '@/lib/cn';
import { NAV_ITEMS } from './nav';

export function MobileSidebar() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="md:hidden h-8 w-8 flex items-center justify-center rounded-full hover:bg-[var(--ios-bg)] transition-colors"
        style={{ color: 'var(--ios-text-secondary)' }}
      >
        <Menu className="h-5 w-5" />
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="left"
          className="p-0 w-64"
          style={{
            background: 'var(--ios-card)',
            borderRight: '1px solid var(--ios-border)',
          }}
        >
          <div
            className="h-16 flex items-center px-5 border-b"
            style={{ borderColor: 'var(--ios-border)' }}
          >
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="Dcard" className="h-9 w-9 rounded-2xl object-cover" />
              <div>
                <div
                  className="text-sm font-bold leading-tight"
                  style={{ color: 'var(--ios-text-primary)' }}
                >
                  Dcard
                </div>
                <div
                  className="text-[11px] leading-tight"
                  style={{ color: 'var(--ios-text-secondary)' }}
                >
                  Merchant Panel
                </div>
              </div>
            </div>
          </div>

          <nav className="px-3 py-3 space-y-0.5">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'text-[#007AFF] bg-[rgba(0,122,255,0.08)]'
                      : 'hover:bg-[var(--ios-bg)]',
                  )
                }
                style={({ isActive }) => ({
                  color: isActive ? '#007AFF' : 'var(--ios-text-tertiary)',
                })}
              >
                {({ isActive }) => (
                  <>
                    <item.icon
                      className="h-[18px] w-[18px] shrink-0"
                      style={{ color: isActive ? '#007AFF' : 'var(--ios-text-secondary)' }}
                    />
                    <span className={isActive ? 'font-semibold' : ''}>{item.label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </SheetContent>
      </Sheet>
    </>
  );
}
