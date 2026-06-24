// TODO(backend): GET /api/merchant/notifications/ → Paginated<Notification>
// TODO(backend): POST /api/merchant/notifications/read-all/ → { ok: true }

import type { Notification, Paginated } from '../../types';
import { delay } from './_util';

const MOCK_NOTIFICATIONS: Notification[] = [
  { id: 1, title: 'Новый заказ', body: 'Получен заказ ORD-0001 от Алишера Каримова', is_read: false, created_at: '2026-06-13T10:00:00Z', category: 'other' },
  { id: 2, title: 'Новый отзыв', body: 'Клиент оставил оценку 5★ на ваш филиал', is_read: false, created_at: '2026-06-12T14:05:00Z', category: 'other' },
  { id: 3, title: 'Акция одобрена', body: 'Акция "Скидка 20% на пиццу" прошла модерацию', is_read: true, created_at: '2026-06-11T09:00:00Z', category: 'partner_promo' },
  { id: 4, title: 'Системное уведомление', body: 'Плановые технические работы 15 июня с 02:00 до 04:00', is_read: true, created_at: '2026-06-10T18:00:00Z', category: 'system' },
];

export function fetchMockNotifications(): Promise<Paginated<Notification>> {
  return delay({ count: MOCK_NOTIFICATIONS.length, next: null, previous: null, results: [...MOCK_NOTIFICATIONS] });
}

export function markAllMockNotificationsRead(): Promise<{ ok: boolean }> {
  MOCK_NOTIFICATIONS.forEach((n) => (n.is_read = true));
  return delay({ ok: true });
}
