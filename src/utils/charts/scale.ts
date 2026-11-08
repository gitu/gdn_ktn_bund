/** Axis scales and number formats shared by the charts. */

/** A "nice" step (1, 2, 2.5 or 5 times a power of ten) for about `count` intervals over `span`. */
function niceStep(span: number, count: number): number {
  const raw = span / Math.max(1, count)
  const power = 10 ** Math.floor(Math.log10(raw))
  const fraction = raw / power
  const nice =
    fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 2.5 ? 2.5 : fraction <= 5 ? 5 : 10
  return nice * power
}

export interface LinearScale {
  min: number
  max: number
  ticks: number[]
  /** Position of a value between min (0) and max (1) */
  position: (value: number) => number
}

/**
 * A scale from round numbers that covers all values. By default it includes zero, so bars grow from
 * a real baseline and a negative result reads as negative; lines may hug their data instead.
 */
export function linearScale(values: readonly number[], count = 4, includeZero = true): LinearScale {
  const finite = values.filter(Number.isFinite)
  let low = finite.length > 0 ? Math.min(...finite) : 0
  let high = finite.length > 0 ? Math.max(...finite) : 0
  if (includeZero) {
    low = Math.min(0, low)
    high = Math.max(0, high)
  }
  if (low === high) high = low + 1

  const step = niceStep(high - low, count)
  low = Math.floor(low / step) * step
  high = Math.ceil(high / step) * step

  const ticks: number[] = []
  // Rounding keeps 0.1 + 0.2 style errors out of the labels
  for (let tick = low; tick <= high + step / 2; tick += step)
    ticks.push(Number(tick.toPrecision(12)))
  return {
    min: low,
    max: high,
    ticks,
    position: (value) => (value - low) / (high - low),
  }
}

/** A short number for axis ticks and bar labels: 1,2 Mrd., 350 Mio., 4500. */
export function formatCompact(value: number, locale: string): string {
  if (!Number.isFinite(value)) return '–'
  const abs = Math.abs(value)
  return new Intl.NumberFormat(locale, {
    notation: abs >= 100_000 ? 'compact' : 'standard',
    compactDisplay: 'short',
    maximumFractionDigits: abs >= 100_000 ? 1 : abs >= 100 ? 0 : abs >= 1 ? 1 : 2,
  }).format(value)
}

/** The full amount, as in the table: 1.234.567 CHF. */
export function formatAmount(value: number, locale: string, fractionDigits = 0): string {
  if (!Number.isFinite(value)) return '–'
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'CHF',
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value)
}

export function formatShare(share: number, locale: string): string {
  return new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 0 }).format(share)
}
