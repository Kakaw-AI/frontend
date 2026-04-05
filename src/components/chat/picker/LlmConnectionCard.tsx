import { DatabaseSourceStatusBadge } from "@/components/chat/DatabaseSourceStatusBadge";
import { LlmProviderLogo } from "@/components/chat/LlmProviderLogo";
import type { LlmConnection } from "@/lib/queries/llm-connections";
import { LoaderCircle, Power, RefreshCw, Trash2 } from "lucide-react";
import { formatTimestamp } from "./picker-utils";

export type ConnectionActionKind = "activate" | "deactivate" | "delete";

export type ConnectionCardAction = {
  action: ConnectionActionKind;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  busy?: boolean;
};

function ConnectionActionButton({
  action,
  label,
  onClick,
  disabled,
  busy,
}: ConnectionCardAction) {
  const toneClassName =
    action === "delete"
      ? "border-rose-200 bg-rose-50 text-rose-800"
      : action === "activate"
        ? "border-emerald-200 bg-emerald-50 text-emerald-800"
        : "border-outline-variant/20 bg-white text-on-surface/70";

  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      disabled={disabled}
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 ${toneClassName}`}
    >
      {busy ? <LoaderCircle size={12} className="animate-spin" /> : null}
      {action === "activate" ? (
        <RefreshCw size={12} />
      ) : action === "delete" ? (
        <Trash2 size={12} />
      ) : (
        <Power size={12} />
      )}
      {label}
    </button>
  );
}

export function LlmConnectionCard({
  connection,
  selected,
  muted,
  onSelect,
  actions,
}: {
  connection: LlmConnection;
  selected: boolean;
  muted?: boolean;
  onSelect?: () => void;
  actions?: ConnectionCardAction[];
}) {
  const cardClassName = muted
    ? selected
      ? "border-outline-variant/20 bg-white/80 opacity-80"
      : "border-outline-variant/15 bg-surface-container-low opacity-75"
    : selected
      ? "border-primary/45 bg-white shadow-[0_18px_40px_-24px_rgba(112,87,49,0.45)]"
      : "border-outline-variant/20 bg-white hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-[0_18px_40px_-24px_rgba(112,87,49,0.45)]";

  const content = (
    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-secondary-container/60 text-primary">
          <LlmProviderLogo provider={connection.provider} className="h-6 w-6" />
        </div>

        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-3">
            <p className="font-semibold text-on-surface">{connection.label}</p>
            <span className="font-label text-[10px] uppercase tracking-[0.2em] text-on-surface/40">
              {connection.provider}
            </span>
          </div>
          <p className="text-sm text-on-surface/55">
            {connection.defaultModel}
            {connection.apiKeyLastFour
              ? ` · key ••••${connection.apiKeyLastFour}`
              : connection.usesLinkedAccount
                ? " · linked account"
                : ""}
          </p>
          <p className="text-sm text-on-surface/55">
            Tested {formatTimestamp(connection.lastTestedAt, "recently")}
          </p>
          {connection.lastError ? (
            <p className="text-sm leading-relaxed text-rose-700/85">
              {connection.lastError}
            </p>
          ) : null}
        </div>
      </div>

      <DatabaseSourceStatusBadge status={connection.status} />
    </div>
  );

  return (
    <div className={`rounded-[24px] border px-5 py-4 transition-all ${cardClassName}`}>
      {onSelect ? (
        <button type="button" onClick={onSelect} className="w-full text-left">
          {content}
        </button>
      ) : (
        content
      )}

      {actions?.length ? (
        <div className="mt-4 flex flex-wrap gap-2 border-t border-outline-variant/15 pt-3">
          {actions.map((item) => (
            <ConnectionActionButton key={`${connection.id}-${item.action}`} {...item} />
          ))}
        </div>
      ) : null}
    </div>
  );
}
