/**
 * infraStatus.ts
 *
 * Single source of truth for Infrastructure Status (KPI 1) logic.
 *
 * Consumed by:
 *   • SummaryStrip.tsx        — KPI bar headline label
 *   • AiExecutiveSummaryDrawer.tsx — drawer narrative + badge
 *
 * Changing the formula or thresholds here updates both consumers
 * simultaneously, eliminating the risk of drift.
 */

import type { CapacityData } from "../services/grafanaApi";

// ─── Types ────────────────────────────────────────────────────────────────────

export type InfraStatus = "Отлично" | "Внимание" | "Критично";

/**
 * A single identified cause signal.
 * priority: lower number = higher urgency (1 is most critical).
 */
export interface InfraSignal {
  priority: number;
  key: string;
  label: string;           // short Russian label for UI display
  description: string;     // one-sentence explanation
  level: "critical" | "warning";
}

// ─── Thresholds ───────────────────────────────────────────────────────────────
// All thresholds are exported so consumers can reference them in comments
// without hardcoding magic numbers.

export const THRESHOLDS = {
  // KPI 1 — Отлично (all must be true)
  AVAIL_EXCELLENT:       99.5,
  HOST_RATIO_EXCELLENT:  0.10,
  CPU_EXCELLENT:         70,

  // KPI 1 — Критично (any one sufficient)
  AVAIL_CRITICAL:        95.0,
  HOST_RATIO_CRITICAL:   0.15,
  CPU_CRITICAL:          85,

  // Warning-level signals (below critical, above excellent)
  AVAIL_WARNING:         98.0,   // server availability incident (KPI 3)
  HOST_RATIO_WARNING:    0.10,   // host availability warning (KPI 1 Отлично boundary)
  CPU_WARNING:           70,     // CPU elevated warning (KPI 1 Отлично boundary)

  // Capacity (KPI 4)
  CAPACITY_WARNING:      75,
} as const;

// ─── Core formula ─────────────────────────────────────────────────────────────

/**
 * Derives the infrastructure status label from three operational dimensions.
 *
 * Отлично:  ALL three signals clean simultaneously (AND).
 * Критично: ANY single signal breaching its critical threshold (OR).
 * Внимание: residual — at least one elevated, none critical.
 */
export function deriveInfraStatus(
  availabilityPct: number,
  unavailable: number,
  total: number,
  cpuLoadPct: number
): InfraStatus {
  const ratio = total > 0 ? unavailable / total : 0;

  if (
    availabilityPct >= THRESHOLDS.AVAIL_EXCELLENT &&
    ratio           <  THRESHOLDS.HOST_RATIO_EXCELLENT &&
    cpuLoadPct      <= THRESHOLDS.CPU_EXCELLENT
  ) return "Отлично";

  if (
    availabilityPct <  THRESHOLDS.AVAIL_CRITICAL ||
    ratio           >= THRESHOLDS.HOST_RATIO_CRITICAL ||
    cpuLoadPct      >  THRESHOLDS.CPU_CRITICAL
  ) return "Критично";

  return "Внимание";
}

// ─── Signal identification ────────────────────────────────────────────────────

/**
 * Identifies all active warning/critical signals from the current data snapshot,
 * sorted by priority (ascending — P1 is most urgent).
 *
 * Priority order follows the Cause-Priority Matrix from the architecture review:
 *   P1  Server availability critical
 *   P2  Host availability critical
 *   P3  CPU overload critical
 *   P4  CPU elevated warning
 *   P5  Server availability reduced warning
 *   P6  Hosts elevated warning
 *   P7  SSD capacity risk
 *   P8  RAM capacity risk
 *
 * Only active signals are returned. An empty array means all clear.
 */
