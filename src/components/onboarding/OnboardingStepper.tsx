"use client";

import { Check } from "lucide-react";
import { usePathname } from "next/navigation";
import { steps } from "./onboarding-steps";

export function OnboardingStepper() {
  const pathname = usePathname();
  const activeIndex = steps.findIndex((step) => step.href === pathname);
  // Unknown onboarding pages show every step as done.
  const current = activeIndex === -1 ? steps.length : activeIndex;

  return (
    <nav aria-label="Setup progress" className="mb-8">
      <ol className="flex items-center gap-3">
        {steps.map((step, index) => {
          const isActive = index === current;
          const isDone = index < current;
          return (
            <li
              key={step.href}
              aria-current={isActive ? "step" : undefined}
              className={`flex items-center gap-2 ${index < steps.length - 1 ? "min-w-0 flex-1" : ""}`}
            >
              <span
                className={[
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px] border border-border text-xs font-bold",
                  isActive ? "bg-primary text-on-primary" : isDone ? "bg-accent text-primary" : "bg-surface-container-lowest text-on-surface-variant",
                ].join(" ")}
              >
                {isDone ? <Check size={14} strokeWidth={3} aria-label="Done" /> : index + 1}
              </span>
              <span className={`text-sm font-bold whitespace-nowrap ${isActive ? "text-on-surface" : "hidden text-on-surface-variant sm:inline"}`}>
                {step.label}
              </span>
              {index < steps.length - 1 ? <span className="h-0.5 flex-1 bg-primary/15" aria-hidden /> : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
