import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

/* ---------------------------------------------------------------- Card */
export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-[14px] border border-cardborder bg-card shadow-card ${className}`}
    >
      {children}
    </div>
  );
}

/* ------------------------------------------------------------ IconChip */
export function IconChip({
  icon: Icon,
  className = "text-ink-700",
}: {
  icon: LucideIcon;
  className?: string;
}) {
  return (
    <span className="flex h-[30px] w-[30px] items-center justify-center rounded-lg bg-chip">
      <Icon className={`h-4 w-4 ${className}`} strokeWidth={2} />
    </span>
  );
}

/* ------------------------------------------------------------ StatusDot */
type DotColor = "green" | "orange" | "red" | "blue";
const DOT_BG: Record<DotColor, string> = {
  green: "bg-dot-success",
  orange: "bg-dot-warning",
  red: "bg-dot-error",
  blue: "bg-dot-info",
};

export function StatusDot({
  color,
  label,
  labelClass = "text-ink-500",
}: {
  color: DotColor;
  label: string;
  labelClass?: string;
}) {
  return (
    <span className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap">
      <span className={`h-2 w-2 rounded-full ${DOT_BG[color]}`} />
      <span className={`text-[11px] font-medium ${labelClass}`}>{label}</span>
    </span>
  );
}

/* --------------------------------------------------------- CardTitleRow */
export function CardTitleRow({
  icon,
  title,
  right,
}: {
  icon: LucideIcon;
  title: string;
  right?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-1.5">
      <div className="flex min-w-0 items-center gap-2">
        <IconChip icon={icon} />
        <span className="whitespace-nowrap text-[10.5px] font-semibold uppercase tracking-[0.02em] text-ink-700">
          {title}
        </span>
      </div>
      {right}
    </div>
  );
}

/* ----------------------------------------------------------- InnerPanel */
export function InnerPanel({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-xl bg-subtle ${className}`}>{children}</div>
  );
}

/* ------------------------------------------------------------- Divider */
export function Divider({ className = "" }: { className?: string }) {
  return <div className={`h-px w-full bg-divider ${className}`} />;
}

/* ----------------------------------------------------------- StatTriple */
export interface TripleStat {
  value: string;
  label: string;
  valueClass?: string;
  dot?: DotColor;
}

export function StatTriple({ stats }: { stats: TripleStat[] }) {
  return (
    <InnerPanel className="px-3 py-3">
      <div className="flex items-stretch">
        {stats.map((s, i) => (
          <div
            key={s.label}
            className={`flex-1 px-2.5 ${
              i !== stats.length - 1 ? "border-r border-divider" : ""
            } ${i === 0 ? "pl-1" : ""}`}
          >
            <div
              className={`text-[13.5px] font-bold leading-tight ${
                s.valueClass ?? "text-ink-800"
              }`}
            >
              {s.value}
            </div>
            <div className="mt-0.5 flex items-center gap-1 text-[11px] leading-tight text-ink-500">
              {s.dot && (
                <span className={`h-1.5 w-1.5 rounded-full ${DOT_BG[s.dot]}`} />
              )}
              {s.label}
            </div>
          </div>
        ))}
      </div>
    </InnerPanel>
  );
}

/* ---------------------------------------------------------------- CtaLink
   Shared style token for all dashboard call-to-action text links.
   "Все статусы" (SummaryStrip) and "Подробнее" (AiForecastPanel) both use
   this constant so they remain typographically identical.

   To update both CTAs at once: change CTA_CLASSES here only.            */
export const CTA_CLASSES =
  "inline-flex items-center gap-1 text-[15px] font-semibold leading-none " +
  "text-brand-blue hover:underline";
