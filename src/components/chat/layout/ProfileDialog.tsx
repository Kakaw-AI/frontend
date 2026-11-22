"use client";

import { useQuery } from "@tanstack/react-query";
import { AlertCircle, LogOut, RefreshCw, Trash2, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef } from "react";
import { LlmProviderLogo } from "@/components/chat/LlmProviderLogo";
import { accountUsageQueryKey, fetchAccountUsage, type AccountUsage } from "@/lib/queries/account";
import { useChatStore } from "../store/useChatStore";

type ProfileUser = { name?: string | null; email?: string | null; image?: string | null };

const compact = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 });
const full = new Intl.NumberFormat("en");
const monthYear = new Intl.DateTimeFormat("en", { month: "short", year: "numeric" });

/** Traces store the model name, not the connection, so the mark is read from the name. */
function providerOf(model: string) {
  const name = model.toLowerCase().replace(/^[^/]+\//, "");
  if (name.startsWith("gemini")) return "google" as const;
  if (name.startsWith("claude")) return "anthropic" as const;
  return "openai" as const;
}

/** Account, what the user has set up, and how many tokens their chats used. */
export function ProfileDialog({
  open,
  user,
  initials,
  onClose,
  onLogout,
  onDeleteAccount,
}: {
  open: boolean;
  user: ProfileUser;
  initials: string;
  onClose: () => void;
  onLogout: () => void;
  onDeleteAccount: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const isSigningOut = useChatStore((s) => s.isSigningOut);

  // Loaded with the page, so the window opens with numbers already in it.
  const usage = useQuery({ queryKey: accountUsageQueryKey, queryFn: fetchAccountUsage });
  const { refetch } = usage;

  // Native modal: focus trap, Esc and the backdrop come for free. Opening also
  // refreshes in the background, so the counts include the chat just finished.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      // showModal focuses the close button and rings it; start on the dialog instead.
      dialog.focus();
      void refetch();
    }
    if (!open && dialog.open) dialog.close();
  }, [open, refetch]);

  return (
    <dialog
      ref={dialogRef}
      tabIndex={-1}
      onClose={onClose}
      // A click on the backdrop lands on the dialog itself; inside it lands on a child.
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      aria-labelledby="profile-title"
      className="m-auto w-[calc(100%-2rem)] max-w-xl overflow-hidden rounded-2xl border border-border bg-surface p-0 text-on-surface outline-none backdrop:bg-on-surface/40 backdrop:backdrop-blur-[2px]"
    >
      {open ? (
        <div className="flex max-h-[calc(100dvh-2rem)] flex-col animate-in fade-in-0 slide-in-from-bottom-2 duration-200 motion-reduce:animate-none">
          <header className="flex items-start gap-4 px-6 pt-6 pb-5">
            {user.image ? (
              <Image
                src={user.image}
                alt=""
                width={52}
                height={52}
                className="h-13 w-13 shrink-0 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-13 w-13 shrink-0 items-center justify-center rounded-full bg-primary font-headline text-lg text-on-primary">
                {initials}
              </div>
            )}
            <div className="min-w-0 flex-1 pt-0.5">
              <h2 id="profile-title" className="truncate font-headline text-2xl leading-tight">
                {user.name || "Your account"}
              </h2>
              <p className="mt-0.5 truncate text-sm text-on-surface-variant">{user.email}</p>
              {usage.data ? (
                <p className="pod-label mt-2">Member since {monthYear.format(new Date(usage.data.memberSince))}</p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="-mr-2 -mt-1 shrink-0 rounded-[10px] p-2 text-on-surface-variant transition-colors hover:bg-accent hover:text-on-surface active:translate-y-px"
            >
              <X size={18} />
            </button>
          </header>

          <div className="flex-1 space-y-7 overflow-y-auto px-6 pb-6">
            {/* Data that loaded wins over a failed background refresh. */}
            {usage.data ? (
              <UsageSections usage={usage.data} />
            ) : usage.isError ? (
              <div className="space-y-3">
                <p className="pod-alert" role="alert">
                  <AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden />
                  {usage.error.message}
                </p>
                <button type="button" onClick={() => void refetch()} className="pod-btn-ghost">
                  <RefreshCw size={14} aria-hidden />
                  Try again
                </button>
              </div>
            ) : (
              <UsageSkeleton />
            )}

            <section
              aria-label="Account"
              className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5"
            >
              <button type="button" onClick={onLogout} disabled={isSigningOut} className="pod-btn-ghost">
                <LogOut size={14} aria-hidden />
                Log out
              </button>
              <button
                type="button"
                onClick={onDeleteAccount}
                disabled={isSigningOut}
                className="inline-flex items-center gap-1.5 rounded-[10px] px-3 py-2 text-sm font-semibold text-secondary transition-colors hover:bg-secondary-container active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Trash2 size={14} aria-hidden />
                Delete account
              </button>
            </section>
          </div>
        </div>
      ) : null}
    </dialog>
  );
}

function UsageSections({ usage }: { usage: AccountUsage }) {
  const { counts, tokens, models } = usage;
  const top = models[0]?.totalTokens || 1;
  const inputShare = tokens.totalTokens ? (tokens.inputTokens / tokens.totalTokens) * 100 : 50;

  const stats: Array<{ label: string; value: number; note?: string | null }> = [
    { label: "Chats", value: counts.conversations },
    { label: "Questions", value: counts.questions },
    { label: "Databases", value: counts.databases, note: counts.uploads ? `${counts.uploads} uploaded` : null },
    { label: "API keys", value: counts.apiKeys },
  ];

  return (
    <>
      {/* One box with hairlines between the figures, not four cards. */}
      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="flex flex-col gap-1 bg-surface-container-lowest px-4 py-3.5">
            <dt className="truncate text-xs text-on-surface-variant">{stat.label}</dt>
            <dd className="order-first font-headline text-3xl leading-none tabular-nums">{full.format(stat.value)}</dd>
            {stat.note ? <dd className="-mt-0.5 truncate font-mono text-[11px] text-on-surface-variant">{stat.note}</dd> : null}
          </div>
        ))}
      </dl>

      <section aria-labelledby="profile-tokens" className="space-y-4">
        <div className="flex items-baseline justify-between gap-3">
          <h3 id="profile-tokens" className="pod-label">Tokens used</h3>
          <p className="text-xs text-on-surface-variant tabular-nums">
            {compact.format(tokens.last30Days)} in the last 30 days
          </p>
        </div>

        <p className="flex items-baseline gap-2">
          <span className="font-headline text-5xl leading-none tabular-nums" title={`${full.format(tokens.totalTokens)} tokens`}>
            {compact.format(tokens.totalTokens)}
          </span>
          <span className="text-sm text-on-surface-variant">
            across {full.format(tokens.runs)} {tokens.runs === 1 ? "answer" : "answers"}
          </span>
        </p>

        {/* Input against output in one bar: cocoa for what was sent, gold for what came back. */}
        <div>
          <div
            className="flex h-2.5 overflow-hidden rounded-full bg-surface-container"
            role="img"
            aria-label={`${full.format(tokens.inputTokens)} input and ${full.format(tokens.outputTokens)} output tokens`}
          >
            {tokens.totalTokens ? (
              <>
                <span className="h-full bg-primary" style={{ width: `${inputShare}%` }} />
                <span className="h-full flex-1 bg-pod" />
              </>
            ) : null}
          </div>
          <div className="mt-2 flex gap-5 text-xs text-on-surface-variant">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-primary" aria-hidden />
              Input <span className="font-medium text-on-surface tabular-nums">{compact.format(tokens.inputTokens)}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-pod" aria-hidden />
              Output <span className="font-medium text-on-surface tabular-nums">{compact.format(tokens.outputTokens)}</span>
            </span>
          </div>
        </div>

        {models.length > 0 ? (
          <ul className="divide-y divide-border border-t border-border" aria-label="Tokens by model">
            {models.map((row) => (
              <li key={row.model} className="flex items-center gap-3 py-3">
                <LlmProviderLogo provider={providerOf(row.model)} className="h-7 w-7 shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="truncate font-mono text-[13px]">{row.model}</span>
                    <span className="shrink-0 text-sm font-medium tabular-nums" title={`${full.format(row.totalTokens)} tokens`}>
                      {compact.format(row.totalTokens)}
                    </span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-3">
                    <div className="h-1 flex-1 overflow-hidden rounded-full bg-surface-container">
                      <div
                        className="h-full rounded-full bg-on-surface-variant"
                        style={{ width: `${Math.max(3, (row.totalTokens / top) * 100)}%` }}
                      />
                    </div>
                    <span className="w-24 shrink-0 whitespace-nowrap text-right text-xs text-on-surface-variant tabular-nums">
                      {full.format(row.runs)} {row.runs === 1 ? "answer" : "answers"}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="border-t border-border pt-4 text-sm text-on-surface-variant">
            Ask your first question and the tokens each model uses show up here.
          </p>
        )}

        <p className="text-xs text-on-surface-variant">
          Counted from every answer, failed ones included. Your provider&apos;s bill is the final word.
        </p>
      </section>
    </>
  );
}

/** Holds the layout's shape while the first load runs, so nothing jumps. */
function UsageSkeleton() {
  return (
    <div className="space-y-7" aria-busy="true" aria-label="Loading your usage">
      <div className="h-[78px] animate-pulse rounded-2xl bg-surface-container motion-reduce:animate-none" />
      <div className="space-y-4">
        <div className="h-3 w-24 animate-pulse rounded bg-surface-container motion-reduce:animate-none" />
        <div className="h-12 w-40 animate-pulse rounded-lg bg-surface-container motion-reduce:animate-none" />
        <div className="h-2.5 animate-pulse rounded-full bg-surface-container motion-reduce:animate-none" />
      </div>
    </div>
  );
}
