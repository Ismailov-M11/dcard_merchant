// TODO(backend): GET /api/merchant/analytics/sales/?from=&to= → SalesAnalytics
// TODO(backend): GET /api/merchant/analytics/traffic/?from=&to= → TrafficAnalytics
// TODO(backend): GET /api/merchant/analytics/rating/ → RatingAnalytics

import type { SalesAnalytics, TrafficAnalytics, RatingAnalytics } from '../../types';
import { delay } from './_util';

export function fetchMockSalesAnalytics(): Promise<SalesAnalytics> {
  return delay({
    total_revenue: 12_450_000,
    total_orders: 87,
    total_discount: 2_340_000,
    avg_order: 143_103,
    points: [
      { date: '2026-06-07', revenue: 1_800_000, orders: 12, discount_amount: 360_000 },
      { date: '2026-06-08', revenue: 2_100_000, orders: 15, discount_amount: 420_000 },
      { date: '2026-06-09', revenue: 1_650_000, orders: 11, discount_amount: 330_000 },
      { date: '2026-06-10', revenue: 2_400_000, orders: 17, discount_amount: 480_000 },
      { date: '2026-06-11', revenue: 1_900_000, orders: 13, discount_amount: 380_000 },
      { date: '2026-06-12', revenue: 2_600_000, orders: 19, discount_amount: 370_000 },
    ],
  });
}

export function fetchMockTrafficAnalytics(): Promise<TrafficAnalytics> {
  return delay({
    total_views: 5_340,
    total_clicks: 1_240,
    total_conversions: 87,
    conversion_rate: 7.0,
    points: [
      { date: '2026-06-07', views: 780, clicks: 180, conversions: 12 },
      { date: '2026-06-08', views: 920, clicks: 210, conversions: 15 },
      { date: '2026-06-09', views: 650, clicks: 155, conversions: 11 },
      { date: '2026-06-10', views: 1100, clicks: 260, conversions: 17 },
      { date: '2026-06-11', views: 870, clicks: 205, conversions: 13 },
      { date: '2026-06-12', views: 1020, clicks: 230, conversions: 19 },
    ],
  });
}

export function fetchMockRatingAnalytics(): Promise<RatingAnalytics> {
  return delay({
    avg_rating: 4.3,
    total_reviews: 126,
    distribution: [
      { stars: 5, count: 68 },
      { stars: 4, count: 32 },
      { stars: 3, count: 15 },
      { stars: 2, count: 7 },
      { stars: 1, count: 4 },
    ],
  });
}
