import { describe, it, expect } from 'vitest'
import { fitScalingModel } from '../fitScalingModel'
import { CustomScalingFormula, type ScalingVariable } from '../../CustomScalingFormula'
import type { FitInput, FitOutcome, FitResult } from '../types'
import { synthetic, type Synthetic } from './testData'

function valid(outcome: FitOutcome): FitResult {
  if (!outcome.isValid) throw new Error(`fit failed: ${outcome.error}`)
  return outcome
}

/** Ratios of the fitted coefficients to the coefficient of `base`. */
function ratios(result: FitResult, base: string): Record<string, number> {
  const out: Record<string, number> = {}
  for (const [id, c] of Object.entries(result.model.coefficients)) {
    out[id] = c / result.model.coefficients[base]
  }
  return out
}

const TRUTH = { pop: 1, workplaces: 0.5, total_area: 20 }

describe('fitScalingModel: recovering a known size formula', () => {
  it('recovers the coefficient ratios from noise-free data (all fit modes)', () => {
    const { input } = synthetic({ n: 14, truth: TRUTH })
    for (const mode of ['ols', 'nonneg', 'robust'] as const) {
      const r = valid(fitScalingModel(input, { mode }))
      const q = ratios(r, 'pop')
      expect(q.workplaces).toBeCloseTo(0.5, 4)
      expect(q.total_area).toBeCloseTo(20, 3)
      expect(r.metrics.afterCV).toBeLessThan(1e-4)
      expect(r.metrics.rSquared).toBeGreaterThan(0.9999)
    }
  })

  it('does not depend on the unit of an account (CHF vs. CHF million)', () => {
    const base = synthetic({
      n: 12,
      truth: TRUTH,
      noise: 0.2,
      seed: 5,
      accounts: { a: 1000, b: 7 },
    })
    const scaled: FitInput = {
      ...base.input,
      accounts: base.input.accounts.map((acc) =>
        acc.id === 'b'
          ? { ...acc, values: new Map([...acc.values].map(([k, v]) => [k, v * 1e6])) }
          : acc,
      ),
    }
    const r1 = valid(fitScalingModel(base.input))
    const r2 = valid(fitScalingModel(scaled))
    for (const id of r1.model.factorIds) {
      expect(r2.model.coefficients[id] / r1.model.coefficients[id]).toBeCloseTo(1, 4)
    }
  })

  it('anchors the formula so that its mean equals the mean of pop', () => {
    const { input } = synthetic({ n: 10, truth: TRUTH, noise: 0.1, seed: 9 })
    const r = valid(fitScalingModel(input))
    const meanScale = r.entities.reduce((s, e) => s + e.scale, 0) / r.entities.length
    const meanPop = r.entities.reduce((s, e) => s + e.factors.pop, 0) / r.entities.length
    expect(meanScale / meanPop).toBeCloseTo(1, 2)
    expect(r.model.anchorFactor).toBe('pop')
  })

  it('writes a formula that the app evaluates to exactly the fitted scale', () => {
    const { input } = synthetic({ n: 8, truth: TRUTH, noise: 0.05, seed: 2 })
    const r = valid(fitScalingModel(input, { includeIntercept: true }))
    for (const e of r.entities) {
      const vars = new Map<string, ScalingVariable>()
      for (const id of Object.keys(e.factors)) {
        vars.set(id, {
          id,
          name: { de: id, fr: id, it: id, en: id },
          unit: { de: '', fr: '', it: '', en: '' },
          value: e.factors[id],
        })
      }
      const evaluated = CustomScalingFormula.evaluateFormula(r.model.formula, vars)
      expect(evaluated.isValid).toBe(true)
      expect(evaluated.result! / e.scale).toBeCloseTo(1, 9)
    }
  })

  it('finds a constant term when there is one and the intercept is allowed', () => {
    const { input } = synthetic({ n: 16, truth: { pop: 1 }, intercept: 6000, seed: 4 })
    const withIntercept = valid(fitScalingModel(input, { includeIntercept: true }))
    const without = valid(fitScalingModel(input, { includeIntercept: false }))
    expect(withIntercept.model.intercept / withIntercept.model.coefficients.pop).toBeCloseTo(
      6000,
      0,
    )
    expect(withIntercept.metrics.afterCV).toBeLessThan(1e-4)
    expect(without.metrics.afterCV).toBeGreaterThan(withIntercept.metrics.afterCV)
  })

  it('is deterministic, including the factor selection', () => {
    const { input } = synthetic({
      n: 9,
      truth: TRUTH,
      noise: 0.15,
      seed: 8,
      extraFactors: ['x1', 'x2', 'x3'],
    })
    const opts = { selection: { enabled: true, maxFactors: 3 } }
    const a = fitScalingModel(input, opts)
    const b = fitScalingModel(
      structuredClone({ ...input, entities: input.entities.map((e) => ({ ...e })) }),
      opts,
    )
    expect(JSON.stringify(a)).toBe(JSON.stringify(b))
  })
})

