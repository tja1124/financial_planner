import type { CSSProperties } from 'react';

const PIE_CX_PCT = 50;
/** Matches Pie cy — center sits above the legend band. */
const PIE_CY_PCT = 45;
/** Distance from center to tooltip anchor — outside outerRadius. */
const TOOLTIP_RADIUS_PCT = 48;

/**
 * Place the expense pie tooltip outside the donut, on the slice mid-angle.
 * Recharts pie: 0° at 3 o'clock, clockwise.
 */
export function getPieSliceTooltipStyle(
  index: number,
  data: ReadonlyArray<{ value: number }>,
): CSSProperties {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total <= 0 || index < 0 || index >= data.length) {
    return {
      left: `${PIE_CX_PCT}%`,
      top: `${PIE_CY_PCT}%`,
      transform: 'translate(-50%, -50%)',
    };
  }

  let startDeg = 0;
  for (let i = 0; i < index; i++) {
    startDeg += (data[i].value / total) * 360;
  }
  const midDeg = startDeg + ((data[index].value / total) * 360) / 2;
  const rad = ((midDeg - 90) * Math.PI) / 180;

  const x = PIE_CX_PCT + Math.cos(rad) * TOOLTIP_RADIUS_PCT;
  const y = PIE_CY_PCT + Math.sin(rad) * TOOLTIP_RADIUS_PCT;

  return {
    left: `${x}%`,
    top: `${y}%`,
    transform: 'translate(-50%, -50%)',
  };
}
