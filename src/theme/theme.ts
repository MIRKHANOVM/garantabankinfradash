// ─────────────────────────────────────────────────────────────────────────────
// Semantic design tokens for the dashboard theme system.
//
// Four themes:
//   light          — existing clean light
//   dark           — existing deep navy dark
//   exec-light     — Executive Light Neumorphism (warm off-white, soft shadows)
//   exec-dark      — Executive Dark Neumorphism  (graphite, raised surfaces)
//
// Two consumption layers, one source of truth:
//   • Class-based components read CSS variables (index.css, kept in sync).
//   • Inline-SVG charts read JS literals reactively via useTheme().
// ─────────────────────────────────────────────────────────────────────────────

export type ThemeName = "light" | "dark" | "exec-light" | "exec-dark";

export interface Theme {
  name: ThemeName;
  background: {
    primary: string;
    secondary: string;
    card: string;
    chip: string;
    track: string;
  };
  text: {
    primary: string;
    strong: string;
    title: string;
    secondary: string;
    muted: string;
    segInactive: string;
    onAccent: string;
  };
  border: {
    default: string;
    subtle: string;
  };
  status: {
    success: string;
    warning: string;
    error: string;
    info: string;
    purple: string;
  };
  dot: {
    success: string;
    warning: string;
    error: string;
    info: string;
  };
  chart: {
    primary: string;
    secondary: string;
    tertiary: string;
    quaternary: string;
    forecast: string;
    threshold: string;
    grid: string;
    axis: string;
    dotHalo: string;
    areaBoost: number;
  };
  shadow: {
    card: string;
    glow: string;
  };
}

// ─── Light (unchanged) ────────────────────────────────────────────────────────
export const lightTheme: Theme = {
  name: "light",
  background: {
    primary: "#F1F3F6",
    secondary: "#F6F7F9",
    card: "#FFFFFF",
    chip: "#F3F4F6",
    track: "#EAECEF",
  },
  text: {
    primary: "#111827",
    strong: "#1F2937",
    title: "#374151",
    secondary: "#6B7280",
    muted: "#9CA3AF",
    segInactive: "#93A4C2",
    onAccent: "#FFFFFF",
  },
  border: {
    default: "#E9EBEF",
    subtle: "#EEF0F3",
  },
  status: {
    success: "#16A34A",
    warning: "#F97316",
    error: "#DC2626",
    info: "#2563EB",
    purple: "#9333EA",
  },
  dot: {
    success: "#22C55E",
    warning: "#F97316",
    error: "#EF4444",
    info: "#2563EB",
  },
  chart: {
    primary: "#2563EB",
    secondary: "#16A34A",
    tertiary: "#F97316",
    quaternary: "#9333EA",
    forecast: "#16A34A",
    threshold: "#EF4444",
    grid: "#EEF0F3",
    axis: "#9CA3AF",
    dotHalo: "#FFFFFF",
    areaBoost: 1,
  },
  shadow: {
    card: "0 1px 2px rgba(16,24,40,0.04), 0 1px 3px rgba(16,24,40,0.06)",
    glow: "none",
  },
};

// ─── Dark (unchanged) ─────────────────────────────────────────────────────────
export const darkTheme: Theme = {
  name: "dark",
  background: {
    primary: "linear-gradient(135deg, #0A101C 0%, #0B1320 55%, #0D1626 100%)",
    secondary: "#181F2C",
    card: "#141B29",
    chip: "#1C2431",
    track: "#232C3C",
  },
  text: {
    primary: "#F4F7FB",
    strong: "#E6EAF2",
    title: "#C7CEDC",
    secondary: "#8B94A5",
    muted: "#687085",
    segInactive: "#6E7686",
    onAccent: "#FFFFFF",
  },
  border: {
    default: "#283143",
    subtle: "#212A39",
  },
  status: {
    success: "#5CC91B",
    warning: "#F97316",
    error: "#EF4444",
    info: "#4884EC",
    purple: "#A855F7",
  },
  dot: {
    success: "#5CC91B",
    warning: "#F97316",
    error: "#EF4444",
    info: "#4884EC",
  },
  chart: {
    primary: "#4884EC",
    secondary: "#5CC91B",
    tertiary: "#F97316",
    quaternary: "#A855F7",
    forecast: "#5CC91B",
    threshold: "#EF4444",
    grid: "#1E2633",
    axis: "#687085",
    dotHalo: "#141B29",
    areaBoost: 1.4,
  },
  shadow: {
    card: "inset 0 1px 0 rgba(255,255,255,0.045), 0 2px 8px rgba(0,0,0,0.30), 0 6px 18px rgba(0,0,0,0.28)",
    glow: "0 0 0 1px rgba(255,255,255,0.03), 0 8px 28px rgba(0,0,0,0.40)",
  },
};

