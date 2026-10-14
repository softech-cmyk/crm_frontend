export const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

// Backend and frontend run on different ports, so fetch's default
// credentials mode ("same-origin") would silently drop the auth cookie.
export function apiFetch(url, options = {}) {
  return fetch(url, { credentials: "include", ...options });
}

export function resolveAssetUrl(url) {
  if (!url) return "";
  return url.startsWith("http") ? url : `${API_BASE}${url}`;
}
