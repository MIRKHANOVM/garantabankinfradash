import { areaPath, linePath, toPoints, type PlotBox } from "./helpers";
import { useChartTokens } from "../theme/useTheme";

const X_TICKS = ["18 мая", "20 мая", "22 мая", "24 мая"];

interface AreaSSDProps {
  history: number[];
  forecast: number[];
  /** ssd.totalTb — used to set the Y-axis ceiling */
  totalTb: number;
}

export default function AreaSSD({ history, forecast, totalTb }: AreaSSDProps) {
  const c = useChartTokens();

  // Y ceiling: round up to the next whole TB above totalTb so the line never
  // clips. Matches the visual behaviour of the previous hardcoded Y_MAX = 4.
  const Y_MAX = Math.ceil(totalTb + 0.5);
  const Y_TICKS = Array.from({ length: Y_MAX + 1 }, (_, i) => Y_MAX - i);

  const box: PlotBox = {
    width: 360,
    height: 150,
    padL: 30,
    padR: 6,
    padT: 8,
    padB: 22,
  };
  const baseY = box.height - box.padB;

  const histPts = toPoints(history, box, 0, Y_MAX, 0, 0.7);
  const foreFull = toPoints(
    [...history.slice(-1), ...forecast],
    box,
    0,
    Y_MAX,
    0.7,
    1
  );
  const forePts = foreFull;

  // Guard: only defined when their respective arrays produced at least one point.
  // On the first render (data=null) history=[] and forecast=[] → both are undefined.
  // linePath/areaPath already handle empty pts gracefully (return "").
  const joint = histPts.length > 0 ? histPts[histPts.length - 1] : null;
  const tip   = forePts.length > 0 ? forePts[forePts.length - 1] : null;

  return (
    <svg viewBox={`0 0 ${box.width} ${box.height}`} className="h-[120px] w-full">
      <defs>
        <linearGradient id="ssdFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={c.secondary} stopOpacity={0.22 * c.areaBoost} />
          <stop offset="100%" stopColor={c.secondary} stopOpacity="0" />
        </linearGradient>
        <linearGradient id="ssdFillForecast" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={c.forecast} stopOpacity={0.1 * c.areaBoost} />
          <stop offset="100%" stopColor={c.forecast} stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* gridlines + Y labels */}
      {Y_TICKS.map((t) => {
        const y = box.padT + (box.height - box.padT - box.padB) * (1 - t / Y_MAX);
        return (
          <g key={t}>
            <line
              x1={box.padL}
              x2={box.width - box.padR}
              y1={y}
              y2={y}
              stroke={c.grid}
              strokeWidth={1}
            />
            <text x={box.padL - 6} y={y + 3} textAnchor="end" fontSize="9" fill={c.axis}>
              {t} ТБ
            </text>
          </g>
        );
      })}

      {/* fills */}
      <path d={areaPath(forePts, baseY, true)} fill="url(#ssdFillForecast)" />
      <path d={areaPath(histPts, baseY, true)} fill="url(#ssdFill)" />

      {/* forecast dashed line */}
      <path
        d={linePath(forePts, true)}
        fill="none"
        stroke={c.forecast}
        strokeWidth={2}
        strokeDasharray="4 3"
        strokeLinecap="round"
      />
      {/* history solid line */}
      <path
        d={linePath(histPts, true)}
        fill="none"
        stroke={c.secondary}
        strokeWidth={2.25}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* "Прогноз" label + endpoint dots — omitted until data is available */}
      {tip && joint && (
        <>
          <text
            x={tip.x - 4}
            y={baseY - 18}
            textAnchor="end"
            fontSize="10"
            fontWeight={600}
            fill={c.forecast}
          >
            Прогноз
          </text>
          <circle cx={joint.x} cy={joint.y} r={3.5} fill={c.secondary} stroke={c.dotHalo} strokeWidth={1.5} />
          <circle cx={tip.x} cy={tip.y} r={4} fill={c.secondary} stroke={c.dotHalo} strokeWidth={1.5} />
        </>
      )}

      {/* X labels */}
      {X_TICKS.map((label, i) => {
        const plotW = box.width - box.padL - box.padR;
        const x = box.padL + (plotW * i) / (X_TICKS.length - 1);
        return (
          <text
            key={label}
            x={Math.min(x, box.width - box.padR - 2)}
            y={box.height - 6}
            textAnchor={i === 0 ? "start" : i === X_TICKS.length - 1 ? "end" : "middle"}
            fontSize="9"
            fill={c.axis}
          >
            {label}
          </text>
        );
      })}
    </svg>
  );
}
