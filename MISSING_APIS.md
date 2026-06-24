# Missing Backend APIs — Merchant Panel

This document lists API endpoints required by the merchant panel redesign that **do not exist** in the current backend (`dcardback`). All endpoints should be accessible only to authenticated merchant users (OWNER / ADMIN role).

---

## 1. Dashboard Summary

**Endpoint:** `GET /api/merchant/dashboard/`

**Auth:** Merchant (OWNER or ADMIN)

**Description:** Returns aggregated KPI data for the current calendar month and the previous month, scoped to all outlets belonging to the merchant's partner.

**Response:**
```json
{
  "revenue_month": 12450000,
  "revenue_prev_month": 10200000,
  "orders_month": 87,
  "orders_prev_month": 71,
  "active_deals": 4,
  "total_branches": 3,
  "avg_rating": 4.3,
  "new_reviews": 12
}
```

**Field descriptions:**
| Field | Type | Description |
|-------|------|-------------|
| `revenue_month` | int | Total transaction value (sum) for current month across all outlets (UZS) |
| `revenue_prev_month` | int | Same metric for the previous calendar month |
| `orders_month` | int | Number of successful verifications in current month |
| `orders_prev_month` | int | Same metric for the previous calendar month |
| `active_deals` | int | Count of `OutletSpecialOffer` with status=`active` for the partner |
| `total_branches` | int | Count of `Outlet` records for the partner |
| `avg_rating` | float | Average rating across all partner outlets (from `VerificationLog.rating` or a rating model) |
| `new_reviews` | int | Number of new ratings/reviews in current month |

**Note:** If revenue tracking is not implemented in the backend, at minimum `orders_month`, `orders_prev_month`, `avg_rating`, and `new_reviews` are needed.

---

## 2. Sales Analytics (Time-Series)

**Endpoint:** `GET /api/merchant/analytics/sales/`

**Query params:** `?from=YYYY-MM-DD&to=YYYY-MM-DD&outlet_id=<int>` (outlet_id optional, defaults to all partner outlets)

**Auth:** Merchant (OWNER or ADMIN)

**Description:** Returns sales / verification statistics grouped by day for the given date range.

**Response:**
```json
{
  "total_revenue": 12450000,
  "total_orders": 87,
  "total_discount": 2340000,
  "avg_order": 143103,
  "revenue_by_discount": 5200000,
  "revenue_by_one_plus_one": 4150000,
  "revenue_by_exclusive": 3100000,
  "points": [
    { "date": "2026-06-07", "revenue": 1800000, "orders": 12, "discount_amount": 360000 },
    { "date": "2026-06-08", "revenue": 2100000, "orders": 15, "discount_amount": 420000 }
  ]
}
```

**Field descriptions:**
| Field | Type | Description |
|-------|------|-------------|
| `total_revenue` | int | Sum of all transaction values in period (UZS) |
| `total_orders` | int | Count of successful verifications in period |
| `total_discount` | int | Total discount amount given in period (UZS) |
| `avg_order` | int | Average transaction value (`total_revenue / total_orders`) |
| `revenue_by_discount` | int | Revenue from `OfferType.DISCOUNT` deals |
| `revenue_by_one_plus_one` | int | Revenue from `OfferType.ONE_PLUS_ONE` deals |
| `revenue_by_exclusive` | int | Revenue from `OfferType.EXCLUSIVE` deals |
| `points[].date` | string | ISO date `YYYY-MM-DD` |
| `points[].revenue` | int | Revenue for that day |
| `points[].orders` | int | Verification count for that day |
| `points[].discount_amount` | int | Total discount given that day |

---

## 3. Traffic Analytics (Time-Series)

**Endpoint:** `GET /api/merchant/analytics/traffic/`

**Query params:** `?from=YYYY-MM-DD&to=YYYY-MM-DD&outlet_id=<int>`

**Auth:** Merchant (OWNER or ADMIN)

**Description:** Returns views, clicks, and conversion metrics per day. These metrics require tracking user interactions with the merchant's profile/offers in the customer mobile app.

**Response:**
```json
{
  "total_views": 5340,
  "total_clicks": 1240,
  "total_conversions": 87,
  "conversion_rate": 7.0,
  "points": [
    { "date": "2026-06-07", "views": 780, "clicks": 180, "conversions": 12 },
    { "date": "2026-06-08", "views": 920, "clicks": 210, "conversions": 15 }
  ]
}
```

