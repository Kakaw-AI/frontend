"use client";

import { useQuery } from "@tanstack/react-query";
import { AlertCircle, Database, LoaderCircle, LogOut, RefreshCw, Sparkles, Trash2, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { accountUsageQueryKey, fetchAccountUsage, type AccountUsage } from "@/lib/queries/account";
import { useChatStore } from "../store/useChatStore";

type ProfileUser = { name?: string | null; email?: string | null; image?: string | null };

const compact = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 });
const full = new Intl.NumberFormat("en");
const monthYear = new Intl.DateTimeFormat("en", { month: "long", year: "numeric" });

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
  const openAddLlmPicker = useChatStore((s) => s.openAddLlmPicker);

  // Refetched on every open, so the numbers include the chat just finished.
  const usage = useQuery({
    queryKey: accountUsageQueryKey,
    queryFn: fetchAccountUsage,
    enabled: open,
    staleTime: 0,
  });

  // Native modal: focus trap, Esc and the backdrop come for free.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      aria-labelledby="profile-title"
      className="m-auto w-[calc(100%-2rem)] max-w-2xl overflow-hidden rounded-lg border border-border bg-surface p-0 text-on-surface backdrop:bg-on-surface/35 backdrop:backdrop-blur-sm"
    >
      {open ? (
        <div className="flex max-h-[calc(100dvh-3rem)] flex-col">
          <header className="flex items-center gap-3 border-b border-border px-5 py-4 md:px-6">
            {user.image ? (
              <Image
                src={user.image}
                alt=""
                width={44}
                height={44}
                className="h-11 w-11 shrink-0 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-semibold">
                {initials}
              </div>
            )}
            <div className="min-w-0">
              <h2 id="profile-title" className="truncate font-headline text-xl">
                {user.name || "Your account"}
              </h2>
              <p className="truncate text-sm text-on-surface-variant">
                {user.email}
                {usage.data ? ` · Member since ${monthYear.format(new Date(usage.data.memberSince))}` : null}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="ml-auto shrink-0 rounded-md p-2 transition-colors hover:bg-accent/60"
            >
              <X size={18} />
            </button>
          </header>

          <div className="flex-1 space-y-8 overflow-y-auto px-5 py-6 md:px-6">
            {usage.isPending ? (
              <p className="flex items-center justify-center gap-2 py-12 text-sm text-on-surface-variant">
                <LoaderCircle size={16} className="animate-spin" aria-hidden />
                Loading your usage
              </p>
            ) : usage.isError ? (
              <div className="space-y-4">
                <p className="pod-alert" role="alert">
                  <AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden />
                  {usage.error.message}
                </p>
                <button type="button" onClick={() => void usage.refetch()} className="pod-btn-ghost">
                  <RefreshCw size={14} aria-hidden />
                  Try again
                </button>
              </div>
            ) : (
              <UsageSections usage={usage.data} />
            )}

            <section aria-labelledby="profile-manage" className="space-y-3">
              <h3 id="profile-manage" className="pod-label">Manage</h3>
              <div className="flex flex-wrap gap-2">
                <Link href="/onboarding/database" onClick={onClose} className="pod-btn-ghost">
                  <Database size={14} aria-hidden />
                  Databases
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    openAddLlmPicker();
                  }}
                  className="pod-btn-ghost"
                >
                  <Sparkles size={14} aria-hidden />
                  Models and API keys
                </button>
              </div>
            </section>

            <section aria-labelledby="profile-account" className="space-y-3">
              <h3 id="profile-account" className="pod-label">Account</h3>
              <div className="flex flex-wrap items-center gap-2">
                <button type="button" onClick={onLogout} disabled={isSigningOut} className="pod-btn-ghost">
                  <LogOut size={14} aria-hidden />
                  Log out
                </button>
                <button type="button" onClick={onDeleteAccount} disabled={isSigningOut} className="pod-btn-danger px-4 py-2 text-sm">
                  <Trash2 size={14} aria-hidden />
                  Delete account
                </button>
              </div>
              <p className="text-xs text-on-surface-variant">
                Deleting removes your chats, databases, uploaded files and saved API keys. It can&apos;t be undone.
              </p>
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

  const stats = [
    { label: "Chats", value: counts.conversations },
    { label: "Questions asked", value: counts.questions },
    {
      label: "Databases",
      value: counts.databases,
      note: counts.uploads ? `${counts.uploads} uploaded` : null,
    },
    { label: "API keys", value: counts.apiKeys },
  ];

  return (
    <>
      <section aria-labelledby="profile-usage" className="space-y-3">
        <h3 id="profile-usage" className="pod-label">Usage</h3>
        <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="pod-card px-4 py-3">
              <dt className="text-xs text-on-surface-variant">{stat.label}</dt>
              <dd className="mt-1 font-headline text-2xl tabular-nums">{full.format(stat.value)}</dd>
              {stat.note ? <dd className="text-xs text-on-surface-variant">{stat.note}</dd> : null}
            </div>
          ))}
        </dl>
      </section>

      <section aria-labelledby="profile-tokens" className="space-y-3">
        <h3 id="profile-tokens" className="pod-label">Tokens</h3>
        <div className="pod-card space-y-5 p-4">
          <div className="flex flex-wrap items-end gap-x-6 gap-y-2">
            <div>
              <p className="text-xs text-on-surface-variant">Total</p>
              <p className="font-headline text-4xl tabular-nums" title={`${full.format(tokens.totalTokens)} tokens`}>
                {compact.format(tokens.totalTokens)}
              </p>
            </div>
            <TokenFigure label="Input" value={tokens.inputTokens} />
            <TokenFigure label="Output" value={tokens.outputTokens} />
            <TokenFigure label="Last 30 days" value={tokens.last30Days} />
          </div>

          {models.length > 0 ? (
            <ul className="space-y-3" aria-label="Tokens by model">
              {models.map((row) => (
                <li key={row.model}>
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="truncate font-mono text-[13px]">{row.model}</span>
                    <span className="shrink-0 tabular-nums text-on-surface-variant" title={`${full.format(row.totalTokens)} tokens`}>
                      {compact.format(row.totalTokens)} · {full.format(row.runs)} {row.runs === 1 ? "run" : "runs"}
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-container">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${Math.max(2, (row.totalTokens / top) * 100)}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-on-surface-variant">No questions asked yet. Token use shows up here after your first chat.</p>
          )}
        </div>
        <p className="text-xs text-on-surface-variant">
          Counted from every answer Kakaw ran, including ones that failed. Your provider&apos;s bill is the final word.
        </p>
      </section>
    </>
  );
}

function TokenFigure({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="text-xs text-on-surface-variant">{label}</p>
      <p className="text-lg font-semibold tabular-nums" title={`${full.format(value)} tokens`}>
        {compact.format(value)}
      </p>
    </div>
  );
}
