/**
 * The fitting core.
 *
 * Model.   amount_ae = c_a * s_e * (1 + noise),   s_e = b_0 + sum_k b_k * x_ke
 * Goal.    minimise  sum_a (1/n_a) sum_e ( y_ae / (c_a s_e) - 1 )^2,
 *          i.e. the squared coefficient of variation of the scaled values y_ae / s_e, summed over
 *          accounts. This is exactly the quantity the UI reports as "CV before / after", so the
 *          optimiser minimises what the user sees.
 *
 * Why not plain least squares on the amounts? In levels the largest entity (a canton, the Bund)
 * dominates the fit and a municipality of 5,000 inhabitants is irrelevant. The relative objective
 * is a constant-CV (Gamma, identity link) model and is solved by iteratively reweighted least
 * squares with weights 1/s_e^2. Because all accounts of an entity share the same design row, the
 * stacked problem collapses exactly to one weighted row per entity (weight sum_a w_ae / s_e^2,
 * target = weighted mean of the account targets), so the cost does not grow with the number of
 * accounts.
 *
 * Accounts are normalised by their own level c_a so that every account counts equally, no matter
 * if it is in CHF thousands or billions. Factors are normalised by their mean, so the coefficients
 * b_k are "share of an average entity's size contributed by factor k" and ridge shrinkage is
 * scale free.
 */

import { medianTyped, weightedFit } from './linearAlgebra'
import type { PreparedProblem } from './scaleProblem'

/** Formula values are kept above this fraction of the mean size to avoid dividing by ~0. */
export const SCALE_FLOOR = 1e-6

export interface CoreSettings {
  intercept: boolean
  nonNegative: boolean
  robust: boolean
  /** Ridge relative to the total fit weight; the intercept is exempt. */
  ridge: number
  huberK: number
  maxIter: number
  tolerance: number
}

export const DEFAULT_CORE: CoreSettings = {
  intercept: false,
  nonNegative: true,
  robust: false,
  ridge: 0,
  huberK: 1.345,
  maxIter: 80,
  tolerance: 1e-9,
}

export interface CoreFit {
  /** Normalised coefficients: [intercept?, ...one per column]. */
  b: number[]
  /** Account levels in the normalised gauge (mean formula value ~ 1). */
  levels: Float64Array
  iterations: number
  converged: boolean
  /** Columns the solver had to treat as linearly dependent. */
  dependent: number[]
  /** sum_a (1/n_a) sum_e dev^2 at the end. */
  objective: number
}

/** Design rows [1?, x_1 ... x_k] for the given entities, using the normalised factors. */
export function buildDesign(
  P: PreparedProblem,
  columns: number[],
  intercept: boolean,
  rows: number[],
): Float64Array[] {
  const width = columns.length + (intercept ? 1 : 0)
  return rows.map((e) => {
    const row = new Float64Array(width)
    let k = 0
    if (intercept) row[k++] = 1
    for (const c of columns) row[k++] = P.Xn[e][c]
    return row
  })
}

/** Normalised formula value for one design row. */
export function dot(row: ArrayLike<number>, b: ArrayLike<number>): number {
  let s = 0
  for (let j = 0; j < b.length; j++) s += row[j] * b[j]
  return s
}

/**
 * Fit on the entities listed in `rows` (indices into the prepared problem).
 * `start` optionally warm-starts the reweighting (used by cross-validation folds).
 */
