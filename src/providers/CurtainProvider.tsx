import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';

interface CurtainCtx {
  /** Call this to start the curtain-up animation; onDone fires when it finishes */
  launch: (onDone: () => void) => void;
}

const CurtainCtx = createContext<CurtainCtx>({ launch: () => {} });

export function CurtainProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState(false);
  const cbRef = useRef<(() => void) | null>(null);

  const launch = useCallback((onDone: () => void) => {
    cbRef.current = onDone;
    setActive(true);
  }, []);

  const handleEnd = () => {
    const cb = cbRef.current;
    cbRef.current = null;
    setActive(false);
    cb?.();
  };

  return (
    <CurtainCtx.Provider value={{ launch }}>
      {children}

      {/* Fixed overlay — lives OUTSIDE the route tree, survives route changes */}
      {active && (
        <div
          className="fixed inset-0 z-[9999] animate-curtain-up overflow-hidden"
          onAnimationEnd={handleEnd}
          style={{
            background:
              'radial-gradient(ellipse at 8% 18%, rgba(26,63,117,0.14) 0%, transparent 55%),' +
              'radial-gradient(ellipse at 90% 8%, rgba(78,164,204,0.18) 0%, transparent 50%),' +
              'radial-gradient(ellipse at 55% 80%, rgba(26,63,117,0.10) 0%, transparent 55%),' +
              'var(--curtain-fill, #DAE9F8)',
          }}
        >
          {/* Curtain orbs drift while sliding */}
          <div className="absolute w-[580px] h-[580px] -top-40 -left-40 rounded-full orb-drift-1"
            style={{ background: 'rgba(26,63,117,0.50)', filter: 'blur(42px)', opacity: 0.85 }} />
          <div className="absolute w-[420px] h-[420px] top-0 -right-24 rounded-full orb-drift-2"
            style={{ background: 'rgba(78,164,204,0.45)', filter: 'blur(38px)', opacity: 0.80, animationDelay: '-4s' }} />
          <div className="absolute w-[480px] h-[480px] -bottom-20 left-1/3 rounded-full orb-drift-3"
            style={{ background: 'rgba(43,91,168,0.48)', filter: 'blur(42px)', opacity: 0.78, animationDelay: '-7s' }} />
        </div>
      )}
    </CurtainCtx.Provider>
  );
}

export const useCurtain = () => useContext(CurtainCtx);
