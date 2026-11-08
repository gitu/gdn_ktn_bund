import { describe, expect, it } from 'vitest'
import { suggestComparisons, type SuggestionContext } from '../PlaceSuggestions'
import type { AvailableDataEntry } from '@/types/DataStructures'

const labels = (text: string) => ({ de: text, fr: text, it: text, en: text })
const entry = (type: 'gdn' | 'std', entityCode: string): AvailableDataEntry => ({
  id: `${type}_${entityCode}`,
  type,
  entityCode,
  displayName: labels(entityCode),
  description: labels(entityCode),
  availableYears: ['2024'],
})

// Zürich (ZH) has a few municipalities of different sizes; Bern (BE) and Basel-Stadt (BS) one each
const MUNICIPALITIES: [string, string, number][] = [
  ['010261', 'zh', 440000],
  ['010230', 'zh', 120000],
  ['010066', 'zh', 25000],
  ['010156', 'zh', 15000],
  ['010058', 'zh', 5400],
  ['020351', 'be', 140000],
  ['020371', 'be', 23000],
  ['122701', 'bs', 175000],
]

const context: SuggestionContext = {
  catalog: [
    ...MUNICIPALITIES.map(([code]) => entry('gdn', code)),
    ...['ktn_zh', 'gdn_zh', 'ktn_gdn_zh', 'gdn_zh_rest', 'ktn_be', 'gdn_be', 'ktn_bs'].map((c) =>
      entry('std', c),
    ),
    ...['gdn', 'ktn', 'ktn_gdn', 'bund', 'bund_ktn_gdn', 'sv', 'sv_ahv', 'sv_iv'].map((c) =>
      entry('std', c),
    ),
  ],
  municipalities: new Map(
    MUNICIPALITIES.map(([code, canton, population]) => [code, { canton, population }]),
  ),
  cantons: new Map([
    ['zh', 1600000],
    ['be', 1050000],
    ['bs', 200000],
  ]),
  rests: new Map([['zh', 180000]]),
}

const placesOf = (start: string, key: string) =>
  suggestComparisons(start, context, 3)
    .find((group) => group.key === key)
    ?.places.map((p) => p.place)

describe('suggestComparisons', () => {
  it('offers municipalities of a similar size in the same canton, closest first', () => {
    // Winterthur (120,000): Zürich is 3.7x larger, Uster (25,000) 4.8x smaller
    expect(placesOf('gdn/fs/010230', 'similarInCanton')).toEqual([
      'gdn/fs/010261',
      'gdn/fs/010066',
      'gdn/fs/010156',
    ])
  })

  it('offers municipalities of a similar size in other cantons, with their inhabitants', () => {
    const group = suggestComparisons('gdn/fs/010230', context, 2).find(
      (g) => g.key === 'similarElsewhere',
    )!
    expect(group.places).toEqual([
      { place: 'gdn/fs/020351', population: 140000 },
      { place: 'gdn/fs/122701', population: 175000 },
    ])
  })

  it('offers the canton of a municipality and the whole country', () => {
    const groups = suggestComparisons('gdn/fs/010230', context)
    expect(groups.find((g) => g.key === 'sameCanton')).toMatchObject({
      canton: 'ZH',
      places: [
        { place: 'std/fs/ktn_zh' },
        { place: 'std/fs/gdn_zh' },
        { place: 'std/fs/ktn_gdn_zh' },
        { place: 'std/fs/gdn_zh_rest' },
      ],
    })
    expect(placesOf('gdn/fs/010230', 'national')).toEqual(['std/fs/gdn'])
  })

  it('offers cantons of a similar size, the rest of the canton family and its largest municipalities', () => {
    expect(placesOf('std/fs/ktn_zh', 'similarCantons')).toEqual(['std/fs/ktn_be', 'std/fs/ktn_bs'])
    expect(placesOf('std/fs/ktn_zh', 'sameCanton')).toEqual([
      'std/fs/gdn_zh',
      'std/fs/ktn_gdn_zh',
      'std/fs/gdn_zh_rest',
    ])
    expect(placesOf('std/fs/ktn_zh', 'largestInCanton')).toEqual([
      'gdn/fs/010261',
      'gdn/fs/010230',
      'gdn/fs/010066',
    ])
    expect(placesOf('std/fs/ktn_zh', 'national')).toEqual(['std/fs/ktn', 'std/fs/bund'])
  })

  it('compares "all municipalities of a canton" with the same kind of figure elsewhere', () => {
    // Only gdn_be exists in the catalogue (gdn_bs does not)
    expect(placesOf('std/fs/gdn_zh', 'similarCantons')).toEqual(['std/fs/gdn_be'])
  })

  it('offers the other levels of government for country-wide figures', () => {
    expect(placesOf('std/fs/bund', 'levels')).toEqual([
      'std/fs/gdn',
      'std/fs/ktn',
      'std/fs/ktn_gdn',
      'std/fs/bund_ktn_gdn',
    ])
  })

  it('offers the other social insurances for a social insurance', () => {
    expect(placesOf('std/fs/sv_ahv', 'otherInsurances')).toEqual(['std/fs/sv', 'std/fs/sv_iv'])
  })

  it('leaves out groups without suggestions and unknown places', () => {
    const groups = suggestComparisons('gdn/fs/999999', context)
    expect(groups.map((g) => g.key)).toEqual(['national'])
    expect(suggestComparisons('nonsense', context)).toEqual([])
  })
})
