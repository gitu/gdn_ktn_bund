/** Number formatting for the optimiser UI (tabular figures are set in CSS). */

export type UiLocale = 'de' | 'fr' | 'it' | 'en'

const TAGS: Record<UiLocale, string> = { de: 'de-CH', fr: 'fr-CH', it: 'it-CH', en: 'en-CH' }

const asLocale = (locale: string): UiLocale => (locale in TAGS ? (locale as UiLocale) : 'de')

export function formatNumber(value: number, locale: string, digits = 0): string {
  if (!Number.isFinite(value)) return '–'
  return new Intl.NumberFormat(TAGS[asLocale(locale)], {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value)
}

/** 0.123 -> "12.3 %"; `signed` adds an explicit plus sign. */
export function formatPercent(
  fraction: number,
  locale: string,
  digits = 1,
  signed = false,
): string {
  if (!Number.isFinite(fraction)) return '–'
  const text = new Intl.NumberFormat(TAGS[asLocale(locale)], {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
    signDisplay: signed ? 'exceptZero' : 'auto',
  }).format(fraction * 100)
  return `${text} %`
}

/** Coefficient of variation, e.g. 0.341 */
export function formatCv(value: number, locale: string): string {
  return formatNumber(value, locale, 2)
}

/** Large CHF amounts in a compact, readable form (1.2 Mio., 3.4 Mrd.). */
export function formatAmount(value: number, locale: string): string {
  if (!Number.isFinite(value)) return '–'
  const abs = Math.abs(value)
  const loc = asLocale(locale)
  const units: Record<UiLocale, [string, string, string]> = {
    de: ['Mrd.', 'Mio.', 'Tsd.'],
    fr: ['Mrd', 'mio', 'k'],
    it: ['mld', 'mln', 'k'],
    en: ['bn', 'm', 'k'],
  }
  const [bn, m, k] = units[loc]
  if (abs >= 1e9) return `${formatNumber(value / 1e9, locale, 2)} ${bn}`
  if (abs >= 1e6) return `${formatNumber(value / 1e6, locale, 2)} ${m}`
  if (abs >= 1e4) return `${formatNumber(value / 1e3, locale, 0)} ${k}`
  return formatNumber(value, locale, 0)
}

/** Parses what a user types into a number field (accepts ' and thin spaces as grouping). */
export function parseNumberInput(text: string): number | null {
  const cleaned = text.replace(/[\s'’  ]/g, '').replace(',', '.')
  if (cleaned === '') return null
  const value = Number(cleaned)
  return Number.isFinite(value) ? value : null
}
