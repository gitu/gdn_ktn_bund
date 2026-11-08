import { describe, expect, it } from 'vitest'
import {
  buildDatasets,
  catalogAvailability,
  defaultYear,
  isGrid,
  latestYears,
  placeKeyOf,
  selectionFromDatasets,
  stepYear,
  yearCoverage,
  yearOf,
} from '../ComparisonSelection'
import type { AvailableDataEntry } from '@/types/DataStructures'

const labels = (text: string) => ({ de: text, fr: text, it: text, en: text })
const entry = (type: 'gdn' | 'std', entityCode: string, years: string[]): AvailableDataEntry => ({
  id: `${type}_${entityCode}`,
  type,
  entityCode,
  displayName: labels(entityCode),
  description: labels(entityCode),
  availableYears: years,
})

const available = catalogAvailability([
  entry('gdn', '010261', ['2022', '2023', '2024']),
  entry('gdn', '010230', ['2023', '2024']),
  entry('std', 'ktn_zh', ['2022', '2023', '2024', '2025']),
])

describe('dataset ids', () => {
  it('splits an id into place and year', () => {
    expect(placeKeyOf('gdn/fs/010261:2024')).toBe('gdn/fs/010261')
    expect(yearOf('gdn/fs/010261:2024')).toBe('2024')
    expect(placeKeyOf('broken')).toBeNull()
    expect(yearOf('gdn/fs/010261')).toBeNull()
  })

  it('reads places in their order and years oldest first', () => {
    expect(
      selectionFromDatasets([
        'std/fs/ktn_zh:2024',
        'gdn/fs/010261:2024',
        'std/fs/ktn_zh:2022',
        'nonsense',
      ]),
    ).toEqual({ places: ['std/fs/ktn_zh', 'gdn/fs/010261'], years: ['2022', '2024'] })
  })
})

describe('buildDatasets', () => {
  it('makes one id per place and year, the years of a place side by side', () => {
    expect(
      buildDatasets({ places: ['gdn/fs/010261', 'std/fs/ktn_zh'], years: ['2024', '2023'] }),
    ).toEqual([
      'gdn/fs/010261:2023',
      'gdn/fs/010261:2024',
      'std/fs/ktn_zh:2023',
      'std/fs/ktn_zh:2024',
    ])
  })

  it('leaves out the years a place has no data for', () => {
    expect(
      buildDatasets(
        { places: ['gdn/fs/010230', 'std/fs/ktn_zh'], years: ['2022', '2024'] },
        available,
      ),
    ).toEqual(['gdn/fs/010230:2024', 'std/fs/ktn_zh:2022', 'std/fs/ktn_zh:2024'])
  })
})

describe('isGrid', () => {
  it('accepts every place in every chosen year, in any order', () => {
    expect(
      isGrid([
        'std/fs/ktn_zh:2024',
        'gdn/fs/010261:2024',
        'gdn/fs/010261:2023',
        'std/fs/ktn_zh:2023',
      ]),
    ).toBe(true)
  })

  it('accepts a gap where a place has no data', () => {
    expect(
      isGrid(['gdn/fs/010230:2024', 'std/fs/ktn_zh:2022', 'std/fs/ktn_zh:2024'], available),
    ).toBe(true)
  })

  it('rejects a hand-made mix of places and years', () => {
    expect(isGrid(['gdn/fs/010261:2022', 'std/fs/ktn_zh:2024'])).toBe(false)
  })
})

describe('years of the chosen places', () => {
  const places = ['gdn/fs/010261', 'gdn/fs/010230']

  it('counts the places per year, newest first', () => {
    expect(yearCoverage(places, available)).toEqual([
      { year: '2024', count: 2 },
      { year: '2023', count: 2 },
      { year: '2022', count: 1 },
    ])
  })

  it('suggests the newest year all places share', () => {
    expect(defaultYear(['gdn/fs/010230', 'std/fs/ktn_zh'], available)).toBe('2024')
    expect(defaultYear(['gdn/fs/010261'], () => ['2020', '2019'])).toBe('2020')
    expect(defaultYear([], available)).toBeNull()
  })

  it('falls back to the newest year any place has when they share none', () => {
    const disjoint = (place: string) => (place === 'a' ? ['2015'] : ['2024'])
    expect(defaultYear(['a', 'b'], disjoint)).toBe('2024')
  })

  it('steps to the next and the previous year, and stops at the ends', () => {
    const all = ['2024', '2022', '2023']
    expect(stepYear('2023', 1, all)).toBe('2024')
    expect(stepYear('2023', -1, all)).toBe('2022')
    expect(stepYear('2024', 1, all)).toBeNull()
    expect(stepYear('2021', 1, all)).toBeNull()
  })

  it('picks the latest years', () => {
    expect(latestYears(['2024', '2020', '2022', '2023'], 3)).toEqual(['2022', '2023', '2024'])
  })
})
