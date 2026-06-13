export function setupMouseGlow() {
  let lastSurface: HTMLElement | null = null;

  document.addEventListener('mousemove', (e: MouseEvent) => {
    const hit = document.elementFromPoint(e.clientX, e.clientY);
    const surface = hit?.closest<HTMLElement>('.glow-surface') ?? null;

    if (surface !== lastSurface) {
      if (lastSurface) {
        lastSurface.style.removeProperty('--glow-x');
        lastSurface.style.removeProperty('--glow-y');
      }
      lastSurface = surface;
    }

    if (surface) {
      const r = surface.getBoundingClientRect();
      surface.style.setProperty('--glow-x', `${e.clientX - r.left}px`);
      surface.style.setProperty('--glow-y', `${e.clientY - r.top}px`);
    }
  }, { passive: true });
}
