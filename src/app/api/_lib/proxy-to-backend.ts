// This proxy runs server-side, so it resolves the backend URL at runtime.
// BACKEND_PROXY_URL is the origin the Next.js server forwards to — an internal
// network address (e.g. http://backend:3001) or a public backend domain (e.g.
// https://kakaw-ai.nasr.work). Use NO trailing slash and NO path; the request
// pathname (/api/...) is appended below. NEXT_PUBLIC_BACKEND_URL remains a
// fallback for local dev.
function resolveBackendUrl(): string {
  return (
    process.env.BACKEND_PROXY_URL ??
    process.env.NEXT_PUBLIC_BACKEND_URL ??
    "http://localhost:3001"
  );
}

export async function proxyToBackend(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const backendUrl = `${resolveBackendUrl()}${url.pathname}${url.search}`;

  return fetch(backendUrl, {
    method: request.method,
    headers: request.headers,
    body: request.method !== "GET" ? request.body : undefined,
    // @ts-expect-error Node 18 fetch requires this for streaming bodies.
    duplex: "half",
  });
}
