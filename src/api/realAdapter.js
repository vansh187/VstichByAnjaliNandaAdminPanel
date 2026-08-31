import { request, setAdminToken } from './client.js';

// Safety cap so a runaway "has_more" flag from the server can never turn
// this into an infinite loop — 25 pages * 100 rows covers 2500 records,
// far beyond what the dashboard needs to render in one screen.
const MAX_PAGES = 25;
const PAGE_SIZE = 100;

// The admin API paginates list endpoints via `after_id`/`has_more`/`next_cursor`.
// The panel has no pagination UI yet, so we walk every page here and hand
// the tabs a plain flat array — same shape the mock adapter already returns.
async function fetchAllPages(path, baseParams, listKey) {
  const all = [];
  let afterId;
  for (let page = 0; page < MAX_PAGES; page++) {
    const res = await request(path, { params: { ...baseParams, limit: PAGE_SIZE, after_id: afterId } });
    all.push(...res[listKey]);
    if (!res.has_more || res.next_cursor == null) break;
    afterId = res.next_cursor;
  }
  return all;
}

// ---------- Auth ----------

export async function login({ admin_username, password }) {
  const res = await request('/admin/login', { method: 'POST', body: { admin_username, password } });
  setAdminToken(res.access_token);
  return res;
}

export async function resetPassword({ admin_username, email, new_password }) {
  return request('/admin/reset-password', { method: 'POST', body: { admin_username, email, new_password } });
}

// ---------- Orders ----------

export async function getOrders({ status, payment_method, search } = {}) {
  const orders = await fetchAllPages('/admin/orders', { status, payment_method, search }, 'orders');
  // The API's cursor order isn't guaranteed to be newest-first, so sort
  // explicitly here — same guarantee the mock adapter provides.
  return orders.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
}

export async function updateOrderStatus(orderId, order_status) {
  return request(`/admin/orders/${orderId}/status`, { method: 'PATCH', body: { order_status } });
}

export async function syncOrderStatus(orderId) {
  return request(`/admin/orders/${orderId}/sync-status`, { method: 'POST' });
}

// Marks a packed order ready for courier pickup — the backend generates the
// AWB / assigns a courier and advances the order to `shipped`. See the
// "POST /admin/orders/{id}/ready-to-ship" section of ADMIN_API_CONTRACT.md.
export async function markOrderReadyToShip(orderId) {
  return request(`/admin/orders/${orderId}/ready-to-ship`, { method: 'POST' });
}

// ---------- Revenue ----------

export async function getRevenueSummary(params) {
  return request('/admin/revenue/summary', { params });
}

// ---------- Collections ----------
// See COLLECTIONS_API_CONTRACT.md. A collection is a curated, ordered set of
// existing products tagged with a season, plus its own banner imagery.

export async function getCollections() {
  // List is keyset-paginated (after_id / has_more / next_cursor) — walk every
  // page and hand back a flat array, same as getProducts().
  return fetchAllPages('/admin/collections', {}, 'items');
}

export async function getCollection(collectionId) {
  return request(`/admin/collections/${collectionId}`);
}

export async function createCollection(payload) {
  return request('/admin/collections', { method: 'POST', body: payload });
}

export async function updateCollection(collectionId, patch) {
  return request(`/admin/collections/${collectionId}`, { method: 'PATCH', body: patch });
}

export async function deleteCollection(collectionId) {
  // Soft delete — sets is_active=false. Returns 204 (no body).
  return request(`/admin/collections/${collectionId}`, { method: 'DELETE' });
}

// Replaces the collection's ENTIRE ordered product list — the array order is
// the storefront order. Always send the full desired list, not a delta.
export async function setCollectionProducts(collectionId, productIds) {
  return request(`/admin/collections/${collectionId}/products`, {
    method: 'PUT',
    body: { product_ids: productIds },
  });
}

export async function addCollectionImage(collectionId, payload) {
  return request(`/admin/collections/${collectionId}/images`, { method: 'POST', body: payload });
}

export async function updateCollectionImage(collectionId, imageId, patch) {
  return request(`/admin/collections/${collectionId}/images/${imageId}`, { method: 'PATCH', body: patch });
}

export async function deleteCollectionImage(collectionId, imageId) {
  return request(`/admin/collections/${collectionId}/images/${imageId}`, { method: 'DELETE' });
}

// ---------- Categories ----------

export async function getCategories() {
  return request('/admin/categories');
}

export async function createCategory(payload) {
  return request('/admin/categories', { method: 'POST', body: payload });
}

// ---------- Coupons ----------

export async function getCoupons() {
  return request('/admin/coupons');
}

export async function createCoupon(payload) {
  return request('/admin/coupons', { method: 'POST', body: payload });
}

export async function updateCouponStatus(couponId, is_active) {
  return request(`/admin/coupons/${couponId}`, { method: 'PATCH', body: { is_active } });
}

// ---------- Images ----------

// image_type tells the backend which storage folder / validation rules to
// apply ("category" vs "product") — see FRONTEND_IMAGE_UPLOAD_API_REQUEST.md.
export async function uploadImage(file, imageType) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('image_type', imageType);
  return request('/admin/images/upload', { method: 'POST', body: formData });
}

// ---------- Products ----------

export async function getProducts() {
  return fetchAllPages('/admin/products', {}, 'items');
}

export async function createProducts(productsPayload) {
  return request('/admin/products', { method: 'POST', body: { products: productsPayload } });
}

export async function updateProduct(productId, patch) {
  return request(`/admin/products/${productId}`, { method: 'PATCH', body: patch });
}
