import { createAuthClient } from "better-auth/react";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

// Browser auth requests should stay same-origin with the frontend so cookies
// are scoped to the Next.js app. The frontend proxy then forwards to NestJS.
export const authClient = createAuthClient({
  baseURL: APP_URL,
});
