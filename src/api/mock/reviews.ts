// TODO(backend): GET /api/merchant/reviews/ → Paginated<Review>
// TODO(backend): POST /api/merchant/reviews/:id/reply/ { reply: string } → Review

import type { Review, Paginated } from '../../types';
import { delay } from './_util';

const MOCK_REVIEWS: Review[] = [
  {
    id: 1, customer_name: 'Алишер К.', rating: 5,
    comment: 'Отличное место, обслуживание на высоте!',
    outlet_id: 1, outlet_name: 'Центральный филиал', deal_title: 'Скидка 20% на пиццу',
    created_at: '2026-06-12T14:00:00Z', is_replied: false,
  },
  {
    id: 2, customer_name: 'Малика Ю.', rating: 4,
    comment: 'Хорошая акция, но очередь была большая.',
    outlet_id: 1, outlet_name: 'Центральный филиал', deal_title: '1+1 на бургеры',
    created_at: '2026-06-11T11:30:00Z', is_replied: true,
    reply: 'Спасибо за отзыв! Мы работаем над улучшением сервиса.',
  },
  {
    id: 3, customer_name: 'Дмитрий И.', rating: 3,
    comment: 'Неплохо, но можно лучше.',
    outlet_id: 2, outlet_name: 'Филиал Чиланзар', deal_title: null,
    created_at: '2026-06-10T09:00:00Z', is_replied: false,
  },
  {
    id: 4, customer_name: 'Нилуфар Р.', rating: 5,
    comment: 'Всё понравилось, буду рекомендовать друзьям!',
    outlet_id: 2, outlet_name: 'Филиал Чиланзар', deal_title: 'Эксклюзив — суши сет',
    created_at: '2026-06-13T16:00:00Z', is_replied: false,
  },
  {
    id: 5, customer_name: 'Камола Т.', rating: 4,
    comment: 'Приятное обслуживание, вкусная еда.',
    outlet_id: 3, outlet_name: 'Филиал Юнусабад', deal_title: '1+1 на бургеры',
    created_at: '2026-06-14T12:00:00Z', is_replied: false,
  },
];

export function fetchMockReviews(params?: { outlet_id?: number }): Promise<Paginated<Review>> {
  let results = [...MOCK_REVIEWS];
  if (params?.outlet_id) results = results.filter((r) => r.outlet_id === params.outlet_id);
  return delay({ count: results.length, next: null, previous: null, results: [...results] });
}

export function replyToMockReview(id: number, reply: string): Promise<Review> {
  const review = MOCK_REVIEWS.find((r) => r.id === id);
  if (!review) return Promise.reject(new Error('Not found'));
  review.is_replied = true;
  review.reply = reply;
  return delay({ ...review });
}
