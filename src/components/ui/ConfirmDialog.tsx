import { AlertTriangle, X } from "lucide-react";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  body?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  danger = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 p-4"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm rounded-lg border border-line bg-surface shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b border-line px-4 py-3">
          {danger && <AlertTriangle size={16} className="text-red-600" />}
          <h2 className="flex-1 text-sm font-semibold">{title}</h2>
          <button
            onClick={onCancel}
            className="rounded p-1 text-ink-soft hover:bg-bg-panel hover:text-ink"
          >
            <X size={14} />
          </button>
        </div>
        {body && (
          <div className="px-4 py-3 text-sm text-ink-muted">{body}</div>
        )}
        <div className="flex justify-end gap-2 border-t border-line bg-bg-panel/40 px-4 py-3">
          <button onClick={onCancel} className="btn">
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={
              danger
                ? "btn bg-red-600 text-white hover:bg-red-700 hover:text-white"
                : "btn btn-primary"
            }
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
