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
  /** Position inside the chart, in pixels */
  x: number
  y: number
  /** Share of the chart width at x, used to keep the tooltip inside the chart */
  side: 'start' | 'middle' | 'end'
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
