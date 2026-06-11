import { useContext } from "react";
import { ThemeContext, type ThemeContextValue } from "./ThemeContext";
import type { Theme } from "./theme";

/** Access theme state + the reactive theme token object. */
export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a <ThemeProvider>.");
  return ctx;
}

/** Convenience selector for charts that only need the chart palette. */
export function useChartTokens(): Theme["chart"] {
  return useTheme().theme.chart;
}
