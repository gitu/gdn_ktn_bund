import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  clearFactorCache,
  entityKey,
  loadFactorValues,
  parseEntityCode,
  type FactorDependencies,
} from '../scalingFactors'
import type { StatsDataResult } from '@/types/StatsData'

const result = (rows: Record<string, number>, year: number): StatsDataResult => ({
  data: Object.entries(rows).map(([key, value]) => ({ key, value })),
  metadata: { source: '', loadedAt: '', recordCount: 0, year, dataType: 'gdn' },
})

function deps(): FactorDependencies & {
  gdn: ReturnType<typeof vi.fn>
  ktn: ReturnType<typeof vi.fn>
} {
  // pop exists for 2023 only; asking for 2024 returns the nearest year like StatsDataLoader does
  const gdn = vi.fn(async (stat: string, year: number) => {
    if (stat === 'pop') return result({ '261': 436000, '230': 120000 }, 2023)
    if (stat === 'workplaces') return result({ '261': 545000 }, year)
    throw new Error('No municipality data available')
  })
  const ktn = vi.fn(async (stat: string) => {
    if (stat === 'pop') return result({ '1': 1600000, '2': 1000000, '19': 700000 }, 2023)
    throw new Error('No canton data available')
  })
  return {
    stats: { loadGdnData: gdn, loadKtnData: ktn },
    geoId: async (ref) => {
      if (ref.source === 'gdn')
        return ref.entityId === '010261' ? '261' : ref.entityId === '010230' ? '230' : null
      return ref.entityId === 'gdn_zh' ? '1' : 'bund'
    },
    gdn,
    ktn,
  }
}

beforeEach(() => clearFactorCache())

describe('parseEntityCode / entityKey', () => {
  it('parses the three parts and the group key without year', () => {
    expect(parseEntityCode('gdn/fs/010261:2024')).toMatchObject({
      source: 'gdn',
      model: 'fs',
      entityId: '010261',
      year: 2024,
      groupKey: 'gdn/fs/010261',
    })
    expect(parseEntityCode('weird')).toBeNull()
    expect(parseEntityCode('gdn/fs/010261')).toBeNull()
    expect(entityKey('gdn/fs/010261:2024')).toBe('010261:2024')
  })
})

describe('loadFactorValues', () => {
  const codes = [
    'gdn/fs/010261:2024',
    'gdn/fs/010230:2024',
    'gdn/fs/999999:2024',
    'std/fs/gdn_zh:2024',
    'std/fs/bund:2024',
  ]

  it('reads each statistics file once, however many entities use it', async () => {
    const d = deps()
    await loadFactorValues(codes, ['pop', 'workplaces'], d)
    expect(d.gdn).toHaveBeenCalledTimes(2) // pop + workplaces, 2024, shared by all municipalities
    expect(d.ktn).toHaveBeenCalledTimes(2) // pop + workplaces on the canton level
    await loadFactorValues(codes, ['pop'], d)
    expect(d.gdn).toHaveBeenCalledTimes(2)
  })

  it('maps municipalities, cantons and the Bund and reports what is missing', async () => {
    const t = await loadFactorValues(codes, ['pop', 'workplaces', 'unknown_stat'], deps())
    expect(t.values.get(codes[0])?.get('pop')).toBe(436000)
    expect(t.values.get(codes[0])?.get('workplaces')).toBe(545000)
    // workplaces has no value for 230 -> simply absent, not 0
    expect(t.values.get(codes[1])?.has('workplaces')).toBe(false)
    expect(t.values.get(codes[1])?.has('unknown_stat')).toBe(false)
    // canton aggregate
    expect(t.values.get(codes[3])?.get('pop')).toBe(1600000)
    // Bund = sum of cantons
    expect(t.values.get(codes[4])?.get('pop')).toBe(3300000)
    expect(t.unmapped).toEqual([codes[2]])
  })

  it('records which year of the statistics was really used', async () => {
    const t = await loadFactorValues([codes[0]], ['pop', 'workplaces'], deps())
    expect(t.years.get('pop')?.get(codes[0])).toBe(2023) // nearest available
    expect(t.years.get('workplaces')?.get(codes[0])).toBe(2024)
  })

  it('reads the calculated rest of a canton from the municipal files (rest_<cantonId>)', async () => {
    const d = deps()
    d.gdn.mockImplementation(async () => result({ rest_1: 123456 }, 2024))
    const t = await loadFactorValues(['std/fs/gdn_zh_rest:2024'], ['pop'], {
      ...d,
      geoId: async () => 'rest_1',
    })
    expect(t.values.get('std/fs/gdn_zh_rest:2024')?.get('pop')).toBe(123456)
    expect(d.ktn).not.toHaveBeenCalled()
  })
})