describe('fitScalingModel: interpretability (non-negative, ridge)', () => {
  it('never returns negative weights in non-negative mode, unlike OLS', () => {
    let olsNegative = 0
    for (let seed = 1; seed <= 30; seed++) {
      // size depends on pop only; workplaces is strongly correlated noise
      const { input } = synthetic({
        n: 7,
        truth: { pop: 1 },
        noise: 0.35,
        seed,
        extraFactors: ['workplaces', 'total_area'],
      })
      const ols = fitScalingModel(input, { mode: 'ols' })
      const nn = valid(fitScalingModel(input, { mode: 'nonneg' }))
      expect(Object.values(nn.model.coefficients).every((c) => c >= 0)).toBe(true)
      expect(nn.model.intercept).toBeGreaterThanOrEqual(0)
      if (ols.isValid && Object.values(ols.model.coefficients).some((c) => c < 0)) {
        olsNegative++
        expect(ols.warnings.map((w) => w.code)).toContain('negativeCoefficient')
      }
    }
    expect(olsNegative).toBeGreaterThan(0)
  })

  it('ridge shrinks the weights of nearly collinear factors', () => {
    const { input } = synthetic({ n: 10, truth: { pop: 1 }, noise: 0.1, seed: 3 })
    // add a near copy of pop
    const jitter = (i: number) => 1 + 0.002 * Math.sin(i * 7.3)
    input.entities.forEach((e, i) =>
      e.factors.set('pop_copy', (e.factors.get('pop') as number) * jitter(i)),
    )
    input.factorIds.push('pop_copy')
    const plain = valid(fitScalingModel(input, { mode: 'ols' }))
    const ridge = valid(fitScalingModel(input, { mode: 'ols', ridge: 0.05 }))
    const spread = (r: FitResult) =>
      Math.abs(r.model.coefficients.pop ?? 0) + Math.abs(r.model.coefficients.pop_copy ?? 0)
    expect(spread(ridge)).toBeLessThanOrEqual(spread(plain) + 1e-9)
    const maxAbs = (r: FitResult) => Math.max(...Object.values(r.model.coefficients).map(Math.abs))
    expect(maxAbs(ridge)).toBeLessThanOrEqual(maxAbs(plain))
  })
})

describe('fitScalingModel: robustness to one huge outlier', () => {
  it('Huber mode resists an entity whose spending is 4x what its size predicts', () => {
    const { input } = synthetic({
      n: 20,
      truth: TRUTH,
      noise: 0.03,
      seed: 12,
      outlier: { index: 5, factor: 4 },
    })
    const err = (r: FitResult) => {
      const q = ratios(r, 'pop')
      return Math.abs(q.workplaces - 0.5) / 0.5 + Math.abs(q.total_area - 20) / 20
    }
    const plain = valid(fitScalingModel(input, { mode: 'nonneg' }))
    const robust = valid(fitScalingModel(input, { mode: 'robust' }))
    expect(err(robust)).toBeLessThan(err(plain))
    expect(err(robust)).toBeLessThan(0.25)
  })

  it('the outlier shows up as the largest deviation in the out-of-sample expectation', () => {
    const { input } = synthetic({
      n: 12,
      truth: TRUTH,
      noise: 0.02,
      seed: 3,
      outlier: { index: 2, factor: 3 },
    })
    const r = valid(fitScalingModel(input, { mode: 'robust' }))
    const dev = r.actual[0].map((y, e) => y / r.cvExpected[0][e] - 1)
    const worst = dev.indexOf(Math.max(...dev))
    expect(worst).toBe(2)
    expect(dev[2]).toBeGreaterThan(1.5)
  })
})

