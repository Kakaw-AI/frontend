const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:3001";

export async function proxyToBackend(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const backendUrl = `${BACKEND_URL}${url.pathname}${url.search}`;

  return fetch(backendUrl, {
    method: request.method,
    headers: request.headers,
    body: request.method !== "GET" ? request.body : undefined,
    // @ts-expect-error Node 18 fetch requires this for streaming bodies.
    duplex: "half",
  });
}
