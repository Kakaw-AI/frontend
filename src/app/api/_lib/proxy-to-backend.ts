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

  const response = await fetch(backendUrl, {
    method: request.method,
    headers: request.headers,
    body: request.method !== "GET" ? request.body : undefined,
    // Pass redirects (e.g. OAuth callback 302s) through to the browser instead
    // of following them server-side, which would swallow the Location and the
    // Set-Cookie that completes the login.
    redirect: "manual",
    // @ts-expect-error Node 18 fetch requires this for streaming bodies.
    duplex: "half",
  });

  // undici (Node fetch) transparently decompresses the upstream body, but the
  // upstream Content-Encoding/Content-Length headers stay on the Response. If we
  // forward them, the browser tries to decode an already-decoded body and fails
  // with ERR_CONTENT_DECODING_FAILED. Strip them and stream the decoded body.
  const headers = new Headers(response.headers);
  headers.delete("content-encoding");
  headers.delete("content-length");

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