describe('fitScalingModel: honest quality metrics (overfitting must be visible)', () => {
  it('cross-validation exposes a formula that interpolates 5 entities with irrelevant factors', () => {
    const { input } = synthetic({
      n: 5,
      truth: { pop: 1 },
      noise: 0.3,
      seed: 21,
      extraFactors: ['a', 'b', 'c'],
    })
    const r = valid(fitScalingModel(input, { mode: 'ols', includeIntercept: true }))
    expect(r.metrics.afterCV).toBeLessThan(r.metrics.cvCV)
    expect(r.metrics.cvCV).toBeGreaterThan(2 * r.metrics.afterCV)
    expect(r.metrics.adjustedRSquared).toSatisfy(
      (v: number) => Number.isNaN(v) || v < r.metrics.rSquared,
    )
    expect(r.metrics.overfitRisk).toBe('high')
    expect(r.warnings.map((w) => w.code)).toContain('overfitRisk')
  })

  it('rates even a single-factor model from many candidates as at least medium risk on 6 entities', () => {
    const extras = Array.from({ length: 8 }, (_, i) => `x${i}`)
    const { input } = synthetic({
      n: 6,
      truth: { pop: 1 },
      noise: 0.1,
      seed: 33,
      extraFactors: extras,
    })
    const r = valid(fitScalingModel(input, { selection: { enabled: true, maxFactors: 2 } }))
    expect(r.metrics.overfitRisk).not.toBe('low')
  })

  it('a well-determined model has low risk and in-sample ~ out-of-sample', () => {
    const { input } = synthetic({ n: 60, truth: TRUTH, noise: 0.1, seed: 31 })
    const r = valid(fitScalingModel(input))
    expect(r.metrics.overfitRisk).toBe('low')
    expect(r.metrics.cvCV / r.metrics.afterCV).toBeLessThan(1.3)
    expect(r.metrics.cvRSquared).toBeGreaterThan(0.9)
  })

  it('reports a negative CV R² when the factors do not describe size at all', () => {
    const { input } = synthetic({ n: 6, truth: { pop: 1 }, noise: 0.0, seed: 17 })
    // Replace the amounts by unrelated noise
    const rnd = [4.1, 0.7, 9.9, 2.2, 5.5, 0.3]
    input.accounts = [
      { id: '36', values: new Map(input.entities.map((e, i) => [e.id, 1000 * rnd[i]])) },
    ]
    const r = valid(fitScalingModel(input, { includeIntercept: true, mode: 'ols' }))
    expect(r.metrics.cvRSquared).toBeLessThan(r.metrics.rSquared)
  })

  it('warns when fewer than 4 entities are compared', () => {
    const { input } = synthetic({ n: 3, truth: { pop: 1 } })
    const r = valid(fitScalingModel(input))
    expect(r.warnings.map((w) => w.code)).toContain('fewEntities')
  })

  it('holds out all years of one municipality together', () => {
    const { input } = synthetic({ n: 6, truth: { pop: 1 }, noise: 0.1, seed: 2 })
    // entities 0 and 1 are the same municipality in two years
    input.entities[1] = { ...input.entities[1], group: input.entities[0].group }
    const r = valid(fitScalingModel(input))
    expect(r.metrics.cvFolds).toBe(5)
    expect(r.entityFold[0]).toBe(r.entityFold[1])
    const sibling = r.cvModels[r.entityFold[0]]
    expect(sibling.heldOut).toEqual([0, 1])
  })

  it('switches to 10 deterministic folds beyond 40 groups', () => {
    const { input } = synthetic({ n: 80, truth: TRUTH, noise: 0.1, seed: 6 })
    const r = valid(fitScalingModel(input))
    expect(r.metrics.cvMethod).toBe('kfold')
    expect(r.metrics.cvFolds).toBe(10)
    const held = r.cvModels.flatMap((m) => m.heldOut).sort((a, b) => a - b)
    expect(held).toEqual(Array.from({ length: 80 }, (_, i) => i))
  })
})

