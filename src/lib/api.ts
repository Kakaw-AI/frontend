// Base URL of the NestJS backend. The browser calls it directly (no same-origin
// proxy), so this must be a same-site origin (a gitnasr.com subdomain) for the
// session cookie to be sent. Hardcoded to the production backend so it never
// falls back to localhost in a deployed build; override with NEXT_PUBLIC_API_URL
// for local dev (e.g. http://localhost:3001).
export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "https://api.kakaw.gitnasr.com";

// Wrapper around fetch that targets the backend and includes cookies on the
// cross-origin (same-site) request. Pass backend paths starting with "/api".
export function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  return fetch(`${API_BASE}${path}`, { credentials: "include", ...init });
}
