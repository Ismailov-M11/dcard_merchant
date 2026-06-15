import { useLayoutEffect, useRef, useState, useTransition, type CSSProperties } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { cn } from '@/lib/cn';
import { NAV_ITEMS } from './nav';
import { ScrollArea } from '@/components/ui/scroll-area';

function getNavIndex(pathname: string) {
  if (pathname === '/') return 0;
  const i = NAV_ITEMS.findIndex(n => n.path !== '/' && pathname.startsWith(n.path));
  return i >= 0 ? i : 0;
}

interface Pill { top: number; height: number; opacity: number; dur: number; }

export function Sidebar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [, startTransition] = useTransition();

  const currentIdx = getNavIndex(pathname);
  const [visualIdx, setVisualIdx] = useState(currentIdx);
  const prevVisual = useRef(currentIdx);

  useLayoutEffect(() => { setVisualIdx(currentIdx); }, [currentIdx]);

  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const [pill, setPill] = useState<Pill>({ top: 0, height: 38, opacity: 0, dur: 0 });

  useLayoutEffect(() => {
    const el = itemRefs.current[visualIdx];
    if (!el) return;
    const prev = prevVisual.current;
    const dist = prev >= 0 ? Math.abs(visualIdx - prev) : 0;
    const dur  = dist > 0 ? Math.min(0.22 + dist * 0.04, 0.40) : 0;
    setPill({ top: el.offsetTop, height: el.offsetHeight, opacity: 1, dur });
    prevVisual.current = visualIdx;
  }, [visualIdx]);

  const handleClick = (path: string, i: number) => (e: React.MouseEvent) => {
    e.preventDefault();
    if (i === visualIdx && pathname === path) return;
    setVisualIdx(i);
    startTransition(() => { navigate(path); });
  };

  return (
    <aside className="w-60 shrink-0 ios-sidebar flex flex-col h-full">
      {/* Logo */}
      <div className="h-16 flex items-center px-5 border-b border-[var(--ios-border)]">
        <div className="flex items-center gap-3">
          <img
            src="/logo.png"
            alt="Dcard"
            className="h-9 w-9 rounded-2xl object-cover"
            style={{ boxShadow: '0 2px 8px rgba(0,122,255,0.25)' }}
          />
          <div>
            <div className="text-sm font-bold text-[var(--ios-text-primary)] leading-tight">Dcard</div>
            <div className="text-[11px] text-[var(--ios-text-secondary)] leading-tight">Merchant Panel</div>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 py-3">
        <nav className="relative px-3">
          {/* Sliding active indicator */}
          <div
            className="absolute left-1 right-1 rounded-2xl pointer-events-none"
            style={{
              top: pill.top,
              height: pill.height,
              opacity: pill.opacity,
              background: 'rgba(0, 122, 255, 0.1)',
              transition: pill.dur > 0
                ? `top ${pill.dur}s cubic-bezier(0.34,1.45,0.64,1), height ${pill.dur}s cubic-bezier(0.34,1.45,0.64,1), opacity 0.12s`
                : 'opacity 0.12s',
            } as CSSProperties}
          />

          <div className="space-y-0.5">
            {NAV_ITEMS.map((item, i) => {
              const isActive = visualIdx === i;
              return (
                <a
                  key={item.path}
                  ref={(el) => { itemRefs.current[i] = el; }}
                  href={item.path}
                  onClick={handleClick(item.path, i)}
                  aria-current={isActive ? 'page' : undefined}
                  className={cn(
                    'relative flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium z-10 transition-colors duration-150 select-none cursor-pointer',
                    isActive
                      ? 'text-[#007AFF]'
                      : 'text-[var(--ios-text-tertiary)] hover:text-[var(--ios-text-primary)] hover:bg-[var(--ios-bg)]',
                  )}
                >
                  <item.icon
                    className={cn(
                      'h-[18px] w-[18px] shrink-0 transition-colors duration-150',
                      isActive ? 'text-[#007AFF]' : 'text-[var(--ios-text-secondary)]',
                    )}
                  />
                  <span className={cn(isActive && 'font-semibold')}>{item.label}</span>
                </a>
              );
            })}
          </div>
        </nav>
      </ScrollArea>

      <div className="h-px bg-[var(--ios-divider)]" />

      {/* App version */}
      <div className="px-5 py-3 flex items-center gap-2">
        <div
          className="w-2 h-2 rounded-full"
          style={{ background: '#12BD09' }}
        />
        <span className="text-xs text-[var(--ios-text-secondary)]">Онлайн</span>
      </div>
    </aside>
  );
}
