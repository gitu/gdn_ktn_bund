import { describe, it, expect } from 'vitest'
import {
  bestComparisonId,
  cloneConstellation,
  comparisonRow,
  constellationSignature,
  createConstellation,
  resolveEntities,
  resolveFactors,
  runConstellation,
} from '../constellation'
import { constellationFixture } from './testData'

const fixture = () =>
  constellationFixture({
    n: 10,
    truth: { pop: 1, workplaces: 0.5, total_area: 20 },
    noise: 0.05,
    seed: 15,
    accounts: { '30': 900, '36': 4000, '46': 250, '40': 1200 },
  })

describe('constellations', () => {
  it('defaults: all entities, all factors, 36 and 46, non-negative, automatic selection', () => {
    const c = createConstellation()
    expect(c).toMatchObject({
      entities: null,
      factors: null,
      accounts: { kind: 'codes', input: '36,46' },
      includeIntercept: false,
      mode: 'nonneg',
      selection: { enabled: true, maxFactors: 3 },
    })
  })

  it('clones are independent and get a new id', () => {
    const a = createConstellation({
      entities: ['x'],
      factors: ['pop'],
      accounts: { kind: 'children', parents: ['3'] },
    })
    const b = cloneConstellation(a, { name: 'copy' })
    expect(b.id).not.toBe(a.id)
    b.entities!.push('y')
    b.factors!.push('fte')
    if (b.accounts.kind === 'children') b.accounts.parents.push('4')
    expect(a.entities).toEqual(['x'])
    expect(a.factors).toEqual(['pop'])
    expect(a.accounts).toEqual({ kind: 'children', parents: ['3'] })
    expect(b.name).toBe('copy')
  })

  it('resolves entities in table order and factors in discovery order', () => {
    const f = fixture()
    const c = createConstellation({
      entities: [f.codes[5], f.codes[1], 'gdn/fs/ghost:2024'],
      factors: ['workplaces', 'pop'],
    })
    expect(resolveEntities(c, f.data)).toEqual([f.codes[1], f.codes[5]])
    expect(resolveFactors(c, f.allFactorIds)).toEqual(['pop', 'workplaces'])
    expect(resolveEntities(createConstellation(), f.data)).toEqual(f.codes)
  })

  it('runs the default question end to end', () => {
    const f = fixture()
    const run = runConstellation(createConstellation(), {
      financialData: f.data,
      factors: f.factors,
      allFactorIds: f.allFactorIds,
    })
    expect(run.outcome.isValid).toBe(true)
    if (!run.outcome.isValid) return
    expect(run.accountGroups).toEqual(['36', '46'])
    expect(run.outcome.accounts.map((a) => a.id)).toEqual(['36', '46'])
    expect(run.outcome.model.factorIds).toEqual(
      expect.arrayContaining(['pop', 'workplaces', 'total_area']),
    )
  })

  it('"all main accounts" fits every child of Aufwand and Ertrag at once', () => {
    const f = fixture()
    const c = createConstellation({
      accounts: { kind: 'children', parents: ['3', '4'] },
      selection: { enabled: false, maxFactors: 3 },
    })
    const run = runConstellation(c, {
      financialData: f.data,
      factors: f.factors,
      allFactorIds: f.allFactorIds,
    })
    expect(run.accountGroups).toEqual(['30', '36', '40', '46'])
    expect(run.outcome.isValid && run.outcome.metrics.accountCount).toBe(4)
  })

  it('a subset of entities fits only those columns', () => {
    const f = fixture()
    const c = createConstellation({ entities: f.codes.slice(0, 6) })
    const run = runConstellation(c, {
      financialData: f.data,
      factors: f.factors,
      allFactorIds: f.allFactorIds,
    })
    expect(run.entityCodes).toEqual(f.codes.slice(0, 6))
    expect(run.outcome.isValid && run.outcome.metrics.entityCount).toBe(6)
  })

  it('different constellations give different, comparable results', () => {
    const f = fixture()
    const ctx = { financialData: f.data, factors: f.factors, allFactorIds: f.allFactorIds }
    const onlyPop = runConstellation(createConstellation({ factors: ['pop'] }), ctx)
    const all = runConstellation(createConstellation(), ctx)
    const a = comparisonRow('a', 'Nur Einwohner', onlyPop)!
    const b = comparisonRow('b', 'Alle Faktoren', all)!
    expect(a.formula).toMatch(/^[\d.]+\*?pop$|^pop$/)
    expect(b.factorIds.length).toBeGreaterThan(1)
    expect(b.cvCV).toBeLessThan(a.cvCV)
    expect(bestComparisonId([a, b])).toBe('b')
  })

  it('reports invalid input with the contract message and unknown codes by name', () => {
    const f = fixture()
    const ctx = { financialData: f.data, factors: f.factors, allFactorIds: f.allFactorIds }
    const bad = runConstellation(
      createConstellation({ accounts: { kind: 'codes', input: 'abc+123' } }),
      ctx,
    )
    expect(bad.inputError).toMatch(/Invalid account codes.*Use numeric codes only/)
    expect(bad.outcome.isValid).toBe(false)
    const unknown = runConstellation(
      createConstellation({ accounts: { kind: 'codes', input: '777,888' } }),
      ctx,
    )
    expect(unknown.unknownCodes).toEqual(['777', '888'])
    expect(unknown.outcome).toMatchObject({ isValid: false })
    expect(!unknown.outcome.isValid && unknown.outcome.error).toContain('777')
  })

  it('a result is outdated as soon as anything it depends on changes', () => {
    const f = fixture()
    const base = createConstellation()
    const sig = (c = base, data = f.data) => constellationSignature(c, data, f.allFactorIds)
    expect(sig()).toBe(sig())
    expect(sig({ ...base, mode: 'ols' })).not.toBe(sig())
    expect(sig({ ...base, includeIntercept: true })).not.toBe(sig())
    expect(sig({ ...base, accounts: { kind: 'codes', input: '30' } })).not.toBe(sig())
    expect(sig({ ...base, selection: { enabled: true, maxFactors: 2 } })).not.toBe(sig())
    expect(sig({ ...base, factors: ['pop'] })).not.toBe(sig())
    // a column was added to / removed from the table
    f.data.entities.delete(f.codes[0])
    expect(sig()).not.toBe(constellationSignature(base, null, f.allFactorIds))
    // a name change does not invalidate anything
    expect(sig({ ...base, name: 'renamed' })).toBe(sig())
  })

  it('failed runs are not part of the comparison', () => {
    expect(comparisonRow('x', 'x', undefined)).toBeNull()
    expect(bestComparisonId([])).toBeNull()
  })
})
