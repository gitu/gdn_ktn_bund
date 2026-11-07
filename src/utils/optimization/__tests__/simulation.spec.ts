import { describe, it, expect } from 'vitest'
import { fitScalingModel } from '../fitScalingModel'
import { SENSITIVITY_STEPS, deviations, expectedVsActual, sensitivity, whatIf } from '../simulation'
import type { FitResult } from '../types'
import { synthetic } from './testData'

function fit(
  opts: Parameters<typeof synthetic>[0],
  fitOpts: Parameters<typeof fitScalingModel>[1] = {},
): FitResult {
  const r = fitScalingModel(synthetic(opts).input, fitOpts)
  if (!r.isValid) throw new Error(r.error)
  return r
}

/** Proportional model: scale = c * pop only, so changes are easy to predict by hand. */
const proportional = () =>
  fit({ n: 10, truth: { pop: 1 }, noise: 0.1, seed: 4, accounts: { '36': 4000, '46': 250 } })

describe('whatIf', () => {
  it('reproduces the fitted expectation for the factors of an existing entity', () => {
    const r = fit({ n: 8, truth: { pop: 1, workplaces: 0.5 }, noise: 0.05, seed: 2 })
    const e = r.entities[3]
    const w = whatIf(r, e.factors, e.id)
    expect(w.valid).toBe(true)
    expect(w.scale).toBeCloseTo(e.scale, 8)
    w.accounts.forEach((acc, a) => {
      expect(acc.expected).toBeCloseTo(r.expected[a][3], 6)
      expect(acc.actual).toBeCloseTo(r.actual[a][3], 6)
      expect(acc.deviation).toBeCloseTo(r.actual[a][3] / r.expected[a][3] - 1, 8)
    })
  })

  it('is linear: doubling the inhabitants of a proportional model doubles the expectation', () => {
    const r = proportional()
    const base = whatIf(r, { pop: 10000 })
    const doubled = whatIf(r, { pop: 20000 })
    base.accounts.forEach((acc, a) =>
      expect(doubled.accounts[a].expected / acc.expected).toBeCloseTo(2, 10),
    )
    expect(base.accounts[0].expected).toBeCloseTo(
      r.accounts[0].level * r.model.coefficients.pop * 10000,
      6,
    )
  })

  it('derives the range from the out-of-sample error of each account', () => {
    const r = proportional()
    const w = whatIf(r, { pop: 12000 })
    w.accounts.forEach((acc, a) => {
      expect(acc.range).toBeCloseTo(Math.min(r.accounts[a].cvCV, 0.95), 12)
      expect(acc.high - acc.expected).toBeCloseTo(acc.expected - acc.low, 8)
      expect(acc.high).toBeGreaterThan(acc.expected)
      expect(acc.low).toBeGreaterThanOrEqual(0)
    })
  })

  it('refuses to predict without all model factors', () => {
    const r = fit({ n: 8, truth: { pop: 1, workplaces: 0.5 }, noise: 0.05, seed: 2 })
    const w = whatIf(r, { pop: 5000 })
    expect(w.valid).toBe(false)
    expect(w.missingFactors).toEqual(['workplaces'])
  })

  it('without a reference entity there is no actual value', () => {
    const w = whatIf(proportional(), { pop: 5000 })
    expect(w.accounts.every((a) => a.actual === null && a.deviation === null)).toBe(true)
  })

  it('keeps the sign of accounts that are negative in the data', () => {
    const base = synthetic({ n: 8, truth: { pop: 1 }, seed: 6, accounts: { '36': 100 } })
    base.input.accounts = base.input.accounts.map((a) => ({
      ...a,
      values: new Map([...a.values].map(([k, v]) => [k, -v])),
    }))
    const r = fitScalingModel(base.input)
    if (!r.isValid) throw new Error(r.error)
    const w = whatIf(r, { pop: 5000 })
    expect(w.accounts[0].expected).toBeLessThan(0)
    expect(w.accounts[0].low).toBeLessThanOrEqual(w.accounts[0].high)
  })
})

