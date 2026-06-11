/**
 * grafanaApi.ts
 *
 * Service layer between the mock Grafana engine and CapacityContext.
 *
 * Data flow:
 *   grafanaEngine (ticks every 15 s, stores latest internally)
 *       ↓  getLatestSnapshot() / getLatestSnapshotAt()
 *   grafanaApi   (async wrapper — adds simulated network latency)
 *       ↓  fetchCapacitySnapshot() / refreshCapacityData()
 *   CapacityContext  (updates React state only when the user clicks Refresh)
 *       ↓  useCapacity()
 *   Dashboard cards
 *
 * To replace with a real Grafana integration:
 *   1. Remove the grafanaEngine import.
 *   2. Swap loadFromEngine() for a fetch() to your datasource proxy URL.
 *   3. Map the real response onto CapacityData.
 */

import {
  getLatestSnapshot,
  getLatestSnapshotAt,
} from "../mock/grafanaEngine";

// ─── Public data shapes ───────────────────────────────────────────────────────

/**
 * Top-level summary KPIs that cannot be derived from individual section metrics
 * alone (incidents, branch risk).
 */
export interface SummaryData {
  /** Count of open incidents — no derivable formula from capacity fields. */
  activeIncidents: number;
  /** Count of branches flagged at risk — no derivable formula from capacity fields. */
  branchesAtRisk: number;
}

export interface ServersData {
  total: number;
  physical: number;
  virtual: number;
  active: number;
  maintenance: number;
  availabilityPct: number;
  availabilityTrendPct: number;
}

export interface HostsData {
  total: number;
  active: number;
  unavailable: number;
  reboots24h: number;
  rebootsAvgPerDay: number;
  rebootsTrendPct: number;
  /** 16-day rolling reboot count history. Last element matches reboots24h. */
  rebootHistory: number[];
}

export interface SsdData {
  usedTb: number;
  totalTb: number;
  growthGbPerDay: number;
  daysRemaining: number;
  usagePct: number;
  forecastFullDate: string;
  history: number[];
  forecast: number[];
}

export interface RamData {
  usedTb: number;
  totalTb: number;
  availableTb: number;
  usagePct: number;
  growthTbPerWeek: number;
  weeklyTrendPct: number;
  trend: number[];
}

export interface CpuData {
  avgLoadPct: number;
  tempAvgC: number;
  tempPeakC: number;
  criticalEventsToday: number;
  loadHistory: number[];
  miniTrend: number[];
}

export interface CapacityData {
  summary: SummaryData;
  servers: ServersData;
  hosts: HostsData;
  ssd: SsdData;
  ram: RamData;
  cpu: CpuData;
  _meta: {
    source: string;
    datasource: string;
    refreshIntervalMs: number;
    description: string;
  };
}

/** Enriched response that also carries the engine's snapshot timestamp. */
export interface CapacityResponse {
  data: CapacityData;
  /** When the engine generated this snapshot (not when the user clicked Refresh). */
  sourceUpdatedAt: Date;
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

/** Simulates realistic datasource query latency (fixed 200 ms). */
function fakeLatency(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 200));
}

/** Reads the engine's latest snapshot + its timestamp. */
async function loadFromEngine(): Promise<CapacityResponse> {
  await fakeLatency();
  return {
    data: getLatestSnapshot(),
    sourceUpdatedAt: getLatestSnapshotAt(),
  };
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Initial load on mount — fetches whatever the engine has right now.
 */
export async function fetchCapacitySnapshot(): Promise<CapacityResponse> {
  return loadFromEngine();
}

/**
 * User-triggered refresh — fetches the engine's current latest snapshot.
 * The `_current` parameter is kept for API-shape compatibility but ignored.
 */
export async function refreshCapacityData(
  _current: CapacityData
): Promise<CapacityResponse> {
  return loadFromEngine();
}
