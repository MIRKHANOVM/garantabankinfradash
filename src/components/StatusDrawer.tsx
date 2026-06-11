/**
 * StatusDrawer.tsx
 *
 * Right-side drawer opened by "Все статусы" in SummaryStrip.
 *
 * Status thresholds (match SummaryStrip + plan):
 *
 *   Серверы         availabilityPct   critical < 98.0   warning 98.0–<99.5  ok ≥ 99.5
 *   Хосты           unavailable/total critical ≥ 0.15   warning 0.10–<0.15  ok < 0.10
 *   Емкость SSD     usagePct          critical > 90      warning > 75        ok ≤ 75
 *   Оперативная RAM usagePct          critical > 90      warning > 75        ok ≤ 75
 *   Процессоры CPU  avgLoadPct        critical > 85      warning > 70        ok ≤ 70
 *
 * UI redesign — unchanged:
 *   • All threshold functions
 *   • buildStatusItems()
 *   • SEVERITY_CONFIG keys/values
 *   • open/onClose props
 *   • backdrop + Escape key handler
 *   • dark/light theme support
 */

import { useEffect, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Cpu,
  HardDrive,
  MemoryStick,
  Monitor,
  Server,
  TriangleAlert,
  X,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { useCapacity } from "../context/CapacityContext";
import type { CapacityData } from "../services/grafanaApi";

// ─── Types ────────────────────────────────────────────────────────────────────

type Severity = "critical" | "warning" | "ok";
type FilterTab = "all" | Severity;

interface StatusItem {
  id: string;
  severity: Severity;
  icon: LucideIcon;
  name: string;
  description: string;
  team: string;
}

// ─── Threshold helpers (unchanged) ───────────────────────────────────────────

function severityServers(availabilityPct: number): Severity {
  if (availabilityPct < 98.0) return "critical";
  if (availabilityPct < 99.5) return "warning";
  return "ok";
}

function severityHosts(unavailable: number, total: number): Severity {
  const ratio = total > 0 ? unavailable / total : 0;
  if (ratio >= 0.15) return "critical";
  if (ratio >= 0.10) return "warning";
  return "ok";
}

function severityUsagePct(pct: number): Severity {
  if (pct > 90) return "critical";
  if (pct > 75) return "warning";
  return "ok";
}

function severityCpu(loadPct: number): Severity {
  if (loadPct > 85) return "critical";
  if (loadPct > 70) return "warning";
  return "ok";
}

// ─── Status list builder (unchanged) ─────────────────────────────────────────

function buildStatusItems(data: CapacityData): StatusItem[] {
  const { servers, hosts, ssd, ram, cpu } = data;
  return [
    {
      id: "servers",
      severity: severityServers(servers.availabilityPct),
      icon: Server,
      name: "Серверы",
      description: `Доступность: ${servers.availabilityPct}% · Активных: ${servers.active} · На обслуживании: ${servers.maintenance}`,
      team: "Команда инфраструктуры",
    },
    {
      id: "hosts",
      severity: severityHosts(hosts.unavailable, hosts.total),
      icon: Monitor,
      name: "Хосты и сервисы",
      description: `Активных: ${hosts.active} · Недоступно: ${hosts.unavailable} · Перезагрузок за 24 ч: ${hosts.reboots24h}`,
      team: "Команда платформы",
    },
    {
      id: "ssd",
      severity: severityUsagePct(ssd.usagePct),
      icon: HardDrive,
      name: "Емкость SSD",
      description: `Использование: ${ssd.usagePct}% · Использовано: ${ssd.usedTb} ТБ из ${ssd.totalTb} ТБ · Осталось: ${ssd.daysRemaining} дн.`,
      team: "Команда хранилищ",
    },
    {
      id: "ram",
      severity: severityUsagePct(ram.usagePct),
      icon: MemoryStick,
      name: "Оперативная память",
      description: `Использование: ${ram.usagePct}% · Использовано: ${ram.usedTb} ТБ из ${ram.totalTb} ТБ · Свободно: ${ram.availableTb} ТБ`,
      team: "Команда хранилищ",
    },
    {
      id: "cpu",
      severity: severityCpu(cpu.avgLoadPct),
      icon: Cpu,
      name: "Процессоры (CPU)",
      description: `Средняя загрузка: ${cpu.avgLoadPct}% · Температура: ${cpu.tempAvgC}°C · Пик: ${cpu.tempPeakC}°C`,
      team: "Команда вычислений",
    },
  ];
}

// ─── Severity config (unchanged keys, extended for new UI) ───────────────────

const SEVERITY_CONFIG: Record<
  Severity,
  {
    label: string;
    labelUpper: string;
    subtitle: string;
    dot: string;
    iconColor: string;
    cardBg: string;
    cardBorder: string;
    cardCount: string;
    Icon: LucideIcon;
    sectionBorder: string;
    sectionLabel: string;
    tabActive: string;
  }
> = {
  critical: {
    label: "Критично",
    labelUpper: "КРИТИЧНО",
    subtitle: "Требуют немедленного внимания",
    dot: "bg-dot-error",
    iconColor: "text-brand-red",
    cardBg: "bg-brand-red/5",
    cardBorder: "border-brand-red/20",
    cardCount: "text-brand-red",
    Icon: XCircle,
    sectionBorder: "border-brand-red/25",
    sectionLabel: "text-brand-red",
    tabActive: "bg-brand-red text-white",
  },
  warning: {
    label: "Внимание",
    labelUpper: "ВНИМАНИЕ",
    subtitle: "Требуют наблюдения",
    dot: "bg-dot-warning",
    iconColor: "text-brand-orange",
    cardBg: "bg-brand-orange/5",
    cardBorder: "border-brand-orange/20",
    cardCount: "text-brand-orange",
    Icon: TriangleAlert,
    sectionBorder: "border-brand-orange/25",
    sectionLabel: "text-brand-orange",
    tabActive: "bg-brand-orange text-white",
  },
  ok: {
    label: "Норма",
    labelUpper: "НОРМА",
    subtitle: "Все работает штатно",
    dot: "bg-dot-success",
    iconColor: "text-brand-green",
    cardBg: "bg-brand-green/5",
    cardBorder: "border-brand-green/20",
    cardCount: "text-brand-green",
    Icon: CheckCircle2,
    sectionBorder: "border-brand-green/25",
    sectionLabel: "text-brand-green",
    tabActive: "bg-brand-green text-white",
  },
};

const SECTION_ORDER: Severity[] = ["critical", "warning", "ok"];
const OK_PREVIEW_LIMIT = 5;

// ─── Time formatter (unchanged) ───────────────────────────────────────────────

function fmt(date: Date | null): string {
  if (!date) return "—";
  return date.toLocaleTimeString("ru", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

// ─── StatusRow — table-style layout ──────────────────────────────────────────

function StatusRow({
  item,
  updatedAt,
}: {
  item: StatusItem;
  updatedAt: Date | null;
}) {
  const cfg = SEVERITY_CONFIG[item.severity];
  return (
    <div className="grid grid-cols-[1fr_auto_auto] items-start gap-x-3 gap-y-0 py-3">
      {/* Col 1: status dot + icon + name + description */}
      <div className="flex min-w-0 items-start gap-2.5">
        <span className={`mt-[5px] h-2.5 w-2.5 shrink-0 rounded-full ${cfg.dot}`} />
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <item.icon className="h-[15px] w-[15px] shrink-0 text-ink-500" strokeWidth={2} />
            <span className="text-[17px] font-semibold text-ink-900">{item.name}</span>
          </div>
          <p className="mt-0.5 text-[15px] leading-snug text-ink-500">{item.description}</p>
        </div>
      </div>

      {/* Col 2: updated time */}
      <div className="whitespace-nowrap pt-0.5 text-right text-[14px] text-ink-400">
        {fmt(updatedAt)}
      </div>

      {/* Col 3: responsible team */}
      <div className="w-[120px] pt-0.5 text-right text-[14px] text-ink-500">
        {item.team}
      </div>
    </div>
  );
}

// ─── Section component ────────────────────────────────────────────────────────

function StatusSection({
  severity,
  items,
  updatedAt,
}: {
  severity: Severity;
  items: StatusItem[];
  updatedAt: Date | null;
}) {
  if (items.length === 0) return null;
  const cfg = SEVERITY_CONFIG[severity];
  const isOk = severity === "ok";
  const displayed = isOk ? items.slice(0, OK_PREVIEW_LIMIT) : items;

  return (
    <section>
      {/* Section header */}
      <div className={`mb-0.5 flex items-center gap-2 border-b pb-2 ${cfg.sectionBorder}`}>
        <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
        <span className={`text-[15px] font-bold uppercase tracking-[0.06em] ${cfg.sectionLabel}`}>
          {cfg.labelUpper}
        </span>
        {isOk && items.length > OK_PREVIEW_LIMIT && (
          <span className="text-[14px] text-ink-400">
            (первые {OK_PREVIEW_LIMIT} из {items.length})
          </span>
        )}
      </div>

      {/* Column header row */}
      <div className="grid grid-cols-[1fr_auto_auto] gap-x-3 pb-1 pt-1.5">
        <span className="text-[14px] font-medium uppercase tracking-[0.04em] text-ink-400">
          Статус / Система
        </span>
        <span className="text-right text-[14px] font-medium uppercase tracking-[0.04em] text-ink-400">
          Обновлено
        </span>
        <span className="w-[120px] text-right text-[14px] font-medium uppercase tracking-[0.04em] text-ink-400">
          Ответственный
        </span>
      </div>

      {/* Rows */}
      <div className="divide-y divide-cardborder">
        {displayed.map((item) => (
          <StatusRow key={item.id} item={item} updatedAt={updatedAt} />
        ))}
      </div>
    </section>
  );
}

// ─── Drawer ───────────────────────────────────────────────────────────────────

interface StatusDrawerProps {
  open: boolean;
  onClose: () => void;
}

export default function StatusDrawer({ open, onClose }: StatusDrawerProps) {
  const { data, sourceUpdatedAt, loading } = useCapacity();
  const [activeTab, setActiveTab] = useState<FilterTab>("all");

  // Escape key handler (unchanged)
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  // Reset filter tab when drawer closes
  useEffect(() => {
    if (!open) setActiveTab("all");
  }, [open]);

  const items = data ? buildStatusItems(data) : [];

  const counts: Record<Severity, number> = {
    critical: items.filter((i) => i.severity === "critical").length,
    warning:  items.filter((i) => i.severity === "warning").length,
    ok:       items.filter((i) => i.severity === "ok").length,
  };

  // Sections visible given the active tab
  const visibleSections: Severity[] =
    activeTab === "all" ? SECTION_ORDER : [activeTab as Severity];

  return (
    <>
      {/* Backdrop (unchanged) */}
      <div
        className={`fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px] transition-opacity duration-300 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
      />

      {/* Panel */}
      <aside
        className={`fixed right-0 top-0 z-50 flex h-full w-[480px] max-w-[95vw] flex-col border-l border-cardborder bg-card shadow-glow transition-transform duration-300 ease-in-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* ── Header ── */}
        <div className="flex shrink-0 items-center justify-between border-b border-cardborder px-5 py-4">
          <div>
            <h2 className="text-[22px] font-bold text-ink-900">Все статусы</h2>
            <p className="mt-0.5 text-[13px] text-ink-500">
              {loading ? "Загрузка…" : `Источник обновлён: ${fmt(sourceUpdatedAt)}`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-500 transition-colors hover:bg-subtle hover:text-ink-900"
            aria-label="Закрыть"
          >
            <X className="h-4 w-4" strokeWidth={2.2} />
          </button>
        </div>

        {/* ── Scrollable body ── */}
        <div className="flex-1 overflow-y-auto">
          {!data ? (
            <div className="flex h-32 items-center justify-center text-[13px] text-ink-400">
              Загрузка данных…
            </div>
          ) : (
            <>
              {/* ── Summary cards ── */}
              <div className="grid grid-cols-3 gap-3 px-5 pb-5 pt-4">
                {SECTION_ORDER.map((sev) => {
                  const cfg = SEVERITY_CONFIG[sev];
                  return (
                    <div
                      key={sev}
                      className={`rounded-xl border px-4 py-5 ${cfg.cardBg} ${cfg.cardBorder}`}
                    >
                      <div className={`text-[44px] font-extrabold leading-none ${cfg.cardCount}`}>
                        {counts[sev]}
                      </div>
                      <div className="mt-3 text-[16px] font-bold text-ink-700">
                        {cfg.label}
                      </div>
                      <div className="mt-1 text-[13px] leading-tight text-ink-400">
                        {cfg.subtitle}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* ── Filter tabs ── */}
              <div className="flex items-center gap-1.5 border-b border-cardborder px-5 pb-3">
                {(
                  [
                    { id: "all" as FilterTab, label: "Все", count: items.length },
                    { id: "critical" as FilterTab, label: "Критично", count: counts.critical },
                    { id: "warning"  as FilterTab, label: "Внимание",  count: counts.warning  },
                    { id: "ok"       as FilterTab, label: "Норма",     count: counts.ok       },
                  ] as { id: FilterTab; label: string; count: number }[]
                ).map((tab) => {
                  const isActive = activeTab === tab.id;
                  const activeCls =
                    tab.id === "all"
                      ? "bg-brand-blue text-white"
                      : SEVERITY_CONFIG[tab.id as Severity].tabActive;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-[14px] font-semibold transition-colors ${
                        isActive
                          ? activeCls
                          : "text-ink-500 hover:bg-subtle hover:text-ink-700"
                      }`}
                    >
                      {tab.label}
                      <span
                        className={`rounded-full px-1.5 py-0.5 text-[13px] font-bold ${
                          isActive ? "bg-white/20 text-white" : "bg-chip text-ink-600"
                        }`}
                      >
                        {tab.count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* ── Status sections ── */}
              <div className="space-y-5 px-5 py-4">
                {visibleSections.map((sev) => (
                  <StatusSection
                    key={sev}
                    severity={sev}
                    items={items.filter((it) => it.severity === sev)}
                    updatedAt={sourceUpdatedAt}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="shrink-0 border-t border-cardborder px-5 py-3">
          <button className="flex w-full items-center justify-center gap-1.5 text-[15px] font-semibold text-brand-blue hover:underline">
            Открыть полный список статусов
            <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.2} />
          </button>
        </div>
      </aside>
    </>
  );
}