**Field descriptions:**
| Field | Type | Description |
|-------|------|-------------|
| `total_views` | int | Total number of times the merchant profile/offer page was opened |
| `total_clicks` | int | Total number of offer "use" / "apply" button clicks |
| `total_conversions` | int | Total successful verifications (= `orders_month`) |
| `conversion_rate` | float | `(total_conversions / total_views) * 100` |
| `points[].views` | int | Page views for that day |
| `points[].clicks` | int | Offer clicks for that day |
| `points[].conversions` | int | Successful verifications for that day |

**Note:** This requires event tracking in the customer app (analytics events for page views and offer clicks). If analytics events are not tracked, at minimum `conversions` can be derived from `VerificationLog`.

---

## 4. Rating Analytics

**Endpoint:** `GET /api/merchant/analytics/rating/`

**Query params:** `?outlet_id=<int>` (optional)

**Auth:** Merchant (OWNER or ADMIN)

**Description:** Returns rating distribution and per-outlet breakdown for all partner outlets.

**Response:**
```json
{
  "avg_rating": 4.3,
  "total_reviews": 126,
  "distribution": [
    { "stars": 5, "count": 68 },
    { "stars": 4, "count": 32 },
    { "stars": 3, "count": 15 },
    { "stars": 2, "count": 7 },
    { "stars": 1, "count": 4 }
  ],
  "by_outlet": [
    { "outlet_id": 1, "outlet_name": "Центральный филиал", "avg_rating": 4.6, "total_reviews": 74 },
    { "outlet_id": 2, "outlet_name": "Филиал Чиланзар", "avg_rating": 4.1, "total_reviews": 31 }
  ]
}
```

**Data source:** `VerificationLog` has a `rating` field (if ratings are stored there), or a separate `Review` / `Rating` model linked to outlet verifications.

---

## 5. Merchant Reviews List

**Endpoint:** `GET /api/merchant/reviews/`

**Query params:** `?outlet_id=<int>&page=<int>&page_size=<int>`

**Auth:** Merchant (OWNER or ADMIN)

**Description:** Returns paginated list of customer reviews left for the merchant's outlets.

**Response (paginated):**
```json
{
  "count": 42,
  "next": "/api/merchant/reviews/?page=2",
  "previous": null,
  "results": [
    {
      "id": 1,
      "customer_name": "Алишер К.",
      "rating": 5,
      "comment": "Отличное обслуживание!",
      "outlet_id": 1,
      "outlet_name": "Центральный филиал",
      "deal_title": "Скидка 20% на пиццу",
      "created_at": "2026-06-12T14:00:00Z",
      "is_replied": false,
      "reply": null
    }
  ]
}
```

---

## 6. Reply to Review

**Endpoint:** `POST /api/merchant/reviews/<id>/reply/`

**Auth:** Merchant (OWNER or ADMIN)

**Request body:**
```json
{ "reply": "Спасибо за ваш отзыв! Рады были вас обслужить." }
```

**Response:** Updated review object (same shape as review list item above with `is_replied: true` and `reply` set).

---

## 7. Verification Logs — Date Filtering (Enhancement)

**Existing endpoint:** `GET /api/merchant/<outlet_id>/verification-logs`

**Missing query params:** `?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD&search=<str>&status=<valid|invalid|expired|blacklisted>`

**Current limitation:** The endpoint returns the last 200 records with no filtering. For the merchant panel to be usable, it needs:
- Date range filtering (`start_date`, `end_date`)
- Status filtering
- Search by customer phone
- Proper pagination (currently hardcoded to 200 records)

---

## Summary Table

| Endpoint | Method | Priority | Status |
|----------|--------|----------|--------|
| `/api/merchant/dashboard/` | GET | HIGH | ❌ Missing |
| `/api/merchant/analytics/sales/` | GET | HIGH | ❌ Missing |
| `/api/merchant/analytics/rating/` | GET | MEDIUM | ❌ Missing |
| `/api/merchant/reviews/` | GET | MEDIUM | ❌ Missing |
| `/api/merchant/reviews/<id>/reply/` | POST | MEDIUM | ❌ Missing |
| `/api/merchant/analytics/traffic/` | GET | LOW | ❌ Missing (requires analytics tracking) |
| `/api/merchant/<outlet_id>/verification-logs` (date filter) | GET | HIGH | ⚠️ Exists, needs enhancement |
