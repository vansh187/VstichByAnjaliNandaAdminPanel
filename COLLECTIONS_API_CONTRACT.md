# Collections Admin API — contract (as delivered by backend)

Everything the admin app needs to build, curate and publish seasonal collections
such as **Summer Luxe** / **Winter**. Consumed by the admin panel's **Collections** tab.

## Base & auth

Every route is under the same host as the rest of the API. All `/admin/*` routes
require a bearer token from `POST /admin/login`:
`Authorization: Bearer <admin_jwt>`. Missing / invalid token → `401`.

## Concepts

- A **collection** is a curated, *ordered* set of existing products tagged with one
  `season`, plus its own banner / lookbook imagery. It does not own products — it
  points at rows from the product catalogue.
- **Seasons:** exactly one of `SUMMER`, `WINTER`, `SPRING`, `AUTUMN` (uppercase).
- **Slug:** `^[a-z0-9]+(?:-[a-z0-9]+)*$`, 1–120 chars, unique. Public URL key; can be
  changed later with `PATCH`.
- **Pagination:** keyset. Read `next_cursor`, pass it back as `after_id`; stop when
  `has_more` is `false`.
- **Soft deletes:** `DELETE` sets `is_active = false`. The record leaves the public
  API but stays in the admin list and can be re-activated with `PATCH`.
- **Error shape:** handled errors → `{ "detail": "<string>" }`. Request-schema
  validation (missing field, bad slug pattern, wrong type) → `{ "detail": [ { loc, msg, type } ] }`.
  Both are HTTP `422`.

## Objects

```
AdminCollection {
  vstitch_collection_id, collection_name, slug, season,
  subtitle|null, description|null, display_order, is_active,
  product_ids: int[],                      // curated storefront order
  images: AdminCollectionImage[]           // primary first, then display_order
}

AdminCollectionImage {
  vstitch_collection_image_id, image_url, is_primary, display_order, is_active
}
```

## Endpoints

| Method & path | Purpose |
| --- | --- |
| `POST /admin/images/upload` | Upload one image, get a public URL (multipart: `file`, `image_type=collection`). Returns `{ image_url }`. |
| `GET /admin/collections` | List (incl. inactive), paginated. Query: `after_id`, `limit` (1–100, default 20). Rows are summaries: `product_count` + `primary_image_url` instead of full lists. Returns `{ items, next_cursor, has_more }`. |
| `POST /admin/collections` | Create. Body: `collection_name`\*, `slug`\*, `season`\*, `subtitle?`, `description?`, `is_active?` (default `true`), `display_order?` (default `0`, ≥ 0). → `201` full `AdminCollection` with `product_ids: []`, `images: []`. `409` duplicate slug. `422` bad slug/season/missing field. |
| `GET /admin/collections/{id}` | Full `AdminCollection` (incl. inactive), complete ordered `product_ids` + every active image. `404`. |
| `PATCH /admin/collections/{id}` | Partial update — send only changed fields. `subtitle`/`description` accept explicit `null` (clears). `collection_name`/`slug`/`season`/`is_active`/`display_order` reject `null` → `422`. `404` · `409` (slug) · `422`. |
| `DELETE /admin/collections/{id}` | Soft delete (`is_active = false`). → `204`. `404`. |
| `PUT /admin/collections/{id}/products` | Replace the **entire** ordered list. Body: `{ product_ids: int[] }` — ordered, ≤ 500, no duplicates, all > 0, all existing **active** products. Send `[]` to empty. → `200` full `AdminCollection`. `422` `"Products not found or inactive: [999]."` (nothing written) / `"product_ids contains duplicates."`. `404`. |
| `POST /admin/collections/{id}/images` | Attach an uploaded URL. Body: `image_url`\* (1–500), `is_primary?` (default `false`; forced `true` for the first image), `display_order?` (≥ 0). → `201` `AdminCollectionImage`. `404` · `409` (rare primary race, retry). |
| `PATCH /admin/collections/{id}/images/{imageId}` | Change `is_primary` and/or `display_order` (both optional, `null` rejected). Promoting one to primary demotes the current primary. → `200`. `404` (also when the image belongs to another collection). |
| `DELETE /admin/collections/{id}/images/{imageId}` | Soft delete. If it was primary, the next image by `display_order` is promoted. → `204`. `404`. |

\* required

## Integration flow

1. `POST /admin/login` — get the bearer token.
2. `POST /admin/images/upload` (`image_type=collection`) — get `image_url`.
3. `POST /admin/collections` — name, slug, season → `vstitch_collection_id`.
4. `POST /admin/collections/{id}/images` — pass the `image_url`, `is_primary: true`.
5. `PUT /admin/collections/{id}/products` — ordered `product_ids` from `GET /admin/products`.
6. `GET /collections/{slug}` — verify on the storefront.

## Field constraints

| Field | Rule |
| --- | --- |
| `collection_name` | string, 1–250, required on create |
| `slug` | string, 1–120, `^[a-z0-9]+(?:-[a-z0-9]+)*$`, unique |
| `season` | `SUMMER` · `WINTER` · `SPRING` · `AUTUMN` |
| `subtitle` | string ≤ 300, nullable |
| `description` | string, nullable, no cap |
| `display_order` | integer ≥ 0 (collections and images) |
| `product_ids` | int[], ≤ 500, no duplicates, all > 0, all active products |
| `image_url` | string, 1–500 |
| `file` (upload) | JPG / PNG / WEBP, ≤ 10 MB; re-encoded to WebP ≤ 1600 px |
| `limit` (list) | integer 1–100, default 20 |
