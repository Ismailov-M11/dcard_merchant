export function formatMoney(amount: number | string): string {
  const n = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(n)) return '—';
  return (
    new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(n).replace(/ /g, ' ') + ' сум'
  );
}
