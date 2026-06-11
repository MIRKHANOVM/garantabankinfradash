export interface Pt {
  x: number;
  y: number;
}

export interface PlotBox {
  width: number;
  height: number;
  padL: number;
  padR: number;
  padT: number;
  padB: number;
}

/** Map a series of raw values to pixel points inside a plot box. */
export function toPoints(
  values: number[],
  box: PlotBox,
  yMin: number,
  yMax: number,
  startFrac = 0,
  endFrac = 1
): Pt[] {
  const plotW = box.width - box.padL - box.padR;
  const plotH = box.height - box.padT - box.padB;
  const n = values.length;
  return values.map((v, i) => {
    const f = n === 1 ? 0 : i / (n - 1);
    const frac = startFrac + (endFrac - startFrac) * f;
    const x = box.padL + plotW * frac;
    const y = box.padT + plotH * (1 - (v - yMin) / (yMax - yMin));
    return { x, y };
  });
}

/** Smooth-ish cardinal-style path through points. */
export function linePath(pts: Pt[], smooth = false): string {
  if (pts.length === 0) return "";
  if (!smooth || pts.length < 3) {
    return pts
      .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(2)},${p.y.toFixed(2)}`)
      .join(" ");
  }
  let d = `M${pts[0].x.toFixed(2)},${pts[0].y.toFixed(2)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i === 0 ? i : i - 1];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2 < pts.length ? i + 2 : i + 1];
    const t = 0.18;
    const c1x = p1.x + (p2.x - p0.x) * t;
    const c1y = p1.y + (p2.y - p0.y) * t;
    const c2x = p2.x - (p3.x - p1.x) * t;
    const c2y = p2.y - (p3.y - p1.y) * t;
    d += ` C${c1x.toFixed(2)},${c1y.toFixed(2)} ${c2x.toFixed(2)},${c2y.toFixed(
      2
    )} ${p2.x.toFixed(2)},${p2.y.toFixed(2)}`;
  }
  return d;
}

/** Closed area path: line across the top, then down to the baseline. */
export function areaPath(pts: Pt[], baselineY: number, smooth = false): string {
  if (pts.length === 0) return "";
  const top = linePath(pts, smooth);
  const last = pts[pts.length - 1];
  const first = pts[0];
  return `${top} L${last.x.toFixed(2)},${baselineY.toFixed(2)} L${first.x.toFixed(
    2
  )},${baselineY.toFixed(2)} Z`;
}
