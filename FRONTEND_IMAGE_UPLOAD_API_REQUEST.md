# Image Upload Endpoint — Request for Backend

Audience: backend team.
Context: the admin panel's "Add Product" and "Add Category" forms currently
ask the admin to paste an `image_url`. We're replacing that with a real
file-upload button (matches the design shared), so the admin picks a photo
from their computer instead of hosting it somewhere else first and copying
a link.

The rest of the product/category contract (`POST /admin/products`,
`POST /admin/categories`) is **unchanged** — they still take `image_url`
strings. This doc only asks for **one new endpoint** that turns an
uploaded file into the `image_url` the frontend already knows how to send.

## Flow

1. Admin clicks "Upload Image" and picks a file.
2. Frontend immediately calls `POST /admin/images/upload` with that file.
3. Backend stores it (S3 / cloud storage / wherever product images already
   live) and returns the public `image_url`.
4. Frontend shows "Image uploaded successfully" and holds onto that URL.
5. When the admin submits the Add Product / Add Category form, the URL
   collected in step 3 is sent as `image_url` in the existing
   `POST /admin/products` / `POST /admin/categories` payloads — no change
   needed there.

Category images: **one per category** (single upload slot, replaces the
existing `image_url` field on `POST /admin/categories`).
Product images: **multiple per product** (repeatable upload slots feeding
the existing `images: [{ image_url, is_primary, display_order }]` array on
`POST /admin/products`).

## `POST /admin/images/upload`

Requires the same admin bearer token as every other `/admin/*` endpoint.

**Request** — `multipart/form-data`

| Field | Type | Notes |
|---|---|---|
| `file` | binary | the image file |
| `image_type` | string | `"category"` or `"product"` — lets the backend pick a storage folder/validation if needed |

```
POST /admin/images/upload
Authorization: Bearer <admin_access_token>
Content-Type: multipart/form-data; boundary=...

------WebKitFormBoundary
Content-Disposition: form-data; name="file"; filename="dupatta-white.jpg"
Content-Type: image/jpeg

<binary data>
------WebKitFormBoundary
Content-Disposition: form-data; name="image_type"

product
------WebKitFormBoundary--
```

**Response `200`**
```json
{
  "image_url": "https://storage.example.com/products/dupatta-white-a1b2c3.jpg"
}
```

**Response `422`** (missing file, wrong `image_type`, unsupported file
type, or file too large)
```json
{ "detail": "Only JPG, PNG, or WEBP images are allowed." }
```
```json
{ "detail": "Image must be smaller than 5MB." }
```

**Response `401`** — same shape as every other admin endpoint:
```json
{ "detail": "Invalid or expired admin access token." }
```

**Response `500`/`502`** — generic safe-to-display message, same convention
as the rest of the API, for storage-backend failures.

### Suggested constraints (frontend already enforces these client-side —
listing them so backend validation matches and a bypassed client can't
slip something bad through)
- Accepted types: `image/jpeg`, `image/png`, `image/webp`.
- Max size: 5 MB.
- `image_type` must be `"category"` or `"product"`.

## Nothing else changes

`POST /admin/products` and `POST /admin/categories` keep taking
`image_url` as a plain string exactly as documented in
`ADMIN_API_CONTRACT.md` — this endpoint just gives the frontend a way to
produce that string from a real file instead of asking the admin to have
one hosted already.
