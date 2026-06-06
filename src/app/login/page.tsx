"use client";

import { authClient } from "@/lib/auth-client";
import Link from "next/link";

export default function AuthPage() {
  // Absolute URL built from the live browser origin (this is a client
  // component, so window is available in the click handlers). The auth client's
  // baseURL points at the backend (k-api.*), so a relative callbackURL would
  // resolve against the backend and 404; an absolute frontend URL lands the
  // user back on this site and satisfies Better Auth's trustedOrigins check.
  async function signInWithGoogle() {
    await authClient.signIn.social({
      provider: "google",
      callbackURL: `${window.location.origin}/dashboard`,
    });
  }

  async function signInWithGitHub() {
    await authClient.signIn.social({
      provider: "github",
      callbackURL: `${window.location.origin}/dashboard`,
    });
  }

  return (
    <main className="flex min-h-dvh flex-col md:flex-row">
      {/* ── Left Side: Authentication Form ── */}
      <section className="w-full md:w-1/2 flex flex-col justify-center items-center px-5 sm:px-8 md:px-24 py-12 md:py-16 bg-surface relative overflow-hidden">
        {/* Logo */}
        <div className="absolute top-6 left-5 md:top-12 md:left-12">
          <Link
            href="/"
            className="font-headline italic text-2xl font-bold text-primary"
          >
            Kakaw AI
          </Link>
        </div>

        <div className="w-full max-w-md">
          <header className="mb-12">
            <h1 className="font-headline text-3xl sm:text-4xl italic text-on-surface mb-3">
              Hey there, I&apos;m Kakaw 👋
            </h1>
            <p className="text-on-surface-variant font-body text-sm tracking-tight">
              Sign in to start talking to your data in plain English.
            </p>
          </header>

          {/* Social Authentication */}
          <div className="flex flex-col gap-4">
            <button
              onClick={signInWithGoogle}
              className="flex items-center justify-center gap-3 bg-surface-container-lowest py-4 px-6 rounded-xl editorial-shadow hover:bg-surface-container-low transition-colors duration-300 w-full"
            >
              <svg
                className="w-5 h-5"
                viewBox="0 0 24 24"
                aria-hidden
              >
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              <span className="text-sm font-semibold text-on-surface-variant">
                Continue with Google
              </span>
            </button>

            <button
              onClick={signInWithGitHub}
              className="flex items-center justify-center gap-3 bg-surface-container-lowest py-4 px-6 rounded-xl editorial-shadow hover:bg-surface-container-low transition-colors duration-300 w-full"
            >
              <svg
                className="w-5 h-5 fill-on-surface"
                viewBox="0 0 24 24"
                aria-hidden
              >
                <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.43.372.823 1.102.823 2.222 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
              </svg>
              <span className="text-sm font-semibold text-on-surface-variant">
                Continue with GitHub
              </span>
            </button>
          </div>

          <p className="mt-10 text-center text-xs text-on-surface-variant/60 font-body">
            By continuing, you agree to our{" "}
            <Link href="/terms" className="underline underline-offset-2 hover:text-on-surface-variant">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="underline underline-offset-2 hover:text-on-surface-variant">
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </section>

      {/* ── Right Side: Brand Showcase ── */}
      <section className="w-full md:w-1/2 min-h-[25rem] md:min-h-dvh relative flex items-center justify-center overflow-hidden">
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-linear-to-br from-primary to-[#291800]" />

        {/* Brand Messaging — centered */}
        <div className="relative z-10 flex max-w-md flex-col items-center px-6 sm:px-12 text-center">
          <h2 className="font-headline text-3xl md:text-5xl italic text-on-primary-container leading-tight">
            Crafting data with <br />
            <span className="text-tertiary-fixed">warm intelligence.</span>
          </h2>
          <p className="mt-4 text-on-primary-container/80 font-body text-base md:text-lg leading-relaxed">
            Join Kakaw AI to transform complex SQL queries into elegant,
            human-readable insights. Your data, refined.
          </p>
        </div>

        {/* Hi, I'm Kakaw — top-right */}
        <div className="absolute top-10 right-10 hidden lg:block z-10">
          <div className="glass-panel px-4 py-3 rounded-2xl rounded-bl-md border border-white/10 shadow-xl">
            <p className="font-headline text-base italic text-on-primary-container leading-none">
              Hi, I&apos;m Kakaw 👋
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
