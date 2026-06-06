import { createAuthClient } from "better-auth/react";
import { API_BASE } from "./api";

// The auth client calls the NestJS backend directly. The backend is a same-site
// subdomain (e.g. k-api.gitnasr.com), so the session cookie (Domain set to
// the shared parent domain) is sent on these credentialed requests.
export const authClient = createAuthClient({
  baseURL: API_BASE,
  fetchOptions: { credentials: "include" },
});
