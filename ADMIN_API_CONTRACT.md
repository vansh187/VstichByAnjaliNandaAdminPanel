# VStitch Admin API — Contract for Backend Implementation

This is the API contract the admin panel is built against. The panel currently runs on a mock
adapter (`src/api/mockAdapter.js`) that implements every function in this doc with in-memory data.
Nothing in the frontend needs to change when the real backend ships — only
`VITE_USE_MOCK_API=false` and `VITE_API_BASE_URL` in `.env` need to be set (see `src/api/index.js`).

Background: the existing backend (`signupapi.py`, `loginapi.py`, `productapi.py`, `categoryapi.py`,
`orderapi.py`, `paymentApi.py`, `shipmentApi.py`, `shipmentOpsApi.py`) has **no admin surface at all**
today — no admin role, no cross-customer order listing, no order-status mutation, no product/category
writes. Everything below is net-new. Naming follows the existing convention (snake_case JSON,
`vstitch_*_id` identifiers) so it reads as part of the same API family.

All endpoints below require `Authorization: Bearer <admin JWT>` unless noted otherwise. The admin JWT
is distinct from the customer JWT (`loginapi.py`) — it must carry a role/scope claim (e.g. `"role": "admin"`),
since `VStitch_Users` today has no such column and nothing else in the system distinguishes an admin caller
from a customer.

## Auth

### `POST /admin/login`
Public. Authenticates an admin and issues the admin JWT.

Request: `{ admin_username, password }`
Response: `{ access_token, token_type, admin_id, admin_username }`

Requires a new admin identity source — either a role flag added to `VStitch_Users` or a separate
`VStitch_AdminUsers` table. Recommend the latter, since customers and admins have different
lifecycle/security requirements (password rotation, 2FA, etc. down the line).

## Orders

### `GET /admin/orders`
List orders across **all** customers (unlike the existing customer-scoped `GET /orders`).

Query: `status`, `payment_method`, `search` (order id / customer name / email), `after_id`, `limit`
Response item:
```
vstitch_order_id, vstitch_user_id, customer_name, customer_email,
order_status, payment_method, total_amount,
shipping_recipient_name, shipping_address_line1, shipping_address_line2,
shipping_city, shipping_state, shipping_postal_code, shipping_country, shipping_phone_number,
awb_code, courier_name, created_date,
items: [{ vstitch_order_item_id, product_name_snapshot, size_snapshot, color_snapshot,
          unit_price_snapshot, quantity }]
```

### `GET /admin/orders/{vstitch_order_id}`
Single order, same shape as above (used for a detail/drawer view).

### `PATCH /admin/orders/{vstitch_order_id}/status`
The order-status-update endpoint that doesn't exist today — `OrderStatus` currently only advances via
the Shiprocket webhook or the customer's own cancel action.

Request: `{ order_status }` — must be one of the existing `OrderStatus` CHECK values:
`payment_pending, payment_failed, placed, confirmed, processing, shipped, out_for_delivery, delivered, cancelled, delivery_failed`
Response: the updated order (same shape as list item)

Should reject transitions that skip the documented flow (e.g. `placed` → `delivered` directly) unless
the admin panel is expected to allow manual overrides — flag this as a product decision for whoever
implements it.

## Revenue / Dashboard

### `GET /admin/revenue/summary`
Query: `from_date`, `to_date` (optional, defaults to today)
Response:
```
today_revenue, today_orders_count,
total_revenue, total_orders_count,
pending_orders_count, low_stock_count, pending_shipments_count
```
"Revenue" should sum `total_amount` for orders that are paid — i.e. `payment_method = 'cod'` orders
count once `placed` or later; `razorpay` orders only count once payment is `captured` (join against
`VStitch_PaymentTransactions`). This distinction matters — a `payment_pending` Razorpay order is not revenue yet.

### `GET /admin/revenue/daily`
Query: `from_date`, `to_date`
Response: `[{ date, revenue, orders_count }]` — for a trend chart.

## Categories

### `GET /admin/categories`
Same as the public `GET /categories` but should include inactive ones (`is_active = false`) so the
admin can re-enable them.

### `POST /admin/categories`
Request: `{ category_name, parent_category_id (nullable), image_url (nullable) }`
Response: created category `{ vstitch_category_id, category_name, parent_category_id, image_url, is_active }`

Must honor the existing DB constraints: unique on `(category_name, parent_category_id)`, plus the
partial-unique-index on top-level category names — return a 409 with a clear message on collision so
the panel can surface "category already exists."

### `PATCH /admin/categories/{id}` / `DELETE /admin/categories/{id}`
Standard update / soft-delete (set `is_active = false` — do not hard-delete a category referenced by products).

## Products (with variants) — supports adding multiple products in one submission

### `GET /admin/products`
Admin listing, includes inactive products and full variant/stock detail (unlike the public listing
which only exposes `min_price`/`max_price`/`in_stock`).

Response item: `{ vstitch_product_id, product_name, description, category_id, category_name,
base_price, is_active, variants: [...], images: [...] }`

### `POST /admin/products`
**Accepts an array** so the admin can create several products in a single request (this is what the
"add multiple products at one time" UI submits).

Request:
```json
{
  "products": [
    {
      "product_name": "...",
      "description": "...",
      "category_id": 12,
      "base_price": 4899,
      "is_active": true,
      "variants": [
        { "size": "M", "color": "Maroon", "sku": "SAR-0142-M-MRN", "price": 4899,
          "stock_quantity": 12, "weight_kg": 0.5, "length_cm": 30, "breadth_cm": 20, "height_cm": 5 }
      ],
      "images": [ { "image_url": "...", "is_primary": true, "display_order": 0 } ]
    }
  ]
}
```
Response: `{ created: [...products with generated ids...], errors: [{ index, message }] }` — partial
success is expected (e.g. one row in the batch has a duplicate SKU); the panel needs per-row error
reporting, not an all-or-nothing 400.

### `PATCH /admin/products/{id}` / `DELETE /admin/products/{id}` (soft-delete via `is_active`)
### `POST /admin/products/{id}/variants` — add a variant to an existing product
### `PATCH /admin/product-variants/{id}` / `DELETE /admin/product-variants/{id}`

## Returns (admin action — exists as a DB workflow today but nothing drives it)

### `GET /admin/returns`
### `PATCH /admin/returns/{id}/status`
Request: `{ status }` — one of `requested, approved, rejected, picked_up, completed, cancelled`

## Shipping ops — proxy, don't expose the ops key to the browser

`shipmentOpsApi.py` already has pickup/label/manifest/invoice/NDR endpoints, but they're gated by
`X-Internal-Ops-Api-Key`, a static shared secret. **The admin panel (a browser app) must never hold
that key.** Add thin admin-JWT-authenticated wrapper endpoints (`/admin/shipments/pickup`, etc.) that
the backend calls through to the existing ops endpoints server-side, injecting the ops key itself.
