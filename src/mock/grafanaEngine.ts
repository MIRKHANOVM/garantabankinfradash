/**
 * grafanaEngine.ts
 *
 * Background mock Grafana scrape engine.
 *
 * Architecture:
 *   1. On each scrape, probabilistically select an InfrastructureHealth state:
 *        Excellent  65%  (healthy, stable)
 *        Warning    25%  (degraded, attention needed)
 *        Critical   10%  (unhealthy, action required)
 *
 *   2. All metric values are generated from ranges bound to that state.
 *      No metric is generated independently — every value is coherent with
 *      the selected state, eliminating contradictory KPI combinations.
 *
 *   3. A deterministic sine-wave oscillator picks values within each
 *      state's range, preserving the smooth metric-movement feel.
 *
 * Public API (unchanged):
 *   getLatestSnapshot()   → deep-copy of latest CapacityData
 *   getLatestSnapshotAt() → Date of last scrape
 *   stopEngine()          → clears the setInterval (test/HMR)
 *   ENGINE_INTERVAL_MS    → 15000
 */

import baseSnapshot from "./grafanaData.json";
import type { CapacityData } from "../services/grafanaApi";

// ─── Configuration ────────────────────────────────────────────────────────────

const SCRAPE_INTERVAL_MS = 15_000;

// ─── Infrastructure health state ──────────────────────────────────────────────

type InfrastructureHealth = "excellent" | "warning" | "critical";

/**
 * Probabilistic state selection on every scrape.
 * Excellent 65% · Warning 25% · Critical 10%
 * Uses Math.random() intentionally — state unpredictability is the goal.
 */
function selectHealthState(): InfrastructureHealth {
  const r = Math.random();
  if (r < 0.65) return "excellent";
  if (r < 0.90) return "warning";
  return "critical";
}

// ─── State-bound ranges ───────────────────────────────────────────────────────

interface StateRanges {
  availabilityPct:  [number, number];
  hostsUnavailable: [number, number];
  ssdUsagePct:      [number, number];
  ramUsagePct:      [number, number];
  cpuLoadPct:       [number, number];
  reboots24h:       [number, number];
  cpuTempAvg:       [number, number];
  cpuTempPeak:      [number, number];
}

const RANGES: Record<InfrastructureHealth, StateRanges> = {
  excellent: {
    availabilityPct:  [99.5,  100.0],
    hostsUnavailable: [0,     10],
    ssdUsagePct:      [50,    75],
    ramUsagePct:      [50,    75],
    cpuLoadPct:       [20,    60],
    reboots24h:       [2,     8],
    cpuTempAvg:       [45,    60],
    cpuTempPeak:      [55,    70],
  },
  warning: {
    availabilityPct:  [95.0,  98.5],
    hostsUnavailable: [10,    30],
    ssdUsagePct:      [70,    85],
    ramUsagePct:      [70,    85],
    cpuLoadPct:       [50,    80],
    reboots24h:       [10,    25],
    cpuTempAvg:       [60,    75],
    cpuTempPeak:      [70,    82],
  },
  critical: {
    availabilityPct:  [90.0,  95.0],
    hostsUnavailable: [30,    60],
    ssdUsagePct:      [85,    98],
    ramUsagePct:      [85,    98],
    cpuLoadPct:       [80,    95],
    reboots24h:       [25,    50],
    cpuTempAvg:       [74,    88],
    cpuTempPeak:      [82,    95],
  },
};

// ─── Range picker ─────────────────────────────────────────────────────────────

let tick = 0;

/**
 * Returns a deterministic value within [lo, hi] using a sine oscillator
 * seeded by tick + phase. Produces smooth movement between scrapes while
 * staying strictly within the state's bounds.
 */
function pickInRange(lo: number, hi: number, phase = 0): number {
  // sin maps to [-1, 1]; rescale to [lo, hi]
  const t = (Math.sin((tick + phase) * 0.7) + 1) / 2; // 0..1
  return lo + t * (hi - lo);
}

function pickRounded(lo: number, hi: number, phase = 0): number {
  return Math.round(pickInRange(lo, hi, phase) * 100) / 100;
}

function pickInt(lo: number, hi: number, phase = 0): number {
  return Math.round(pickInRange(lo, hi, phase));
}

// ─── Series helpers ───────────────────────────────────────────────────────────

/**
 * Advances a time-series array by dropping the oldest value and appending
 * a new value drawn from [lo, hi] — consistent with the current health state.
 */
function advanceSeries(
  series: number[],
  lo: number,
  hi: number,
  phase = 0
): number[] {
  const next = pickRounded(lo, hi, phase);
  return [...series.slice(1), next];
}

// ─── Snapshot generator ───────────────────────────────────────────────────────

