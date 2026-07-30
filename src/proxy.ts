import { NextRequest, NextResponse } from "next/server";
import { API_BASE } from "@/lib/api";

async function getSession(request: NextRequest) {
  let response: Response;
  try {
    response = await fetch(`${API_BASE}/api/auth/get-session`, {
      method: "GET",
      headers: new Headers({
        cookie: request.headers.get("cookie") ?? "",
      }),
      cache: "no-store",
    });
  } catch {
    // Backend unreachable (DNS/connection/TLS) — treat as logged out rather
    // than crashing the page with a 500.
    return null;
  }

  if (!response.ok) {
    return null;
  }

  return response.json().catch(() => null);
}

async function getOnboardingState(request: NextRequest) {
  let response: Response;
  try {
    response = await fetch(`${API_BASE}/api/me/onboarding-state`, {
      method: "GET",
      headers: new Headers({
        cookie: request.headers.get("cookie") ?? "",
      }),
      cache: "no-store",
    });
  } catch {
    return null;
  }

  if (!response.ok) {
    return null;
  }

  return response
    .json()
    .catch(() => null) as Promise<
      | {
          hasDatabaseSource?: boolean;
          connectionCount?: number;
          isFirstConnection?: boolean;
          blockingSync?: {
            status?: "PENDING" | "SYNCING" | "READY" | "FAILED";
          } | null;
        }
      | null
    >;
}

// Optimistic check — redirects unauthenticated users to /login.
// Actual authorization must be enforced per-page with the backend session too.
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Both lookups run on every navigation to every app route, and every branch
  // below that reads the onboarding state also needs the session. Issuing them
  // together turns two sequential round-trips into one before any HTML can
  // stream. Gated on a cookie being present so anonymous hits on /login do not
  // fire a request that can only come back unauthorized.
  const hasSessionCookie = Boolean(request.headers.get("cookie"));
  const onboardingStatePromise = hasSessionCookie
    ? getOnboardingState(request)
    : Promise.resolve(null);

  const session = await getSession(request);
  const isLoggedIn = Boolean(session?.session);
  const isLoginPage = pathname === "/login";
  const isAppPage = pathname.startsWith("/dashboard") || pathname.startsWith("/chat");
  const isSyncPage = pathname === "/onboarding/sync";

  if (isLoginPage && isLoggedIn) {
    const onboardingState = await onboardingStatePromise;
    const destination = onboardingState?.hasDatabaseSource
      ? "/dashboard"
      : onboardingState?.blockingSync?.status === "SYNCING" ||
          onboardingState?.blockingSync?.status === "FAILED"
        ? "/onboarding/sync"
        : "/onboarding/database";
    return NextResponse.redirect(new URL(destination, request.url));
  }

  if (!isLoginPage && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isLoggedIn) {
    const onboardingState = await onboardingStatePromise;
    const hasDatabaseSource = Boolean(onboardingState?.hasDatabaseSource);
    const blockingSyncStatus = onboardingState?.blockingSync?.status;

    if (
      !hasDatabaseSource &&
      blockingSyncStatus === "SYNCING" &&
      pathname !== "/onboarding/sync"
    ) {
      return NextResponse.redirect(new URL("/onboarding/sync", request.url));
    }

    if (!hasDatabaseSource && isAppPage) {
      const destination =
        blockingSyncStatus === "FAILED" ? "/onboarding/sync" : "/onboarding/database";
      return NextResponse.redirect(new URL(destination, request.url));
    }

    if (hasDatabaseSource && isSyncPage) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/login", "/chat/:path*", "/dashboard/:path*", "/onboarding/:path*"],
};
