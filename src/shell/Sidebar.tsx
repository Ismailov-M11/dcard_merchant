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

const EASINGS = [
  'cubic-bezier(0.34,1.45,0.64,1)',  // 1 step — springy
  'cubic-bezier(0.25,1.25,0.50,1)',  // 2 steps
  'cubic-bezier(0.20,1.15,0.45,1)',  // 3 steps
  'cubic-bezier(0.16,1.05,0.35,1)',  // 4+ steps — smooth
];
const pillEase = (d: number) => EASINGS[Math.min(d - 1, 3)];
const pillDur  = (d: number) => d <= 1 ? 0.22 : d <= 3 ? 0.28 + d * 0.03 : 0.44;

interface Pill { top: number; height: number; opacity: number; dur: number; ease: string; }

export function Sidebar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [, startTransition] = useTransition();

  const currentIdx = getNavIndex(pathname);
  // visualIdx drives the indicator — moves immediately on click, syncs on back/forward
  const [visualIdx, setVisualIdx] = useState(currentIdx);
  const prevVisual = useRef(currentIdx);

  // Keep in sync with browser back/forward navigation
  useLayoutEffect(() => { setVisualIdx(currentIdx); }, [currentIdx]);

  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const [pill, setPill] = useState<Pill>({ top: 0, height: 38, opacity: 0, dur: 0, ease: 'linear' });
  const [travelCls, setTravelCls] = useState('');

  // useLayoutEffect: runs before paint so indicator position is always in sync
  useLayoutEffect(() => {
    const el = itemRefs.current[visualIdx];
    if (!el) return;

    const prev = prevVisual.current;
    const dist = prev >= 0 ? Math.abs(visualIdx - prev) : 0;
    const dur  = dist > 0 ? pillDur(dist) : 0;
    const ease = dist > 0 ? pillEase(dist) : 'linear';
    const dir  = visualIdx > prev ? 'down' : visualIdx < prev ? 'up' : null;

    setPill({ top: el.offsetTop, height: el.offsetHeight, opacity: 1, dur, ease });

    if (dir) {
      setTravelCls(`pill-travel-${dir}`);
      const t = setTimeout(() => setTravelCls(''), dur * 1000 + 60);
      prevVisual.current = visualIdx;
      return () => clearTimeout(t);
    }
    prevVisual.current = visualIdx;
  }, [visualIdx]);

  const handleClick = (path: string, i: number) => (e: React.MouseEvent) => {
    e.preventDefault();
    if (i === visualIdx && pathname === path) return;
    setVisualIdx(i); // move indicator immediately — before route change
    startTransition(() => { navigate(path); }); // defer route change (keeps old page visible while loading)
  };

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
        <nav className="relative px-3 space-y-0.5">
          {/* Liquid sliding indicator */}
          <div
            className={cn('absolute left-0 right-0 rounded-2xl bg-[#1A3F75] shadow-md shadow-[#1A3F75]/20', travelCls)}
            style={{
              top: pill.top,
              height: pill.height,
              opacity: pill.opacity,
              transition: `top ${pill.dur}s ${pill.ease}, height ${pill.dur}s ${pill.ease}, opacity 0.12s linear`,
              '--pill-dur': `${pill.dur}s`,
            } as CSSProperties}
          />

          {NAV_ITEMS.map((item, i) => (
            <a
              key={item.path}
              ref={(el) => { itemRefs.current[i] = el; }}
              href={item.path}
              onClick={handleClick(item.path, i)}
              aria-current={visualIdx === i ? 'page' : undefined}
              className={cn(
                'relative flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium z-10 transition-colors duration-150',
                visualIdx === i
                  ? 'text-white'
                  : 'text-foreground/60 hover:text-foreground',
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </a>
          ))}
        </nav>
      </ScrollArea>

      <div className="h-px bg-gradient-to-r from-transparent via-[#1A3F75]/20 to-transparent" />
    </aside>
  );
}
