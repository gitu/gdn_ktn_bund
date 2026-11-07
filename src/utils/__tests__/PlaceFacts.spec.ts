import { beforeEach, describe, expect, it, vi } from 'vitest'

const stats = vi.hoisted(() => ({
  loadGdnData: vi.fn(),
  loadKtnData: vi.fn(),
  getBundData: vi.fn(),
}))
vi.mock('@/utils/StatsDataLoader', () => ({ StatsDataLoader: { getInstance: () => stats } }))

const geo = vi.hoisted(() => ({
  getMunicipalityByGdnId: vi.fn(),
  getCantonByAbbreviation: vi.fn(),
}))
vi.mock('@/utils/GeographicalDataLoader', () => geo)

import {
  classifyStandardEntity,
  loadAllPlaceFacts,
  loadPlaceFacts,
  parseDatasetId,
  share,
} from '../PlaceFacts'

const VALUES: Record<string, number> = {
  pop: 400000,
  pop_65plus: 60000,
  pop_foreign: 140000,
  workplaces: 500000,
  road_length: 800,
  total_area: 8800,
}

beforeEach(() => {
  vi.clearAllMocks()
  const respond = (statId: string, _year: number, filters?: { geoIds: string[] }) => {
    if (!(statId in VALUES)) return Promise.reject(new Error('unknown statistic'))
    return Promise.resolve({ data: [{ key: filters?.geoIds[0] ?? '', value: VALUES[statId] }] })
  }
  stats.loadGdnData.mockImplementation(respond)
  stats.loadKtnData.mockImplementation(respond)
  stats.getBundData.mockImplementation((statId: string) =>
    statId in VALUES
      ? Promise.resolve({ totalValue: VALUES[statId] * 20 })
      : Promise.reject(new Error('x')),
  )
  geo.getMunicipalityByGdnId.mockResolvedValue({
    municipalityId: '261',
    municipalityLongName: 'Zürich',
    cantonAbbreviation: 'ZH',
  })
  geo.getCantonByAbbreviation.mockResolvedValue({ cantonId: '1', cantonLongName: 'Zürich' })
})

describe('parseDatasetId', () => {
  it('splits source, model, entity and year', () => {
    expect(parseDatasetId('gdn/fs/010261:2024')).toEqual({
      source: 'gdn',
      model: 'fs',
      entity: '010261',
      year: '2024',
    })
  })

  it('rejects malformed identifiers', () => {
    expect(parseDatasetId('gdn/fs')).toBeNull()
    expect(parseDatasetId('gdn/fs/010261')).toBeNull()
  })
})

describe('classifyStandardEntity', () => {
  it.each([
    ['bund', 'federal'],
    ['ktn_zh', 'canton'],
    ['gdn_zh', 'cantonMunicipalities'],
    ['gdn_zh_rest', 'cantonRest'],
    ['ktn_gdn_zh', 'cantonAndMunicipalities'],
    ['sv_ahv', 'socialInsurance'],
    ['staat', 'switzerland'],
    ['bund_ktn_gdn', 'switzerland'],
    ['gdn', 'switzerland'],
    ['whatever', 'other'],
  ])('%s is a %s', (code, kind) => {
    expect(classifyStandardEntity(code)).toBe(kind)
  })
})

describe('loadPlaceFacts', () => {
  it('reports a municipality with its canton and all statistics', async () => {
    const facts = await loadPlaceFacts('gdn/fs/010261:2024')
    expect(facts).toMatchObject({
      kind: 'municipality',
      municipalityName: 'Zürich',
      cantonAbbreviation: 'ZH',
      year: '2024',
      population: 400000,
      population65Plus: 60000,
      populationForeign: 140000,
      jobs: 500000,
      roadKm: 800,
      areaHa: 8800,
    })
    // the municipality is looked up by its BFS number, not by the 6-digit EFV code
    expect(stats.loadGdnData).toHaveBeenCalledWith('pop', 2024, { geoIds: ['261'] })
  })

  it('reports a canton with its full name and canton-level statistics', async () => {
    const facts = await loadPlaceFacts('std/fs/ktn_zh:2024')
    expect(facts).toMatchObject({
      kind: 'canton',
      cantonName: 'Zürich',
      cantonAbbreviation: 'ZH',
      population: 400000,
    })
    expect(stats.loadKtnData).toHaveBeenCalledWith('pop', 2024, { geoIds: ['1'] })
  })

  it('uses the whole-canton figures for combined canton entities', async () => {
    expect((await loadPlaceFacts('std/fs/gdn_zh:2024'))?.kind).toBe('cantonMunicipalities')
    expect((await loadPlaceFacts('std/fs/ktn_gdn_zh:2024'))?.kind).toBe('cantonAndMunicipalities')
  })

  it('sums the cantons for the federal level and leaves the area out (the file lists totals)', async () => {
    const facts = await loadPlaceFacts('std/fs/bund:2024')
    expect(facts?.kind).toBe('federal')
    expect(facts?.population).toBe(8_000_000)
    expect(facts?.areaHa).toBeUndefined()
  })

  it('reads the calculated rest of a canton from its own record, not from the whole canton', async () => {
    const facts = await loadPlaceFacts('std/fs/gdn_zh_rest:2024')
    expect(facts).toMatchObject({ kind: 'cantonRest', cantonName: 'Zürich', population: 400000 })
    expect(stats.loadGdnData).toHaveBeenCalledWith('pop', 2024, { geoIds: ['rest_1'] })
    expect(stats.loadKtnData).not.toHaveBeenCalled()
  })

  it('has no statistics for social insurances, but a description', async () => {
    const facts = await loadPlaceFacts('std/fs/sv_ahv:2024')
    expect(facts).toMatchObject({ kind: 'socialInsurance' })
    expect(facts?.population).toBeUndefined()
    expect(facts?.description?.de).toBeTruthy()
  })

  it('leaves out a statistic the loader cannot provide instead of failing', async () => {
    stats.loadGdnData.mockImplementation((statId: string) =>
      statId === 'pop'
        ? Promise.resolve({ data: [{ key: '261', value: 1000 }] })
        : Promise.reject(new Error('missing')),
    )
    const facts = await loadPlaceFacts('gdn/fs/010261:2024')
    expect(facts?.population).toBe(1000)
    expect(facts?.jobs).toBeUndefined()
  })

  it('returns null for a malformed identifier and skips it in loadAllPlaceFacts', async () => {
    expect(await loadPlaceFacts('nonsense')).toBeNull()
    const all = await loadAllPlaceFacts(['nonsense', 'std/fs/bund:2024'])
    expect(all.map((f) => f.kind)).toEqual(['federal'])
  })
})

describe('share', () => {
  it('computes fractions and refuses to divide by nothing', () => {
    expect(share(25, 100)).toBe(0.25)
    expect(share(undefined, 100)).toBeUndefined()
    expect(share(5, 0)).toBeUndefined()
  })
})
