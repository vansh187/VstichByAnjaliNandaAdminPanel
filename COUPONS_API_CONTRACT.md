# Marketing — Coupons API Contract

Net-new. Requires a new `VStitch_Coupons` table — no coupon/discount concept exists in the schema today. Naming follows the existing convention (`vstitch_coupon_id`, snake_case columns).

Suggested `VStitch_Coupons` table columns:
```
vstitch_coupon_id      PK, serial
coupon_code            varchar, UNIQUE, e.g. "FESTIVE20"  (store upper-cased)
discount_type          varchar CHECK IN ('percentage', 'flat')
discount_value         numeric  -- % (0-100) if percentage, ₹ amount if flat
min_order_amount       numeric, nullable  -- order subtotal must meet this to apply
max_discount_amount    numeric, nullable  -- cap on ₹ discount for percentage coupons
usage_limit            integer, nullable  -- total redemptions allowed; null = unlimited
used_count             integer, default 0 -- incremented by checkout/order flow on redemption
valid_from             timestamp, default now()
valid_until            timestamp, nullable  -- null = no expiry
is_active              boolean, default true
created_date           timestamp, default now()
```

All endpoints below require `Authorization: Bearer <admin JWT>`.

## `GET /admin/coupons`
List all coupons (active and inactive), newest first.

Response:
```json
[
  {
    "vstitch_coupon_id": 1,
    "coupon_code": "FESTIVE20",
    "discount_type": "percentage",
    "discount_value": 20,
    "min_order_amount": 2000,
    "max_discount_amount": null,
    "usage_limit": null,
    "used_count": 0,
    "valid_from": "2026-07-29T00:00:00Z",
    "valid_until": null,
    "is_active": true,
    "created_date": "2026-07-29T00:00:00Z"
  }
]
```

## `POST /admin/coupons`
Creates a coupon — this is what the admin panel's "+ Add Coupon" button submits.

Request:
```json
{
  "coupon_code": "FESTIVE20",
  "discount_type": "percentage",
  "discount_value": 20,
  "min_order_amount": 2000,
  "max_discount_amount": null,
  "usage_limit": null,
  "valid_until": null
}
```

Validation rules:
- `coupon_code` — required, upper-case/trim server-side too; reject a case-insensitive duplicate with **409** and a clear message ("coupon code already exists").
- `discount_type` — required, one of `percentage` | `flat`.
- `discount_value` — required, > 0; if `discount_type` is `percentage`, must also be ≤ 100.
- `min_order_amount`, `max_discount_amount`, `usage_limit`, `valid_until` — all optional/nullable.

Response: the created coupon, same shape as the `GET` list item (`used_count: 0`, `is_active: true`, `valid_from`/`created_date` set server-side to now).

## `PATCH /admin/coupons/{vstitch_coupon_id}`
Toggles a coupon on/off (deactivate instead of delete, so redemption history is preserved).

Request:
```json
{ "is_active": false }
```

Response: the updated coupon (same shape as list item).
