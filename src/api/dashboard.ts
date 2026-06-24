import type { DashboardSummary } from '../types';
import { fetchOutlets } from './outlets';
import { fetchMerchantDeals } from './deals';

// Fields marked ⚠️ require a dedicated backend endpoint that does not yet exist.
// See MISSING_APIS.md for the full specification.
export async function fetchDashboard(): Promise<DashboardSummary> {
  const [outlets, activeDeals] = await Promise.all([
    fetchOutlets(),
    fetchMerchantDeals({ status: 'active' }),
  ]);

  return {
    // ⚠️ no POS/revenue data in backend — requires GET /api/merchant/dashboard/
    revenue_month: 0,
    revenue_prev_month: 0,
    // ⚠️ verification count without monthly filter — requires dedicated dashboard endpoint
    orders_month: 0,
    orders_prev_month: 0,
    active_deals: activeDeals.length,
    total_branches: outlets.length,
    // ⚠️ no merchant-facing rating summary endpoint
    avg_rating: 0,
    // ⚠️ no merchant-facing reviews endpoint
    new_reviews: 0,
  };
}
