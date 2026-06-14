// Media files are served from the API origin (no /api prefix)
const API_ORIGIN = (import.meta.env.VITE_API_URL ?? '')
  .replace(/\/api\/?$/, '');

export function mediaUrl(path: string | null | undefined): string | undefined {
  if (!path) return undefined;
  if (path.startsWith('http')) {
    // Upgrade http:// → https:// to avoid mixed-content block on HTTPS pages
    return path.replace(/^http:\/\//, 'https://');
  }
  return `${API_ORIGIN}${path}`;
}
