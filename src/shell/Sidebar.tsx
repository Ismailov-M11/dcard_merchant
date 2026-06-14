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
  const [hoveredIdx, setHoveredIdx] = useState(-1);

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
          <img src="/logo.png" alt="Dcard" className="h-8 w-8 rounded-2xl object-cover shadow-lg shadow-[#1A3F75]/20" />
          <span className="text-foreground font-semibold text-sm tracking-wide">Dcard Merchant</span>
        </div>
      </div>

      <ScrollArea className="flex-1 py-3">
        <nav className="relative px-3 space-y-0.5">
          {/* Liquid sliding indicator */}
          <div
            className={cn('absolute left-1 right-1 rounded-2xl shadow-md shadow-[#1A3F75]/20', travelCls)}
            style={{
              top: pill.top,
              height: pill.height,
              opacity: pill.opacity,
              // 200%-wide gradient: left half = blue→gold, right half = gold→blue
              // background-position slides the visible window left/right
              background: 'linear-gradient(to right, #1A3F75 0%, #1C4A88 22%, #B8820E 50%, #1C4A88 78%, #1A3F75 100%)',
              backgroundSize: '200% 100%',
              backgroundPosition: hoveredIdx === visualIdx ? '100% center' : '0% center',
              transition: [
                `top ${pill.dur}s ${pill.ease}`,
                `height ${pill.dur}s ${pill.ease}`,
                'opacity 0.12s linear',
                'background-position 0.50s cubic-bezier(0.4, 0, 0.2, 1)',
              ].join(', '),
              '--pill-dur': `${pill.dur}s`,
            } as CSSProperties}
          />

          {NAV_ITEMS.map((item, i) => {
            const isActive  = visualIdx === i;
            const isHovered = hoveredIdx === i;
            return (
              <a
                key={item.path}
                ref={(el) => { itemRefs.current[i] = el; }}
                href={item.path}
                onClick={handleClick(item.path, i)}
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(-1)}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'relative flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium z-10 transition-colors duration-200',
                  isActive ? 'text-white' : 'text-foreground/60 hover:text-foreground',
                )}
              >
                <item.icon
                  className={cn(
                    'h-4 w-4 shrink-0',
                    'transition-colors duration-500',
                    isActive
                      ? (isHovered ? 'text-[#4EA4CC]' : 'text-amber-300')
                      : '',
                  )}
                />
                {item.label}
              </a>
            );
          })}
        </nav>
      </ScrollArea>

      <div className="h-px bg-gradient-to-r from-transparent via-[rgba(210,158,24,0.32)] to-transparent" />
    </aside>
  );
}
