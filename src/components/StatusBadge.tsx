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

// iOS-style badge colors: bg + text
const COLORS: Record<string, { bg: string; color: string }> = {
  pending:   { bg: 'rgba(255, 159, 10, 0.12)',  color: '#FF9500' },
  active:    { bg: 'rgba(18, 189, 9, 0.10)',     color: '#12BD09' },
  approved:  { bg: 'rgba(18, 189, 9, 0.10)',     color: '#12BD09' },
  completed: { bg: 'rgba(18, 189, 9, 0.10)',     color: '#12BD09' },
  new:       { bg: 'rgba(0, 122, 255, 0.10)',    color: '#007AFF' },
  confirmed: { bg: 'rgba(0, 173, 255, 0.10)',    color: '#00ADFF' },
  paused:    { bg: 'rgba(142, 142, 147, 0.12)',  color: '#8E8E93' },
  rejected:  { bg: 'rgba(238, 112, 112, 0.12)', color: '#EE7070' },
  cancelled: { bg: 'rgba(238, 112, 112, 0.12)', color: '#EE7070' },
};

export function StatusBadge({ status }: { status: AnyStatus }) {
  const style = COLORS[status] ?? { bg: 'rgba(142,142,147,0.10)', color: '#8E8E93' };
  return (
    <span
      className="badge-pop inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold"
      style={{ background: style.bg, color: style.color }}
    >
      {LABELS[status] ?? status}
    </span>
  );
}
