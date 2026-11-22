"use client";

import { AlertTriangle } from "lucide-react";
import { useEffect, useRef } from "react";
import { createStore, useStore } from "@/lib/state/create-store";

type ConfirmOptions = {
  title: string;
  body: string;
  confirmLabel: string;
  /** Red confirm button and a warning mark, for actions that delete things. */
  destructive?: boolean;
};

type PendingConfirm = ConfirmOptions & { resolve: (confirmed: boolean) => void };

const confirmStore = createStore<PendingConfirm | null>(null);

/**
 * The app's replacement for window.confirm. Resolves true on confirm and false
 * on Cancel, Esc or a click on the backdrop. Needs <ConfirmDialogHost /> mounted.
 */
export function confirmDialog(options: ConfirmOptions): Promise<boolean> {
  // A new question replaces one still open, which counts as cancelled.
  confirmStore.getState()?.resolve(false);
  return new Promise((resolve) => confirmStore.setState({ ...options, resolve }));
}

function settle(confirmed: boolean) {
  const pending = confirmStore.getState();
  if (!pending) return;
  confirmStore.setState(null);
  pending.resolve(confirmed);
}

export function ConfirmDialogHost() {
  const pending = useStore(confirmStore, (state) => state);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  // Native modal: focus trap, Esc and the top layer come for free, so it also
  // stacks above another open dialog. Focus starts on Cancel, the safe choice.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (pending && !dialog.open) {
      dialog.showModal();
      cancelRef.current?.focus();
    }
    if (!pending && dialog.open) dialog.close();
  }, [pending]);

  return (
    <dialog
      ref={dialogRef}
      role="alertdialog"
      aria-labelledby="confirm-title"
      aria-describedby="confirm-body"
      onClose={() => settle(false)}
      // A click on the backdrop lands on the dialog itself; inside it lands on a child.
      onClick={(event) => {
        if (event.target === event.currentTarget) settle(false);
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-md overflow-hidden rounded-2xl border border-border bg-surface p-0 text-on-surface outline-none backdrop:bg-on-surface/40 backdrop:backdrop-blur-[2px]"
    >
      {pending ? (
        <div className="p-6 animate-in fade-in-0 zoom-in-95 duration-150 motion-reduce:animate-none">
          <div className="flex items-start gap-4">
            {pending.destructive ? (
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary-container text-secondary">
                <AlertTriangle size={18} aria-hidden />
              </span>
            ) : null}
            <div className="min-w-0 pt-0.5">
              <h2 id="confirm-title" className="font-headline text-xl leading-tight">
                {pending.title}
              </h2>
              <p id="confirm-body" className="mt-2 text-sm leading-relaxed text-on-surface-variant">
                {pending.body}
              </p>
            </div>
          </div>
          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button ref={cancelRef} type="button" onClick={() => settle(false)} className="pod-btn-ghost min-h-11 px-5">
              Cancel
            </button>
            <button
              type="button"
              onClick={() => settle(true)}
              className={`min-h-11 ${pending.destructive ? "pod-btn-destructive" : "pod-btn"}`}
            >
              {pending.confirmLabel}
            </button>
          </div>
        </div>
      ) : null}
    </dialog>
  );
}