function generateSnapshot(): CapacityData {
  const b = baseSnapshot;
  const state = selectHealthState();
  const r = RANGES[state];

  // ── Servers ──────────────────────────────────────────────────────────────
  const availPct     = pickRounded(r.availabilityPct[0], r.availabilityPct[1], 0);
  const activeServers = Math.round((availPct / 100) * b.servers.total);
  const maintenance  = b.servers.total - activeServers;

  // ── Hosts ────────────────────────────────────────────────────────────────
  const unavailableHosts = pickInt(r.hostsUnavailable[0], r.hostsUnavailable[1], 1);
  const activeHosts      = b.hosts.total - unavailableHosts;
  const reboots24h       = pickInt(r.reboots24h[0], r.reboots24h[1], 2);

  // Reboot history: advance and cap last bar to reboots24h
  const updatedRebootHistory = [
    ...advanceSeries(b.hosts.rebootHistory, r.reboots24h[0], r.reboots24h[1], 2).slice(0, -1),
    reboots24h,
  ];

  // ── SSD ──────────────────────────────────────────────────────────────────
  const ssdPct      = pickInt(r.ssdUsagePct[0], r.ssdUsagePct[1], 3);
  const ssdUsed     = Math.round((ssdPct / 100) * b.ssd.totalTb * 100) / 100;
  const ssdDaysLeft = Math.max(
    1,
    Math.round(((b.ssd.totalTb - ssdUsed) * 1000) / b.ssd.growthGbPerDay)
  );
  // SSD history series: values range from ~50% to current usage for the trend
  const ssdHistLo = (r.ssdUsagePct[0] / 100) * b.ssd.totalTb * 0.7;
  const ssdHistHi = ssdUsed;
  const ssdHistory  = advanceSeries(b.ssd.history, ssdHistLo, ssdHistHi, 3);
  const ssdForecast = advanceSeries(b.ssd.forecast, ssdUsed, ssdUsed * 1.05, 3);

  // ── RAM ──────────────────────────────────────────────────────────────────
  const ramPct   = pickInt(r.ramUsagePct[0], r.ramUsagePct[1], 4);
  const ramUsed  = Math.round((ramPct / 100) * b.ram.totalTb * 100) / 100;
  const ramAvail = Math.round((b.ram.totalTb - ramUsed) * 10) / 10;
  const ramTrendLo = (r.ramUsagePct[0] / 100) * b.ram.totalTb * 0.8;
  const ramTrend   = advanceSeries(b.ram.trend, ramTrendLo, ramUsed, 4);

  // ── CPU ──────────────────────────────────────────────────────────────────
  const cpuLoad  = pickInt(r.cpuLoadPct[0], r.cpuLoadPct[1], 5);
  const tempAvg  = pickInt(r.cpuTempAvg[0], r.cpuTempAvg[1], 6);
  const tempPeak = Math.max(tempAvg + 2, pickInt(r.cpuTempPeak[0], r.cpuTempPeak[1], 7));
  const loadHistory = advanceSeries(b.cpu.loadHistory, r.cpuLoadPct[0], r.cpuLoadPct[1], 5);
  const miniTrend   = advanceSeries(b.cpu.miniTrend, r.cpuLoadPct[0], r.cpuLoadPct[1], 5);

  return {
    _meta: {
      ...b._meta,
      description: `State: ${state} · Scrape #${tick} · ${new Date().toLocaleTimeString("ru")}`,
    },
    summary: {
      // Kept in CapacityData for API shape compatibility.
      // KPIs in SummaryStrip derive these from metric thresholds, not these fields.
      activeIncidents: b.summary.activeIncidents,
      branchesAtRisk:  b.summary.branchesAtRisk,
    },
    servers: {
      ...b.servers,
      active:          activeServers,
      maintenance,
      availabilityPct: availPct,
    },
    hosts: {
      ...b.hosts,
      active:       activeHosts,
      unavailable:  unavailableHosts,
      reboots24h,
      rebootHistory: updatedRebootHistory,
    },
    ssd: {
      ...b.ssd,
      usedTb:       ssdUsed,
      usagePct:     ssdPct,
      daysRemaining: ssdDaysLeft,
      history:      ssdHistory,
      forecast:     ssdForecast,
    },
    ram: {
      ...b.ram,
      usedTb:      ramUsed,
      availableTb: ramAvail,
      usagePct:    ramPct,
      trend:       ramTrend,
    },
    cpu: {
      ...b.cpu,
      avgLoadPct:  cpuLoad,
      tempAvgC:    tempAvg,
      tempPeakC:   tempPeak,
      loadHistory,
      miniTrend,
    },
  };
}

// ─── Engine state (module singleton) ─────────────────────────────────────────

let latestSnapshot: CapacityData = generateSnapshot();
let latestSnapshotAt: Date = new Date();

function scrape(): void {
  tick += 1;
  latestSnapshot = generateSnapshot();
  latestSnapshotAt = new Date();
}

const _intervalId = setInterval(scrape, SCRAPE_INTERVAL_MS);

export function stopEngine(): void {
  clearInterval(_intervalId);
}

// ─── Public read API ──────────────────────────────────────────────────────────

export function getLatestSnapshot(): CapacityData {
  return JSON.parse(JSON.stringify(latestSnapshot)) as CapacityData;
}

export function getLatestSnapshotAt(): Date {
  return new Date(latestSnapshotAt.getTime());
}

export const ENGINE_INTERVAL_MS = SCRAPE_INTERVAL_MS;
