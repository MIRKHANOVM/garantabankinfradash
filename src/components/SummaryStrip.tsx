/**
 * SummaryStrip.tsx
 *
 * KPI bar — all five values derived from CapacityContext.
 *
 * ┌─────────────────────────────────────────────────────────────────────────────
 * │  KPI FORMULAS (documented per dependency audit)
 * │
 * │  1. Состояние инфраструктуры  (three states, no "Норма")
 * │     "Отлично"   if servers.availabilityPct >= 99.5
 * │                 AND hosts.unavailable / hosts.total < 0.10
 * │                 AND cpu.avgLoadPct <= 70
 * │     "Критично"  if servers.availabilityPct < 95.0
 * │                 OR  hosts.unavailable / hosts.total >= 0.15
 * │                 OR  cpu.avgLoadPct > 85
 * │     "Внимание"  everything else
 * │
 * │  2. Сервисы доступны
 * │     round(hosts.active / hosts.total * 100) + "%"
 * │
 * │  3. Активные инциденты
 * │     count of resources in critical state:
 * │     ssd.usagePct > 90 | ram.usagePct > 90 | cpu.avgLoadPct > 85 | hosts ratio >= 0.15
 * │
 * │  4. Риски емкости
 * │     count of [ssd.usagePct, ram.usagePct] where value > 75
 * │     threshold 75% = capacity risk threshold used across the dashboard
 * │
 * │  5. Филиалы под риском
 * │     0 when hosts unavail ratio < 0.10; floor(unavailable/5) when >= 0.10
 * └─────────────────────────────────────────────────────────────────────────────
 */

import { useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  ListChecks,
  MapPin,
  Shield,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react";
import { Card, CTA_CLASSES } from "./primitives";
import { useCapacity } from "../context/CapacityContext";
import { deriveInfraStatus, type InfraStatus } from "../lib/infraStatus";
import StatusDrawer from "./StatusDrawer";

// ─── Types ────────────────────────────────────────────────────────────────────

interface KpiItem {
  icon: LucideIcon;
  iconClass: string;
  label: string;
  value: string;
  valueClass: string;
}

// ─── KPI derivation ───────────────────────────────────────────────────────────

const CAPACITY_RISK_THRESHOLD = 75; // % — consistent with LineCPU threshold line

const STATUS_VALUE_CLASS: Record<InfraStatus, string> = {
  "Отлично":  "text-brand-green",
  "Внимание": "text-brand-orange",
  "Критично": "text-brand-red",
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function SummaryStrip() {
  const { data } = useCapacity();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Build KPI items reactively; fall back to "—" while data loads.
  const kpis: KpiItem[] = (() => {
    if (!data) {
      return [
        { icon: Shield,        iconClass: "text-ink-400",        label: "Состояние инфраструктуры", value: "—", valueClass: "text-ink-400" },
        { icon: CheckCircle2,  iconClass: "text-brand-blue",     label: "Сервисы доступны",         value: "—", valueClass: "text-ink-400" },
        { icon: ListChecks,    iconClass: "text-ink-400",        label: "Активные инциденты",       value: "—", valueClass: "text-ink-400" },
        { icon: TriangleAlert, iconClass: "text-brand-orange",   label: "Риски емкости",            value: "—", valueClass: "text-ink-400" },
        { icon: MapPin,        iconClass: "text-ink-400",        label: "Филиалы под риском",       value: "—", valueClass: "text-ink-400" },
      ];
    }

    // 1. Infrastructure status
    const infraStatus = deriveInfraStatus(
      data.servers.availabilityPct,
      data.hosts.unavailable,
      data.hosts.total,
      data.cpu.avgLoadPct
    );

    // 2. Services available  →  round(active / total × 100)%
    const servicesPct = data.hosts.total > 0
      ? Math.round((data.hosts.active / data.hosts.total) * 100)
      : 0;
    const servicesColor = servicesPct >= 95
      ? "text-brand-green"
      : servicesPct >= 85
      ? "text-brand-orange"
      : "text-brand-red";

    // 3. Active incidents → operational signals only (availability + CPU overload).
    //    Intentionally excludes SSD and RAM capacity — those are captured by
    //    KPI 4 (Риски ёмкости) to keep the two KPIs as separate business concepts.
    //      • servers.availabilityPct < 98.0  → server availability incident
    //      • hosts.unavailable / hosts.total >= 0.15 → host availability incident
    //      • cpu.avgLoadPct > 85             → CPU overload incident
    const unavailRatioForIncidents = data.hosts.total > 0
      ? data.hosts.unavailable / data.hosts.total : 0;
    const incidents =
      (data.servers.availabilityPct   <  98.0  ? 1 : 0) +
      (unavailRatioForIncidents       >= 0.15  ? 1 : 0) +
      (data.cpu.avgLoadPct            >  85    ? 1 : 0);
    const incidentsColor = incidents === 0 ? "text-ink-900" : "text-brand-red";

    // 4. Capacity risks  →  count([ssd.usagePct, ram.usagePct] > 75)
    const capacityRisks = [data.ssd.usagePct, data.ram.usagePct]
      .filter((v) => v > CAPACITY_RISK_THRESHOLD).length;
    const risksColor = capacityRisks === 0
      ? "text-ink-900"
      : capacityRisks === 1
      ? "text-brand-orange"
      : "text-brand-red";

    // 5. Branches at risk → derived from host unavailability ratio
    //    Zero while hosts are within normal bounds (< 10% unavailable).
    //    floor(unavailable / 5) once ratio enters warning territory (≥ 10%).
    //    Mirrors the host threshold used by KPI 1 (deriveInfraStatus).
    const unavailRatioForBranches = data.hosts.total > 0
      ? data.hosts.unavailable / data.hosts.total : 0;
    const branches = unavailRatioForBranches >= 0.10
      ? Math.floor(data.hosts.unavailable / 5)
      : 0;
    const branchesColor = branches === 0 ? "text-ink-900" : "text-brand-orange";

    return [
      {
        icon: Shield,
        iconClass: "text-ink-400",
        label: "Состояние инфраструктуры",
        value: infraStatus,
        valueClass: STATUS_VALUE_CLASS[infraStatus],
      },
      {
        icon: CheckCircle2,
        iconClass: "text-brand-blue",
        label: "Сервисы доступны",
        value: `${servicesPct}%`,
        valueClass: servicesColor,
      },
      {
        icon: ListChecks,
        iconClass: "text-ink-400",
        label: "Активные инциденты",
        value: String(incidents),
        valueClass: incidentsColor,
      },
      {
        icon: TriangleAlert,
        iconClass: "text-brand-orange",
        label: "Риски емкости",
        value: String(capacityRisks),
        valueClass: risksColor,
      },
      {
        icon: MapPin,
        iconClass: "text-ink-400",
        label: "Филиалы под риском",
        value: String(branches),
        valueClass: branchesColor,
      },
    ];
  })();

  return (
    <>
      <Card className="px-6 py-[34px]">
        <div className="flex items-center">
          {kpis.map((k, i) => (
            <div key={k.label} className="flex flex-1 items-center">
              <div className="flex items-center gap-4">
                <k.icon className={`h-11 w-11 shrink-0 ${k.iconClass}`} strokeWidth={1.8} />
                <div className="min-w-0">
                  <div className="text-[15px] leading-tight text-ink-500">
                    {k.label}
                  </div>
                  <div className={`text-[32px] font-bold leading-tight ${k.valueClass}`}>
                    {k.value}
                  </div>
                </div>
              </div>
              {i !== kpis.length - 1 && (
                <div className="ml-auto mr-2 h-14 w-px bg-cardborder" />
              )}
            </div>
          ))}

          <button
            onClick={() => setDrawerOpen(true)}
            className={`ml-6 shrink-0 ${CTA_CLASSES}`}
          >
            Все статусы
            <ArrowRight className="h-4 w-4" strokeWidth={2.2} />
          </button>
        </div>
      </Card>

      <StatusDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
}
