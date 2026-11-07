/**
 * Small dense least-squares toolkit used by the scaling optimiser.
 *
 * Everything here works on problems with few unknowns (a handful of scaling factors) and up to a
 * few thousand observations. Instead of solving the normal equations (which squares the condition
 * number and was silently "fixed" with an ad-hoc diagonal term before), we
 *
 *   1. equilibrate the columns (unit norm),
 *   2. compress the weighted system with a Householder QR (no normal equations),
 *   3. solve the tiny triangular problem with a column-pivoted QR that reveals the numerical rank,
 *      or with Lawson-Hanson active-set NNLS for non-negative coefficients.
 *
 * All routines are deterministic (fixed tie-breaking by column index) and allocation-light.
 */

/** Relative pivot size below which a column counts as linearly dependent (columns equilibrated). */
export const RANK_TOLERANCE = 1e-10

export interface LeastSquaresSolution {
  /** Coefficients in the original column scale. Dependent columns get 0. */
  coefficients: number[]
  /** Numerical rank of the (equilibrated) design. */
  rank: number
  /** Largest / smallest retained pivot of the equilibrated system (Infinity when rank deficient). */
  condition: number
  /** Indices of columns that were dropped because they are linear combinations of earlier ones. */
  dependentColumns: number[]
}

export interface WeightedFitOptions {
  /** Constrain all coefficients to be >= 0 (Lawson-Hanson active set). */
  nonNegative?: boolean
  /** Absolute ridge strength added as sqrt(lambda) rows; applied to columns where `penalized[j]`. */
  ridge?: number
  /** Which columns the ridge applies to (default: all). Typically the intercept is exempt. */
  penalized?: boolean[]
}

/**
 * In-place Householder triangularisation of the row-major m x c matrix `M`.
 * The first `reflect` columns are eliminated; every column is transformed. With `pivot` the column
 * with the largest remaining norm is chosen at each step (rank revealing).
 * Returns the column permutation and the number of columns that could be eliminated.
 */
function householder(
  M: Float64Array,
  m: number,
  c: number,
  reflect: number,
  pivot: boolean,
): { perm: number[]; steps: number } {
  const perm = Array.from({ length: reflect }, (_, j) => j)
  const steps = Math.min(m, reflect)
  let done = 0
  for (let k = 0; k < steps; k++) {
    if (pivot) {
      let best = k
      let bestNorm = -1
      for (let j = k; j < reflect; j++) {
        let s = 0
        for (let i = k; i < m; i++) {
          const v = M[i * c + j]
          s += v * v
        }
        if (s > bestNorm * (1 + 1e-12)) {
          bestNorm = s
          best = j
        }
      }
      if (best !== k) {
        for (let i = 0; i < m; i++) {
          const a = i * c + k
          const b = i * c + best
          const t = M[a]
          M[a] = M[b]
          M[b] = t
        }
        const tp = perm[k]
        perm[k] = perm[best]
        perm[best] = tp
      }
    }
    let norm2 = 0
    for (let i = k; i < m; i++) {
      const v = M[i * c + k]
      norm2 += v * v
    }
    if (norm2 === 0 || !Number.isFinite(norm2)) {
      continue
    }
    const norm = Math.sqrt(norm2)
    const x0 = M[k * c + k]
    const alpha = x0 >= 0 ? -norm : norm
    // v = x - alpha e1 (stored in a scratch column)
    const v0 = x0 - alpha
    const vnorm2 = v0 * v0 + (norm2 - x0 * x0)
    if (vnorm2 === 0) {
      continue
    }
    for (let j = k; j < c; j++) {
      let dot = v0 * M[k * c + j]
      for (let i = k + 1; i < m; i++) {
        dot += M[i * c + k] * M[i * c + j]
      }
      const f = (2 * dot) / vnorm2
      if (j === k) {
        continue
      }
      M[k * c + j] -= f * v0
      for (let i = k + 1; i < m; i++) {
        M[i * c + j] -= f * M[i * c + k]
      }
    }
    M[k * c + k] = alpha
    for (let i = k + 1; i < m; i++) {
      M[i * c + k] = 0
    }
    done++
  }
  return { perm, steps: done }
}

/**
 * Solve min |A x - b| for a small dense system (A: rows x cols, row-major) with a column-pivoted
 * Householder QR. Columns are equilibrated first so the rank decision is scale free.
 */
