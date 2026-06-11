import { useState, useEffect, useRef } from "react";
import { ChevronDown, RefreshCw } from "lucide-react";
import { useTheme } from "../theme/useTheme";
import { useCapacity } from "../context/CapacityContext";
import { getLatestSnapshotAt, ENGINE_INTERVAL_MS } from "../mock/grafanaEngine";
import type { ThemeName } from "../theme/theme";

function fmt(date: Date | null): string {
  if (!date) return "—";
  return date.toLocaleTimeString("ru", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function SourceClock() {
  const [sourceAt, setSourceAt] = useState<Date>(getLatestSnapshotAt);
  useEffect(() => {
    const id = setInterval(() => setSourceAt(getLatestSnapshotAt()), 1_000);
    return () => clearInterval(id);
  }, []);
  return <span className="font-medium text-ink-700">{fmt(sourceAt)}</span>;
}

// ─── Theme picker ─────────────────────────────────────────────────────────────

const THEME_OPTIONS: { value: ThemeName; label: string; dot: string }[] = [
  { value: "light",      label: "Светлая",         dot: "bg-amber-400"  },
  { value: "dark",       label: "Тёмная",           dot: "bg-slate-600"  },
  { value: "exec-light", label: "Executive Light",  dot: "bg-blue-400"   },
  { value: "exec-dark",  label: "Executive Dark",   dot: "bg-slate-400"  },
];

function ThemePicker() {
  const { themeName, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open]);

  const active = THEME_OPTIONS.find((o) => o.value === themeName) ?? THEME_OPTIONS[0];

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-9 items-center gap-2 rounded-[10px] border border-cardborder bg-card px-3 text-[13px] font-medium text-ink-700 transition-colors hover:bg-subtle"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={`h-2.5 w-2.5 rounded-full ${active.dot}`} />
        {active.label}
        <ChevronDown
          className={`h-3.5 w-3.5 text-ink-500 transition-transform ${open ? "rotate-180" : ""}`}
          strokeWidth={2.2}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+6px)] z-50 w-[180px] overflow-hidden rounded-[10px] border border-cardborder bg-card shadow-glow">
          {THEME_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              role="option"
              aria-selected={themeName === opt.value}
              onClick={() => { setTheme(opt.value); setOpen(false); }}
              className={`flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-[13px] transition-colors hover:bg-subtle ${
                themeName === opt.value
                  ? "font-semibold text-brand-blue"
                  : "font-medium text-ink-700"
              }`}
            >
              <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${opt.dot}`} />
              {opt.label}
              {themeName === opt.value && (
                <span className="ml-auto text-[10px] font-bold uppercase tracking-wide text-brand-blue">
                  ✓
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Header ───────────────────────────────────────────────────────────────────

export default function Header() {
  const [mode, setMode] = useState<"op" | "forecast">("op");
  const { refresh, loading, dashboardRefreshedAt, data } = useCapacity();

  return (
    <header className="flex flex-col gap-2">
      {/* ── Main row ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h1 className="text-[26px] font-extrabold leading-none tracking-[-0.01em] text-ink-900">
            Инфраструктура - Операционная аналитика
          </h1>
          <a href="#" className="text-[14px] font-medium text-brand-blue hover:underline">
            Что происходит сейчас?
          </a>
        </div>

        <div className="flex items-center gap-3">
          <ThemePicker />

          <div className="flex items-center rounded-[10px] border border-cardborder bg-card p-[3px]">
            <button
              onClick={() => setMode("op")}
              className={`rounded-[7px] px-3.5 py-1.5 text-[13px] font-semibold transition-colors ${
                mode === "op" ? "bg-brand-blue text-white" : "text-ink-500 hover:text-ink-700"
              }`}
            >
              Операционный
            </button>
            <button
              onClick={() => setMode("forecast")}
              className={`rounded-[7px] px-3.5 py-1.5 text-[13px] font-semibold transition-colors ${
                mode === "forecast" ? "bg-brand-blue text-white" : "text-seg-inactive hover:text-ink-700"
              }`}
            >
              Прогнозный
            </button>
          </div>

          <button
            onClick={refresh}
            disabled={loading}
            title={`Загрузить последний снимок из Mock Grafana\n(источник обновляется каждые ${ENGINE_INTERVAL_MS / 1000} с)`}
            className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-cardborder bg-card text-ink-500 transition-colors hover:text-ink-700 disabled:opacity-40"
          >
            <RefreshCw
              className={`h-[18px] w-[18px] ${loading ? "animate-spin" : ""}`}
              strokeWidth={2}
            />
          </button>
        </div>
      </div>

      {/* ── Status bar ── */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px]">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-dot-success" />
          <span className="text-ink-500">Источник:</span>
          <span className="font-semibold text-ink-700">
            {data?._meta.source ?? "Mock Grafana"}
          </span>
        </span>
        <span className="text-ink-400">·</span>
        <span className="flex items-center gap-1">
          <span className="text-ink-500">Источник обновлён:</span>
          <SourceClock />
        </span>
        <span className="text-ink-400">·</span>
        <span className="flex items-center gap-1">
          <span className="text-ink-500">Дашборд обновлён:</span>
          <span className="font-medium text-ink-700">
            {loading ? "загрузка…" : fmt(dashboardRefreshedAt)}
          </span>
        </span>
      </div>
    </header>
  );
}
