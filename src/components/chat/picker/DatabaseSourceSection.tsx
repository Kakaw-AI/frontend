"use client";

import { DatabaseSourceStatusBadge } from "@/components/chat/DatabaseSourceStatusBadge";
import { DatabaseLogo } from "@/components/onboarding/DatabaseLogo";
import type { DatabaseSource } from "@/lib/queries/database-sources";
import { Database } from "lucide-react";
import Link from "next/link";
import { formatTimestamp } from "./picker-utils";

export function DatabaseSourceSection({
  databaseSources,
  selectedSourceId,
  onSelect,
}: {
  databaseSources: DatabaseSource[] | undefined;
  selectedSourceId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <section className="space-y-4 rounded-[28px] border border-outline-variant/15 bg-surface-container-low p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-label text-[10px] uppercase tracking-[0.22em] text-primary">
            Step 1
          </p>
          <h4 className="mt-1 text-lg font-semibold text-on-surface">Data source</h4>
        </div>
      </div>

      {!databaseSources?.length ? (
        <div className="flex min-h-56 flex-col items-center justify-center gap-4 rounded-[24px] border border-dashed border-outline-variant/20 bg-surface-container-lowest px-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary-container text-primary">
            <Database size={22} />
          </div>
          <div className="space-y-2">
            <p className="font-semibold text-on-surface">No database sources found</p>
            <p className="text-sm leading-relaxed text-on-surface/60">
              Add a saved database connection before starting a chat.
            </p>
          </div>
          <Link
            href="/onboarding/database"
            className="inline-flex items-center rounded-full bg-primary px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-on-primary transition-opacity hover:opacity-90"
          >
            Add Source
          </Link>
        </div>
      ) : (
        <div className="grid gap-3">
          {databaseSources.map((source) => {
            const disabled = !source.canStartChat;
            const selected = selectedSourceId === source.id;

            return (
              <button
                key={source.id}
                type="button"
                disabled={disabled}
                onClick={() => onSelect(source.id)}
                className={`w-full rounded-[24px] border px-5 py-4 text-left transition-all ${
                  disabled
                    ? "cursor-not-allowed border-outline-variant/15 bg-surface-container-low opacity-70"
                    : selected
                      ? "border-primary/45 bg-white shadow-[0_18px_40px_-24px_rgba(112,87,49,0.45)]"
                      : "border-outline-variant/20 bg-white hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-[0_18px_40px_-24px_rgba(112,87,49,0.45)]"
                }`}
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-secondary-container/60 text-primary">
                      <DatabaseLogo provider={source.provider} className="h-6 w-6" />
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <p className="font-semibold text-on-surface">{source.label}</p>
                        <span className="font-label text-[10px] uppercase tracking-[0.2em] text-on-surface/40">
                          {source.provider}
                        </span>
                      </div>
                      <p className="text-sm text-on-surface/55">
                        Tested {formatTimestamp(source.lastTestedAt, "recently")}
                      </p>
                      {source.lastError ? (
                        <p className="text-sm leading-relaxed text-rose-700/85">
                          {source.lastError}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <DatabaseSourceStatusBadge status={source.status} />
                </div>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
