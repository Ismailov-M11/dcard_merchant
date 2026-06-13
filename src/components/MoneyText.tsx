import { cn } from '@/lib/cn';
import { formatMoney } from '@/lib/money';

export function MoneyText({ amount, className }: { amount: number | string; className?: string }) {
  return <span className={cn('tnum', className)}>{formatMoney(amount)}</span>;
}