export function fitCore(
  P: PreparedProblem,
  columns: number[],
  settings: CoreSettings,
  rows: number[],
  start?: number[],
): CoreFit {
  const A = P.y.length
  const m = rows.length
  const p = columns.length + (settings.intercept ? 1 : 0)
  const D = buildDesign(P, columns, settings.intercept, rows)
  const penalized = Array.from({ length: p }, (_, j) => !(settings.intercept && j === 0))

  // Account bookkeeping on the training rows
  const count = new Float64Array(A)
  const omega = new Float64Array(A)
  const level = new Float64Array(A)
  for (let a = 0; a < A; a++) {
    let s = 0
    let c = 0
    for (let r = 0; r < m; r++) {
      const v = P.y[a][rows[r]]
      if (Number.isFinite(v)) {
        s += v
        c++
      }
    }
    count[a] = c
    omega[a] = c > 0 ? 1 / c : 0
    level[a] = c > 0 && s > 0 ? s / c : 1
  }

  // psi[a*m + r]: robustness weight of observation (a, r); 1 unless robust
  const psi = new Float64Array(A * m).fill(1)
  const sf = new Float64Array(m)
  const target = new Float64Array(m)
  const weight = new Float64Array(m)

  // Starting formula values: either the warm start or the account-mean of the targets
  if (start && start.length === p) {
    for (let r = 0; r < m; r++) sf[r] = Math.max(dot(D[r], start), SCALE_FLOOR)
  } else {
    for (let r = 0; r < m; r++) {
      let num = 0
      let den = 0
      for (let a = 0; a < A; a++) {
        const v = P.y[a][rows[r]]
        if (Number.isFinite(v)) {
          num += (omega[a] * v) / level[a]
          den += omega[a]
        }
      }
      sf[r] = Math.max(den > 0 ? num / den : 1, SCALE_FLOOR)
    }
  }

  let b: number[] = start && start.length === p ? start.slice() : Array.from({ length: p }, () => 0)
  let converged = false
  let iterations = 0
  let dependent: number[] = []
  let objective = Infinity
  const dev = new Float64Array(A * m)
  // Robust scale estimation works on at most ~4000 deviations (deterministic stride sample)
  const MAX_SAMPLE = 4096
  const sample = new Float64Array(Math.min(A * m, MAX_SAMPLE))

  for (let it = 1; it <= settings.maxIter; it++) {
    iterations = it
    // Entity-level weighted problem
    let totalWeight = 0
    for (let r = 0; r < m; r++) {
      let num = 0
      let den = 0
      for (let a = 0; a < A; a++) {
        const v = P.y[a][rows[r]]
        if (Number.isFinite(v)) {
          const w = omega[a] * psi[a * m + r]
          num += (w * v) / level[a]
          den += w
        }
      }
      target[r] = den > 0 ? num / den : 0
      weight[r] = den > 0 ? den / (sf[r] * sf[r]) : 0
      totalWeight += weight[r]
    }
    const sol = weightedFit(D, target, weight, p, {
      nonNegative: settings.nonNegative,
      ridge: settings.ridge * totalWeight,
      penalized,
    })
    dependent = sol.dependentColumns
    const bNew = sol.coefficients.slice()
    // Damping once the iteration has had time to settle: avoids two-cycle oscillations
    if (it > 12) {
      for (let j = 0; j < p; j++) bNew[j] = 0.5 * (bNew[j] + b[j])
    }

    let change = 0
    let scaleB = Number.MIN_VALUE
    for (let j = 0; j < p; j++) {
      change = Math.max(change, Math.abs(bNew[j] - b[j]))
      scaleB = Math.max(scaleB, Math.abs(bNew[j]))
    }
    b = bNew

    // New formula values, levels and relative deviations
    for (let r = 0; r < m; r++) sf[r] = Math.max(dot(D[r], b), SCALE_FLOOR)
    for (let a = 0; a < A; a++) {
      let num = 0
      let den = 0
      for (let r = 0; r < m; r++) {
        const v = P.y[a][rows[r]]
        if (Number.isFinite(v)) {
          const w = psi[a * m + r]
          num += (w * v) / sf[r]
          den += w
        }
      }
      if (den > 0 && num > 0) level[a] = num / den
    }
    let obj = 0
    let devCount = 0
    for (let a = 0; a < A; a++) {
      let acc = 0
      for (let r = 0; r < m; r++) {
        const v = P.y[a][rows[r]]
        if (Number.isFinite(v)) {
          const d = v / (level[a] * sf[r]) - 1
          dev[a * m + r] = d
          acc += d * d
          if (settings.robust) devCount++
        } else {
          dev[a * m + r] = NaN
        }
      }
      obj += omega[a] * acc
    }
    objective = obj

    if (settings.robust && devCount > 0) {
      const stride = Math.max(1, Math.ceil(devCount / MAX_SAMPLE))
      let taken = 0
      let seen = 0
      for (let i = 0; i < dev.length && taken < sample.length; i++) {
        if (Number.isFinite(dev[i])) {
          if (seen % stride === 0) sample[taken++] = dev[i]
          seen++
        }
      }
      const picked = sample.subarray(0, taken)
      const med = medianTyped(picked)
      for (let i = 0; i < taken; i++) picked[i] = Math.abs(picked[i] - med)
      const sigma = 1.4826 * medianTyped(picked)
      if (sigma > 1e-12) {
        const cut = settings.huberK * sigma
        for (let a = 0; a < A; a++) {
          for (let r = 0; r < m; r++) {
            const d = dev[a * m + r]
            psi[a * m + r] =
              Number.isFinite(d) && Math.abs(d - med) > cut ? cut / Math.abs(d - med) : 1
          }
        }
      }
    }

    if (it >= 2 && change <= settings.tolerance * scaleB) {
      converged = true
      break
    }
  }

  return { b, levels: level, iterations, converged, dependent, objective }
}
