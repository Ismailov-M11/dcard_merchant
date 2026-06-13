// TODO(backend): GET /api/merchant/reviews/ → Paginated<Review>
// TODO(backend): POST /api/merchant/reviews/:id/reply/ { reply: string } → Review

import type { Review, Paginated } from '../../types';
import { delay } from './_util';

const MOCK_REVIEWS: Review[] = [
  {
    id: 1, customer_name: 'Алишер К.', rating: 5,
    comment: 'Отличное место, обслуживание на высоте!',
    outlet_name: 'Центральный филиал', deal_title: 'Скидка 20% на пиццу',
    created_at: '2026-06-12T14:00:00Z', is_replied: false,
  },
  {
    id: 2, customer_name: 'Малика Ю.', rating: 4,
    comment: 'Хорошая акция, но очередь была большая.',
    outlet_name: 'Центральный филиал', deal_title: '1+1 на бургеры',
    created_at: '2026-06-11T11:30:00Z', is_replied: true,
    reply: 'Спасибо за отзыв! Мы работаем над улучшением сервиса.',
  },
  {
    id: 3, customer_name: 'Дмитрий И.', rating: 3,
    comment: 'Неплохо, но можно лучше.',
    outlet_name: 'Филиал Чиланзар', deal_title: null,
    created_at: '2026-06-10T09:00:00Z', is_replied: false,
  },
];

export function fetchMockReviews(): Promise<Paginated<Review>> {
  return delay({ count: MOCK_REVIEWS.length, next: null, previous: null, results: [...MOCK_REVIEWS] });
}

export function replyToMockReview(id: number, reply: string): Promise<Review> {
  const review = MOCK_REVIEWS.find((r) => r.id === id);
  if (!review) return Promise.reject(new Error('Not found'));
  review.is_replied = true;
  review.reply = reply;
  return delay({ ...review });
}
