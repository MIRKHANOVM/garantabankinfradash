/**
 * CapacityContext.tsx
 *
 * Single source of truth for all Infrastructure Capacity data shown on the
 * dashboard.  It holds two distinct timestamps:
 *
 *   sourceUpdatedAt  — when the mock Grafana engine last generated a snapshot.
 *                      Advances every 15 s regardless of user action.
 *
 *   dashboardRefreshedAt — when the user last clicked Refresh (or the page
 *                          loaded).  This is when the dashboard cards updated.
 *
 * The engine runs continuously in the background.  React state changes — and
 * therefore card re-renders — happen ONLY when refresh() is called explicitly.
 *
 * Usage:
 *   const { data, refresh, loading, sourceUpdatedAt, dashboardRefreshedAt }
 *     = useCapacity();
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  fetchCapacitySnapshot,
  refreshCapacityData,
  type CapacityData,
} from "../services/grafanaApi";

// ─── Context shape ────────────────────────────────────────────────────────────

export interface CapacityContextValue {
  /** Snapshot currently displayed on the dashboard. Null only before first load. */
  data: CapacityData | null;
  /** True while a fetch / refresh is in flight. */
  loading: boolean;
  /**
   * When the mock Grafana engine generated the snapshot that is currently
   * displayed.  Updates when the user clicks Refresh, not on engine ticks.
   */
  sourceUpdatedAt: Date | null;
  /**
   * When the user last triggered a refresh (or the page first loaded).
   * This is the "Dashboard Last Refreshed" timestamp.
   */
  dashboardRefreshedAt: Date | null;
  /** Pull the engine's latest snapshot into the dashboard. */
  refresh: () => Promise<void>;
}

// ─── Context + hook ───────────────────────────────────────────────────────────

export const CapacityContext = createContext<CapacityContextValue | null>(null);

export function useCapacity(): CapacityContextValue {
  const ctx = useContext(CapacityContext);
  if (!ctx) {
    throw new Error("useCapacity must be used inside <CapacityProvider>");
  }
  return ctx;
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function CapacityProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<CapacityData | null>(null);
  const [loading, setLoading] = useState(false);
  const [sourceUpdatedAt, setSourceUpdatedAt] = useState<Date | null>(null);
  const [dashboardRefreshedAt, setDashboardRefreshedAt] = useState<Date | null>(null);

  const dataRef = useRef<CapacityData | null>(null);
  dataRef.current = data;

  // ── Initial load on mount ──────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchCapacitySnapshot()
      .then((response) => {
        if (cancelled) return;
        setData(response.data);
        setSourceUpdatedAt(response.sourceUpdatedAt);
        setDashboardRefreshedAt(new Date());
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // ── User-triggered refresh ─────────────────────────────────────────────────
  const refresh = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    try {
      const current = dataRef.current;
      const response = current
        ? await refreshCapacityData(current)
        : await fetchCapacitySnapshot();
      setData(response.data);
      setSourceUpdatedAt(response.sourceUpdatedAt);
      setDashboardRefreshedAt(new Date());
    } finally {
      setLoading(false);
    }
  }, [loading]);

  return (
    <CapacityContext.Provider
      value={{ data, loading, sourceUpdatedAt, dashboardRefreshedAt, refresh }}
    >
      {children}
    </CapacityContext.Provider>
  );
}
