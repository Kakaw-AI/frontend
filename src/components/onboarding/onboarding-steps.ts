import { Database, Terminal, type LucideIcon } from "lucide-react";

export type Step = {
  label: string;
  Icon: LucideIcon;
  href: string;
};

// Single source of truth for the onboarding flow steps, shared by the desktop
// sidebar (OnboardingSidebar) and the mobile stepper (OnboardingStepper).
export const steps: Step[] = [
  { label: "Select Source", Icon: Database, href: "/onboarding/database" },
  { label: "Connection Details", Icon: Terminal, href: "/onboarding/connection" },
];
