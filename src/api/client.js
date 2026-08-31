const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
const TOKEN_KEY = 'vstitch_admin_token';
const REQUEST_TIMEOUT_MS = 20000;
// Image uploads carry up to 10MB over multipart, which routinely takes
// longer than the 20s budget for a small JSON request on a slow/mobile
// connection — give them more room before treating it as a hang.
const UPLOAD_TIMEOUT_MS = 90000;

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

  // FormData (file uploads) must NOT get a JSON Content-Type — the browser
  // sets its own multipart boundary header when it sees a FormData body.
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), isFormData ? UPLOAD_TIMEOUT_MS : REQUEST_TIMEOUT_MS);
  const token = getAdminToken();

  let res;
  try {
    res = await fetch(url.toString(), {
      method,
      headers: {
        ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? (isFormData ? body : JSON.stringify(body)) : undefined,
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
    // FastAPI 422s return `detail` as an array of {loc, msg, type} instead of
    // a string — join the messages so the UI shows readable text instead of
    // "[object Object]".
    if (Array.isArray(detail)) {
      detail = detail.map((d) => d.msg || JSON.stringify(d)).join(' ');
    }
    // Attach the HTTP status so callers can branch on it (404 vs 409 vs 502)
    // without regex-matching the message text.
    const err = new Error(detail || `Request failed (${res.status}).`);
    err.status = res.status;
    throw err;
  }

  if (res.status === 204) return null;
  return res.json();
}
