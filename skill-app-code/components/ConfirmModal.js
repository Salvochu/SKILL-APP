"use client";

// Generic Yes/No confirm dialog. DangerZone.js has its own specialised
// version (it needs a "type DELETE" field); this is for everything else
// that just needs a plain confirm before an action.
export default function ConfirmModal({
  title,
  message,
  confirmLabel = "Yes",
  cancelLabel = "No",
  danger = false,
  onConfirm,
  onCancel,
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={title}>
      <button type="button" aria-label={cancelLabel} onClick={onCancel} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative flex w-full max-w-sm flex-col gap-4 rounded-2xl border border-border bg-surface p-5">
        <h3 className="font-display text-lg font-semibold text-fg">{title}</h3>
        <p className="text-sm text-muted">{message}</p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-field border border-border px-4 py-2.5 text-sm font-medium text-fg hover:bg-surface-2"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`flex-1 rounded-field px-4 py-2.5 text-sm font-semibold transition-colors ${
              danger ? "bg-danger text-black hover:bg-danger/90" : "bg-accent text-black hover:bg-accent-2"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
