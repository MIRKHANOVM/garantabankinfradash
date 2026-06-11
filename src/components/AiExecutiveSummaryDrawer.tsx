/**
 * AiExecutiveSummaryDrawer.tsx
 *
 * Executive explanation layer for the KPI bar.
 * Answers: what is happening / why / operational impact / what to do.
 *
 * All narrative text is derived from the same formula and signal priority
 * system used by SummaryStrip (KPI 1) via src/lib/infraStatus.ts.
 * Contradictions between the drawer and the KPI bar are impossible by
 * construction — both call deriveInfraStatus() from the same source.
 *
 * Sections:
 *   1. State card  — InfraStatus headline + primary cause + narrative
 *   2. Actions     — prioritised recommendations from active signals
 *   3. Resources   — per-resource compact cards with mini trends
 *   4. Conclusion  — state-matched closing paragraph
 */

import { useEffect } from "react";
import {
  CheckCircle2,
  Cpu,
  HardDrive,
  MemoryStick,
  TriangleAlert,
  X,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { useCapacity } from "../context/CapacityContext";
import { useTheme } from "../theme/useTheme";
import { InnerPanel } from "./primitives";
import AreaTrend from "../charts/AreaTrend";
import type { CapacityData } from "../services/grafanaApi";
import {
  deriveInfraStatus,
  identifySignals,
  type InfraStatus,
  type InfraSignal,
} from "../lib/infraStatus";

// ─── Narrative builders ───────────────────────────────────────────────────────
// Each builder receives the InfraStatus (guaranteed consistent with KPI 1)
// and the sorted signal list. Text is templated per state — no free-form
// generation that could accidentally contradict the status label.

function buildHeadline(status: InfraStatus, primary: InfraSignal | null): string {
  if (status === "Отлично") return "Инфраструктура работает штатно";
  if (status === "Критично") {
    return primary
      ? `Критично: ${primary.label}`
      : "Обнаружены критические показатели";
  }
  // Внимание
  return primary
    ? `Требует наблюдения: ${primary.label}`
    : "Требует наблюдения";
}

function buildNarrative(
  status: InfraStatus,
  signals: InfraSignal[],
  data: CapacityData
): string {
  if (status === "Отлично") {
    return (
      `Все ключевые операционные показатели в пределах нормы. ` +
      `Доступность серверов: ${data.servers.availabilityPct}%, ` +
      `загрузка CPU: ${data.cpu.avgLoadPct}%, ` +
      `недоступных хостов: ${data.hosts.unavailable} из ${data.hosts.total}. ` +
      `Операционных рисков не выявлено.`
    );
  }

  const criticalSignals = signals.filter(s => s.level === "critical");
  const warningSignals  = signals.filter(s => s.level === "warning");
  const primary = signals[0] ?? null;

  if (status === "Критично") {
    const causeText = criticalSignals.map(s => s.description).join(" ");
    const secondaryText = warningSignals.length > 0
      ? ` Дополнительно: ${warningSignals.map(s => s.label.toLowerCase()).join(", ")}.`
      : "";
    return (
      `Обнаружены критические показатели, способные повлиять на доступность сервисов. ` +
      causeText +
      secondaryText
    );
  }

  // Внимание — must always name the primary cause
  const primaryText = primary?.description ?? "";
  const secondaryLabels = signals.slice(1).map(s => s.label.toLowerCase());
  const secondaryText = secondaryLabels.length > 0
    ? ` Также требует внимания: ${secondaryLabels.join(", ")}.`
    : "";
  return (
    `Обнаружены признаки отклонения от нормы. ` +
    primaryText +
    secondaryText
  );
}

function buildActions(
  signals: InfraSignal[],
  data: CapacityData
): { text: string; level: "critical" | "warning" | "low" }[] {
  const actions: { text: string; level: "critical" | "warning" | "low" }[] = [];

  for (const s of signals) {
    if (s.key === "server_avail_critical") {
      actions.push({ text: `Срочно проверить состояние серверов — доступность ${data.servers.availabilityPct}%`, level: "critical" });
    }
    if (s.key === "host_avail_critical") {
      actions.push({ text: `Выявить причину недоступности ${data.hosts.unavailable} хостов и восстановить их работу`, level: "critical" });
    }
    if (s.key === "cpu_critical") {
      actions.push({ text: `Немедленно выявить процессы с высокой нагрузкой CPU (${data.cpu.avgLoadPct}%)`, level: "critical" });
    }
    if (s.key === "cpu_warning") {
      actions.push({ text: `Контролировать загрузку CPU (${data.cpu.avgLoadPct}%) — запланировать оптимизацию`, level: "warning" });
    }
    if (s.key === "server_avail_warning") {
      actions.push({ text: `Проверить состояние серверов — доступность ${data.servers.availabilityPct}% ниже целевого`, level: "warning" });
    }
    if (s.key === "host_warning") {
      actions.push({ text: `Проверить ${data.hosts.unavailable} недоступных хостов`, level: "warning" });
    }
    if (s.key === "ssd_capacity") {
      const addTb = Math.max(0.1, Math.ceil((data.ssd.usedTb / 0.60 - data.ssd.totalTb) * 10) / 10);
      actions.push({
        text: `Добавить ${addTb} ТБ SSD — до исчерпания ёмкости осталось ${data.ssd.daysRemaining} дн.`,
        level: s.level === "critical" ? "critical" : "warning",
      });
    }
    if (s.key === "ram_capacity") {
      actions.push({ text: `Проверить использование RAM (${data.ram.usagePct}%) — выявить процессы с утечками`, level: "warning" });
    }
  }

  // Universal baseline action — always last
  actions.push({ text: "Убедиться, что оповещения настроены для всех ключевых метрик", level: "low" });

  return actions.slice(0, 5);
}

function buildConclusion(status: InfraStatus, signals: InfraSignal[], data: CapacityData): string {
  if (status === "Отлично") {
    return (
      `Инфраструктура находится в стабильном состоянии. ` +
      `Доступность: ${data.servers.availabilityPct}%, CPU: ${data.cpu.avgLoadPct}%, ` +
      `SSD: ${data.ssd.usagePct}%, RAM: ${data.ram.usagePct}%. ` +
      `Немедленных действий не требуется.`
    );
  }
  if (status === "Критично") {
    return (
      `Инфраструктура требует немедленного вмешательства. ` +
      `Выявлено ${signals.filter(s => s.level === "critical").length} критических показателя. ` +
      `Рекомендуется принять меры в течение ближайших часов.`
    );
  }
  const primary = signals[0];
  return (
    `Инфраструктура требует наблюдения. ` +
    (primary ? `Приоритетный сигнал: ${primary.label.toLowerCase()}. ` : "") +
    `Немедленных критических действий не требуется, однако рекомендуется устранить выявленные отклонения.`
  );
}

// ─── UI config ────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  InfraStatus,
  {
    cardBg: string;
    badgeBg: string;
    badgeText: string;
    dotClass: string;
    Icon: LucideIcon;
    iconColor: string;
    badgeLabel: string;
  }
> = {
  "Отлично": {
    cardBg:    "bg-brand-green/5",
    badgeBg:   "bg-brand-green/10",
    badgeText: "text-brand-green",
    dotClass:  "bg-dot-success",
    Icon:      CheckCircle2,
    iconColor: "text-brand-green",
    badgeLabel: "Отлично",
  },
  "Внимание": {
    cardBg:    "bg-brand-orange/5",
    badgeBg:   "bg-brand-orange/10",
    badgeText: "text-brand-orange",
    dotClass:  "bg-dot-warning",
    Icon:      TriangleAlert,
    iconColor: "text-brand-orange",
    badgeLabel: "Внимание",
  },
  "Критично": {
    cardBg:    "bg-brand-red/5",
    badgeBg:   "bg-brand-red/10",
    badgeText: "text-brand-red",
    dotClass:  "bg-dot-error",
    Icon:      XCircle,
    iconColor: "text-brand-red",
    badgeLabel: "Критично",
  },
};

const ACTION_ICON: Record<"critical" | "warning" | "low", LucideIcon> = {
  critical: XCircle,
  warning:  TriangleAlert,
  low:      CheckCircle2,
};
const ACTION_COLOR: Record<"critical" | "warning" | "low", string> = {
  critical: "text-brand-red",
  warning:  "text-brand-orange",
  low:      "text-brand-green",
};

// Resource risk level (local — for resource cards only, does not affect KPI 1)
type ResourceLevel = "low" | "medium" | "high";
function resourceLevel(pct: number, warnThreshold = 75, critThreshold = 90): ResourceLevel {
  if (pct > critThreshold) return "high";
  if (pct > warnThreshold) return "medium";
  return "low";
}
const RESOURCE_BADGE: Record<ResourceLevel, { bg: string; text: string; label: string }> = {
  high:   { bg: "bg-brand-red/10",    text: "text-brand-red",    label: "Высокий" },
  medium: { bg: "bg-brand-orange/10", text: "text-brand-orange", label: "Средний" },
  low:    { bg: "bg-brand-green/10",  text: "text-brand-green",  label: "Низкий"  },
};

function ResourceBadge({ level }: { level: ResourceLevel }) {
  const cfg = RESOURCE_BADGE[level];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[13px] font-bold ${cfg.bg} ${cfg.text}`}>
      {cfg.label}
    </span>
  );
}

function ResourceCard({
  icon: Icon, title, level, metric, metricLabel, trendValues, trendColor,
}: {
  icon: LucideIcon; title: string; level: ResourceLevel;
  metric: string; metricLabel: string; trendValues?: number[]; trendColor: string;
}) {
  return (
    <InnerPanel className="flex flex-col gap-3 px-4 py-3.5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-chip">
            <Icon className="h-[14px] w-[14px] text-ink-700" strokeWidth={2} />
          </span>
          <span className="text-[13px] font-semibold text-ink-700">{title}</span>
        </div>
        <ResourceBadge level={level} />
      </div>
      <div className="flex items-end justify-between gap-3">
        <div>
          <div className="text-[22px] font-extrabold leading-none text-ink-900">{metric}</div>
          <div className="mt-1 text-[12px] text-ink-500">{metricLabel}</div>
        </div>
        <div className="w-[80px] shrink-0">
          <AreaTrend color={trendColor} values={trendValues} height={36} strokeWidth={1.5} />
        </div>
      </div>
    </InnerPanel>
  );
}

// ─── Drawer ───────────────────────────────────────────────────────────────────

export interface AiExecutiveSummaryDrawerProps {
  open: boolean;
  onClose: () => void;
}

export default function AiExecutiveSummaryDrawer({ open, onClose }: AiExecutiveSummaryDrawerProps) {
  const { data, loading, sourceUpdatedAt } = useCapacity();
  const { theme } = useTheme();

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // Derive all state from the shared utility — same formula as KPI 1
  const status: InfraStatus = data
    ? deriveInfraStatus(
        data.servers.availabilityPct,
        data.hosts.unavailable,
        data.hosts.total,
        data.cpu.avgLoadPct
      )
    : "Отлично";

  const signals: InfraSignal[] = data ? identifySignals(data) : [];
  const primary = signals[0] ?? null;
  const statusCfg = STATUS_CONFIG[status];

  const headline      = data ? buildHeadline(status, primary)                  : "—";
  const narrative     = data ? buildNarrative(status, signals, data)            : null;
  const actions       = data ? buildActions(signals, data)                      : [];
  const conclusion    = data ? buildConclusion(status, signals, data)           : null;

  function fmtTime(d: Date | null): string {
    if (!d) return "—";
    return d.toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px] transition-opacity duration-300 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
      />

      {/* Panel */}
      <aside
        className={`fixed right-0 top-0 z-50 flex h-full w-[500px] max-w-[95vw] flex-col border-l border-cardborder bg-card shadow-glow transition-transform duration-300 ease-in-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* ── Header ── */}
        <div className="flex shrink-0 items-center justify-between border-b border-cardborder px-5 py-4">
          <div>
            <h2 className="text-[17px] font-bold text-ink-900">AI Executive Summary</h2>
            <p className="mt-0.5 text-[13px] text-ink-500">
              {loading ? "Загрузка…" : `Сформировано из текущих метрик · ${fmtTime(sourceUpdatedAt)}`}
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
        <div className="flex-1 overflow-y-auto px-5 py-5">
          {!data ? (
            <div className="flex h-32 items-center justify-center text-[13px] text-ink-400">
              Загрузка данных…
            </div>
          ) : (
            <div className="space-y-5">

              {/* ── Section 1: State card ── */}
              <section>
                <div
                  className={`rounded-xl border px-6 py-8 ${statusCfg.cardBg}`}
                  style={{ borderColor: "var(--border-subtle)" }}
                >
                  {/* Headline + badge */}
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="text-[24px] font-extrabold leading-tight text-ink-900">
                      {headline}
                    </h3>
                    <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-4 py-1.5 text-[14px] font-bold ${statusCfg.badgeBg} ${statusCfg.badgeText}`}>
                      <span className={`h-2.5 w-2.5 rounded-full ${statusCfg.dotClass}`} />
                      {statusCfg.badgeLabel}
                    </span>
                  </div>
                  {/* Narrative */}
                  <p className="mt-5 text-[15px] leading-relaxed text-ink-600">
                    {narrative}
                  </p>
                </div>
              </section>

              {/* ── Section 2: Actions ── */}
              <section>
                <h4 className="mb-3 text-[12px] font-bold uppercase tracking-[0.06em] text-ink-500">
                  Рекомендуемые действия
                </h4>
                <InnerPanel className="px-4 py-4">
                  <ul className="space-y-3">
                    {actions.map((action, i) => {
                      const Icon  = ACTION_ICON[action.level];
                      const color = ACTION_COLOR[action.level];
                      return (
                        <li key={i} className="flex items-start gap-3">
                          <Icon className={`mt-0.5 h-[16px] w-[16px] shrink-0 ${color}`} strokeWidth={2.2} />
                          <span className="text-[14px] leading-snug text-ink-700">{action.text}</span>
                        </li>
                      );
                    })}
                  </ul>
                </InnerPanel>
              </section>

              {/* ── Section 3: Resource detail ── */}
              <section>
                <h4 className="mb-3 text-[12px] font-bold uppercase tracking-[0.06em] text-ink-500">
                  Ресурсы
                </h4>
                <div className="space-y-2.5">
                  <ResourceCard
                    icon={HardDrive}
                    title="SSD-хранилище"
                    level={resourceLevel(data.ssd.usagePct)}
                    metric={`${data.ssd.usagePct}%`}
                    metricLabel={`${data.ssd.usedTb} ТБ из ${data.ssd.totalTb} ТБ · ${data.ssd.daysRemaining} дн. до лимита`}
                    trendValues={data.ssd.history}
                    trendColor={theme.chart.secondary}
                  />
                  <ResourceCard
                    icon={MemoryStick}
                    title="Оперативная память"
                    level={resourceLevel(data.ram.usagePct)}
                    metric={`${data.ram.usagePct}%`}
                    metricLabel={`${data.ram.usedTb} ТБ из ${data.ram.totalTb} ТБ · ${data.ram.availableTb} ТБ свободно`}
                    trendValues={data.ram.trend}
                    trendColor={theme.chart.tertiary}
                  />
                  <ResourceCard
                    icon={Cpu}
                    title="Процессоры (CPU)"
                    level={resourceLevel(data.cpu.avgLoadPct, 70, 85)}
                    metric={`${data.cpu.avgLoadPct}%`}
                    metricLabel={`Средняя загрузка · ${data.cpu.tempAvgC}°C · пик ${data.cpu.tempPeakC}°C`}
                    trendValues={data.cpu.miniTrend}
                    trendColor={theme.chart.primary}
                  />
                </div>
              </section>

              {/* ── Section 4: Conclusion ── */}
              <section>
                <h4 className="mb-3 text-[12px] font-bold uppercase tracking-[0.06em] text-ink-500">
                  Заключение
                </h4>
                <InnerPanel className="px-4 py-4">
                  <p className="text-[14px] leading-relaxed text-ink-600">{conclusion}</p>
                </InnerPanel>
              </section>

            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="shrink-0 border-t border-cardborder px-5 py-3">
          <p className="text-center text-[12px] text-ink-400">
            Анализ основан на данных мониторинга Mock Grafana · не является финансовым советом
          </p>
        </div>
      </aside>
    </>
  );
}
