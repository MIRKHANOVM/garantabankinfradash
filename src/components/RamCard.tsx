import { MemoryStick, TrendingUp } from "lucide-react";
import { Card, CardTitleRow, StatTriple, StatusDot } from "./primitives";
import AreaTrend from "../charts/AreaTrend";
import { useChartTokens } from "../theme/useTheme";
import { useCapacity } from "../context/CapacityContext";

export default function RamCard() {
  const c = useChartTokens();
  const { data } = useCapacity();
  const ram = data?.ram;

  const trendSign = ram && ram.weeklyTrendPct >= 0 ? "+" : "";
  const trendVal = ram ? `${trendSign}${ram.weeklyTrendPct}%` : "—";

  return (
    <Card className="flex h-full flex-col p-[18px]">
      <CardTitleRow
        icon={MemoryStick}
        title="Оперативная память (RAM)"
        right={<StatusDot color="green" label="Норма" />}
      />

      <div className="mt-4 flex items-baseline gap-1">
        <span className="text-[36px] font-extrabold leading-none text-ink-900">
          {ram ? ram.usedTb : "—"}
        </span>
        <span className="text-[20px] font-semibold leading-none text-ink-400">
          ТБ
        </span>
      </div>
      <div className="mt-2 text-[13px] text-ink-500">Использовано</div>

      <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-track">
        <div
          className="h-full rounded-full bg-brand-orange transition-all duration-700"
          style={{ width: ram ? `${ram.usagePct}%` : "0%" }}
        />
      </div>
      <div className="mt-2.5 text-[13px]">
        <span className="text-ink-500">Всего </span>
        <span className="font-semibold text-ink-700">
          {ram ? `${ram.totalTb} ТБ` : "—"}
        </span>
      </div>

      <div className="mt-4">
        <StatTriple
          stats={[
            { value: ram ? `${ram.availableTb} ТБ` : "—", label: "Доступно" },
            { value: ram ? `${ram.usagePct}%` : "—", label: "Использование" },
            {
              value: ram ? `+${ram.growthTbPerWeek} ТБ/нед` : "—",
              label: "Прирост",
              valueClass: "text-brand-green",
            },
          ]}
        />
      </div>

      <div className="mt-auto">
        <div className="mb-2 flex items-center gap-2 text-[12.5px]">
          <TrendingUp className="h-4 w-4 text-brand-green" strokeWidth={2.2} />
          <span className="font-semibold text-brand-green">{trendVal}</span>
          <span className="text-ink-500">к прошлой неделе</span>
        </div>
        <AreaTrend color={c.tertiary} height={72} values={ram?.trend} />
      </div>
    </Card>
  );
}