export function solveSmallLeastSquares(
  A: ArrayLike<number>,
  b: ArrayLike<number>,
  rows: number,
  cols: number,
  rankTolerance: number = RANK_TOLERANCE,
): LeastSquaresSolution {
  if (cols === 0) {
    return { coefficients: [], rank: 0, condition: 1, dependentColumns: [] }
  }
  const c = cols + 1
  const M = new Float64Array(rows * c)
  const colScale = new Float64Array(cols)
  for (let j = 0; j < cols; j++) {
    let s = 0
    for (let i = 0; i < rows; i++) {
      const v = A[i * cols + j]
      s += v * v
    }
    colScale[j] = s > 0 ? Math.sqrt(s) : 1
  }
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      M[i * c + j] = A[i * cols + j] / colScale[j]
    }
    M[i * c + cols] = b[i]
  }
  const { perm } = householder(M, rows, c, cols, true)
  const limit = Math.min(rows, cols)
  const r00 = limit > 0 ? Math.abs(M[0]) : 0
  let rank = 0
  if (r00 > 0) {
    for (let k = 0; k < limit; k++) {
      if (Math.abs(M[k * c + k]) > rankTolerance * r00) {
        rank = k + 1
      } else {
        break
      }
    }
  }
  const x = Array.from({ length: cols }, () => 0)
  const solved = Array.from({ length: rank }, () => 0)
  for (let k = rank - 1; k >= 0; k--) {
    let s = M[k * c + cols]
    for (let j = k + 1; j < rank; j++) {
      s -= M[k * c + j] * solved[j]
    }
    solved[k] = s / M[k * c + k]
  }
  const dependentColumns: number[] = []
  for (let k = 0; k < cols; k++) {
    if (k < rank) {
      x[perm[k]] = solved[k] / colScale[perm[k]]
    } else {
      dependentColumns.push(perm[k])
    }
  }
  dependentColumns.sort((a, b2) => a - b2)
  const condition =
    rank === cols && rank > 0 ? r00 / Math.abs(M[(rank - 1) * c + (rank - 1)]) : Infinity
  return { coefficients: x, rank, condition, dependentColumns }
}

/**
 * Lawson-Hanson non-negative least squares on a small dense system (A: rows x cols, row-major):
 * min |A x - b| subject to x >= 0. Dependent columns are never admitted to the passive set.
 */
export function solveNonNegative(
  A: ArrayLike<number>,
  b: ArrayLike<number>,
  rows: number,
  cols: number,
): LeastSquaresSolution {
  const x = Array.from({ length: cols }, () => 0)
  if (cols === 0) {
    return { coefficients: x, rank: 0, condition: 1, dependentColumns: [] }
  }
  // Equilibrate columns so tolerances are comparable
  const colScale = new Float64Array(cols)
  for (let j = 0; j < cols; j++) {
    let s = 0
    for (let i = 0; i < rows; i++) {
      s += A[i * cols + j] * A[i * cols + j]
    }
    colScale[j] = s > 0 ? Math.sqrt(s) : 1
  }
  const As = new Float64Array(rows * cols)
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      As[i * cols + j] = A[i * cols + j] / colScale[j]
    }
  }
  const gradient = (): number[] => {
    const resid = Array.from({ length: rows }, () => 0)
    for (let i = 0; i < rows; i++) {
      let s = b[i]
      for (let j = 0; j < cols; j++) {
        s -= As[i * cols + j] * x[j]
      }
      resid[i] = s
    }
    const g = Array.from({ length: cols }, () => 0)
    for (let j = 0; j < cols; j++) {
      let s = 0
      for (let i = 0; i < rows; i++) {
        s += As[i * cols + j] * resid[i]
      }
      g[j] = s
    }
    return g
  }
  let maxAtb = 0
  for (let j = 0; j < cols; j++) {
    let s = 0
    for (let i = 0; i < rows; i++) {
      s += As[i * cols + j] * b[i]
    }
    maxAtb = Math.max(maxAtb, Math.abs(s))
  }
  const tol = 1e-11 * Math.max(1, maxAtb)
  const tiny = 1e-14
  const passive: number[] = []
  const frozen = new Set<number>()
  const subSolve = (set: number[]): number[] => {
    const sub = new Float64Array(rows * set.length)
    for (let i = 0; i < rows; i++) {
      for (let k = 0; k < set.length; k++) {
        sub[i * set.length + k] = As[i * cols + set[k]]
      }
    }
    return solveSmallLeastSquares(sub, b, rows, set.length).coefficients
  }
  const maxOuter = 6 * cols + 10
  for (let outer = 0; outer < maxOuter; outer++) {
    const g = gradient()
    let jBest = -1
    let gBest = tol
    for (let j = 0; j < cols; j++) {
      if (!passive.includes(j) && !frozen.has(j) && g[j] > gBest) {
        gBest = g[j]
        jBest = j
      }
    }
    if (jBest < 0) {
      break
    }
    passive.push(jBest)
    passive.sort((a, b2) => a - b2)
    let admitted = true
    for (let inner = 0; inner < maxOuter; inner++) {
      const z = subSolve(passive)
      const trial = Array.from({ length: cols }, () => 0)
      passive.forEach((j, k) => (trial[j] = z[k]))
      if (passive.every((j) => trial[j] > tiny)) {
        for (let j = 0; j < cols; j++) {
          x[j] = trial[j]
        }
        break
      }
      let alpha = 1
      for (const j of passive) {
        if (trial[j] <= tiny) {
          const denom = x[j] - trial[j]
          const a = denom > 0 ? x[j] / denom : 0
          if (a < alpha) {
            alpha = a
          }
        }
      }
      for (let j = 0; j < cols; j++) {
        x[j] += alpha * (trial[j] - x[j])
      }
      for (let k = passive.length - 1; k >= 0; k--) {
        if (x[passive[k]] <= tiny) {
          x[passive[k]] = 0
          if (passive[k] === jBest) {
            admitted = false
          }
          passive.splice(k, 1)
        }
      }
      if (passive.length === 0) {
        break
      }
    }
    if (!admitted) {
      frozen.add(jBest)
    } else {
      frozen.clear()
    }
  }
  const dependentColumns: number[] = []
  const used = x.map((v) => v > 0)
  const usedCount = used.filter(Boolean).length
  for (let j = 0; j < cols; j++) {
    if (frozen.has(j) && !used[j]) {
      dependentColumns.push(j)
    }
  }
  return {
    coefficients: x.map((v, j) => v / colScale[j]),
    rank: usedCount,
    condition: 1,
    dependentColumns,
  }
}