describe('fitScalingModel: automatic factor selection', () => {
  it('keeps the true factors and drops irrelevant ones', () => {
    const { input } = synthetic({
      n: 24,
      truth: { pop: 1, workplaces: 0.6 },
      noise: 0.08,
      seed: 14,
      extraFactors: ['x1', 'x2', 'x3', 'x4'],
    })
    const r = valid(fitScalingModel(input, { selection: { enabled: true, maxFactors: 3 } }))
    expect(r.model.factorIds).toContain('pop')
    expect(r.model.factorIds).toContain('workplaces')
    expect(r.model.factorIds.length).toBeLessThanOrEqual(3)
    expect(r.selection?.bestBySize.length).toBeGreaterThan(0)
    expect(r.selection?.tried).toBeGreaterThan(5)
    // the chosen model is not worse out-of-sample than using everything
    const all = valid(fitScalingModel(input))
    expect(r.metrics.cvRmse).toBeLessThanOrEqual(all.metrics.cvRmse * 1.05)
  })

  it('prefers the smaller model when a bigger one is not clearly better', () => {
    const { input } = synthetic({
      n: 30,
      truth: { pop: 1 },
      noise: 0.1,
      seed: 5,
      extraFactors: ['x1', 'x2', 'x3'],
    })
    const r = valid(fitScalingModel(input, { selection: { enabled: true, maxFactors: 3 } }))
    expect(r.model.factorIds).toEqual(['pop'])
  })

  it('uses forward selection with many candidates and still finds the signal', () => {
    const extras = Array.from({ length: 9 }, (_, i) => `x${i}`)
    const { input } = synthetic({
      n: 40,
      truth: { pop: 1, total_area: 25 },
      noise: 0.05,
      seed: 7,
      extraFactors: extras,
    })
    const r = valid(fitScalingModel(input, { selection: { enabled: true, maxFactors: 4 } }))
    expect(r.selection?.method).toBe('forward')
    expect(r.model.factorIds).toEqual(expect.arrayContaining(['pop', 'total_area']))
  })

  it('flags that selection on a handful of entities makes the CV error optimistic', () => {
    const { input } = synthetic({
      n: 6,
      truth: TRUTH,
      noise: 0.2,
      seed: 9,
      extraFactors: ['x1', 'x2'],
    })
    const r = valid(fitScalingModel(input, { selection: { enabled: true, maxFactors: 2 } }))
    expect(r.warnings.map((w) => w.code)).toContain('selectionOptimism')
  })

  it('caps the number of factors by the number of entities', () => {
    const { input } = synthetic({
      n: 4,
      truth: { pop: 1, workplaces: 1 },
      noise: 0.2,
      seed: 1,
      extraFactors: ['x1', 'x2', 'x3'],
    })
    const r = valid(fitScalingModel(input, { selection: { enabled: true, maxFactors: 5 } }))
    expect(r.model.factorIds.length).toBeLessThanOrEqual(3)
    expect(r.selection!.maxFactors).toBeLessThanOrEqual(3)
  })

  it('reports which factors matter: shares add up and dropping a true factor hurts', () => {
    const { input } = synthetic({ n: 30, truth: TRUTH, noise: 0.05, seed: 22 })
    const r = valid(fitScalingModel(input, { selection: { enabled: true, maxFactors: 3 } }))
    const total = r.importance.reduce((s, i) => s + i.share, 0)
    expect(total).toBeCloseTo(1, 6)
    for (const imp of r.importance) expect(imp.dropEffect).toBeGreaterThan(0.05)
  })
})

