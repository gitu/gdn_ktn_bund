/** Shapes shared by the chart components. Colours are CSS custom properties (see _tokens.scss). */

export interface ChartSeries {
  key: string
  label: string
  /** CSS colour, usually `var(--gk-series-<n>)` */
  color: string
  /** Text colour on top of the fill, `var(--gk-series-<n>-ink)` */
  ink?: string
}

export interface ChartCategory {
  key: string
  label: string
  /** Second line under the label, e.g. the year */
  sublabel?: string
}

export interface ChartTable {
  head: string[]
  rows: { key: string; label: string; cells: string[] }[]
}

export interface TooltipRow {
  label: string
  value: string
  color?: string
  shape?: 'rect' | 'line'
}

export interface TooltipState {
  /** Position of the mark (or the crosshair) inside the chart, in pixels */
  x: number
  y: number
  /** Width of the chart, so the tooltip can be kept inside it */
  width: number
  /** Where x lies: the tooltip grows away from the nearer edge */
  side: 'start' | 'middle' | 'end'
  /** Next to a crosshair (line charts) instead of above a mark */
  beside?: boolean
  /** Beside a crosshair: y is the top of the plot (tooltip hangs down) or its bottom (grows up) */
  valign?: 'top' | 'bottom'

  title: string
  rows: TooltipRow[]
}

/** Categorical slot `index` (0-based), cycling never: callers cap the number of series at 8. */
export function seriesColor(index: number): Pick<ChartSeries, 'color' | 'ink'> {
  const slot = Math.min(index, 7) + 1
  return { color: `var(--gk-series-${slot})`, ink: `var(--gk-series-${slot}-ink)` }
}

export function tooltipSide(x: number, width: number): TooltipState['side'] {
  if (width <= 0) return 'middle'
  const at = x / width
  return at < 0.3 ? 'start' : at > 0.7 ? 'end' : 'middle'
}

/** Gap between a crosshair and the tooltip beside it */
const BESIDE_GAP = 12
/** How far an "above" tooltip reaches past its mark towards the edge it grows from */
const OVERHANG = 12

/**
 * Inline position of a tooltip. It is anchored to the edge it grows away from (left or right), so
 * it is never squeezed against the chart's border, and it never gets wider than the room there.
 */
export function tooltipStyle(tooltip: TooltipState): Record<string, string> {
  const { x, y, width, side, beside } = tooltip
  const style: Record<string, string> = { top: `${y}px` }
  let room: number
  if (beside) {
    if (tooltip.valign === 'bottom') style.transform = 'translateY(-100%)'
    // Right half: to the left of the crosshair; left half: to its right
    if (x > width / 2) {
      style.right = `${width - x + BESIDE_GAP}px`
      room = x - BESIDE_GAP
    } else {
      style.left = `${x + BESIDE_GAP}px`
      room = width - x - BESIDE_GAP
    }
  } else {
    style.transform = 'translateY(calc(-100% - 0.5rem))'
    if (side === 'end') {
      const right = Math.max(0, width - x - OVERHANG)
      style.right = `${right}px`
      room = width - right
    } else if (side === 'start') {
      const left = Math.max(0, x - OVERHANG)
      style.left = `${left}px`
      room = width - left
    } else {
      style.left = `${x}px`
      style.transform = 'translate(-50%, calc(-100% - 0.5rem))'
      room = 2 * Math.min(x, width - x)
    }
  }
  style.maxWidth = `min(18rem, ${Math.max(96, Math.floor(room))}px)`
  return style
}
