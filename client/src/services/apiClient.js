import axios from "axios";

// The Vite dev server proxies /api -> http://localhost:5000
const api = axios.create({
  baseURL: "/api/v1",
  headers: { "Content-Type": "application/json" },
  timeout: 20000,
});

// When the server runs the real Clerk flow, every request needs the current
// session token. Clerk's token is only reachable from a React hook, so the app
// registers a getter here once Clerk has loaded. In DEMO_AUTH mode no getter is
// registered and requests go out unauthenticated, which is exactly what the
// server expects.
let tokenGetter = null;

export const setTokenGetter = (fn) => {
  tokenGetter = fn;
};

api.interceptors.request.use(async (config) => {
  if (tokenGetter) {
    try {
      const token = await tokenGetter();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      // Fall through unauthenticated; the API will answer 401.
    }
  }
  return config;
});

// Unwrap the standard ApiResponse envelope: { success, statusCode, data, message }
// and surface a clean error message on failure.
const unwrap = (res) => res.data?.data ?? res.data;

const toError = (error) => {
  const payload = error.response?.data;
  const errs = payload?.errors;
  let message = payload?.message || error.message || "Request failed";

  // Backend validation errors come as an array of { field, message } or strings.
  if (Array.isArray(errs) && errs.length) {
    const first = errs[0];
    message = typeof first === "string" ? first : first.message || message;
  }
  const e = new Error(message);
  e.status = error.response?.status;
  e.raw = payload;
  return e;
};

export const request = async (method, url, { params, data } = {}) => {
  try {
    const res = await api.request({ method, url, params, data });
    return unwrap(res);
  } catch (error) {
    throw toError(error);
  }
};

export const get = (url, params) => request("get", url, { params });
export const post = (url, data) => request("post", url, { data });
export const patch = (url, data) => request("patch", url, { data });
export const del = (url) => request("delete", url);

export default api;
