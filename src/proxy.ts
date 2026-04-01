import { NextRequest, NextResponse } from "next/server";

async function getSession(request: NextRequest) {
  const response = await fetch(new URL("/api/auth/get-session", request.url), {
    method: "GET",
    headers: new Headers({
      cookie: request.headers.get("cookie") ?? "",
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    return null;
  }

  return response.json().catch(() => null);
}

async function getOnboardingState(request: NextRequest) {
  const response = await fetch(new URL("/api/me/onboarding-state", request.url), {
    method: "GET",
    headers: new Headers({
      cookie: request.headers.get("cookie") ?? "",
    }),
    cache: "no-store",
  });

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
        }
      | null
    >;
}

// Optimistic check — redirects unauthenticated users to /login.
// Actual authorization must be enforced per-page with the backend session too.
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = await getSession(request);
  const isLoggedIn = Boolean(session?.session);
  const isLoginPage = pathname === "/login";
  const isAppPage = pathname === "/dashboard" || pathname === "/chat";

  if (isLoginPage && isLoggedIn) {
    const onboardingState = await getOnboardingState(request);
    const destination = onboardingState?.hasDatabaseSource
      ? "/dashboard"
      : "/onboarding/database";
    return NextResponse.redirect(new URL(destination, request.url));
  }

  if (!isLoginPage && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isLoggedIn) {
    const onboardingState = await getOnboardingState(request);
    const hasDatabaseSource = Boolean(onboardingState?.hasDatabaseSource);

    if (!hasDatabaseSource && isAppPage) {
      return NextResponse.redirect(new URL("/onboarding/database", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/login", "/chat", "/dashboard", "/onboarding/:path*"],
};
