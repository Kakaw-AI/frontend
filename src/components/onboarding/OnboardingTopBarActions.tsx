"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { HelpCircle, X } from "lucide-react";
import { onboardingStateQueryOptions } from "@/lib/queries/onboarding";

const iconLink = "rounded-full p-2 text-on-surface transition-colors hover:bg-surface-container";

export function OnboardingTopBarActions() {
  const { data } = useQuery(onboardingStateQueryOptions());
  // First-time users have nowhere to go back to yet.
  const showClose = data?.isFirstConnection === false;

  return (
    <div className="flex items-center gap-1">
      <Link href="/docs" target="_blank" rel="noopener noreferrer" className={iconLink} aria-label="Documentation">
        <HelpCircle size={20} />
      </Link>
      {showClose ? (
        <Link href="/chat" className={iconLink} aria-label="Close setup">
          <X size={20} />
        </Link>
      ) : null}
    </div>
  );
}
