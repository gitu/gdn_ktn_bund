import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ScalingCalculator, describeFormula } from '../ScalingCalculator'
import type { StatsAvailabilityInfo } from '@/types/StatsData'

const statsLoaderMock = vi.hoisted(() => ({
  getStatsEntry: vi.fn(),
  getAvailableStats: vi.fn(),
  loadGdnData: vi.fn(),
  loadKtnData: vi.fn(),
  getBundData: vi.fn(),
}))
vi.mock('@/utils/StatsDataLoader', () => ({
  StatsDataLoader: { getInstance: vi.fn(() => statsLoaderMock) },
}))
vi.mock('@/utils/GeographicalDataLoader', () => ({
  getCantonByAbbreviation: vi.fn(async () => ({ cantonId: '1' })),
  // gdn ids are canton (2 digits) + BFS number: 010261 is Zürich, BFS 261
  getMunicipalityByGdnId: vi.fn(async (id: string) => ({
    municipalityId: String(Number(id.slice(2))),
  })),
}))

const stat = (id: string): StatsAvailabilityInfo => ({
  id,
  name: { de: id, fr: id, it: id, en: id },
  unit: { de: 'Personen', fr: 'personnes', it: 'persone', en: 'persons' },
  type: 'scaling',
  description: { de: id, fr: id, it: id, en: id },
  availableKtnYears: [2024],
  availableGdnYears: [2024],
  source: 'BFS',
  lastUpdate: '2026-01-01',
})

// Population and jobs of the city of Zürich (BFS 261) and the canton (1); area only for 2018
const VALUES: Record<string, Record<string, number>> = {
  pop: { '261': 440000, '1': 1600000 },
  workplaces: { '261': 500000, '1': 1100000 },
  total_area: { '261': 8800 },
}

describe('ScalingCalculator', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    statsLoaderMock.getStatsEntry.mockImplementation(async (id: string) =>
      id in VALUES ? stat(id) : null,
    )
    statsLoaderMock.getAvailableStats.mockResolvedValue(Object.keys(VALUES).map(stat))
    const load = async (id: string, year: number, options: { geoIds: string[] }) => ({
      data: options.geoIds
        .filter((key) => VALUES[id][key] !== undefined)
        .map((key) => ({ key, value: VALUES[id][key] })),
      metadata: { year: id === 'total_area' ? 2018 : year },
    })
    statsLoaderMock.loadGdnData.mockImplementation(load)
    statsLoaderMock.loadKtnData.mockImplementation(load)
    statsLoaderMock.getBundData.mockResolvedValue({ totalValue: 9000000, year: 2024 })
  })

  it('divides by the statistic of each place and year, and says which year of it was used', async () => {
    const calculation = await new ScalingCalculator().calculate('total_area', [
      'gdn/fs/010261:2024',
    ])
    expect(calculation.ok).toBe(true)
    if (!calculation.ok) return
    expect(calculation.outcomes.get('gdn/fs/010261:2024')).toEqual({
      datasetId: 'gdn/fs/010261:2024',
      factor: 8800,
      inputs: [{ statId: 'total_area', value: 8800, year: 2018 }],
    })
    expect(calculation.label.de).toContain('total_area')
  })

  it('evaluates a custom formula with the values of every place', async () => {
    const calculation = await new ScalingCalculator().calculate('custom:pop+workplaces/2', [
      'gdn/fs/010261:2024',
      'std/fs/bund:2024',
    ])
    if (!calculation.ok) throw new Error('expected a valid formula')
    expect(calculation.outcomes.get('gdn/fs/010261:2024')?.factor).toBe(690000)
    expect(calculation.outcomes.get('gdn/fs/010261:2024')?.inputs.map((i) => i.statId)).toEqual([
      'pop',
      'workplaces',
    ])
    expect(calculation.outcomes.get('std/fs/bund:2024')?.factor).toBe(13500000)
  })

  it('gives no divisor when a statistic of the formula is missing for a place', async () => {
    // The canton has a population but no area record here
    const calculation = await new ScalingCalculator().calculate('custom:pop+total_area', [
      'std/fs/ktn_zh:2024',
    ])
    if (!calculation.ok) throw new Error('expected a valid formula')
    const outcome = calculation.outcomes.get('std/fs/ktn_zh:2024')
    expect(outcome?.factor).toBeNull()
    expect(outcome?.inputs).toEqual([{ statId: 'pop', value: 1600000, year: 2024 }])
  })

  it('never divides by zero or a negative result', async () => {
    const calculation = await new ScalingCalculator().calculate('custom:pop-workplaces', [
      'gdn/fs/010261:2024',
    ])
    if (!calculation.ok) throw new Error('expected a valid formula')
    expect(calculation.outcomes.get('gdn/fs/010261:2024')?.factor).toBeNull()
  })

  it('reports unknown statistics and invalid formulas', async () => {
    const calculator = new ScalingCalculator()
    expect(await calculator.calculate('nope', ['gdn/fs/010261:2024'])).toEqual({
      ok: false,
      unknown: true,
    })
    const invalid = await calculator.calculate('custom:pop*', ['gdn/fs/010261:2024'])
    expect(invalid.ok).toBe(false)
    expect(invalid.ok ? '' : invalid.error).toBeTruthy()
  })

  it('loads every statistic for a place and year only once', async () => {
    const calculator = new ScalingCalculator()
    await calculator.calculate('pop', ['gdn/fs/010261:2024'])
    await calculator.calculate('custom:pop*2', ['gdn/fs/010261:2024'])
    expect(statsLoaderMock.loadGdnData).toHaveBeenCalledTimes(1)
    calculator.clear()
    await calculator.calculate('pop', ['gdn/fs/010261:2024'])
    expect(statsLoaderMock.loadGdnData).toHaveBeenCalledTimes(2)
  })
})

describe('describeFormula', () => {
  const names: Record<string, string> = {
    pop: 'Einwohner/innen',
    workplaces: 'Arbeitsplätze',
    pop_65plus: 'Einwohner ab 65',
  }
  const nameOf = (id: string) => names[id] ?? id

  it('names the statistics and typesets the operators', () => {
    expect(describeFormula('pop+workplaces/2', nameOf)).toBe('Einwohner/innen + Arbeitsplätze ÷ 2')
    expect(describeFormula('1.5*pop_65plus - pop', nameOf)).toBe(
      '1.5 × Einwohner ab 65 − Einwohner/innen',
    )
    expect(describeFormula('(pop+workplaces)*0.5', nameOf)).toBe(
      '(Einwohner/innen + Arbeitsplätze) × 0.5',
    )
  })

  it('keeps a leading minus as a sign', () => {
    expect(describeFormula('-pop+workplaces', nameOf)).toBe('−Einwohner/innen + Arbeitsplätze')
  })
})
