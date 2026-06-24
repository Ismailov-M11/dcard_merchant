# MISSING_APIS — dcardback

Specification of backend endpoints required by `dcardmerchant-main` that are **not implemented** in the current backend.

Backend: Django REST Framework · `EnvelopeJSONRenderer` wrapper (`{ success, data, error, meta }`) · JWT auth via `Authorization: Bearer <access_token>` · `StandardResultsSetPagination` (`{ count, next, previous, results }`) · Permission class: `MerchantSchema` (role `MERCHANT_OWNER` | `PARTNER_OWNER` | `ADMIN`).

---

## 1. `GET /api/merchant/dashboard/`

### Permission
`MerchantSchema` — `MERCHANT_OWNER` or `PARTNER_OWNER` or `ADMIN`

### Query params
None. Data scope is derived from `request.user` → all `Partner` IDs via `get_user_partner_ids(request.user)`.

### Logic
```python
partner_ids = get_user_partner_ids(request.user)
outlets     = Outlet.objects.filter(partner_id__in=partner_ids, is_active=True)
outlet_ids  = list(outlets.values_list('id', flat=True))

now          = timezone.now()
month_start  = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
prev_start   = (month_start - timedelta(days=1)).replace(day=1)

logs_month   = VerificationLog.objects.filter(outlet_id__in=outlet_ids, status='valid', timestamp__gte=month_start)
logs_prev    = VerificationLog.objects.filter(outlet_id__in=outlet_ids, status='valid', timestamp__gte=prev_start, timestamp__lt=month_start)
active_deals = OutletSpecialOffer.objects.filter(partner_id__in=partner_ids, status='active').count()
```

Rating source: if a `Rating` or `Review` model exists linked to `VerificationLog` or `Outlet`, aggregate `avg(rating)` over current month. If not implemented — return `null`.

### Response body (`data` field)
```jsonc
{
  "revenue_month":      0,          // int | null — sum of transaction amounts in UZS; null if not tracked
  "revenue_prev_month": 0,          // int | null
  "orders_month":       87,         // int — COUNT of VerificationLog(status='valid', timestamp >= month_start)
  "orders_prev_month":  71,         // int — COUNT of VerificationLog(status='valid', prev month)
  "active_deals":       4,          // int — COUNT of OutletSpecialOffer(status='active', partner__in=partner_ids)
  "total_branches":     3,          // int — COUNT of Outlet(partner__in=partner_ids, is_active=True)
  "avg_rating":         4.3,        // float | null — AVG rating across all outlets; null if not tracked
  "new_reviews":        12          // int | null — COUNT of new reviews this month; null if not tracked
}
```

### HTTP status codes
| Code | Condition |
|------|-----------|
| `200` | OK |
| `401` | Missing / invalid JWT |
| `403` | User has no partner association |

---

## 2. `GET /api/merchant/analytics/sales/`

### Permission
`MerchantSchema` — OWNER or ADMIN

### Query params
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `from` | `date` YYYY-MM-DD | No | Start of period (default: 7 days ago) |
| `to`   | `date` YYYY-MM-DD | No | End of period (default: today) |
| `outlet_id` | `int` | No | Filter to single outlet; must belong to caller's partner |

### Logic
```python
partner_ids = get_user_partner_ids(request.user)
outlets = Outlet.objects.filter(partner_id__in=partner_ids)
if outlet_id:
    outlets = outlets.filter(pk=outlet_id)  # validate ownership

logs = VerificationLog.objects.filter(
    outlet__in=outlets,
    status='valid',
    timestamp__date__gte=date_from,
    timestamp__date__lte=date_to,
).select_related('special_offer')

# Group by day:
points = logs.annotate(date=TruncDate('timestamp')).values('date').annotate(
    orders=Count('id'),
    discount_amount=Sum(F('discount_percent') * F('price') / 100),  # if price exists
).order_by('date')

# Group by offer_type for revenue split:
by_type = logs.values('special_offer__offer_type').annotate(orders=Count('id'))
```

