import * as mockAdapter from './mockAdapter.js';
import * as realAdapter from './realAdapter.js';

// The real admin backend is live (see ADMIN_API_REFERENCE.md) and is what
// .env points VITE_API_BASE_URL at. Set VITE_USE_MOCK_API=true to fall back
// to the in-memory mock adapter for offline frontend work — no other code
// needs to change either way.
const useMock = import.meta.env.VITE_USE_MOCK_API === 'true';

const baseApi = useMock ? mockAdapter : realAdapter;
export const isMockApi = useMock;

// OrdersTab, PaymentsTab, and ShippingTab all independently call getOrders()
// with the same (empty) filters. Without this, switching between them
// re-fetches and re-paginates the entire order list every time, which is
// slow against a cold-starting backend. A short TTL keeps tab-switching
// instant while still picking up new orders within a few seconds.
const ORDERS_CACHE_TTL_MS = 10000;
let ordersCache = null; // { key, expiresAt, promise }

function cacheKey(params) {
  return JSON.stringify(params || {});
}

async function getOrdersCached(params, { force = false } = {}) {
  const key = cacheKey(params);
  // `force` is for explicit user actions (a Refresh/Retry click, a post-write
  // resync) that must reflect reality now — the TTL only exists to make passive
  // tab-switching cheap.
  if (!force && ordersCache && ordersCache.key === key && ordersCache.expiresAt > Date.now()) {
    return ordersCache.promise;
  }
  const promise = baseApi.getOrders(params);
  ordersCache = { key, expiresAt: Date.now() + ORDERS_CACHE_TTL_MS, promise };
  promise.catch(() => { ordersCache = null; }); // don't cache failures
  return promise;
}

async function updateOrderStatusAndInvalidate(orderId, status) {
  const result = await baseApi.updateOrderStatus(orderId, status);
  ordersCache = null;
  return result;
}

async function syncOrderStatusAndInvalidate(orderId) {
  const result = await baseApi.syncOrderStatus(orderId);
  ordersCache = null;
  return result;
}

async function markOrderReadyToShipAndInvalidate(orderId) {
  // Invalidate even on failure: a 404/409 means our cached copy of this order
  // is stale (status moved on, order removed, or a concurrent dispatch), so the
  // next getOrders() must hit the network to resync the row.
  try {
    return await baseApi.markOrderReadyToShip(orderId);
  } finally {
    ordersCache = null;
  }
}

export const adminApi = {
  ...baseApi,
  getOrders: getOrdersCached,
  updateOrderStatus: updateOrderStatusAndInvalidate,
  syncOrderStatus: syncOrderStatusAndInvalidate,
  markOrderReadyToShip: markOrderReadyToShipAndInvalidate,
};
