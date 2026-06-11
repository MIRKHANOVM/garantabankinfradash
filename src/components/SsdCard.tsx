import { HardDrive } from "lucide-react";
import { Card, CardTitleRow, StatTriple, StatusDot } from "./primitives";
import AreaSSD from "../charts/AreaSSD";
import { useCapacity } from "../context/CapacityContext";

export default function SsdCard() {
  const { data } = useCapacity();
  const ssd = data?.ssd;

  return (
    <Card className="flex h-full flex-col p-[18px]">
      <CardTitleRow
        icon={HardDrive}
        title="Емкость SSD"
        right={<StatusDot color="orange" label="Риск емкости" />}
      />

      <div className="mt-4 flex items-baseline gap-1">
        <span className="text-[36px] font-extrabold leading-none text-ink-900">
          {ssd ? ssd.usedTb : "—"}
        </span>
        <span className="text-[22px] font-semibold leading-none text-ink-400">
          / {ssd ? ssd.totalTb : "—"} ТБ
        </span>
      </div>
      <div className="mt-2 text-[13px] text-ink-500">Использовано / Всего</div>

      <div className="mt-3">
        <AreaSSD
          history={ssd?.history ?? []}
          forecast={ssd?.forecast ?? []}
          totalTb={ssd?.totalTb ?? 4}
        />
      </div>

      <div className="mt-3">
        <StatTriple
          stats={[
            {
              value: ssd ? `+${ssd.growthGbPerDay} ГБ/день` : "—",
              label: "Скорость роста",
              valueClass: "text-brand-green",
            },
            { value: ssd ? String(ssd.daysRemaining) : "—", label: "Дней осталось" },
            { value: ssd ? `${ssd.usagePct}%` : "—", label: "Использование" },
          ]}
        />
      </div>

      <div className="mt-auto flex items-center justify-between pt-3.5">
        <StatusDot color="green" label="В норме" />
        <div className="text-[12.5px] text-ink-500">
          Полный:{" "}
          <span className="font-medium text-ink-700">
            {ssd ? ssd.forecastFullDate : "—"}
          </span>
        </div>
      </div>
    </Card>
  );
}
