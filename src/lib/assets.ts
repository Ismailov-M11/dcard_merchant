const BASE = import.meta.env.VITE_API_URL ?? '';

export function mediaUrl(path: string | null | undefined): string | undefined {
  if (!path) return undefined;
  if (path.startsWith('http')) return path;
  return `${BASE}${path}`;
}