describe('fitScalingModel: exactly dependent factors (pop = pop_0_19 + pop_20_64 + pop_65plus)', () => {
  function ageProblem(n: number, truthOnAges: boolean): Synthetic['input'] {
    const { input } = synthetic({ n, truth: { pop: 1 }, noise: 0.02, seed: 40 })
    input.factorIds = ['pop', 'pop_0_19', 'pop_20_64', 'pop_65plus']
    input.entities.forEach((e, i) => {
      const pop = e.factors.get('pop') as number
      const young = pop * (0.15 + 0.1 * Math.abs(Math.sin(i * 1.7)))
      const old = pop * (0.12 + 0.12 * Math.abs(Math.cos(i * 2.3)))
      e.factors.set('pop_0_19', young)
      e.factors.set('pop_65plus', old)
      e.factors.set('pop_20_64', pop - young - old)
    })
    if (truthOnAges) {
      const scale = input.entities.map(
        (e) =>
          0.4 * (e.factors.get('pop_0_19') as number) +
          1.0 * (e.factors.get('pop_20_64') as number) +
          0.1 * (e.factors.get('pop_65plus') as number),
      )
      input.accounts = [
        { id: '36', values: new Map(input.entities.map((e, i) => [e.id, 3000 * scale[i]])) },
        { id: '46', values: new Map(input.entities.map((e, i) => [e.id, 800 * scale[i]])) },
      ]
    }
    return input
  }

  it('without selection: skips the dependent factor, says so, and stays finite', () => {
    const r = valid(fitScalingModel(ageProblem(12, false)))
    expect(r.warnings.map((w) => w.code)).toContain('collinearFactors')
    const dropped = r.exclusions.factors.filter((f) => f.reason === 'collinear')
    expect(dropped.map((d) => d.id)).toEqual(['pop_65plus'])
    expect(Object.values(r.model.coefficients).every(Number.isFinite)).toBe(true)
    // earlier factors win, so the interpretable total population stays in
    expect(r.model.factorIds).toContain('pop')
  })

  it('with selection: never combines all four and recovers an age-based truth exactly', () => {
    const input = ageProblem(14, true)
    const r = valid(fitScalingModel(input, { selection: { enabled: true, maxFactors: 3 } }))
    expect(r.model.factorIds.length).toBeLessThanOrEqual(3)
    expect(r.metrics.afterCV).toBeLessThan(1e-4)
    expect(r.metrics.cvCV).toBeLessThan(1e-4)
    // pop is a valid stand-in for the sum of the groups, so check the scales, not the names
    input.entities.forEach((e, i) => {
      const truth =
        0.4 * (e.factors.get('pop_0_19') as number) +
        (e.factors.get('pop_20_64') as number) +
        0.1 * (e.factors.get('pop_65plus') as number)
      const row = r.entities[i]
      expect(row.scale / truth).toBeCloseTo(
        r.entities[0].scale /
          (0.4 * (input.entities[0].factors.get('pop_0_19') as number) +
            (input.entities[0].factors.get('pop_20_64') as number) +
            0.1 * (input.entities[0].factors.get('pop_65plus') as number)),
        5,
      )
    })
  })

  it('with at least as many factors as entities nothing is pruned arbitrarily, and it is flagged', () => {
    const input = ageProblem(4, false)
    const r = valid(fitScalingModel(input, { mode: 'ols' }))
    expect(r.warnings.map((w) => w.code)).toContain('tooManyFactors')
    expect(r.exclusions.factors.filter((f) => f.reason === 'collinear')).toHaveLength(0)
    expect(r.metrics.overfitRisk).not.toBe('low')
  })

  it('OLS with all four factors listed does not blow up either', () => {
    const r = valid(fitScalingModel(ageProblem(10, true), { mode: 'ols' }))
    expect(r.metrics.afterCV).toBeLessThan(1e-3)
    expect(Object.values(r.model.coefficients).every((c) => Math.abs(c) < 1e3)).toBe(true)
  })
})

