// This proxy runs server-side, so it resolves the backend URL at runtime.
// In containers the server reaches the backend over the internal network
// (BACKEND_INTERNAL_URL, e.g. http://backend:3001), which differs from any
// public URL baked into the client bundle. NEXT_PUBLIC_BACKEND_URL remains a
// fallback for local dev.
function resolveBackendUrl(): string {
  return (
    process.env.BACKEND_INTERNAL_URL ??
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
