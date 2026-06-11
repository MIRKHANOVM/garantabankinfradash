import { areaPath, linePath, toPoints, type PlotBox } from "./helpers";
import { useChartTokens } from "../theme/useTheme";

interface AreaTrendProps {
  /** Stroke/fill colour — caller passes a reactive theme token. */
  color: string;
  values?: number[];
  height?: number;
  strokeWidth?: number;
}

const DEFAULT_VALUES = [
  20, 24, 22, 30, 34, 31, 40, 44, 48, 52, 58, 63, 68, 74, 82,
];

export default function AreaTrend({
  color,
  values = DEFAULT_VALUES,
  height = 84,
  strokeWidth = 2,
}: AreaTrendProps) {
  const { areaBoost } = useChartTokens();
  const box: PlotBox = {
    width: 320,
    height: 100,
    padL: 2,
    padR: 2,
    padT: 10,
    padB: 4,
  };
  const baseY = box.height - box.padB;
  const max = Math.max(...values) * 1.08;
  const min = Math.min(...values) * 0.6;
  const pts = toPoints(values, box, min, max, 0, 1);
  const gradId = `trendFill-${color.replace("#", "")}-${Math.round(height)}`;

  return (
    <svg
      viewBox={`0 0 ${box.width} ${box.height}`}
      preserveAspectRatio="none"
      style={{ height, width: "100%", display: "block" }}
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.24 * areaBoost} />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath(pts, baseY, true)} fill={`url(#${gradId})`} />
      <path
        d={linePath(pts, true)}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
