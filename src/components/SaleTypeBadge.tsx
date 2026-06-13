import { cn } from '@/lib/cn';
import type { SaleType } from '@/types';

const CONFIG: Record<SaleType, { dot: string; label: string }> = {
  discount: { dot: 'bg-[hsl(var(--chart-1))]', label: 'Скидка' },
  one_plus_one: { dot: 'bg-[hsl(var(--chart-2))]', label: '1+1' },
  exclusive: { dot: 'bg-[hsl(var(--chart-3))]', label: 'Эксклюзив' },
};

export function SaleTypeBadge({ type, className }: { type: SaleType; className?: string }) {
  const cfg = CONFIG[type] ?? { dot: 'bg-muted', label: type };
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium', className)}>
      <span className={cn('h-2 w-2 rounded-full', cfg.dot)} />
      {cfg.label}
    </span>
  );
}
