/**
 * Shared types of the scaling optimiser.
 *
 * Vocabulary
 *  - entity:   one column of the comparison table (municipality/canton/Bund in one year)
 *  - factor:   a statistic from stats.json (pop, workplaces, total_area, ...), discovered dynamically
 *  - account:  one account code, or a "+" sum of codes ("400+401"), of the financial data
 *  - scale:    the formula value s_e = intercept + sum_k coefficient_k * factor_k(e)
 *  - level:    the typical scaled value of an account, c_a = mean_e (amount_ae / s_e)
 *  - expected: c_a * s_e (what the formula says the entity should have in that account)
 */

/** How the coefficients are fitted. */
export type FitMode = 'ols' | 'nonneg' | 'robust'

/** One entity (table column) with its factor values. */
export interface FitEntity {
  id: string
  /** Entities with the same group (e.g. one municipality in several years) are held out together. */
  group?: string
  factors: ReadonlyMap<string, number>
}

/** One account (or "+" sum) with the amount per entity id. */
export interface FitAccount {
  id: string
  label?: string
  values: ReadonlyMap<string, number>
}

export interface FitInput {
  entities: FitEntity[]
  accounts: FitAccount[]
  /** Candidate factors in a stable order (the order decides ties). */
  factorIds: string[]
}

export interface FitOptions {
  /** ols: any sign; nonneg: coefficients >= 0 (default); robust: nonneg + Huber loss. */
  mode?: FitMode
  /** Include a constant term (>= 0 unless mode is 'ols'). Default false. */
  includeIntercept?: boolean
  /** Ridge strength relative to the fit weight (0 = none). Default 0. */
  ridge?: number
  /** Pick the best subset of at most `maxFactors` candidate factors by cross-validated error. */
  selection?: { enabled: boolean; maxFactors: number }
  /** Factor whose mean fixes the unit of the formula (default `pop` if it is a candidate). */
  anchorFactor?: string
  /** Huber threshold in robust standard deviations. Default 1.345. */
  huberK?: number
}

export type WarningCode =
  | 'fewEntities' // fewer than 4 entities: every statistic is unreliable
  | 'overfitRisk' // few entities per parameter / large gap between fit and cross-validation
  | 'selectionOptimism' // factors were chosen on the same entities that report the CV error
  | 'cvWorseThanUnscaled' // the formula does not generalise better than no scaling
  | 'nonPositiveScale' // the formula is <= 0 for some entities (cannot divide by it)
  | 'negativeCoefficient' // an unconstrained fit produced negative weights
  | 'collinearFactors' // exactly dependent factors (e.g. pop = sum of age groups) were skipped
  | 'tooManyFactors' // at least as many candidate factors as entities: overfitting is certain without selection
  | 'notConverged' // the reweighting loop hit its iteration limit
  | 'excludedAccounts'
  | 'excludedFactors'
  | 'excludedEntities'
  | 'noFactorEffect' // the best formula barely improves on equal scaling

export interface FitWarning {
  code: WarningCode
  params?: Record<string, string | number>
}

export type AccountExclusionReason =
  | 'tooFewEntities'
  | 'mixedSign'
  | 'mostlyZero'
  | 'noVariation'
  | 'noData'

export type FactorExclusionReason = 'missing' | 'negative' | 'noVariation' | 'zero' | 'collinear'

export interface Exclusions {
  accounts: { id: string; reason: AccountExclusionReason }[]
  factors: { id: string; reason: FactorExclusionReason; entities?: string[]; by?: string[] }[]
  entities: { id: string; reason: 'missingFactor' | 'noAccountData'; factors?: string[] }[]
}

/** Per-account result. CV = standard deviation / mean of the scaled values y_e / s_e. */
export interface AccountMetrics {
  id: string
  label?: string
  /** Entities that contribute to this account. */
  entityCount: number
  mean: number
  /** Typical scaled value c_a: amount per formula unit. */
  level: number
  beforeCV: number
  /** In-sample CV after scaling. */
  afterCV: number
  /** Out-of-sample CV after scaling (each entity scaled by a formula that never saw it). */
  cvCV: number
  /** In-sample improvement in percent: (before - after) / before. */
  improvement: number
  /** Out-of-sample improvement in percent. May be negative (the formula hurts). */
  cvImprovement: number
  beforeVariance: number
  afterVariance: number
}