### Response body (`data` field)
```jsonc
{
  "total_revenue":           12450000,   // int | null — sum of discounted transaction amounts in UZS
  "total_orders":            87,         // int — COUNT(valid verifications in period)
  "total_discount":          2340000,    // int | null
  "avg_order":               143103,     // int | null — total_revenue / total_orders
  "revenue_by_discount":     5200000,    // int | null — revenue from OfferType.EXCLUSIVE (discount %)
  "revenue_by_one_plus_one": 4150000,    // int | null — revenue from OfferType.ONE_PLUS_ONE
  "revenue_by_exclusive":    3100000,    // int | null — revenue from OfferType.EXCLUSIVE
  "points": [
    {
      "date":            "2026-06-07",   // str YYYY-MM-DD
      "revenue":         1800000,        // int | null
      "orders":          12,             // int
      "discount_amount": 360000          // int | null
    }
  ]
}
```

### HTTP status codes
| Code | Condition |
|------|-----------|
| `200` | OK |
| `400` | Invalid date format |
| `403` | `outlet_id` does not belong to caller's partner |

---

## 3. `GET /api/merchant/analytics/traffic/`

### Permission
`MerchantSchema` — OWNER or ADMIN

### Query params
Same as `analytics/sales/`: `from`, `to`, `outlet_id`.

### Prerequisite
Requires an analytics event model or an existing analytics tracking mechanism in the customer mobile app. Minimum viable implementation: derive `conversions` from `VerificationLog`; derive `views` and `clicks` from a new `AnalyticsEvent` table (or `analytics` app if tracking is added).

### Response body (`data` field)
```jsonc
{
  "total_views":       5340,   // int — SUM of 'page_view' events for partner's offer/profile pages
  "total_clicks":      1240,   // int — SUM of 'offer_click' events
  "total_conversions": 87,     // int — COUNT(VerificationLog, status='valid')
  "conversion_rate":   7.0,    // float — (total_conversions / total_views) * 100, rounded to 1dp
  "points": [
    {
      "date":        "2026-06-07",
      "views":       780,
      "clicks":      180,
      "conversions": 12
    }
  ]
}
```

---

## 4. `GET /api/merchant/analytics/rating/`

### Permission
`MerchantSchema` — OWNER or ADMIN

### Query params
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `outlet_id` | `int` | No | Filter to single outlet |

### Logic
Data source: a `Rating` model (or `VerificationLog.rating` if ratings are stored there) linked to `Outlet`.

```python
partner_ids = get_user_partner_ids(request.user)
outlets = Outlet.objects.filter(partner_id__in=partner_ids)

ratings = Rating.objects.filter(outlet__in=outlets)   # or VerificationLog with rating field
agg = ratings.aggregate(avg=Avg('value'), total=Count('id'))

distribution = (
    ratings.values('value').annotate(count=Count('id')).order_by('value')
)
by_outlet = (
    ratings.values('outlet_id', 'outlet__name')
    .annotate(avg_rating=Avg('value'), total_reviews=Count('id'))
)
```

### Response body (`data` field)
```jsonc
{
  "avg_rating":    4.3,          // float
  "total_reviews": 126,          // int
  "distribution": [
    { "stars": 5, "count": 68 },
    { "stars": 4, "count": 32 },
    { "stars": 3, "count": 15 },
    { "stars": 2, "count": 7  },
    { "stars": 1, "count": 4  }
  ],
  "by_outlet": [
    {
      "outlet_id":     1,
      "outlet_name":   "Центральный филиал",
      "avg_rating":    4.6,
      "total_reviews": 74
    }
  ]
}
```

---

## 5. `GET /api/merchant/reviews/`

### Permission
`MerchantSchema` — OWNER or ADMIN

### Query params
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `outlet_id` | `int` | No | Filter to single outlet |
| `page` | `int` | No | Pagination cursor |
| `page_size` | `int` | No | Default 20, max 100 |

