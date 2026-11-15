import { DatabaseSourceStatusBadge } from "@/components/chat/DatabaseSourceStatusBadge";
import { LlmProviderLogo } from "@/components/chat/LlmProviderLogo";
import type { LlmConnection } from "@/lib/queries/llm-connections";
import { LoaderCircle, Power, RefreshCw, Trash2 } from "lucide-react";
import { formatTimestamp } from "./picker-utils";

export type ConnectionActionKind = "activate" | "deactivate" | "delete";

const ACTIONS: Record<ConnectionActionKind, { label: string; Icon: typeof Power; className: string }> = {
  activate: { label: "Turn on", Icon: RefreshCw, className: "pod-btn-ghost px-3 py-1.5 text-xs" },
  deactivate: { label: "Turn off", Icon: Power, className: "pod-btn-ghost px-3 py-1.5 text-xs" },
  delete: { label: "Delete", Icon: Trash2, className: "pod-btn-danger" },
};

export function LlmConnectionCard({
  connection,
  actions,
  busyAction,
  disabled,
  onAction,
}: {
  connection: LlmConnection;
  actions: ConnectionActionKind[];
  busyAction: ConnectionActionKind | null;
  disabled: boolean;
  onAction: (action: ConnectionActionKind) => void;
}) {
  return (
    <li className={`pod-card flex flex-wrap items-start gap-3 rounded-2xl p-3 ${connection.isActive ? "" : "opacity-70"}`}>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-primary bg-surface-container">
        <LlmProviderLogo provider={connection.provider} className="h-6 w-6" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate font-bold text-on-surface">{connection.label}</p>
          {connection.isActive ? <DatabaseSourceStatusBadge status={connection.status} /> : null}
        </div>
        <p className="mt-0.5 truncate text-xs text-on-surface-variant">
          {connection.defaultModel}
          {connection.apiKeyLastFour ? ` · key ••••${connection.apiKeyLastFour}` : connection.usesLinkedAccount ? " · linked account" : ""}
          {` · checked ${formatTimestamp(connection.lastTestedAt, "recently")}`}
        </p>
        {connection.lastError ? <p className="mt-1 text-xs text-secondary">{connection.lastError}</p> : null}
      </div>
      <div className="flex gap-2">
        {actions.map((action) => {
          const { label, Icon, className } = ACTIONS[action];
          return (
            <button
              key={action}
              type="button"
              onClick={() => onAction(action)}
              disabled={disabled}
              className={className}
              aria-label={`${label} ${connection.label}`}
            >
              {busyAction === action ? <LoaderCircle size={12} className="animate-spin" aria-hidden /> : <Icon size={12} aria-hidden />}
              <span className="hidden sm:inline">{label}</span>
            </button>
          );
        })}
      </div>
    </li>
  );
}
