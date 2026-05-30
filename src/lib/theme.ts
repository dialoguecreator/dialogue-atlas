import { create } from "zustand";
import { getSetting, setSetting } from "./db";

export type Theme = "light" | "dark";

interface ThemeStore {
  theme: Theme;
  ready: boolean;
  init: () => Promise<void>;
  setTheme: (next: Theme) => void;
  toggle: () => void;
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
  console.log(
    "[theme] applied:",
    theme,
    "html.classList:",
    Array.from(root.classList),
  );
}

function systemPreference(): Theme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export const useTheme = create<ThemeStore>((set, get) => ({
  theme: "light",
  ready: false,
  init: async () => {
    try {
      const stored = (await getSetting("theme")) as Theme | null;
      const theme: Theme = stored === "light" || stored === "dark" ? stored : systemPreference();
      applyTheme(theme);
      set({ theme, ready: true });
    } catch {
      applyTheme("light");
      set({ ready: true });
    }
  },
  setTheme: (next) => {
    applyTheme(next);
    set({ theme: next });
    setSetting("theme", next).catch((e) => console.warn("Failed to persist theme", e));
  },
  toggle: () => {
    const next: Theme = get().theme === "dark" ? "light" : "dark";
    get().setTheme(next);
  },
}));
