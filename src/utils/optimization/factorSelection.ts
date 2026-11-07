/**
 * Automatic factor selection by cross-validated error.
 *
 * With 3-6 entities and a dozen candidate statistics (pop, pop_0_19, pop_20_64, pop_65plus,
 * workplaces, fte, ...) a formula that uses every factor fits the sample perfectly and predicts
 * nothing. We therefore pick the *smallest* subset whose leave-one-group-out error is within 5 %
 * of the best one found, and we never let a subset contain exactly dependent factors
 * (pop = pop_0_19 + pop_20_64 + pop_65plus).
 *
 * Search: exhaustive over all subsets up to `maxFactors` while that is cheap (<= EXHAUSTIVE_LIMIT
 * subsets), otherwise forward selection followed by a swap pass at the chosen size.
 */

import { analyseColumnDependence } from './linearAlgebra'
import { crossValidate, planFolds, type FoldPlan } from './crossValidation'
import { fitCore, type CoreSettings } from './scaleFit'
import type { PreparedProblem } from './scaleProblem'
import type { SelectionInfo, SelectionStep } from './types'

export const EXHAUSTIVE_LIMIT = 300
/** A smaller model wins if its error is at most this much (relative) above the best model. */
export const PARSIMONY_TOLERANCE = 0.05

/** Cheaper, slightly looser iteration settings used while searching. */
export function searchSettings(settings: CoreSettings): CoreSettings {
  return { ...settings, maxIter: settings.robust ? 15 : 30, tolerance: 1e-6 }
}

/** Large problems are searched with 5 folds (the final model is always validated with 10). */
const SEARCH_FOLDS = 5

export class SubsetScorer {
  private readonly cache = new Map<string, number>()
  readonly settings: CoreSettings
  private readonly plan: FoldPlan
  tried = 0

  constructor(
    private readonly P: PreparedProblem,
    settings: CoreSettings,
    plan: FoldPlan,
  ) {
    this.settings = searchSettings(settings)
    this.plan = plan.method === 'kfold' ? planFolds(P.groups, SEARCH_FOLDS) : plan
  }

  /** True when the columns are linearly independent (no exact factor relation). */
  independent(columns: number[]): boolean {
    if (columns.length <= 1) return true
    const rows = this.P.Xn.map((x) => columns.map((c) => x[c]))
    return analyseColumnDependence(rows, columns.length).dependentColumns.length === 0
  }

  /** Cross-validated RMS relative deviation of the best fit using exactly these factors. */
  score(columns: number[]): number {
    const key = [...columns].sort((a, b) => a - b).join(',')
    const cached = this.cache.get(key)
    if (cached !== undefined) return cached
    let value = Infinity
    if (columns.length > 0 && this.independent(columns)) {
      this.tried++
      const all = Array.from({ length: this.P.n }, (_, i) => i)
      const full = fitCore(this.P, columns, this.settings, all)
      value = crossValidate(this.P, columns, this.settings, this.plan, full).score
      if (!Number.isFinite(value)) value = Infinity
    }
    this.cache.set(key, value)
    return value
  }
}

function* combinations(m: number, k: number): Generator<number[]> {
  const idx = Array.from({ length: k }, (_, i) => i)
  if (k > m) return
  for (;;) {
    yield idx.slice()
    let i = k - 1
    while (i >= 0 && idx[i] === m - k + i) i--
    if (i < 0) return
    idx[i]++
    for (let j = i + 1; j < k; j++) idx[j] = idx[j - 1] + 1
  }
}

function binomial(m: number, k: number): number {
  let r = 1
  for (let i = 1; i <= k; i++) r = (r * (m - k + i)) / i
  return Math.round(r)
}

export interface SelectionResult {
  /** Chosen columns (indices into the prepared factor list), ascending. */
  chosen: number[]
  info: SelectionInfo
  /** CV score of the chosen subset. */
  score: number
}

export function selectFactors(
  P: PreparedProblem,
  candidates: number[],
  settings: CoreSettings,
  plan: FoldPlan,
  maxFactors: number,
  scorer: SubsetScorer = new SubsetScorer(P, settings, plan),
): SelectionResult | null {
  const m = candidates.length
  const groupCount = new Set(P.groups).size
  const kMax = Math.max(1, Math.min(maxFactors, m, groupCount - 1 - (settings.intercept ? 1 : 0)))
  let total = 0
  for (let k = 1; k <= kMax; k++) total += binomial(m, k)
  const exhaustive = total <= EXHAUSTIVE_LIMIT

  const bestBySize: { cols: number[]; score: number }[] = []
  if (exhaustive) {
    for (let k = 1; k <= kMax; k++) {
      let best: { cols: number[]; score: number } | null = null
      for (const combo of combinations(m, k)) {
        const cols = combo.map((i) => candidates[i])
        const s = scorer.score(cols)
        if (best === null || s < best.score - 1e-12) best = { cols, score: s }
      }
      if (best) bestBySize.push(best)
    }
  } else {
    let current: number[] = []
    for (let k = 1; k <= kMax; k++) {
      let best: { cols: number[]; score: number } | null = null
      for (const c of candidates) {
        if (current.includes(c)) continue
        const cols = [...current, c].sort((a, b) => a - b)
        const s = scorer.score(cols)
        if (best === null || s < best.score - 1e-12) best = { cols, score: s }
      }
      if (!best || !Number.isFinite(best.score)) break
      current = best.cols
      bestBySize.push(best)
    }
  }
  const finite = bestBySize.filter((b) => Number.isFinite(b.score))
  if (finite.length === 0) return null

  const minScore = Math.min(...finite.map((b) => b.score))
  let chosenIdx = finite.findIndex((b) => b.score <= minScore * (1 + PARSIMONY_TOLERANCE) + 1e-9)
  if (chosenIdx < 0) chosenIdx = 0
  let chosen = finite[chosenIdx]

  // Swap pass (only when the search was greedy)
  if (!exhaustive) {
    for (let pass = 0; pass < 4; pass++) {
      let improved = false
      for (let pos = 0; pos < chosen.cols.length; pos++) {
        for (const c of candidates) {
          if (chosen.cols.includes(c)) continue
          const cols = chosen.cols.map((x, i) => (i === pos ? c : x)).sort((a, b) => a - b)
          const s = scorer.score(cols)
          if (s < chosen.score * (1 - 1e-9)) {
            chosen = { cols, score: s }
            improved = true
          }
        }
      }
      if (!improved) break
    }
    finite[chosenIdx] = chosen
  }

  const names = (cols: number[]) => cols.map((c) => P.factorIds[c])
  const steps: SelectionStep[] = finite.map((b) => ({ factorIds: names(b.cols), cvScore: b.score }))
  return {
    chosen: [...chosen.cols].sort((a, b) => a - b),
    score: chosen.score,
    info: {
      method: exhaustive ? 'exhaustive' : 'forward',
      tried: scorer.tried,
      candidateCount: m,
      maxFactors: kMax,
      bestBySize: steps,
      chosen: names(chosen.cols),
    },
  }
}