export type OverfitRisk = 'low' | 'medium' | 'high'

export interface FitMetrics {
  entityCount: number
  accountCount: number
  /** Fitted parameters including the intercept. */
  parameterCount: number
  /** Mean over accounts of the CVs. */
  beforeCV: number
  afterCV: number
  cvCV: number
  /** 1 - mean(afterCV^2) / mean(beforeCV^2): share of the squared CV that scaling removes. */
  rSquared: number
  adjustedRSquared: number
  /** Same with the out-of-sample CVs. Negative = worse than no scaling. */
  cvRSquared: number
  /** Mean over accounts of CV improvement in percent (out-of-sample). */
  cvImprovement: number
  /** Root-mean-square relative deviation of out-of-sample predictions: the +/- range in what-if. */
  cvRmse: number
  cvMethod: 'loo' | 'kfold'
  cvFolds: number
  overfitRisk: OverfitRisk
}

export interface EntityRow {
  id: string
  group: string
  /** Formula value fitted on all entities. */
  scale: number
  /** Formula value from a fit that did not include this entity. */
  cvScale: number
  /** Value of every candidate factor (NaN when unavailable). */
  factors: Record<string, number>
}

export interface FitModel {
  /** Factors with a non-zero coefficient, in candidate order. */
  factorIds: string[]
  coefficients: Record<string, number>
  /** 0 when the fit has no constant term. */
  intercept: number
  /** Formula string accepted by CustomScalingFormula (without the `custom:` prefix). */
  formula: string
  /** Factor whose mean defines the unit of the formula. */
  anchorFactor: string | null
}

export interface SelectionStep {
  factorIds: string[]
  cvScore: number
}

export interface SelectionInfo {
  method: 'exhaustive' | 'forward'
  /** Number of factor subsets whose cross-validated error was evaluated. */
  tried: number
  candidateCount: number
  maxFactors: number
  /** Best subset for every size, ascending in size. */
  bestBySize: SelectionStep[]
  chosen: string[]
}

/** The fitted model of one fold: used for out-of-sample predictions and for sensitivity. */
export interface CvModel {
  /** Entity indices that were held out. */
  heldOut: number[]
  intercept: number
  coefficients: Record<string, number>
  /** Account levels c_a of this fold (same order as `FitResult.accounts`). */
  levels: number[]
}

export interface FactorImportance {
  id: string
  /** Share of the mean formula value contributed by the factor (0..1, sums to ~1). */
  share: number
  /** Relative increase of the cross-validated error when the factor is dropped (0.2 = +20 %). */
  dropEffect: number
}

export interface FitResult {
  isValid: true
  model: FitModel
  metrics: FitMetrics
  accounts: AccountMetrics[]
  entities: EntityRow[]
  /** [account][entity] amounts in the original sign; NaN where the entity has no value. */
  actual: number[][]
  /** [account][entity] in-sample expectation c_a * s_e (original sign). */
  expected: number[][]
  /** [account][entity] out-of-sample expectation. */
  cvExpected: number[][]
  cvModels: CvModel[]
  /** For every entity, the index in `cvModels` of the fold that held it out. */
  entityFold: number[]
  importance: FactorImportance[]
  selection?: SelectionInfo
  exclusions: Exclusions
  warnings: FitWarning[]
  /** Mode and options the result was computed with. */
  options: Required<Pick<FitOptions, 'mode' | 'includeIntercept' | 'ridge'>>
  iterations: number
}

export interface FitFailure {
  isValid: false
  error: string
  /** Machine readable reason for the UI. */
  code:
    | 'noEntities'
    | 'tooFewEntities'
    | 'noAccounts'
    | 'noFactors'
    | 'noUsableAccounts'
    | 'noUsableFactors'
    | 'singular'
    | 'noEffect'
  exclusions?: Exclusions
}

export type FitOutcome = FitResult | FitFailure