export function identifySignals(data: CapacityData): InfraSignal[] {
  const signals: InfraSignal[] = [];
  const { servers, hosts, cpu, ssd, ram } = data;
  const hostsRatio = hosts.total > 0 ? hosts.unavailable / hosts.total : 0;

  // P1 — Server availability critical
  if (servers.availabilityPct < THRESHOLDS.AVAIL_CRITICAL) {
    signals.push({
      priority: 1,
      key: "server_avail_critical",
      label: "Доступность серверов",
      description: `Доступность упала до ${servers.availabilityPct}% — ниже критического порога ${THRESHOLDS.AVAIL_CRITICAL}%.`,
      level: "critical",
    });
  }

  // P2 — Host availability critical
  if (hostsRatio >= THRESHOLDS.HOST_RATIO_CRITICAL) {
    signals.push({
      priority: 2,
      key: "host_avail_critical",
      label: "Хосты недоступны",
      description: `${hosts.unavailable} хостов недоступно (${Math.round(hostsRatio * 100)}%) — превышен критический порог.`,
      level: "critical",
    });
  }

  // P3 — CPU overload critical
  if (cpu.avgLoadPct > THRESHOLDS.CPU_CRITICAL) {
    signals.push({
      priority: 3,
      key: "cpu_critical",
      label: "Перегрузка CPU",
      description: `Средняя загрузка CPU: ${cpu.avgLoadPct}% — превышен критический порог ${THRESHOLDS.CPU_CRITICAL}%.`,
      level: "critical",
    });
  }

  // P4 — CPU elevated warning (only if not already critical)
  if (cpu.avgLoadPct > THRESHOLDS.CPU_WARNING && cpu.avgLoadPct <= THRESHOLDS.CPU_CRITICAL) {
    signals.push({
      priority: 4,
      key: "cpu_warning",
      label: "Повышенная загрузка CPU",
      description: `Средняя загрузка CPU: ${cpu.avgLoadPct}% — выше нормального уровня.`,
      level: "warning",
    });
  }

  // P5 — Server availability reduced (below warning threshold but not critical)
  if (
    servers.availabilityPct >= THRESHOLDS.AVAIL_CRITICAL &&
    servers.availabilityPct <  THRESHOLDS.AVAIL_WARNING
  ) {
    signals.push({
      priority: 5,
      key: "server_avail_warning",
      label: "Снижение доступности серверов",
      description: `Доступность ${servers.availabilityPct}% — ниже целевого значения ${THRESHOLDS.AVAIL_WARNING}%.`,
      level: "warning",
    });
  }

  // P6 — Hosts elevated (below critical but above Отлично threshold)
  if (
    hostsRatio >= THRESHOLDS.HOST_RATIO_WARNING &&
    hostsRatio <  THRESHOLDS.HOST_RATIO_CRITICAL
  ) {
    signals.push({
      priority: 6,
      key: "host_warning",
      label: "Недоступные хосты",
      description: `${hosts.unavailable} хостов недоступно (${Math.round(hostsRatio * 100)}%) — требует наблюдения.`,
      level: "warning",
    });
  }

  // P7 — SSD capacity risk
  if (ssd.usagePct > THRESHOLDS.CAPACITY_WARNING) {
    signals.push({
      priority: 7,
      key: "ssd_capacity",
      label: "Риск ёмкости SSD",
      description: `SSD заполнен на ${ssd.usagePct}% — осталось ${ssd.daysRemaining} дн. до лимита.`,
      level: ssd.usagePct > 90 ? "critical" : "warning",
    });
  }

  // P8 — RAM capacity risk
  if (ram.usagePct > THRESHOLDS.CAPACITY_WARNING) {
    signals.push({
      priority: 8,
      key: "ram_capacity",
      label: "Риск ёмкости RAM",
      description: `RAM используется на ${ram.usagePct}% (${ram.usedTb} из ${ram.totalTb} ТБ).`,
      level: ram.usagePct > 90 ? "critical" : "warning",
    });
  }

  // Return sorted by priority ascending (most urgent first)
  return signals.sort((a, b) => a.priority - b.priority);
}
