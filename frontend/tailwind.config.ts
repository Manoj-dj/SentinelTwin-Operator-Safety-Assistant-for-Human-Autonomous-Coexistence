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
        cat: {
          black: "var(--cat-black)",
          yellow: "var(--cat-yellow)",
          "yellow-dark": "var(--cat-yellow-dark)",
          white: "var(--cat-white)",
          "gray-light": "var(--cat-gray-light)",
          "gray-mid": "var(--cat-gray-mid)",
          "gray-border": "var(--cat-gray-border)",
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
        "cat-card": "0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)",
        "cat-card-hover": "0 8px 20px rgba(0,0,0,0.10), 0 2px 6px rgba(0,0,0,0.06)",
        "cat-badge": "0 3px 8px rgba(0,0,0,0.18)",
      },
      borderRadius: {
        card: "0.75rem",
      },
      keyframes: {
        "fade-slide-in": {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "risk-flash": {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(255,205,17,0)" },
          "30%": { boxShadow: "0 0 0 4px rgba(255,205,17,0.55)" },
        },
      },
      animation: {
        "fade-slide-in": "fade-slide-in 0.25s ease-out",
        "risk-flash": "risk-flash 0.9s ease-out",
      },
    },
  },
  plugins: [],
} satisfies Config;
