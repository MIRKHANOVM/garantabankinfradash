import { linePath, toPoints, type PlotBox } from "./helpers";
import { useChartTokens } from "../theme/useTheme";

// Fallback used only when no values prop is passed (e.g. during initial load).
const BARS_FALLBACK = [4, 6, 5, 8, 7, 9, 8, 11, 10, 12, 11, 14, 13, 16, 15, 18];

export function BarReboots({ values }: { values?: number[] }) {
  const c = useChartTokens();
  const bars = values && values.length > 0 ? values : BARS_FALLBACK;
  const w = 120;
  const h = 46;
  const max = Math.max(...bars);
  const gap = 2;
  const bw = (w - gap * (bars.length - 1)) / bars.length;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-[46px] w-[120px]">
      {bars.map((v, i) => {
        const bh = (v / max) * (h - 2);
        const x = i * (bw + gap);
        const y = h - bh;
        return (
          <rect
            key={i}
            x={x}
            y={y}
            width={bw}
            height={bh}
            rx={1}
            fill={c.quaternary}
            opacity={0.55 + 0.45 * (v / max)}
          />
        );
      })}
    </svg>
  );
}

const TREND_FALLBACK = [10, 12, 11, 14, 16, 15, 18, 20];

export function MiniTrend({ color, values }: { color?: string; values?: number[] }) {
  const c = useChartTokens();
  const stroke = color ?? c.primary;
  const data = values && values.length > 0 ? values : TREND_FALLBACK;
  const box: PlotBox = {
    width: 44,
    height: 18,
    padL: 1,
    padR: 1,
    padT: 2,
    padB: 2,
  };
  const max = Math.max(...data);
  const min = Math.min(...data);
  const pts = toPoints(data, box, min, max, 0, 1);
  return (
    <svg viewBox={`0 0 ${box.width} ${box.height}`} className="h-[18px] w-[44px]">
      <path
        d={linePath(pts, true)}
        fill="none"
        stroke={stroke}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
