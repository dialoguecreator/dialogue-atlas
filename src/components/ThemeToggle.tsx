import { Moon, Sun } from "lucide-react";
import { useTheme } from "../lib/theme";
import { classNames } from "../lib/utils";

export function ThemeToggle() {
  const theme = useTheme((s) => s.theme);
  const toggle = useTheme((s) => s.toggle);
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      onClick={toggle}
      className={classNames(
        "group relative flex h-7 w-12 shrink-0 items-center rounded-full border transition-colors duration-500 ease-out",
        isDark
          ? "border-transparent bg-accent/90"
          : "border-line bg-bg-deep",
      )}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {/* Track icons */}
      <Sun
        size={11}
        className={classNames(
          "absolute left-1.5 transition-opacity duration-300",
          isDark ? "opacity-50 text-white/70" : "opacity-100 text-amber-500",
        )}
      />
      <Moon
        size={11}
        className={classNames(
          "absolute right-1.5 transition-opacity duration-300",
          isDark ? "opacity-100 text-white" : "opacity-40 text-ink-soft",
        )}
      />

      {/* Bubble */}
      <span
        className={classNames(
          "pointer-events-none absolute top-1/2 -translate-y-1/2 h-5 w-5 rounded-full bg-white shadow-md transition-all duration-500",
          isDark
            ? "left-[22px] scale-100 shadow-black/40"
            : "left-[2px] scale-100 shadow-black/15",
        )}
        style={{
          transitionTimingFunction: "cubic-bezier(0.34, 1.56, 0.64, 1)",
        }}
      />
    </button>
  );
}
