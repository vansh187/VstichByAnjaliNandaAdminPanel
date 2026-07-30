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

// ---------- Revenue ----------

export async function getRevenueSummary(params) {
  return request('/admin/revenue/summary', { params });
}

// ---------- Categories ----------

export async function getCategories() {
  return request('/admin/categories');
}

export async function createCategory(payload) {
  return request('/admin/categories', { method: 'POST', body: payload });
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
