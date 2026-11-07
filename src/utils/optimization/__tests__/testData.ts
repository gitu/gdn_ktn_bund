/** Synthetic problems with known truth for the optimiser tests. */
import type { FitAccount, FitEntity, FitInput } from '../types'

/** Small deterministic PRNG (mulberry32) so every test run sees the same data. */
export function rng(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function gaussian(next: () => number): number {
  const u = Math.max(next(), 1e-12)
  const v = next()
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
}

export interface SyntheticOptions {
  n: number
  /** True coefficients of the size formula (original units). */
  truth: Record<string, number>
  intercept?: number
  /** Accounts: id -> level c_a (amount per formula unit). */
  accounts?: Record<string, number>
  /** Multiplicative noise (standard deviation of the relative error). */
  noise?: number
  seed?: number
  /** Extra factors without any influence on size. */
  extraFactors?: string[]
  /** Entity index (and multiplier) of an outlier in every account. */
  outlier?: { index: number; factor: number }
}

export interface MutableEntity extends FitEntity {
  factors: Map<string, number>
}

export interface Synthetic {
  input: Omit<FitInput, 'entities'> & { entities: MutableEntity[] }
  scales: number[]
}

export function synthetic(opts: SyntheticOptions): Synthetic {
  const next = rng(opts.seed ?? 1)
  const factorIds = [...Object.keys(opts.truth), ...(opts.extraFactors ?? [])]
  const entities: MutableEntity[] = []
  const scales: number[] = []
  for (let i = 0; i < opts.n; i++) {
    const factors = new Map<string, number>()
    for (const f of factorIds) {
      // log-normal spread: sizes differ by one to two orders of magnitude, like real municipalities
      const base = f === 'pop' ? 8000 : f === 'workplaces' ? 4000 : f === 'total_area' ? 900 : 300
      factors.set(f, base * Math.exp(1.1 * gaussian(next)))
    }
    let s = opts.intercept ?? 0
    for (const [f, c] of Object.entries(opts.truth)) s += c * (factors.get(f) as number)
    scales.push(s)
    entities.push({
      id: `gdn/fs/${String(100000 + i)}:2024`,
      group: `gdn/fs/${100000 + i}`,
      factors,
    })
  }
  const accountLevels = opts.accounts ?? { '36': 4000, '46': 250 }
  const accounts: FitAccount[] = Object.entries(accountLevels).map(([id, level]) => {
    const values = new Map<string, number>()
    entities.forEach((e, i) => {
      let y = level * scales[i] * (1 + (opts.noise ?? 0) * gaussian(next))
      if (opts.outlier && opts.outlier.index === i) y *= opts.outlier.factor
      values.set(e.id, y)
    })
    return { id, values }
  })
  return { input: { entities, accounts, factorIds }, scales }
}

// --- FinancialData fixtures ------------------------------------------------------------------

import type { FinancialData, FinancialDataNode } from '@/types/FinancialDataStructure'

const labels = (text: string) => ({ de: text, fr: text, it: text, en: text })

/**
 * Minimal income statement: root -> "3" (Aufwand) -> 30.., root -> "4" (Ertrag) -> 40..
 * `amounts` maps an account code to one amount per entity (undefined = no value).
 */
export function financialDataFrom(
  entityCodes: string[],
  amounts: Record<string, (number | undefined)[]>,
): FinancialData {
  const leaf = (code: string): FinancialDataNode => {
    const values = new Map<string, { value: number; unit: string }>()
    amounts[code].forEach((v, i) => {
      if (v !== undefined) values.set(entityCodes[i], { value: v, unit: 'CHF' })
    })
    return { code, labels: labels(`Konto ${code}`), values, children: [] }
  }
  const parent = (code: string, name: string): FinancialDataNode => {
    const children = Object.keys(amounts)
      .filter((c) => c.length === 2 && c.startsWith(code))
      .map(leaf)
    const values = new Map<string, { value: number; unit: string }>()
    entityCodes.forEach((e) => {
      values.set(e, {
        value: children.reduce((s, c) => s + (c.values.get(e)?.value ?? 0), 0),
        unit: 'CHF',
      })
    })
    return { code, labels: labels(name), values, children }
  }
  const root: FinancialDataNode = {
    code: 'root',
    labels: labels('Erfolgsrechnung'),
    values: new Map(),
    children: [parent('3', 'Aufwand'), parent('4', 'Ertrag')],
  }
  return {
    incomeStatement: root,
    balanceSheet: { code: 'root', labels: labels('Bilanz'), values: new Map(), children: [] },
    entities: new Map(
      entityCodes.map((code) => [
        code,
        {
          code,
          name: labels(code),
          description: labels(code),
          year: code.split(':')[1],
          model: 'fs',
          source: code.split('/')[0],
          metadata: { source: 'test', loadedAt: '', recordCount: 0 },
        },
      ]),
    ),
    metadata: { source: 'test', loadedAt: '', recordCount: 0 },
  }
}

/** Synthetic fit input rebuilt as FinancialData + factor table, for constellation level tests. */
export function constellationFixture(opts: SyntheticOptions) {
  const { input } = synthetic(opts)
  const codes = input.entities.map((e) => e.id)
  const amounts: Record<string, number[]> = {}
  for (const account of input.accounts) {
    amounts[account.id] = codes.map((c) => account.values.get(c) as number)
  }
  const values = new Map(input.entities.map((e) => [e.id, new Map(e.factors)]))
  return {
    codes,
    data: financialDataFrom(codes, amounts),
    factors: { values, years: new Map(), unmapped: [] as string[] },
    allFactorIds: input.factorIds,
  }
}
