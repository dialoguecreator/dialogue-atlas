/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: "var(--c-bg)",
          panel: "var(--c-bg-panel)",
          deep: "var(--c-bg-deep)",
          raised: "var(--c-bg-raised)",
        },
        ink: {
          DEFAULT: "var(--c-ink)",
          muted: "var(--c-ink-muted)",
          soft: "var(--c-ink-soft)",
        },
        accent: {
          DEFAULT: "var(--c-accent)",
          hover: "var(--c-accent-hover)",
        },
        line: "var(--c-line)",
        surface: "var(--c-card)",
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "Inter",
          "system-ui",
          "sans-serif",
        ],
        serif: ["ui-serif", "Georgia", "serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      boxShadow: {
        "atlas-sm": "var(--shadow-sm)",
        "atlas-md": "var(--shadow-md)",
        "atlas-lg": "var(--shadow-lg)",
      },
    },
  },
  plugins: [],
};
