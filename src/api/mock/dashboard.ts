// TODO(backend): GET /api/merchant/dashboard/ → DashboardSummary

import type { DashboardSummary } from '../../types';
import { delay } from './_util';

export function fetchMockDashboard(): Promise<DashboardSummary> {
  return delay({
    revenue_month: 12_450_000,
    revenue_prev_month: 10_200_000,
    orders_month: 87,
    orders_prev_month: 71,
    active_deals: 4,
    total_branches: 3,
    avg_rating: 4.3,
    new_reviews: 12,
  });
}
