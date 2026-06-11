/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // ── surfaces ─────────────────────────────────────────────
        page: "var(--bg-primary)",
        card: "var(--bg-card)",
        subtle: "var(--bg-secondary)",
        chip: "var(--bg-chip)",
        track: "var(--bg-track)",
        // ── borders / dividers ───────────────────────────────────
        cardborder: "var(--border-default)",
        divider: "var(--border-subtle)",
        // ── text ramp (semantic → CSS vars) ──────────────────────
        ink: {
          900: "var(--text-primary)",
          800: "var(--text-strong)",
          700: "var(--text-title)",
          500: "var(--text-secondary)",
          400: "var(--text-muted)",
        },
        "seg-inactive": "var(--text-seg-inactive)",
        // ── status / accents ─────────────────────────────────────
        brand: {
          blue: "var(--info)",
          green: "var(--success)",
          orange: "var(--warning)",
          red: "var(--error)",
          purple: "var(--accent-purple)",
        },
        // ── status-indicator dots ────────────────────────────────
        dot: {
          success: "var(--dot-success)",
          warning: "var(--dot-warning)",
          error: "var(--dot-error)",
          info: "var(--dot-info)",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
      },
      boxShadow: {
        card: "var(--shadow-card)",
        glow: "var(--shadow-glow)",
      },
    },
  },
  plugins: [],
};
