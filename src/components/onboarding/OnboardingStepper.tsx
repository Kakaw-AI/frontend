"use client";

import { usePathname } from "next/navigation";
import { steps } from "./onboarding-steps";

// Mobile-only horizontal progress indicator (the desktop sidebar is hidden
// below lg). Shares the same `steps` source as OnboardingSidebar.
export function OnboardingStepper() {
  const pathname = usePathname();
  const activeIndex = steps.findIndex((step) => step.href === pathname);

  return (
    <nav
      aria-label="Onboarding progress"
      className="sticky top-16 z-30 flex items-center gap-2 border-b border-outline-variant/15 bg-[#fbf9f8] px-5 py-3 lg:hidden"
    >
      {steps.map((step, index) => {
        const isActive = pathname === step.href;
        const isDone = activeIndex > -1 && index < activeIndex;
        return (
          <div key={step.href} className="flex min-w-0 flex-1 items-center gap-2">
            <span
              className={
                isActive
                  ? "flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-on-primary"
                  : isDone
                    ? "flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary"
                    : "flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-on-surface/10 text-xs font-semibold text-on-surface/50"
              }
            >
              {index + 1}
            </span>
            <span
              className={
                isActive
                  ? "truncate text-xs font-semibold uppercase tracking-wide text-primary"
                  : "truncate text-xs font-medium uppercase tracking-wide text-on-surface/45"
              }
            >
              {step.label}
            </span>
            {index < steps.length - 1 ? (
              <span className="mx-1 h-px flex-1 bg-outline-variant/30" aria-hidden />
            ) : null}
          </div>
        );
      })}
    </nav>
  );
}