### Logic
```python
partner_ids = get_user_partner_ids(request.user)
reviews = Review.objects.filter(outlet__partner_id__in=partner_ids).order_by('-created_at')
if outlet_id:
    reviews = reviews.filter(outlet_id=outlet_id)
```

### Response body (paginated)
```jsonc
{
  "count": 42,
  "next": "/api/merchant/reviews/?page=2",
  "previous": null,
  "results": [
    {
      "id":            1,
      "customer_name": "Алишер К.",          // str — anonymised display name
      "rating":        5,                    // int 1–5
      "comment":       "Отличное место!",    // str | null
      "outlet_id":     1,                    // int
      "outlet_name":   "Центральный филиал", // str
      "deal_title":    "Скидка 20%",         // str | null — OutletSpecialOffer.title at time of visit
      "created_at":    "2026-06-12T14:00:00Z",
      "is_replied":    false,                // bool
      "reply":         null                  // str | null
    }
  ]
}
```

---

## 6. `POST /api/merchant/reviews/<id>/reply/`

### Permission
`MerchantSchema` — OWNER or ADMIN. Must verify that `review.outlet.partner_id` is in caller's partner list.

### Request body
```json
{ "reply": "Спасибо за ваш отзыв!" }
```

### Validation
- `reply`: `CharField(max_length=1000, required=True, allow_blank=False)`
- Cannot reply twice (if `review.reply` is already set, return `400`)

### Response body (`data` field)
Full review object (same schema as item in `GET /api/merchant/reviews/`) with `is_replied: true` and `reply` populated.

### HTTP status codes
| Code | Condition |
|------|-----------|
| `200` | Reply saved |
| `400` | `reply` blank, or review already has a reply |
| `403` | Review does not belong to caller's partner |
| `404` | Review `id` not found |

---

## 7. Enhancement: `GET /api/merchant/<outlet_id>/verification-logs` — add filtering & pagination

**Current state:** Returns last 200 records, no filtering, no pagination.

**Required additions:**

### Additional query params
| Param | Type | Description |
|-------|------|-------------|
| `start_date` | `date` YYYY-MM-DD | Filter `timestamp__date >= start_date` |
| `end_date` | `date` YYYY-MM-DD | Filter `timestamp__date <= end_date` |
| `status` | `str` choices: `valid,invalid,expired,blacklisted` | Filter by `VerificationLog.status` |
| `search` | `str` | `icontains` filter on `user__phone` |
| `page` | `int` | Pagination |
| `page_size` | `int` | Default 50, max 200 |

### Change response format
Wrap results in `StandardResultsSetPagination` instead of a plain `{"results": [...]}` list:
```jsonc
{
  "count": 412,
  "next": "/api/merchant/1/verification-logs?page=2",
  "previous": null,
  "results": [ /* VerificationLogEntry */ ]
}
```

---

## Dependency map (dcardmerchant-main consumers)

| Endpoint | Consumer file |
|----------|---------------|
| `/api/merchant/dashboard/` | `src/api/dashboard.ts` → `src/pages/DashboardPage.tsx` |
| `/api/merchant/analytics/sales/` | `src/api/mock/analytics.ts` → `src/pages/AnalyticsPage.tsx` |
| `/api/merchant/analytics/traffic/` | `src/api/mock/analytics.ts` → `src/pages/AnalyticsPage.tsx` |
| `/api/merchant/analytics/rating/` | `src/api/mock/analytics.ts` → `src/pages/AnalyticsPage.tsx` |
| `/api/merchant/reviews/` | `src/api/mock/reviews.ts` → `src/pages/AnalyticsPage.tsx` (ReviewsDialog) |
| `/api/merchant/reviews/<id>/reply/` | `src/api/mock/reviews.ts` → `src/pages/AnalyticsPage.tsx` |
| `/api/merchant/<outlet_id>/verification-logs` (enhanced) | `src/api/verificationLogs.ts` → `src/pages/OrdersPage.tsx` |
