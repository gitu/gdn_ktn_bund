/**
 * Leave-one-entity-out cross-validation (K-fold for larger problems).
 *
 * The honest question for a scaling formula is: "if this entity had not been used to find the
 * formula, how far off would the scaled value of its accounts be from the typical scaled value of
 * the others?" Held-out units are *groups*: one municipality in three years is one group, so a
 * later year of the same municipality cannot leak into its own prediction.
 */

import { buildDesign, dot, fitCore, SCALE_FLOOR, type CoreFit, type CoreSettings } from './scaleFit'
import type { PreparedProblem } from './scaleProblem'

/** Up to this many groups every group is held out on its own (exact LOO); beyond: K folds. */
export const MAX_LOO_GROUPS = 40
export const KFOLD_FOLDS = 10
/** One deviation counts at most as +/- 1000 % in a score so a single ~0 prediction cannot dominate. */
export const DEVIATION_CAP = 10

export interface FoldPlan {
  method: 'loo' | 'kfold'
  /** Entity indices held out per fold. */
  folds: number[][]
}

/** Deterministic fold plan: groups are ordered by key, K-fold assigns group g to fold g % K. */
export function planFolds(groups: string[], folds: number = KFOLD_FOLDS): FoldPlan {
  const keys = [...new Set(groups)].sort()
  // A single group would leave nothing to train on: fall back to one entity per group
  const effective = keys.length < 2 ? groups.map((_, i) => `#${i}`) : groups
  const orderedKeys = keys.length < 2 ? effective : keys
  const byKey = new Map<string, number[]>()
  effective.forEach((k, i) => {
    const list = byKey.get(k)
    if (list) list.push(i)
    else byKey.set(k, [i])
  })
  if (orderedKeys.length <= MAX_LOO_GROUPS) {
    return { method: 'loo', folds: orderedKeys.map((k) => byKey.get(k) as number[]) }
  }
  const buckets: number[][] = Array.from({ length: folds }, () => [])
  orderedKeys.forEach((k, g) => buckets[g % folds].push(...(byKey.get(k) as number[])))
  return { method: 'kfold', folds: buckets }
}

export interface FoldModel {
  heldOut: number[]
  /** Normalised coefficients (same layout as CoreFit.b). */
  b: number[]
  levels: Float64Array
  converged: boolean
}

export interface CvRun {
  plan: FoldPlan
  models: FoldModel[]
  /** [account][entity] out-of-sample expectation c_a * s_e (positive-normalised amounts). */
  expected: Float64Array[]
  /** Per account: root-mean-square relative deviation y / expected - 1 (capped). */
  accountCV: Float64Array
  /** Root-mean-square over accounts of `accountCV`: the selection criterion. */
  score: number
  /** Predictions that were <= 0 (the formula could not scale that entity). */
  nonPositive: number
}

export function crossValidate(
  P: PreparedProblem,
  columns: number[],
  settings: CoreSettings,
  plan: FoldPlan,
  full?: CoreFit,
): CvRun {
  const A = P.y.length
  const expected = Array.from({ length: A }, () => new Float64Array(P.n).fill(NaN))
  const models: FoldModel[] = []
  let nonPositive = 0
  const all = Array.from({ length: P.n }, (_, i) => i)

  for (const heldOut of plan.folds) {
    const held = new Set(heldOut)
    const train = all.filter((i) => !held.has(i))
    if (train.length === 0) continue
    const fit = fitCore(P, columns, settings, train, full?.b)
    models.push({ heldOut, b: fit.b, levels: fit.levels, converged: fit.converged })
    const design = buildDesign(P, columns, settings.intercept, heldOut)
    heldOut.forEach((e, r) => {
      const s = dot(design[r], fit.b)
      if (!(s > SCALE_FLOOR)) nonPositive++
      const scale = Math.max(s, SCALE_FLOOR)
      for (let a = 0; a < A; a++) {
        expected[a][e] = fit.levels[a] * scale
      }
    })
  }

  const accountCV = new Float64Array(A)
  let sumSq = 0
  let counted = 0
  for (let a = 0; a < A; a++) {
    let acc = 0
    let c = 0
    for (let e = 0; e < P.n; e++) {
      const y = P.y[a][e]
      const x = expected[a][e]
      if (Number.isFinite(y) && Number.isFinite(x) && x > 0) {
        const d = Math.min(Math.abs(y / x - 1), DEVIATION_CAP)
        acc += d * d
        c++
      }
    }
    accountCV[a] = c > 0 ? Math.sqrt(acc / c) : NaN
    if (c > 0) {
      sumSq += accountCV[a] * accountCV[a]
      counted++
    }
  }
  const score = counted > 0 ? Math.sqrt(sumSq / counted) : Infinity
  return { plan, models, expected, accountCV, score, nonPositive }
}
