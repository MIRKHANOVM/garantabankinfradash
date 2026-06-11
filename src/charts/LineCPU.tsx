import { areaPath, linePath, toPoints, type PlotBox } from "./helpers";
import { useChartTokens } from "../theme/useTheme";

const Y_MAX = 100;
const Y_TICKS = [100, 75, 50, 25, 0];
const X_TICKS = ["00:00", "06:00", "12:00", "18:00", "24:00"];
const THRESHOLD = 75;

interface LineCPUProps {
  loadHistory: number[];
}

export default function LineCPU({ loadHistory }: LineCPUProps) {
  const c = useChartTokens();
  const box: PlotBox = {
    width: 360,
    height: 150,
    padL: 30,
    padR: 6,
    padT: 8,
    padB: 22,
  };
  const baseY = box.height - box.padB;
  const pts = toPoints(loadHistory, box, 0, Y_MAX, 0, 1);
  const thrY =
    box.padT + (box.height - box.padT - box.padB) * (1 - THRESHOLD / Y_MAX);

  return (
    <svg viewBox={`0 0 ${box.width} ${box.height}`} className="h-[120px] w-full">
      <defs>
        <linearGradient id="cpuFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={c.primary} stopOpacity={0.16 * c.areaBoost} />
          <stop offset="100%" stopColor={c.primary} stopOpacity="0" />
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
              {t}%
            </text>
          </g>
        );
      })}

      {/* red dashed threshold */}
      <line
        x1={box.padL}
        x2={box.width - box.padR}
        y1={thrY}
        y2={thrY}
        stroke={c.threshold}
        strokeWidth={1.5}
        strokeDasharray="5 4"
      />

      {/* area + line */}
      <path d={areaPath(pts, baseY, false)} fill="url(#cpuFill)" />
      <path
        d={linePath(pts, false)}
        fill="none"
        stroke={c.primary}
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
      />

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