/**
 * Weighted (optionally ridge-regularised, optionally non-negative) least squares:
 *   min  sum_i w_i (y_i - x_i . beta)^2 + ridge * sum_{j penalised} beta_j^2
 * `X` is an array of rows. Rows with non-positive or non-finite weights/values are ignored.
 */
export function weightedFit(
  X: ArrayLike<ArrayLike<number>>,
  y: ArrayLike<number>,
  w: ArrayLike<number> | null,
  cols: number,
  options: WeightedFitOptions = {},
): LeastSquaresSolution {
  const { nonNegative = false, ridge = 0, penalized } = options
  const valid: number[] = []
  for (let i = 0; i < X.length; i++) {
    const wi = w ? w[i] : 1
    if (!(wi > 0) || !Number.isFinite(wi) || !Number.isFinite(y[i])) {
      continue
    }
    let ok = true
    for (let j = 0; j < cols; j++) {
      if (!Number.isFinite(X[i][j])) {
        ok = false
        break
      }
    }
    if (ok) {
      valid.push(i)
    }
  }
  const ridgeCols: number[] = []
  if (ridge > 0) {
    for (let j = 0; j < cols; j++) {
      if (!penalized || penalized[j]) {
        ridgeCols.push(j)
      }
    }
  }
  const rows = valid.length + ridgeCols.length
  const c = cols + 1
  // Equilibrate on the weighted columns (ridge rows included)
  const colScale = new Float64Array(cols)
  for (let j = 0; j < cols; j++) {
    let s = 0
    for (const i of valid) {
      const wi = w ? w[i] : 1
      s += wi * X[i][j] * X[i][j]
    }
    if (ridgeCols.includes(j)) {
      s += ridge
    }
    colScale[j] = s > 0 ? Math.sqrt(s) : 1
  }
  const M = new Float64Array(rows * c)
  let r = 0
  for (const i of valid) {
    const sw = Math.sqrt(w ? w[i] : 1)
    for (let j = 0; j < cols; j++) {
      M[r * c + j] = (sw * X[i][j]) / colScale[j]
    }
    M[r * c + cols] = sw * y[i]
    r++
  }
  const sr = Math.sqrt(ridge)
  for (const j of ridgeCols) {
    M[r * c + j] = sr / colScale[j]
    r++
  }
  // Compress: only the triangular factor (and Q'b) are needed
  householder(M, rows, c, cols, false)
  const q = Math.min(rows, cols)
  const A = new Float64Array(q * cols)
  const b = new Float64Array(q)
  for (let i = 0; i < q; i++) {
    for (let j = 0; j < cols; j++) {
      A[i * cols + j] = M[i * c + j]
    }
    b[i] = M[i * c + cols]
  }
  const sol = nonNegative ? solveNonNegative(A, b, q, cols) : solveSmallLeastSquares(A, b, q, cols)
  return {
    ...sol,
    coefficients: sol.coefficients.map((v, j) => v / colScale[j]),
  }
}

/**
 * Numerical rank and dependent columns of a set of columns (n x k, given as an array of rows),
 * after centring is NOT applied: exact linear relations such as pop = pop_0_19 + pop_20_64 +
 * pop_65plus show up as dependent columns.
 */
export function analyseColumnDependence(
  rows: ArrayLike<ArrayLike<number>>,
  cols: number,
): { rank: number; dependentColumns: number[]; condition: number } {
  const n = rows.length
  const A = new Float64Array(n * cols)
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < cols; j++) {
      A[i * cols + j] = rows[i][j]
    }
  }
  const sol = solveSmallLeastSquares(A, new Float64Array(n), n, cols)
  return { rank: sol.rank, dependentColumns: sol.dependentColumns, condition: sol.condition }
}

/** Median of a Float64Array using the native numeric sort (copies; the input is not modified). */
export function medianTyped(values: Float64Array): number {
  const n = values.length
  if (n === 0) return NaN
  const sorted = Float64Array.from(values).sort()
  const mid = n >> 1
  return n % 2 === 1 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

/** Median of a numeric array (does not modify the input). */
export function median(values: ArrayLike<number>): number {
  const n = values.length
  if (n === 0) {
    return NaN
  }
  const sorted = Array.from(values).sort((a, b) => a - b)
  const mid = n >> 1
  return n % 2 === 1 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}
