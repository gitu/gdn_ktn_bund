import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useOptimizerStore } from '../optimizer'
import { createConstellation } from '@/utils/optimization/constellation'
import { MAX_SCENARIOS } from '@/utils/optimization/scenarioCodec'
import { constellationFixture } from '@/utils/optimization/__tests__/testData'
import type { StatsAvailabilityInfo } from '@/types/StatsData'

const fixture = constellationFixture({
  n: 8,
  truth: { pop: 1, workplaces: 0.5 },
  noise: 0.05,
  seed: 7,
  accounts: { '36': 4000, '46': 250 },
})
const label = (id: string) => ({ de: id, fr: id, it: id, en: id })
const stats = fixture.allFactorIds.map(
  (id) => ({ id, name: label(id), unit: label('u') }) as StatsAvailabilityInfo,
)
const ctx = { financialData: fixture.data, stats, loadFactors: async () => fixture.factors }

describe('optimizer store (scenarios)', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('starts with one scenario that is selected', () => {
    const s = useOptimizerStore()
    expect(s.scenarios).toHaveLength(1)
    expect(s.selected.constellation.id).toBe(s.selectedId)
  })

  it('adds, selects, duplicates (definition only) and removes', async () => {
    const s = useOptimizerStore()
    const first = s.selectedId
    await s.run(first, ctx)
    const copy = s.duplicate(first, 'Kopie')!
    expect(copy.constellation.id).not.toBe(first)
    expect(copy.constellation.name).toBe('Kopie')
    expect(copy.run).toBeNull() // results are never copied
    expect(s.selectedId).toBe(copy.constellation.id)
    s.add({ mode: 'robust' })
    expect(s.scenarios.map((x) => x.constellation.mode)).toEqual(['nonneg', 'nonneg', 'robust'])
    s.select(first)
    s.remove(first)
    expect(s.scenarios).toHaveLength(2)
    expect(s.selectedId).not.toBe(first)
  })

  it('never ends up without a scenario and never exceeds the maximum', () => {
    const s = useOptimizerStore()
    s.update(s.selectedId, { mode: 'ols' })
    s.remove(s.selectedId)
    expect(s.scenarios).toHaveLength(1)
    expect(s.selected.constellation.mode).toBe('nonneg') // reset to the default
    for (let i = 0; i < 20; i++) s.add()
    expect(s.scenarios).toHaveLength(MAX_SCENARIOS)
    expect(s.canAdd).toBe(false)
    expect(s.add()).toBeNull()
    expect(s.duplicate(s.selectedId)).toBeNull()
  })

  it('runs a scenario and marks the result outdated when the definition changes', async () => {
    const s = useOptimizerStore()
    const id = s.selectedId
    await s.run(id, ctx)
    expect(s.selected.status).toBe('done')
    expect(s.selected.run?.outcome.isValid).toBe(true)
    const ids = fixture.allFactorIds
    expect(s.isStale(s.selected, fixture.data, ids)).toBe(false)
    s.update(id, { includeIntercept: true })
    expect(s.isStale(s.selected, fixture.data, ids)).toBe(true)
    s.update(id, { name: 'renamed' })
    await s.run(id, ctx)
    expect(s.isStale(s.selected, fixture.data, ids)).toBe(false)
  })

  it('reports invalid input as an error status with the message', async () => {
    const s = useOptimizerStore()
    s.update(s.selectedId, { accounts: { kind: 'codes', input: 'abc' } })
    await s.run(s.selectedId, ctx)
    expect(s.selected.status).toBe('error')
    expect(s.selected.error).toMatch(/Invalid account codes/)
  })

  it('survives a failing statistics loader', async () => {
    const s = useOptimizerStore()
    await s.run(s.selectedId, {
      ...ctx,
      loadFactors: async () => Promise.reject(new Error('offline')),
    })
    expect(s.selected.status).toBe('error')
    expect(s.selected.error).toBe('offline')
  })

  it('replaces all scenarios from a link (definitions only) and runs them in order', async () => {
    const s = useOptimizerStore()
    s.replaceAll([createConstellation({ mode: 'ols' }), createConstellation({ mode: 'robust' })])
    expect(s.scenarios.every((x) => x.run === null && x.status === 'idle')).toBe(true)
    await s.runAll(ctx)
    expect(s.scenarios.map((x) => x.status)).toEqual(['done', 'done'])
    s.replaceAll([])
    expect(s.scenarios).toHaveLength(1)
  })
})
