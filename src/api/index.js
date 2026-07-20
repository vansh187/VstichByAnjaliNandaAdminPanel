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

async function getOrdersCached(params) {
  const key = cacheKey(params);
  if (ordersCache && ordersCache.key === key && ordersCache.expiresAt > Date.now()) {
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

export const adminApi = {
  ...baseApi,
  getOrders: getOrdersCached,
  updateOrderStatus: updateOrderStatusAndInvalidate,
  syncOrderStatus: syncOrderStatusAndInvalidate,
};
