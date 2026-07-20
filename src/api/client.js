const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
const TOKEN_KEY = 'vstitch_admin_token';
const REQUEST_TIMEOUT_MS = 20000;

export function getAdminToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setAdminToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

// Fired whenever the server tells us the admin token is missing/expired, so
// the UI can drop back to the login screen instead of showing a dead page.
export const AUTH_EXPIRED_EVENT = 'admin-auth-expired';

export async function request(path, { method = 'GET', body, params } = {}) {
  const url = new URL(BASE_URL + path, window.location.origin);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, v);
    });
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const token = getAdminToken();

  let res;
  try {
    res = await fetch(url.toString(), {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error('The server took too long to respond. Please try again.');
    }
    throw new Error('Could not reach the server. Please check your connection and try again.');
  } finally {
    clearTimeout(timeoutId);
  }

  if (res.status === 401 && path !== '/admin/login') {
    setAdminToken(null);
    // Deferred to a macrotask so the caller's own rejected-promise handler
    // (e.g. a modal's setFormError) runs first, before this event unmounts
    // the app back to the login screen — otherwise in-progress form state
    // disappears with no error ever shown.
    setTimeout(() => window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT)), 0);
  }

  if (!res.ok) {
    let detail = null;
    try {
      detail = (await res.json()).detail;
    } catch {
      // response had no JSON body — fall through to the generic message below
    }
    throw new Error(detail || `Request failed (${res.status}).`);
  }

  if (res.status === 204) return null;
  return res.json();
}
