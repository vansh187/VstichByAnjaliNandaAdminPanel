# Ready to Ship — API contract (as delivered by backend)

`POST /admin/orders/{vstitch_order_id}/ready-to-ship`

Books the Shiprocket shipment + courier/AWB for an order, writes the AWB to our DB, and advances the
order to `shipped`. This is the **only** trigger for shipment creation — nothing is booked at checkout.

## Authorization

- **Admin only.** `Authorization: Bearer <admin access_token>` — the same token issued by
  `POST /admin/login`. No customer / storefront user may call this endpoint.
- Missing / invalid / expired token → `401` (the admin panel drops back to the login screen).

## Request

```
POST /admin/orders/5001/ready-to-ship
Authorization: Bearer <admin access_token>
```

- Path param: `vstitch_order_id` (integer, ≥ 1)
- No request body
- No query params

## Success — `200 OK`

Full updated order, identical shape to a `GET /admin/orders` list item.

```json
{
  "vstitch_order_id": 5001,
  "vstitch_user_id": 812,
  "customer_name": "Anjali Sharma",
  "customer_email": "anjali@example.com",
  "order_status": "shipped",
  "payment_method": "cod",
  "total_amount": 2499.0,
  "shipping_recipient_name": "Anjali Sharma",
  "shipping_address_line1": "12 Rose Villa",
  "shipping_address_line2": "MG Road",
  "shipping_city": "Pune",
  "shipping_state": "Maharashtra",
  "shipping_postal_code": "411001",
  "shipping_country": "India",
  "shipping_phone_number": "+919812345678",
  "awb_code": "784512369874",
  "courier_name": "Delhivery",
  "created_date": "2026-08-28T15:45:00+05:30",
  "items": [
    {
      "vstitch_order_item_id": 90011,
      "product_name_snapshot": "Silk Anarkali Kurta",
      "size_snapshot": "M",
      "color_snapshot": "Maroon",
      "purchase_option_snapshot": "stitched",
      "unit_price_snapshot": 2499.0,
      "quantity": 1
    }
  ]
}
```

Field notes:

- `order_status` will be `"shipped"` on success.
- `awb_code`, `courier_name` — string on success; may be `null` only in the rare case Shiprocket
  booked the shipment but the status write lagged (treat `null` as "refresh the row").
- `shipping_address_line2`, `size_snapshot`, `color_snapshot`, `purchase_option_snapshot` — nullable.
- `created_date` — ISO-8601 with `+05:30` (IST) offset.
- `total_amount`, `unit_price_snapshot` — numbers (float).

## Errors

All error bodies are `{ "detail": "<string>" }`. `detail` is shown to the admin verbatim.

| HTTP | `detail` | Meaning | Client action |
| --- | --- | --- | --- |
| `401` | `Invalid or expired admin access token.` | missing / bad / expired token | send to login |
| `404` | `Order not found` | no order with that id | resync list |
| `409` | `Order cannot be marked ready to ship from its current status` | already shipped/delivered/cancelled, or still awaiting payment | refresh the row; hide the button |
| `409` | `This order is already being marked ready to ship - wait for that to finish, then refresh.` | a previous click is still in flight | disable button briefly, then refetch |
| `502` | `Courier assignment failed, please retry` | Shiprocket rejected / unreachable / transient | keep button enabled, allow retry |

## Guarantees

- **Idempotent.** A double-click or a retry after a failure will not create a second Shiprocket
  order. Repeated calls after success return `409` (first message).
- On `502`, retrying is safe — it resumes where it left off.
