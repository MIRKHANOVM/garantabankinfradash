/**
 * AiForecastPanel.tsx
 *
 * Dynamic fields wired to CapacityContext:
 *
 *   Col 1 — SSD risk:
 *     daysRemaining  = ssd.daysRemaining  (direct)
 *     ssdTrendChart  = ssd.history        (direct — replaces GREEN_TREND)
 *
 *   Col 4 — Recommendation:
 *     recommendTb    = ceil((ssd.usedTb / 0.60 − ssd.totalTb) × 10) / 10
 *                      floored at 0.1 TB
 *                      "Add enough storage to bring utilisation to 60%"
 *                      → baseline: ceil((2.9/0.60 − 3.8) × 10) / 10 = 1.1 TB
 *
 * Still static (missing JSON fields — deferred):
 *   Col 2 — ORANGE_TREND chart, "45 дней" cluster label
 *
 * "Подробнее" opens AiExecutiveSummaryDrawer.
 */

import { useState } from "react";
import {
  ArrowRight,
  Brain,
  CheckCircle2,
  Info,
  TriangleAlert,
} from "lucide-react";
import { Card, CardTitleRow, CTA_CLASSES } from "./primitives";
import AreaTrend from "../charts/AreaTrend";
import { useTheme } from "../theme/useTheme";
import { useCapacity } from "../context/CapacityContext";
import AiExecutiveSummaryDrawer from "./AiExecutiveSummaryDrawer";

// Col 2 cluster trend — deferred until ai.clusterTrend added to data model.
const ORANGE_TREND = [18, 22, 20, 28, 33, 30, 39, 44, 41, 52, 58, 53, 64, 72, 67];

export default function AiForecastPanel() {
  const { theme } = useTheme();
  const { data } = useCapacity();
  const [summaryOpen, setSummaryOpen] = useState(false);

  // Col 1: days until SSD capacity limit
  const daysRemaining = data?.ssd.daysRemaining ?? 29;

  // Col 1: SSD usage history series → drives the area trend chart
  const ssdHistory = data?.ssd.history;

  // Col 4: how much SSD to add to bring utilisation down to 60%
  //   formula: ceil((usedTb / 0.60 − totalTb) × 10) / 10, min 0.1 TB
  const recommendTb = data
    ? Math.max(0.1, Math.ceil((data.ssd.usedTb / 0.60 - data.ssd.totalTb) * 10) / 10)
    : 1.0;

  return (
    <>
      <Card className="h-full p-[18px]">
        <CardTitleRow icon={Brain} title="AI Прогноз" />

        <div className="mt-5 grid grid-cols-4">
          {/* Col 1 — SSD risk */}
          <div className="flex h-full flex-col pr-5">
            <div className="flex items-center gap-2.5">
              <TriangleAlert
                className="h-[22px] w-[22px] shrink-0 text-white"
                fill={theme.status.error}
                strokeWidth={2}
              />
              <span className="text-[14px] font-bold leading-tight text-ink-800">
                Риск емкости SSD
              </span>
            </div>
            <p className="mt-3.5 text-[13px] leading-[1.5] text-ink-500">
              Емкость достигнет лимита
              <br />
              через <span className="font-semibold text-brand-orange">{daysRemaining}</span> дней
            </p>
            <div className="mt-auto pt-4">
              <AreaTrend color={theme.chart.secondary} values={ssdHistory} height={82} />
            </div>
          </div>

          {/* Col 2 — Cluster expansion (static until ai.clusterTrend added) */}
          <div className="flex h-full flex-col border-l border-divider px-5">
            <div className="flex items-center gap-2.5">
              <TriangleAlert
                className="h-[22px] w-[22px] shrink-0 text-white"
                fill={theme.status.warning}
                strokeWidth={2}
              />
              <span className="text-[14px] font-bold leading-tight text-ink-800">
                Расширение кластера
              </span>
            </div>
            <p className="mt-3.5 text-[13px] leading-[1.5] text-ink-500">
              Ресурсы Kubernetes
              <br />
              будут ограничены
              <br />
              через <span className="font-semibold text-brand-orange">45</span> дней
            </p>
            <div className="mt-auto pt-4">
              <AreaTrend color={theme.chart.tertiary} values={ORANGE_TREND} height={82} />
            </div>
          </div>

          {/* Col 3 — SLA impact */}
          <div className="flex h-full flex-col border-l border-divider px-5">
            <div className="flex items-center gap-2.5">
              <CheckCircle2
                className="h-[22px] w-[22px] shrink-0 text-white"
                fill={theme.status.success}
                strokeWidth={2}
              />
              <span className="text-[14px] font-bold leading-tight text-ink-800">
                Влияние на SLA
              </span>
            </div>
            <p className="mt-3.5 text-[13px] leading-[1.5] text-ink-500">
              Существенной деградации
              <br />
              SLA не ожидается
            </p>
            <div className="mt-auto pt-4">
              <span className="text-[13px] font-bold uppercase tracking-[0.04em] text-brand-green">
                Низкий риск
              </span>
            </div>
          </div>

          {/* Col 4 — Recommendation */}
          <div className="flex h-full flex-col border-l border-divider pl-5">
            <div className="flex items-center gap-2.5">
              <Info
                className="h-[22px] w-[22px] shrink-0 text-white"
                fill={theme.status.info}
                strokeWidth={2}
              />
              <span className="text-[14px] font-bold leading-tight text-ink-800">
                Рекомендация
              </span>
            </div>
            <p className="mt-3.5 text-[13px] leading-[1.5] text-ink-500">
              Добавить{" "}
              <span className="font-semibold text-brand-red">{recommendTb} ТБ</span> SSD
              <br />в течение 3 недель
            </p>
            <div className="mt-auto pt-4">
              <button
                onClick={() => setSummaryOpen(true)}
                className={CTA_CLASSES}
              >
                Подробнее
                <ArrowRight className="h-4 w-4" strokeWidth={2.2} />
              </button>
            </div>
          </div>
        </div>
      </Card>

      <AiExecutiveSummaryDrawer
        open={summaryOpen}
        onClose={() => setSummaryOpen(false)}
      />
    </>
  );
}
