import { BarChart3, MapPin, ShieldCheck } from "lucide-react";
import { Card, CardTitleRow, IconChip } from "./primitives";

interface BranchRow {
  branch: string;
  sla: string;
  slaColor: string;
  worst: string;
}

const ROWS: BranchRow[] = [
  { branch: "Филиал 1", sla: "95%", slaColor: "text-brand-red", worst: "10:00 – 12:00" },
  { branch: "Филиал 2", sla: "99.2%", slaColor: "text-brand-green", worst: "08:45 – 09:10" },
  { branch: "Филиал 3", sla: "98.9%", slaColor: "text-brand-green", worst: "14:00 – 14:15" },
  { branch: "Филиал 4", sla: "98.9%", slaColor: "text-brand-green", worst: "11:20 – 11:40" },
];

export default function SlaPanel() {
  return (
    <Card className="h-full p-[18px]">
      <CardTitleRow icon={ShieldCheck} title="Стабильность SLA" />

      <div className="mt-5 flex gap-8">
        {/* left stat column */}
        <div className="flex w-[170px] shrink-0 flex-col gap-5">
          <div>
            <div className="text-[30px] font-extrabold leading-none text-brand-green">
              99.9%
            </div>
            <div className="mt-1.5 text-[13px] text-ink-500">Общий SLA</div>
          </div>

          <div className="flex items-center gap-3">
            <IconChip icon={BarChart3} className="text-ink-500" />
            <div>
              <div className="text-[12px] leading-tight text-ink-500">
                Целевой SLA
              </div>
              <div className="text-[15px] font-bold text-ink-800">99.9%</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <IconChip icon={MapPin} className="text-ink-500" />
            <div>
              <div className="text-[12px] leading-tight text-ink-500">
                Филиалов под
                <br />
                мониторингом
              </div>
              <div className="text-[15px] font-bold text-ink-800">35</div>
            </div>
          </div>
        </div>

        {/* table */}
        <div className="min-w-0 flex-1">
          <div className="grid grid-cols-[1fr_0.9fr_1.2fr] gap-x-4 pb-2.5 text-[11.5px] font-semibold uppercase tracking-[0.03em] text-ink-400">
            <span>Филиал</span>
            <span>SLA сейчас</span>
            <span>Худшее значение</span>
          </div>

          {ROWS.map((r) => (
            <div
              key={r.branch}
              className="grid grid-cols-[1fr_0.9fr_1.2fr] items-center gap-x-4 border-t border-divider py-3.5"
            >
              <span className="text-[14px] font-semibold uppercase tracking-wide text-ink-800">
                {r.branch}
              </span>
              <span className={`text-[14px] font-bold ${r.slaColor}`}>
                {r.sla}
              </span>
              <span className="text-[14px] font-semibold text-ink-800">
                {r.worst}
              </span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
