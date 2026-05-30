import { getCurrentWindow } from "@tauri-apps/api/window";
import { CloudCheck, CloudOff, Loader2, RefreshCw } from "lucide-react";
import { useSync } from "../lib/sync";
import { classNames } from "../lib/utils";

const startDrag = (e: React.MouseEvent) => {
  // Only handle primary-button drag, ignore right-click etc.
  if (e.button !== 0) return;
  e.preventDefault();
  void getCurrentWindow().startDragging();
};

const maximize = () => {
  void getCurrentWindow().toggleMaximize();
};

export function TitleBar() {
  const enabled = useSync((s) => s.enabled);
  const isSyncing = useSync((s) => s.isSyncing);
  const lastError = useSync((s) => s.lastError);
  const syncNow = useSync((s) => s.syncNow);

  return (
    <div
      onMouseDown={startDrag}
      onDoubleClick={maximize}
      className={classNames(
        "titlebar-drag flex h-11 shrink-0 cursor-default select-none items-center border-b border-line",
        "bg-bg-panel/95 backdrop-blur-xl",
      )}
    >
      {/* Left spacer for macOS traffic lights (red/yellow/green) */}
      <div className="h-full w-20 shrink-0" />

      {/* Center title */}
      <div className="flex h-full flex-1 items-center justify-center gap-2 px-4">
        <span className="text-base leading-none">📚</span>
        <span className="text-sm font-semibold tracking-tight text-ink">
          Dialogue Atlas
        </span>
      </div>

      {/* Right sync pill — stop drag propagation so clicks register */}
      <div
        onMouseDown={(e) => e.stopPropagation()}
        onDoubleClick={(e) => e.stopPropagation()}
        className="titlebar-no-drag flex h-full shrink-0 items-center gap-1.5 pr-3"
      >
        {enabled ? (
          <button
            onClick={() => void syncNow()}
            title={lastError ?? "Sync now"}
            className={classNames(
              "group flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-medium shadow-sm transition hover:border-accent",
              lastError ? "text-red-500" : "text-ink-muted hover:text-ink",
            )}
          >
            {isSyncing ? (
              <Loader2 size={11} className="animate-spin" />
            ) : lastError ? (
              <CloudOff size={11} />
            ) : (
              <CloudCheck size={11} className="text-accent" />
            )}
            <span>
              {isSyncing ? "Syncing…" : lastError ? "Sync error" : "Synced"}
            </span>
            {!isSyncing && !lastError && (
              <RefreshCw
                size={9}
                className="opacity-30 transition group-hover:rotate-90 group-hover:opacity-100"
              />
            )}
          </button>
        ) : (
          <span className="flex items-center gap-1 rounded-full border border-line bg-surface px-3 py-1.5 text-xs text-ink-soft">
            <CloudOff size={11} />
            Local only
          </span>
        )}
      </div>
    </div>
  );
}
