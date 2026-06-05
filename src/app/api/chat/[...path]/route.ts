import { proxyToBackend } from "../../_lib/proxy-to-backend";

// Chat runs stream from the agent and can be slow. Raise the function timeout to
// the Vercel Hobby ceiling (60s). NOTE: agent runs longer than this are cut off;
// bump to 300 on a Pro plan, or have the browser call the backend directly.
export const maxDuration = 60;

export const GET = proxyToBackend;
export const POST = proxyToBackend;
export const PATCH = proxyToBackend;
export const DELETE = proxyToBackend;
