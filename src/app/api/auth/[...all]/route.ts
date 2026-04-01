// All auth traffic is handled by the NestJS backend at NEXT_PUBLIC_BACKEND_URL.
// This route is kept as a thin proxy so server-side code (middleware, RSC) can
// still use auth.api.getSession() without knowing the backend's address.
import { proxyToBackend } from "../../_lib/proxy-to-backend";

export const GET = proxyToBackend;
export const POST = proxyToBackend;
