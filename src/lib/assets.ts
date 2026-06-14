// Media files are served from the API origin (no /api prefix)
const API_ORIGIN = (import.meta.env.VITE_API_URL ?? '')
  .replace(/\/api\/?$/, '');

export function mediaUrl(path: string | null | undefined): string | undefined {
  if (!path) return undefined;
  if (path.startsWith('http')) return path;
  return `${API_ORIGIN}${path}`;
}
