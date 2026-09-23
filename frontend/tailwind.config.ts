import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: {
          yellow: "var(--color-brand-yellow)",
          "yellow-dark": "var(--color-brand-yellow-dark)",
          charcoal: "var(--color-charcoal)",
          "charcoal-light": "var(--color-charcoal-light)",
        },
        surface: {
          DEFAULT: "var(--color-surface)",
          raised: "var(--color-surface-raised)",
          sunken: "var(--color-surface-sunken)",
        },
        ink: {
          DEFAULT: "var(--color-ink)",
          muted: "var(--color-ink-muted)",
          faint: "var(--color-ink-faint)",
        },
        status: {
          safe: "var(--color-safe)",
          "safe-bg": "var(--color-safe-bg)",
          warning: "var(--color-warning)",
          "warning-bg": "var(--color-warning-bg)",
          critical: "var(--color-critical)",
          "critical-bg": "var(--color-critical-bg)",
          info: "var(--color-info)",
          "info-bg": "var(--color-info-bg)",
          unknown: "var(--color-unknown)",
          "unknown-bg": "var(--color-unknown-bg)",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
      },
      boxShadow: {
        industrial: "0 1px 2px rgba(0,0,0,0.06), 0 1px 0 rgba(0,0,0,0.04)",
        "industrial-lg": "0 4px 12px rgba(0,0,0,0.12)",
      },
      borderRadius: {
        card: "0.75rem",
      },
    },
  },
  plugins: [],
} satisfies Config;
