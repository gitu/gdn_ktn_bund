/**
 * Swiss number formats for the whole app: 1'234'567 with an apostrophe between thousands (French:
 * a narrow space), whatever the language. Amounts can be shown exactly in francs or rounded to
 * thousands or millions of francs.
 */

export type AmountUnit = 'chf' | 'thousand' | 'million'
export const AMOUNT_UNITS: AmountUnit[] = ['chf', 'thousand', 'million']

const DIVISOR: Record<AmountUnit, number> = { chf: 1, thousand: 1_000, million: 1_000_000 }

/** `de` → `de-CH`: the Swiss variant of the interface language. */
export function swissLocale(locale: string): string {
  const language = locale.split('-')[0] || 'de'
  return `${language}-CH`
}

const formatters = new Map<string, Intl.NumberFormat>()

/** Cached Intl.NumberFormat: tables format thousands of cells. */
function numberFormat(locale: string, options: Intl.NumberFormatOptions): Intl.NumberFormat {
  const key = `${locale}|${JSON.stringify(options)}`
  let format = formatters.get(key)
  if (!format) {
    format = new Intl.NumberFormat(swissLocale(locale), options)
    formatters.set(key, format)
  }
  return format
}

export function formatNumber(value: number, locale: string, maximumFractionDigits = 0): string {
  if (!Number.isFinite(value)) return '–'
  return numberFormat(locale, { maximumFractionDigits }).format(value)
}

/** Decimals for a value in a unit: exact francs without, rounded units with one or two. */
function fractionDigits(value: number, unit: AmountUnit, small: boolean): number {
  const abs = Math.abs(value)
  if (unit === 'chf') return small && abs < 100 ? 2 : 0
  if (abs >= 100) return 0
  return abs >= 1 ? 1 : 2
}

/**
 * An amount in the chosen unit, e.g. 14'886'062'686 CHF, 14'886'063 Tsd. CHF or 14'886.1 Mio. CHF.
 * `small` marks values per inhabitant etc., where amounts below 100 francs keep their centimes.
 * `suffix` is the unit text (translated by the caller); leave it out for a bare number.
 */
export function formatAmount(
  value: number,
  locale: string,
  options: { unit?: AmountUnit; small?: boolean; suffix?: string } = {},
): string {
  if (!Number.isFinite(value)) return '–'
  const unit = options.unit ?? 'chf'
  const scaled = value / DIVISOR[unit]
  const digits = fractionDigits(scaled, unit, options.small ?? false)
  const number = numberFormat(locale, {
    minimumFractionDigits: unit === 'chf' ? 0 : digits,
    maximumFractionDigits: digits,
  }).format(scaled)
  return options.suffix ? `${number} ${options.suffix}` : number
}

/** A short number for axis ticks and bar labels: 1.2 Mrd., 350 Mio., 4'500. */
export function formatCompact(value: number, locale: string): string {
  if (!Number.isFinite(value)) return '–'
  const abs = Math.abs(value)
  return numberFormat(locale, {
    notation: abs >= 100_000 ? 'compact' : 'standard',
    compactDisplay: 'short',
    maximumFractionDigits: abs >= 100_000 ? 1 : abs >= 100 ? 0 : abs >= 1 ? 1 : 2,
  }).format(value)
}

/** 0.42 → 42%. */
export function formatShare(share: number, locale: string): string {
  if (!Number.isFinite(share)) return '–'
  return numberFormat(locale, { style: 'percent', maximumFractionDigits: 0 }).format(share)
}

/** 12.345 → +12.3%: a change in percent, with its sign. */
export function formatChange(percent: number | null, locale: string): string {
  if (percent === null || !Number.isFinite(percent)) return '-'
  return `${numberFormat(locale, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
    signDisplay: 'exceptZero',
  }).format(percent)}%`
}
