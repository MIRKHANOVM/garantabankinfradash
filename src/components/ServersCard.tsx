import { Server, ShieldCheck } from "lucide-react";
import { Card, CardTitleRow, Divider, InnerPanel, StatusDot } from "./primitives";
import { useCapacity } from "../context/CapacityContext";

function Stat({
  value,
  label,
  sub,
  valueClass = "text-ink-900",
}: {
  value: string;
  label: string;
  sub?: string;
  valueClass?: string;
}) {
  return (
    <div>
      <div className={`text-[22px] font-bold leading-none ${valueClass}`}>
        {value}
      </div>
      <div className="mt-1.5 text-[12.5px] leading-tight text-ink-500">
        {label}
      </div>
      {sub && (
        <div className="mt-0.5 text-[12.5px] leading-tight text-ink-500">
          {sub}
        </div>
      )}
    </div>
  );
}

export default function ServersCard() {
  const { data } = useCapacity();
  const s = data?.servers;

  const physPct = s ? Math.round((s.physical / s.total) * 100) : 0;
  const virtPct = s ? Math.round((s.virtual / s.total) * 100) : 0;
  const trendSign = s && s.availabilityTrendPct >= 0 ? "+" : "";
  const trendVal = s ? `${trendSign}${Math.round(s.availabilityTrendPct * 10) / 10}%` : "—";

  return (
    <Card className="flex h-full flex-col p-[18px]">
      <CardTitleRow
        icon={Server}
        title="Серверы"
        right={<StatusDot color="green" label="Норма" />}
      />

      <div className="mt-4">
        <div className="text-[36px] font-extrabold leading-none text-ink-900">
          {s ? s.total : "—"}
        </div>
        <div className="mt-1.5 text-[13px] text-ink-500">Всего серверов</div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-y-4">
        <Stat
          value={s ? String(s.physical) : "—"}
          valueClass="text-brand-blue"
          label="Физических"
          sub={s ? `${physPct}%` : undefined}
        />
        <Stat
          value={s ? String(s.virtual) : "—"}
          label="Виртуальных"
          sub={s ? `${virtPct}%` : undefined}
        />
        <div className="col-span-2 py-0.5">
          <Divider />
        </div>
        <Stat value={s ? String(s.active) : "—"} valueClass="text-brand-green" label="Активных" />
        <Stat value={s ? String(s.maintenance) : "—"} valueClass="text-brand-orange" label="На обслуживании" />
      </div>

      <InnerPanel className="mt-auto px-4 py-3.5">
        <div className="text-[12.5px] text-ink-500">Доступность</div>
        <div className="mt-1 flex items-center gap-2">
          <span className="text-[26px] font-extrabold leading-none text-brand-blue">
            {s ? `${s.availabilityPct}%` : "—"}
          </span>
          <ShieldCheck className="h-5 w-5 text-brand-green" strokeWidth={2} />
        </div>
        <div className="mt-1.5 flex items-center gap-1.5 text-[12.5px]">
          <span className="font-semibold text-brand-green">↑ {trendVal}</span>
          <span className="text-ink-500">к прошлому месяцу</span>
        </div>
      </InnerPanel>
    </Card>
  );
}
