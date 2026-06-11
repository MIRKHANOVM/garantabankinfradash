import { Monitor, RefreshCw } from "lucide-react";
import { Card, CardTitleRow, InnerPanel, StatusDot } from "./primitives";
import { BarReboots } from "../charts/Sparklines";
import { useCapacity } from "../context/CapacityContext";

export default function HostsCard() {
  const { data } = useCapacity();
  const h = data?.hosts;

  const trendSign = h && h.rebootsTrendPct <= 0 ? "" : "+";
  const trendVal = h ? `${trendSign}${h.rebootsTrendPct}%` : "—";
  const trendColor = h && h.rebootsTrendPct <= 0 ? "text-brand-green" : "text-brand-red";

  return (
    <Card className="flex h-full flex-col p-[18px]">
      <CardTitleRow
        icon={Monitor}
        title="Хосты и сервисы"
        right={<StatusDot color="orange" label="Внимание" />}
      />

      <div className="mt-4">
        <div className="text-[36px] font-extrabold leading-none text-ink-900">
          {h ? h.total : "—"}
        </div>
        <div className="mt-1.5 text-[13px] text-ink-500">Всего хостов</div>
      </div>

      <div className="mt-5 grid grid-cols-2">
        <div>
          <div className="text-[22px] font-bold leading-none text-brand-green">
            {h ? h.active : "—"}
          </div>
          <div className="mt-1.5 text-[12.5px] text-ink-500">Активных</div>
        </div>
        <div>
          <div className="text-[22px] font-bold leading-none text-brand-red">
            {h ? h.unavailable : "—"}
          </div>
          <div className="mt-1.5 text-[12.5px] text-ink-500">Недоступно</div>
        </div>
      </div>

      <InnerPanel className="mt-auto px-4 py-3.5">
        <div className="text-[12px] font-semibold uppercase tracking-[0.03em] text-ink-700">
          Перезагрузки хостов
        </div>

        <div className="mt-3 flex items-end justify-between">
          <div>
            <div className="flex items-center gap-2">
              <RefreshCw className="h-[18px] w-[18px] text-brand-blue" strokeWidth={2.2} />
              <span className="text-[24px] font-extrabold leading-none text-ink-900">
                {h ? h.reboots24h : "—"}
              </span>
            </div>
            <div className="mt-2 text-[12px] text-ink-500">
              за последние 24 часа
            </div>
          </div>
          <div className="pb-0.5">
            <BarReboots values={h?.rebootHistory} />
          </div>
        </div>

        <div className="mt-3 flex items-end justify-between">
          <div className="text-[12.5px] font-medium leading-snug text-brand-blue">
            <div>В среднем: {h ? h.rebootsAvgPerDay : "—"} в сутки</div>
            <div>за последние 7 дней</div>
          </div>
          <div className={`text-[14px] font-bold ${trendColor}`}>{trendVal}</div>
        </div>
      </InnerPanel>
    </Card>
  );
}
