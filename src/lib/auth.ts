import { betterAuth } from "better-auth";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

// The frontend owns the public auth surface at `/api/auth` and proxies those
// requests to the NestJS backend. Keeping auth same-origin makes cookie-based
// sessions work consistently in the browser and in Next middleware.
export const auth = betterAuth({
  baseURL: APP_URL,
  secret: process.env.BETTER_AUTH_SECRET ?? "placeholder",
  // No database or providers — this frontend instance only needs to talk to
  // the frontend auth route, which proxies to the backend.
});
