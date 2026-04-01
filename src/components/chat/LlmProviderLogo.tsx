"use client";

import { Bot, BrainCircuit, GitPullRequest, Globe2, Route } from "lucide-react";
import type { LlmProvider } from "@/lib/queries/llm-connections";

type LlmProviderLogoProps = {
  provider: LlmProvider;
  className?: string;
};

function BaseLogo({
  className,
  background,
  children,
}: {
  className: string;
  background: string;
  children: React.ReactNode;
}) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect width="32" height="32" rx="8" fill={background} />
      <foreignObject x="0" y="0" width="32" height="32">
        <div className="flex h-full w-full items-center justify-center text-white">
          {children}
        </div>
      </foreignObject>
    </svg>
  );
}

export function LlmProviderLogo({
  provider,
  className = "h-7 w-7",
}: LlmProviderLogoProps) {
  switch (provider) {
    case "openai":
      return (
        <BaseLogo className={className} background="#101828">
          <Bot size={16} />
        </BaseLogo>
      );
    case "anthropic":
      return (
        <BaseLogo className={className} background="#B65C2D">
          <BrainCircuit size={16} />
        </BaseLogo>
      );
    case "openrouter":
      return (
        <BaseLogo className={className} background="#5B3FD3">
          <Route size={16} />
        </BaseLogo>
      );
    case "google":
      return (
        <BaseLogo className={className} background="#1A73E8">
          <Globe2 size={16} />
        </BaseLogo>
      );
    case "github-copilot":
      return (
        <BaseLogo className={className} background="#24292F">
          <GitPullRequest size={16} />
        </BaseLogo>
      );
  }
}
