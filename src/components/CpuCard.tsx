import { ArrowRight, CheckCircle2, Cpu } from "lucide-react";
import { Card, CardTitleRow, InnerPanel, StatusDot } from "./primitives";
import LineCPU from "../charts/LineCPU";
import { MiniTrend } from "../charts/Sparklines";
import { useCapacity } from "../context/CapacityContext";

function TempStat({
  value,
  label,
  valueClass = "text-ink-900",
  dot,
}: {
  value: string;
  label: React.ReactNode;
  valueClass?: string;
  dot?: "green" | "orange";
}) {
  const dotBg = dot === "green" ? "bg-dot-success" : "bg-dot-warning";
  return (
    <div>
      <div className={`text-[18px] font-bold leading-none ${valueClass}`}>
        {value}
      </div>
      <div className="mt-1 text-[11px] leading-tight text-ink-500">{label}</div>
      {dot && <span className={`mt-1.5 block h-2 w-2 rounded-full ${dotBg}`} />}
    </div>
  );
}

export default function CpuCard() {
  const { data } = useCapacity();
  const cpu = data?.cpu;

  const tempDot = (temp: number | undefined): "green" | "orange" =>
    temp !== undefined && temp < 65 ? "green" : "orange";

  return (
    <Card className="flex h-full flex-col p-[18px]">
      <CardTitleRow
        icon={Cpu}
        title="Процессоры (CPU)"
        right={<StatusDot color="green" label="Норма" />}
      />

      <div className="mt-4 text-[36px] font-extrabold leading-none text-ink-900">
        {cpu ? `${cpu.avgLoadPct}%` : "—"}
      </div>
      <div className="mt-2 text-[13px] text-ink-500">Средняя загрузка</div>

      <div className="mt-3">
        <LineCPU loadHistory={cpu?.loadHistory ?? []} />
      </div>

      <InnerPanel className="mt-3 px-4 py-3">
        <div className="flex items-start justify-between">
          <div className="flex gap-6">
            <TempStat
              value={cpu ? `${cpu.tempAvgC}°C` : "—"}
              valueClass={cpu && cpu.tempAvgC < 65 ? "text-brand-green" : "text-brand-orange"}
              label="Темп. CPU"
              dot={tempDot(cpu?.tempAvgC)}
            />
            <TempStat
              value={cpu ? `${cpu.tempPeakC}°C` : "—"}
              valueClass={cpu && cpu.tempPeakC < 65 ? "text-brand-green" : "text-brand-orange"}
              label="Пик. темп."
              dot={tempDot(cpu?.tempPeakC)}
            />
            <TempStat
              value={cpu ? String(cpu.criticalEventsToday) : "—"}
              label={
                <>
                  Крит. событий
                  <br />
                  сегодня
                </>
              }
            />
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[13px] font-semibold text-brand-blue">
              Стабильно
            </span>
            <span className="mt-1">
              <MiniTrend values={cpu?.miniTrend} />
            </span>
            <span className="mt-0.5 flex items-center gap-1 text-[12px] text-ink-500">
              Тренд <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
            </span>
          </div>
        </div>
      </InnerPanel>

      <div className="mt-auto pt-3.5">
        <div className="flex items-center gap-4 text-[12px] text-ink-500">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-dot-success" /> &lt; 65°C
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-dot-warning" /> 65–80°C
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-dot-error" /> &gt; 80°C
          </span>
        </div>
        <div className="mt-3 flex items-center gap-1.5 text-[12.5px]">
          <CheckCircle2 className="h-4 w-4 text-brand-green" strokeWidth={2.2} />
          <span className="text-ink-500">Состояние:</span>
          <span className="font-semibold text-brand-green">Норма</span>
        </div>
      </div>
    </Card>
  );
}