// ─── Executive Light — Neumorphism ────────────────────────────────────────────
//
// Canvas: #E3E7EC (L*=91.5) — warm light-grey, visible separation from cards.
// Card:   #F5F7FA (L*=97.2) — near-white warm surface, CR=1.157 vs canvas.
// Secondary: #DDE2E8 (L*=89.7) — recessed panels sit below canvas.
// Shadows and corners unchanged — surface contrast carries the elevation.
//
export const execLightTheme: Theme = {
  name: "exec-light",
  background: {
    primary: "#E3E7EC",       // canvas  L*=91.5 — warm light-grey
    secondary: "#DDE2E8",     // recessed panels — L*=89.7, visibly below canvas
    card: "#F5F7FA",          // card surface L*=97.2 — CR 1.157 vs canvas
    chip: "#E8ECF1",          // icon chips — recessed from card surface
    track: "#D8DCE2",         // progress bar track
  },
  text: {
    primary: "#1E2635",
    strong: "#2C3A4F",
    title: "#3D4F66",
    secondary: "#5C6E85",
    muted: "#8A99AB",
    segInactive: "#8A99AB",
    onAccent: "#FFFFFF",
  },
  border: {
    default: "transparent",   // neumorphic cards use shadow, not border
    subtle: "#D8DCE4",
  },
  status: {
    success: "#1A8A4A",
    warning: "#D97706",
    error: "#C62828",
    info: "#1D4ED8",
    purple: "#7C3AED",
  },
  dot: {
    success: "#16A34A",
    warning: "#F59E0B",
    error: "#DC2626",
    info: "#2563EB",
  },
  chart: {
    primary: "#1D4ED8",
    secondary: "#1A8A4A",
    tertiary: "#D97706",
    quaternary: "#7C3AED",
    forecast: "#1A8A4A",
    threshold: "#C62828",
    grid: "#DDE1E8",
    axis: "#8A99AB",
    dotHalo: "#F5F7FA",
    areaBoost: 0.85,
  },
  shadow: {
    // Raised neumorphic card: bright top-left + dark bottom-right
    card: "6px 6px 14px rgba(166,176,190,0.70), -6px -6px 14px rgba(255,255,255,0.90)",
    // Drawer / overlay panel: deeper version
    glow: "8px 8px 20px rgba(160,170,185,0.65), -8px -8px 20px rgba(255,255,255,0.85)",
  },
};

// ─── Executive Dark — Neumorphism ─────────────────────────────────────────────
//
// Surface: graphite #2A2F3A — warm dark grey, not black.
// Neumorphic depth created with:
//   highlight: rgba(255,255,255,0.06) top-left
//   shadow:    rgba(0,0,0,0.45) bottom-right
// Status/accent colours are muted to sit naturally on graphite.
//
export const execDarkTheme: Theme = {
  name: "exec-dark",
  background: {
    primary: "#242830",       // graphite canvas
    secondary: "#1E2228",     // deeper recessed panels
    card: "#2A2F3A",          // raised card surface (lighter than canvas)
    chip: "#323845",
    track: "#1E2228",
  },
  text: {
    primary: "#E8EDF4",
    strong: "#D4DAE6",
    title: "#B0BAC8",
    secondary: "#7E8A9C",
    muted: "#5A6472",
    segInactive: "#5A6472",
    onAccent: "#FFFFFF",
  },
  border: {
    default: "transparent",   // depth from shadow only
    subtle: "#323845",
  },
  status: {
    success: "#4CAF72",
    warning: "#F59E0B",
    error: "#F87171",
    info: "#60A5FA",
    purple: "#A78BFA",
  },
  dot: {
    success: "#4CAF72",
    warning: "#F59E0B",
    error: "#F87171",
    info: "#60A5FA",
  },
  chart: {
    primary: "#60A5FA",
    secondary: "#4CAF72",
    tertiary: "#F59E0B",
    quaternary: "#A78BFA",
    forecast: "#4CAF72",
    threshold: "#F87171",
    grid: "#323845",
    axis: "#5A6472",
    dotHalo: "#2A2F3A",
    areaBoost: 1.3,
  },
  shadow: {
    // Graphite raised: subtle white highlight + deep shadow
    card: "5px 5px 12px rgba(0,0,0,0.50), -5px -5px 12px rgba(255,255,255,0.05)",
    glow: "7px 7px 18px rgba(0,0,0,0.55), -7px -7px 18px rgba(255,255,255,0.04)",
  },
};

export const THEMES: Record<ThemeName, Theme> = {
  light: lightTheme,
  dark: darkTheme,
  "exec-light": execLightTheme,
  "exec-dark": execDarkTheme,
};

export const STORAGE_KEY = "dashboard-theme";
