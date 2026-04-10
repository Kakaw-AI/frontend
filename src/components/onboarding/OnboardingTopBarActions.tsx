"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { HelpCircle, X } from "lucide-react";
import { onboardingStateQueryOptions } from "@/lib/queries/onboarding";

export function OnboardingTopBarActions() {
  const { data } = useQuery(onboardingStateQueryOptions());
  const showClose = data?.isFirstConnection === false;

  return (
    <div className="flex items-center gap-4 text-primary-container">
      <Link
        href="/docs"
        target="_blank"
        rel="noopener noreferrer"
        className="cursor-pointer hover:opacity-70 p-2 rounded transition-colors hover:bg-surface-container-low"
        aria-label="Documentation"
      >
        <HelpCircle size={20} />
      </Link>
      {showClose ? (
        <Link
          href="/dashboard"
          className="cursor-pointer hover:opacity-70 p-2 rounded transition-colors hover:bg-surface-container-low"
          aria-label="Close onboarding"
        >
          <X size={20} />
        </Link>
      ) : null}
    </div>
  );
}
