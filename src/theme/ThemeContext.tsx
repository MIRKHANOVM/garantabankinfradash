import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { STORAGE_KEY, THEMES, type Theme, type ThemeName } from "./theme";

export interface ThemeContextValue {
  themeName: ThemeName;
  theme: Theme;
  /** Cycle Light → Dark → Exec-Light → Exec-Dark → Light */
  toggleTheme: () => void;
  setTheme: (name: ThemeName) => void;
}

export const ThemeContext = createContext<ThemeContextValue | null>(null);

const THEME_CYCLE: ThemeName[] = ["light", "dark", "exec-light", "exec-dark"];

function getInitialTheme(): ThemeName {
  if (typeof document !== "undefined") {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY) as ThemeName | null;
      if (stored && stored in THEMES) return stored;
    } catch { /* ignore */ }
    const attr = document.documentElement.getAttribute("data-theme") as ThemeName | null;
    if (attr && attr in THEMES) return attr;
  }
  return "light";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeName, setThemeName] = useState<ThemeName>(getInitialTheme);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", themeName);
    try {
      window.localStorage.setItem(STORAGE_KEY, themeName);
    } catch { /* ignore */ }
  }, [themeName]);

  useEffect(() => {
    const root = document.documentElement;
    const id = window.requestAnimationFrame(() =>
      root.classList.remove("no-transitions")
    );
    return () => window.cancelAnimationFrame(id);
  }, []);

  const setTheme = useCallback((name: ThemeName) => setThemeName(name), []);

  const toggleTheme = useCallback(() => {
    setThemeName((n) => {
      const idx = THEME_CYCLE.indexOf(n);
      return THEME_CYCLE[(idx + 1) % THEME_CYCLE.length];
    });
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({ themeName, theme: THEMES[themeName], toggleTheme, setTheme }),
    [themeName, toggleTheme, setTheme]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}
