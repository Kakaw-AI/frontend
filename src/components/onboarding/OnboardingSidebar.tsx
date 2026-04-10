"use client";

import { usePathname } from "next/navigation";
import { Database, Terminal, type LucideIcon } from "lucide-react";

type Step = {
  label: string;
  Icon: LucideIcon;
  href: string;
};

const steps: Step[] = [
  { label: "Select Source",      Icon: Database,  href: "/onboarding/database" },
  { label: "Connection Details", Icon: Terminal,   href: "/onboarding/connection" },
];

export function OnboardingSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-16 bottom-0 flex flex-col py-8 px-4 h-full w-64 bg-[#f5f3f3]">
      <div className="mb-8 px-4">
        <h2 className="font-headline text-2xl italic text-primary">Onboarding</h2>
        <p className="text-xs font-label uppercase tracking-widest text-on-surface-variant opacity-60">
          Getting Kakaw ready
        </p>
      </div>
      <nav className="flex flex-col gap-2">
        {steps.map((step) => {
          const isActive = pathname === step.href;
          return (
            <div
              key={step.href}
              className={
                isActive
                  ? "flex items-center gap-3 bg-[#ffffff] text-primary rounded-lg px-4 py-3 shadow-sm border-l-4 border-primary transition-all duration-300"
                  : "flex items-center gap-3 text-on-surface opacity-50 px-4 py-3 transition-all duration-300"
              }
            >
              <step.Icon size={18} />
              <span className="font-body text-sm font-medium tracking-wide uppercase">
                {step.label}
              </span>
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
