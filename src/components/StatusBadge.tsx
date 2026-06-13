import { Badge } from '@/components/ui/badge';
import type { DealStatus, OrderStatus, PartnerDiscountStatus } from '@/types';

type AnyStatus = DealStatus | OrderStatus | PartnerDiscountStatus;

const LABELS: Record<string, string> = {
  pending: 'На проверке',
  active: 'Активна',
  paused: 'Приостановлена',
  rejected: 'Отклонена',
  approved: 'Одобрена',
  new: 'Новый',
  confirmed: 'Подтверждён',
  completed: 'Выполнен',
  cancelled: 'Отменён',
};

const VARIANTS: Record<string, 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning'> = {
  pending: 'warning',
  active: 'success',
  approved: 'success',
  new: 'default',
  confirmed: 'secondary',
  completed: 'success',
  paused: 'secondary',
  rejected: 'destructive',
  cancelled: 'destructive',
};

export function StatusBadge({ status }: { status: AnyStatus }) {
  return (
    <Badge variant={VARIANTS[status] ?? 'outline'}>
      {LABELS[status] ?? status}
    </Badge>
  );
}