describe('expectedVsActual', () => {
  const r = fit({
    n: 12,
    truth: { pop: 1, workplaces: 0.5 },
    noise: 0.02,
    seed: 3,
    outlier: { index: 4, factor: 3 },
  })

  it('ranks entities from highest to lowest deviation, rank 1 = spends most for its size', () => {
    const rows = expectedVsActual(r, '36')
    expect(rows).toHaveLength(12)
    expect(rows[0].entityId).toBe(r.entities[4].id)
    expect(rows[0].rank).toBe(1)
    expect(rows[0].deviation).toBeGreaterThan(1.5)
    for (let i = 1; i < rows.length; i++)
      expect(rows[i].deviation).toBeLessThanOrEqual(rows[i - 1].deviation)
    expect(rows.map((x) => x.rank)).toEqual(rows.map((_, i) => i + 1))
  })

  it('uses leave-one-out expectations, so a model cannot hide an outlier by fitting it', () => {
    const row = expectedVsActual(r, '36').find((x) => x.entityId === r.entities[4].id)!
    const inSample = r.actual[0][4] / r.expected[0][4] - 1
    expect(row.deviation).toBeGreaterThan(inSample)
    expect(row.expected).toBeCloseTo(r.cvExpected[0][4], 8)
  })

  it('averages the accounts for the "all accounts" view', () => {
    const rows = expectedVsActual(r, null)
    const dev = deviations(r, null)
    expect(rows[0].actual).toBeNull()
    const first = rows[0]
    const idx = r.entities.findIndex((e) => e.id === first.entityId)
    expect(first.deviation).toBeCloseTo(dev[idx], 10)
    const manual =
      r.accounts
        .map((_, a) => r.actual[a][idx] / r.cvExpected[a][idx] - 1)
        .reduce((s, v) => s + v, 0) / r.accounts.length
    expect(first.deviation).toBeCloseTo(manual, 10)
  })

  it('deviations sum to roughly zero for a well calibrated model (sanity)', () => {
    const clean = fit({ n: 30, truth: { pop: 1 }, noise: 0.1, seed: 9 })
    const mean = deviations(clean, '36').reduce((s, d) => s + d, 0) / 30
    expect(Math.abs(mean)).toBeLessThan(0.08)
  })
})

describe('sensitivity', () => {
  const r = proportional()
  const entity = r.entities[2]

  it('a +10 % change of the only (proportional) factor changes the expectation by exactly +10 %', () => {
    const s = sensitivity(r, entity.id, '36')!
    const row = s.rows.find((x) => x.factorId === 'pop')!
    const plus10 = row.cells.find((c) => c.delta === 0.1)!
    const minus25 = row.cells.find((c) => c.delta === -0.25)!
    expect(plus10.expectedChange).toBeCloseTo(0.1, 6)
    expect(minus25.expectedChange).toBeCloseTo(-0.25, 6)
    // the deviation moves the opposite way: 1+dev' = (1+dev)/(1+delta)
    expect(1 + plus10.deviation).toBeCloseTo((1 + s.baselineDeviation) / 1.1, 6)
  })

  it('the rank moves in the direction of the change and "all factors" equals the single factor here', () => {
    const s = sensitivity(r, entity.id, null)!
    const row = s.rows.find((x) => x.factorId === 'pop')!
    const all = s.rows.find((x) => x.factorId === null)!
    // more inhabitants -> larger expectation -> smaller deviation -> rank number can only grow
    const ranks = row.cells.map((c) => c.rank)
    expect(ranks).toEqual([...ranks].sort((a, b) => a - b)) // -25 %, -10 %, +10 %, +25 %: non-decreasing
    expect(all.cells.map((c) => c.rank)).toEqual(row.cells.map((c) => c.rank))
    expect(s.baselineRank).toBeGreaterThanOrEqual(1)
    expect(s.baselineRank).toBeLessThanOrEqual(s.entityCount)
  })

  it('has one row per model factor plus the combined row and the standard steps', () => {
    const multi = fit({ n: 12, truth: { pop: 1, workplaces: 0.5 }, noise: 0.05, seed: 8 })
    const s = sensitivity(multi, multi.entities[1].id, '46')!
    expect(s.rows.map((x) => x.factorId)).toEqual([...multi.model.factorIds, null])
    expect(s.rows[0].cells.map((c) => c.delta)).toEqual([...SENSITIVITY_STEPS])
  })

  it('the baseline rank agrees with the expected-vs-actual table', () => {
    const s = sensitivity(r, entity.id, '36')!
    const table = expectedVsActual(r, '36')
    expect(s.baselineRank).toBe(table.find((x) => x.entityId === entity.id)!.rank)
  })

  it('returns null for an unknown entity', () => {
    expect(sensitivity(r, 'nope', null)).toBeNull()
  })
})
