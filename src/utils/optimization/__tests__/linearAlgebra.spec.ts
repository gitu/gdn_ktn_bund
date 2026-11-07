import { describe, it, expect } from 'vitest'
import {
  analyseColumnDependence,
  median,
  solveNonNegative,
  solveSmallLeastSquares,
  weightedFit,
} from '../linearAlgebra'
import { gaussian, rng } from './testData'

function randomDesign(n: number, p: number, seed: number) {
  const next = rng(seed)
  const rows: number[][] = []
  for (let i = 0; i < n; i++) rows.push(Array.from({ length: p }, () => gaussian(next)))
  return rows
}
const flat = (rows: number[][]) => Float64Array.from(rows.flat())

describe('solveSmallLeastSquares', () => {
  it('recovers exact coefficients of a noise-free system', () => {
    const rows = randomDesign(30, 4, 7)
    const beta = [2, -1, 0.5, 3]
    const y = rows.map((r) => r.reduce((s, v, j) => s + v * beta[j], 0))
    const sol = solveSmallLeastSquares(flat(rows), y, 30, 4)
    expect(sol.rank).toBe(4)
    sol.coefficients.forEach((c, j) => expect(c).toBeCloseTo(beta[j], 10))
  })

  it('is not fooled by columns whose magnitudes differ by 12 orders', () => {
    const rows = randomDesign(25, 3, 3).map(([a, b, c]) => [a * 1e6, b * 1e-6, c])
    const beta = [2e-6, 5e6, -1]
    const y = rows.map((r) => r.reduce((s, v, j) => s + v * beta[j], 0))
    const sol = solveSmallLeastSquares(flat(rows), y, 25, 3)
    expect(sol.rank).toBe(3)
    sol.coefficients.forEach((c, j) => expect(c / beta[j]).toBeCloseTo(1, 8))
  })

  it('reports exactly dependent columns instead of returning garbage', () => {
    const rows = randomDesign(20, 3, 11).map(([a, b, c]) => [a, b, c, a + b + c])
    const y = rows.map((r) => 2 * r[0] + r[1])
    const sol = solveSmallLeastSquares(flat(rows), y, 20, 4)
    expect(sol.rank).toBe(3)
    expect(sol.dependentColumns).toHaveLength(1)
    expect(sol.condition).toBe(Infinity)
    // the fit itself is still exact
    const pred = rows.map((r) => r.reduce((s, v, j) => s + v * sol.coefficients[j], 0))
    pred.forEach((p, i) => expect(p).toBeCloseTo(y[i], 9))
  })

  it('handles more unknowns than equations (minimum-rank solution, no NaN)', () => {
    const sol = solveSmallLeastSquares(flat(randomDesign(2, 4, 5)), [1, 2], 2, 4)
    expect(sol.rank).toBe(2)
    expect(sol.coefficients.every(Number.isFinite)).toBe(true)
  })
})

describe('analyseColumnDependence', () => {
  it('finds pop = pop_0_19 + pop_20_64 + pop_65plus', () => {
    const next = rng(2)
    const rows = Array.from({ length: 8 }, () => {
      const a = 1000 * (1 + next())
      const b = 5000 * (1 + next())
      const c = 1500 * (1 + next())
      return [a + b + c, a, b, c]
    })
    const r = analyseColumnDependence(rows, 4)
    expect(r.rank).toBe(3)
    expect(r.dependentColumns).toHaveLength(1)
  })
})

describe('solveNonNegative', () => {
  it('equals least squares when the true coefficients are positive', () => {
    const rows = randomDesign(40, 3, 21).map((r) => r.map(Math.abs))
    const beta = [1, 2, 3]
    const y = rows.map((r) => r.reduce((s, v, j) => s + v * beta[j], 0))
    const sol = solveNonNegative(flat(rows), y, 40, 3)
    sol.coefficients.forEach((c, j) => expect(c).toBeCloseTo(beta[j], 8))
  })

  it('never returns a negative coefficient and satisfies the KKT conditions', () => {
    for (let seed = 1; seed <= 25; seed++) {
      const rows = randomDesign(12, 4, seed)
      const next = rng(seed + 100)
      const y = rows.map((r) => r[0] - 2 * r[1] + 0.5 * r[2] + 0.3 * gaussian(next))
      const sol = solveNonNegative(flat(rows), y, 12, 4)
      expect(sol.coefficients.every((c) => c >= 0)).toBe(true)
      // KKT: gradient of 0.5|y - Ax|^2 is >= 0 where x = 0 and = 0 where x > 0
      const resid = rows.map((r, i) => y[i] - r.reduce((s, v, j) => s + v * sol.coefficients[j], 0))
      for (let j = 0; j < 4; j++) {
        const g = rows.reduce((s, r, i) => s + r[j] * resid[i], 0)
        if (sol.coefficients[j] > 0) expect(Math.abs(g)).toBeLessThan(1e-7)
        else expect(g).toBeLessThan(1e-7)
      }
    }
  })

  it('does not admit a column that duplicates a passive one', () => {
    const rows = randomDesign(15, 2, 4).map((r) => [Math.abs(r[0]), Math.abs(r[1]), Math.abs(r[0])])
    const y = rows.map((r) => 2 * r[0] + r[1])
    const sol = solveNonNegative(flat(rows), y, 15, 3)
    expect(sol.coefficients.every((c) => c >= 0)).toBe(true)
    const pred = rows.map((r) => r.reduce((s, v, j) => s + v * sol.coefficients[j], 0))
    pred.forEach((p, i) => expect(p).toBeCloseTo(y[i], 8))
  })
})

describe('weightedFit', () => {
  const rows = randomDesign(20, 3, 9)
  const beta = [4, -2, 1]
  const y = rows.map((r) => r.reduce((s, v, j) => s + v * beta[j], 0))

  it('weights select which observations matter', () => {
    const bad = y.map((v, i) => (i === 0 ? v + 1000 : v))
    const w = rows.map((_, i) => (i === 0 ? 1e-12 : 1))
    const sol = weightedFit(rows, bad, w, 3)
    sol.coefficients.forEach((c, j) => expect(c).toBeCloseTo(beta[j], 5))
  })

  it('ridge shrinks the coefficient norm and leaves exempt columns alone', () => {
    const plain = weightedFit(rows, y, null, 3)
    const shrunk = weightedFit(rows, y, null, 3, { ridge: 50 })
    const norm = (c: number[]) => Math.hypot(...c)
    expect(norm(shrunk.coefficients)).toBeLessThan(norm(plain.coefficients))
    const exempt = weightedFit(rows, y, null, 3, { ridge: 1e6, penalized: [false, true, true] })
    expect(exempt.coefficients[0]).toBeGreaterThan(1)
    expect(Math.abs(exempt.coefficients[1])).toBeLessThan(0.01)
  })

  it('ignores rows with non-finite values or zero weight', () => {
    const dirty = rows.map((r) => r.slice())
    dirty[3][1] = NaN
    const sol = weightedFit(dirty, y, null, 3)
    sol.coefficients.forEach((c, j) => expect(c).toBeCloseTo(beta[j], 8))
  })
})

describe('median', () => {
  it('handles odd, even and empty input', () => {
    expect(median([3, 1, 2])).toBe(2)
    expect(median([4, 1, 3, 2])).toBe(2.5)
    expect(median([])).toBeNaN()
  })
})
