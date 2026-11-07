import { describe, it, expect } from 'vitest'
import { buildFormula, formatCoefficient, roundCoefficient } from '../formula'
import { CustomScalingFormula } from '../../CustomScalingFormula'
import type { StatsAvailabilityInfo } from '@/types/StatsData'

describe('formula formatting', () => {
  it('uses fixed notation with six significant digits for any magnitude', () => {
    expect(formatCoefficient(1)).toBe('1')
    expect(formatCoefficient(0.5)).toBe('0.5')
    expect(formatCoefficient(1234567.891)).toBe('1234568')
    expect(formatCoefficient(0.000012345678)).toBe('0.0000123457')
    expect(formatCoefficient(3.1e-9)).toBe('0.0000000031')
    expect(formatCoefficient(-2.5)).toBe('2.5') // sign is handled by buildFormula
    expect(formatCoefficient(0)).toBe('0')
  })

  it('rounds to what the string can express, so model and formula agree', () => {
    for (const x of [0.123456789, 98765.4321, 1.0000004, 4.56789e-5]) {
      expect(Number(formatCoefficient(roundCoefficient(x)))).toBe(roundCoefficient(x))
    }
  })

  it('builds sums and differences with a leading constant', () => {
    expect(buildFormula(0, [{ id: 'pop', coefficient: 1 }])).toBe('pop')
    expect(
      buildFormula(120.5, [
        { id: 'pop', coefficient: 0.8 },
        { id: 'total_area', coefficient: 14 },
      ]),
    ).toBe('120.5+0.8*pop+14*total_area')
    expect(buildFormula(-3, [{ id: 'pop', coefficient: -0.25 }])).toBe('-3-0.25*pop')
    expect(buildFormula(0, [])).toBe('0')
  })

  it('every generated shape passes the app formula validator', () => {
    const stat = (id: string) =>
      ({
        id,
        name: { de: id, fr: id, it: id, en: id },
        unit: { de: '', fr: '', it: '', en: '' },
      }) as StatsAvailabilityInfo
    const stats = ['pop', 'workplaces', 'total_area'].map(stat)
    const formulas = [
      buildFormula(0, [{ id: 'pop', coefficient: 0.0000123 }]),
      buildFormula(5, [
        { id: 'pop', coefficient: 1 },
        { id: 'workplaces', coefficient: 123456.7 },
      ]),
      buildFormula(-1.5, [
        { id: 'total_area', coefficient: -0.002 },
        { id: 'pop', coefficient: 2 },
      ]),
      '-0.5*pop+3',
    ]
    for (const f of formulas) {
      expect(CustomScalingFormula.validateFormula(f, stats).isValid, f).toBe(true)
    }
  })
})
