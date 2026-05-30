import { Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import { searchEmojis } from "../../lib/emojiSearch";
import { classNames } from "../../lib/utils";

interface EmojiPickerProps {
  open: boolean;
  current: string | null;
  onSelect: (emoji: string) => void;
  onClear: () => void;
  onClose: () => void;
}

const QUICK_GROUPS: { label: string; emojis: string[] }[] = [
  {
    label: "Common",
    emojis: ["📄", "📁", "📚", "📝", "🗂️", "📋", "🗒️", "📊", "💡", "⭐"],
  },
  {
    label: "Work",
    emojis: ["💼", "📈", "📉", "🎯", "🚀", "⚙️", "🛠️", "🧠", "🔍", "✅"],
  },
  {
    label: "Topics",
    emojis: ["📣", "🎨", "💬", "📞", "📧", "💰", "🏷️", "🔒", "🔑", "🧾"],
  },
  {
    label: "Faces",
    emojis: ["😀", "🙂", "🤔", "😴", "🤩", "🥳", "😎", "🤯", "🫶", "👀"],
  },
  {
    label: "Nature",
    emojis: ["🌱", "🌿", "🍀", "🌳", "🌸", "🔥", "💧", "🌊", "⛰️", "🌙"],
  },
];

export function EmojiPicker({
  open,
  current,
  onSelect,
  onClear,
  onClose,
}: EmojiPickerProps) {
  const [query, setQuery] = useState("");

  const results = useMemo(() => searchEmojis(query), [query]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/30 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-lg border border-line bg-surface shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">{current ?? "📄"}</span>
            <h2 className="text-sm font-semibold text-ink">Choose icon</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-ink-soft hover:bg-bg-panel hover:text-ink"
          >
            <X size={14} />
          </button>
        </div>

        <div className="border-b border-line px-4 py-3">
          <div className="relative">
            <Search
              size={13}
              className="absolute left-2 top-1/2 -translate-y-1/2 text-ink-soft"
            />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder='Search emojis (e.g. "wrench", "fire", "rocket")'
              className="w-full rounded-md border border-line bg-[var(--c-card)] py-1.5 pl-7 pr-2 text-sm text-ink outline-none focus:border-accent"
            />
          </div>
        </div>

        <div className="max-h-80 overflow-y-auto px-4 py-3">
          {query.trim() ? (
            results.length === 0 ? (
              <div className="py-6 text-center text-xs text-ink-soft">
                No emojis match "{query}". Paste any emoji below to use it
                directly.
              </div>
            ) : (
              <div className="grid grid-cols-10 gap-1">
                {results.map((e) => (
                  <button
                    key={e.emoji}
                    onClick={() => onSelect(e.emoji)}
                    title={e.name}
                    className={classNames(
                      "flex h-8 w-8 items-center justify-center rounded text-lg transition hover:bg-bg-panel",
                      current === e.emoji && "bg-bg-deep ring-1 ring-accent",
                    )}
                  >
                    {e.emoji}
                  </button>
                ))}
              </div>
            )
          ) : (
            QUICK_GROUPS.map((group) => (
              <div key={group.label} className="mb-3 last:mb-0">
                <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-ink-soft">
                  {group.label}
                </div>
                <div className="grid grid-cols-10 gap-1">
                  {group.emojis.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => onSelect(emoji)}
                      className={classNames(
                        "flex h-8 w-8 items-center justify-center rounded text-lg transition hover:bg-bg-panel",
                        current === emoji && "bg-bg-deep ring-1 ring-accent",
                      )}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="flex items-center gap-2 border-t border-line px-4 py-3">
          <span className="text-[11px] text-ink-soft">
            Tip: you can also paste any emoji directly.
          </span>
          <div className="flex-1" />
          <button type="button" onClick={onClear} className="btn">
            Clear icon
          </button>
        </div>
      </div>
    </div>
  );
}