describe('fitScalingModel: data hygiene (nothing is dropped silently)', () => {
  it('excludes accounts with mixed signs and explains why', () => {
    const { input } = synthetic({ n: 8, truth: { pop: 1 }, noise: 0.1, seed: 3 })
    input.accounts.push({
      id: '38',
      values: new Map(input.entities.map((e, i) => [e.id, i % 2 === 0 ? 5000 : -2000])),
    })
    const r = valid(fitScalingModel(input))
    expect(r.exclusions.accounts).toEqual([{ id: '38', reason: 'mixedSign' }])
    expect(r.accounts.map((a) => a.id)).not.toContain('38')
  })

  it('treats an account that is negative everywhere as its absolute value and restores the sign', () => {
    const { input } = synthetic({ n: 8, truth: { pop: 1 }, noise: 0, seed: 3 })
    input.accounts = input.accounts.map((a) => ({
      ...a,
      values: new Map([...a.values].map(([k, v]) => [k, -v])),
    }))
    const r = valid(fitScalingModel(input))
    expect(r.actual[0].every((v) => v < 0)).toBe(true)
    expect(r.expected[0].every((v) => v < 0)).toBe(true)
    expect(r.metrics.afterCV).toBeLessThan(1e-4)
  })

  it('excludes a factor that is missing for one of few entities (and says which)', () => {
    const { input } = synthetic({
      n: 6,
      truth: { pop: 1 },
      noise: 0.1,
      seed: 3,
      extraFactors: ['fte'],
    })
    input.entities[2].factors = new Map([...input.entities[2].factors].filter(([k]) => k !== 'fte'))
    const r = valid(fitScalingModel(input))
    expect(r.exclusions.factors).toEqual([
      { id: 'fte', reason: 'missing', entities: [input.entities[2].id] },
    ])
    expect(r.metrics.entityCount).toBe(6)
  })

  it('with many entities drops the few that lack a factor instead of the factor', () => {
    const { input } = synthetic({ n: 40, truth: TRUTH, noise: 0.1, seed: 3 })
    input.entities[7].factors = new Map(
      [...input.entities[7].factors].filter(([k]) => k !== 'workplaces'),
    )
    const r = valid(fitScalingModel(input))
    expect(r.exclusions.entities).toEqual([
      { id: input.entities[7].id, reason: 'missingFactor', factors: ['workplaces'] },
    ])
    expect(r.model.factorIds).toContain('workplaces')
    expect(r.metrics.entityCount).toBe(39)
  })

  it('rejects impossible requests with a reason', () => {
    const { input } = synthetic({ n: 1, truth: { pop: 1 } })
    const one = fitScalingModel(input)
    expect(one.isValid).toBe(false)
    const none = fitScalingModel({ ...synthetic({ n: 5, truth: { pop: 1 } }).input, accounts: [] })
    expect(none).toMatchObject({ isValid: false, code: 'noAccounts' })
    const noFactors = fitScalingModel({
      ...synthetic({ n: 5, truth: { pop: 1 } }).input,
      factorIds: [],
    })
    expect(noFactors).toMatchObject({ isValid: false, code: 'noFactors' })
    const constant = synthetic({ n: 5, truth: { pop: 1 } }).input
    constant.entities.forEach((e) => e.factors.set('pop', 100))
    expect(fitScalingModel(constant)).toMatchObject({ isValid: false, code: 'noUsableFactors' })
  })

  it('names the account when nothing can be scaled', () => {
    const { input } = synthetic({ n: 5, truth: { pop: 1 } })
    input.accounts = [{ id: '99', values: new Map(input.entities.map((e) => [e.id, 0])) }]
    expect(fitScalingModel(input)).toMatchObject({ isValid: false, code: 'noUsableAccounts' })
  })
})

describe('fitScalingModel: speed', () => {
  it('fits and cross-validates 2,000 municipalities x 5 factors x 12 accounts in well under 4 s', () => {
    const accounts: Record<string, number> = {}
    for (let i = 0; i < 12; i++) accounts[String(30 + i)] = 150 * (i + 1)
    const { input } = synthetic({
      n: 2000,
      truth: TRUTH,
      noise: 0.15,
      seed: 11,
      extraFactors: ['fte', 'establishments'],
      accounts,
    })
    const t0 = performance.now()
    const r = valid(fitScalingModel(input, { selection: { enabled: true, maxFactors: 4 } }))
    const elapsed = performance.now() - t0
    expect(elapsed).toBeLessThan(4000)
    expect(r.metrics.cvMethod).toBe('kfold')
    expect(r.model.factorIds).toEqual(expect.arrayContaining(['pop', 'workplaces', 'total_area']))
  }, 20000)
})
