import { describe, it, expect } from 'vitest'
import { SAMPLE_COMPARISONS, sampleComparisonQuery } from '../sampleComparisons'
import available from '../available-data.json'

describe('sampleComparisons', () => {
  it('builds the query the comparison page reads', () => {
    expect(sampleComparisonQuery({ datasets: ['std/fs/bund:2022', 'std/fs/ktn:2022'] })).toEqual({
      datasets: 'std/fs/bund:2022,std/fs/ktn:2022',
    })
    expect(sampleComparisonQuery({ datasets: ['gdn/fs/010261:2022'], scaling: 'pop' })).toEqual({
      datasets: 'gdn/fs/010261:2022',
      scaling: 'pop',
    })
  })

  it('only offers datasets that exist in the catalogue (no dead demo links after a data refresh)', () => {
    const catalog = available as { type: string; entityCode: string; availableYears: string[] }[]
    for (const sample of Object.values(SAMPLE_COMPARISONS)) {
      for (const id of sample.datasets) {
        const [source, , entityAndYear] = id.split('/')
        const [entityCode, year] = entityAndYear.split(':')
        const entry = catalog.find((e) => e.type === source && e.entityCode === entityCode)
        expect(entry, id).toBeDefined()
        expect(entry?.availableYears, id).toContain(year)
      }
    }
  })
})
