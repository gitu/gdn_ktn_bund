import { describe, expect, it } from 'vitest'
import {
  formatAmount,
  formatChange,
  formatCompact,
  formatNumber,
  formatShare,
  swissLocale,
} from '../numberFormat'

// Intl separates numbers and units with a no-break space and may use ’ or ' between thousands
const plain = (text: string) => text.replace(/ | /g, ' ').replace(/’/g, "'")

describe('Swiss number formats', () => {
  it('uses the Swiss variant of every interface language', () => {
    expect(swissLocale('de')).toBe('de-CH')
    expect(swissLocale('fr')).toBe('fr-CH')
    expect(swissLocale('en-GB')).toBe('en-CH')
  })

  it("groups thousands the Swiss way (1'234'567), with a decimal point in German", () => {
    expect(plain(formatNumber(14886062686, 'de'))).toBe("14'886'062'686")
    expect(plain(formatNumber(1234.5, 'de', 2))).toBe("1'234.5")
    expect(plain(formatNumber(1234.5, 'fr', 2))).toMatch(/^1.234,5$/)
  })

  it('shows amounts exactly in francs, or rounded to thousands or millions', () => {
    expect(plain(formatAmount(14886062686, 'de', { suffix: 'CHF' }))).toBe("14'886'062'686 CHF")
    expect(plain(formatAmount(14886062686, 'de', { unit: 'thousand', suffix: 'Tsd. CHF' }))).toBe(
      "14'886'063 Tsd. CHF",
    )
    expect(plain(formatAmount(14886062686, 'de', { unit: 'million', suffix: 'Mio. CHF' }))).toBe(
      "14'886 Mio. CHF",
    )
    // Smaller rounded amounts keep a decimal, so they do not all collapse to 0 or 1
    expect(plain(formatAmount(37940, 'de', { unit: 'thousand' }))).toBe('37.9')
    expect(plain(formatAmount(350000, 'de', { unit: 'million' }))).toBe('0.35')
  })

  it('keeps centimes only for small converted amounts', () => {
    expect(plain(formatAmount(12.345, 'de', { small: true }))).toBe('12.35')
    expect(plain(formatAmount(12.345, 'de'))).toBe('12')
    expect(plain(formatAmount(14984.2, 'de', { small: true }))).toBe("14'984")
    expect(formatAmount(NaN, 'de')).toBe('–')
  })

  it('shortens axis labels and formats shares and changes', () => {
    expect(plain(formatCompact(1_234_000_000, 'de'))).toBe('1.2 Mrd.')
    expect(plain(formatCompact(4500, 'de'))).toBe("4'500")
    expect(formatShare(0.42, 'de')).toBe('42%')
    expect(formatChange(12.345, 'de')).toBe('+12.3%')
    expect(formatChange(-3, 'de')).toBe('-3.0%')
    expect(formatChange(null, 'de')).toBe('-')
  })
})
