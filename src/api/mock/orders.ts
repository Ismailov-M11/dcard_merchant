// TODO(backend): GET /api/merchant/orders/ → Paginated<Order>
// TODO(backend): GET /api/merchant/orders/:id/ → Order
// TODO(backend): PATCH /api/merchant/orders/:id/ { status } → Order

import type { Order, Paginated } from '../../types';
import { delay } from './_util';

const MOCK_ORDERS: Order[] = [
  {
    id: 1, order_number: 'ORD-0001', customer_name: 'Алишер Каримов',
    customer_phone: '+998901234567', outlet_id: 1, outlet_name: 'Центральный филиал',
    deal_id: 1, deal_title: 'Скидка 20% на пиццу', sale_type: 'discount',
    status: 'new', total_amount: '150000', discount_amount: '30000',
    scanned_by: 'Акбар Исмоилов',
    created_at: '2026-06-10T10:00:00Z', updated_at: '2026-06-10T10:00:00Z',
  },
  {
    id: 2, order_number: 'ORD-0002', customer_name: 'Малика Юсупова',
    customer_phone: '+998909876543', outlet_id: 1, outlet_name: 'Центральный филиал',
    deal_id: 2, deal_title: '1+1 на бургеры', sale_type: 'one_plus_one',
    status: 'confirmed', total_amount: '200000', discount_amount: '100000',
    scanned_by: 'Акбар Исмоилов',
    created_at: '2026-06-11T12:30:00Z', updated_at: '2026-06-11T12:45:00Z',
  },
  {
    id: 3, order_number: 'ORD-0003', customer_name: 'Дмитрий Иванов',
    customer_phone: '+998911112233', outlet_id: 2, outlet_name: 'Филиал Чиланзар',
    deal_id: 3, deal_title: 'Эксклюзив — суши сет', sale_type: 'exclusive',
    status: 'completed', total_amount: '350000', discount_amount: '0',
    scanned_by: 'Зафар Рашидов',
    created_at: '2026-06-12T09:15:00Z', updated_at: '2026-06-12T10:00:00Z',
  },
  {
    id: 4, order_number: 'ORD-0004', customer_name: 'Нилуфар Рашидова',
    customer_phone: '+998905554433', outlet_id: 2, outlet_name: 'Филиал Чиланзар',
    deal_id: 1, deal_title: 'Скидка 20% на пиццу', sale_type: 'discount',
    status: 'cancelled', total_amount: '120000', discount_amount: '24000',
    scanned_by: 'Зафар Рашидов',
    created_at: '2026-06-13T08:00:00Z', updated_at: '2026-06-13T08:05:00Z',
  },
  {
    id: 5, order_number: 'ORD-0005', customer_name: 'Камола Тошматова',
    customer_phone: '+998901112233', outlet_id: 3, outlet_name: 'Филиал Юнусабад',
    deal_id: 2, deal_title: '1+1 на бургеры', sale_type: 'one_plus_one',
    status: 'completed', total_amount: '240000', discount_amount: '120000',
    scanned_by: 'Санжар Маматов',
    created_at: '2026-06-14T11:00:00Z', updated_at: '2026-06-14T11:20:00Z',
  },
  {
    id: 6, order_number: 'ORD-0006', customer_name: 'Бобур Холматов',
    customer_phone: '+998907778899', outlet_id: 1, outlet_name: 'Центральный филиал',
    deal_id: 3, deal_title: 'Эксклюзив — суши сет', sale_type: 'exclusive',
    status: 'new', total_amount: '450000', discount_amount: '0',
    scanned_by: 'Акбар Исмоилов',
    created_at: '2026-06-15T14:30:00Z', updated_at: '2026-06-15T14:30:00Z',
  },
];

export function fetchMockOrders(params?: { status?: string; page?: number }): Promise<Paginated<Order>> {
  let results = [...MOCK_ORDERS];
  if (params?.status) results = results.filter((o) => o.status === params.status);
  return delay({ count: results.length, next: null, previous: null, results });
}

export function fetchMockOrder(id: number): Promise<Order> {
  const order = MOCK_ORDERS.find((o) => o.id === id);
  if (!order) return Promise.reject(new Error('Not found'));
  return delay({ ...order });
}

export function updateMockOrderStatus(id: number, status: Order['status']): Promise<Order> {
  const order = MOCK_ORDERS.find((o) => o.id === id);
  if (!order) return Promise.reject(new Error('Not found'));
  order.status = status;
  return delay({ ...order });
}
