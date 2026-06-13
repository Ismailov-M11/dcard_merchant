import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { NAV_ITEMS } from '@/shell/nav';

function navIndex(pathname: string): number {
  if (pathname === '/') return 0;
  const i = NAV_ITEMS.findIndex(n => n.path !== '/' && pathname.startsWith(n.path));
  return i >= 0 ? i : -1;
}

function pickClass(dist: number, dir: number): string {
  const sfx = dir < 0 ? '-rev' : '';
  if (dist === 1) return `page-near${sfx}`;
  if (dist <= 3) return `page-mid${sfx}`;
  return `page-far${sfx}`;
}

export function PageTransition({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const prevRef = useRef<string | null>(null);
  const [cls, setCls] = useState('');

  useLayoutEffect(() => {
    if (prevRef.current === null) {
      prevRef.current = pathname;
      return;
    }
    if (prevRef.current === pathname) return;

    const fromIdx = navIndex(prevRef.current);
    const toIdx   = navIndex(pathname);
    const dist    = fromIdx >= 0 && toIdx >= 0 ? Math.abs(toIdx - fromIdx) : 1;
    const dir     = toIdx >= fromIdx ? 1 : -1;

    setCls(pickClass(dist, dir));
    prevRef.current = pathname;
  }, [pathname]);

  return (
    <div className={cls || undefined} onAnimationEnd={() => setCls('')}>
      {children}
    </div>
  );
}
