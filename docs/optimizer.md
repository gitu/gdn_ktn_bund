# Scaling-formula optimiser

Finds a _size formula_ `s = b0 + b1·factor1 + b2·factor2 + …` (factors are statistics from
`public/data/stats/stats.json`: `pop`, `pop_65plus`, `workplaces`, `total_area`, …) such that the
chosen accounts of the chosen entities (table columns) are as equal as possible after dividing by
`s`. The formula is applied as the custom scaling `custom:<formula>`, exactly like a hand-written one.

Code: `src/utils/ScalingOptimization.ts` (public facade) and `src/utils/optimization/*` (engine).
Unit tests with synthetic data of known truth: `src/utils/optimization/__tests__/`.

## 1. What the previous version really did (audit)

| #   | Finding                                                                                                                                                                                                                                                         | Consequence                                                                                                                                                           |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Only the alphabetically first account was fitted.** After the first account, every later account got `target = amount / (amount · ratio_of_first) = first_amount / 100000`, i.e. the first account's target again. Accounts were sorted with `localeCompare`. | `36,46` and `46,36` optimised `36` (resp. `36` again); the second account only appeared in the "before/after" table.                                                  |
| 2   | The objective was plain least squares of `amount/100000` on the factors, in _levels_.                                                                                                                                                                           | The largest column (a canton, the Bund) decides the fit; a municipality of 5,000 inhabitants is irrelevant. It did not minimise the CV that the result panel reports. |
| 3   | Normal equations `XᵀX β = Xᵀy` with a fixed `1e-6` ridge added to _every_ diagonal element (also the intercept), a "condition number" taken as the ratio of diagonal entries, Gaussian elimination.                                                             | Squared conditioning, ad-hoc shrinkage, no detection of dependent factors (`pop = pop_0_19 + pop_20_64 + pop_65plus` gives an arbitrary split).                       |
| 4   | Coefficients of any sign; formula printed with `toFixed(6)`.                                                                                                                                                                                                    | Negative per-capita weights; coefficients below 5e-7 silently vanished from the string.                                                                               |
| 5   | Quality = in-sample R², accepted unless `R² < 0.1 and relative error > 0.5`. No adjusted R², no out-of-sample error.                                                                                                                                            | With 3-6 entities and many factors every fit looks perfect.                                                                                                           |
| 6   | One entity: a "balanced formula" where every factor contributes 1.0.                                                                                                                                                                                            | Meaningless (there is nothing to compare).                                                                                                                            |
| 7   | `Math.abs()` of every amount; accounts with mixed signs (e.g. `38` Ausserordentlicher Aufwand: −84 M for one entity, +81 M for another) were fitted as magnitudes; entities lacking a factor disappeared without notice.                                        | Silent garbage in, plausible-looking formula out.                                                                                                                     |
| 8   | Performance: a tree walk per (entity, account); one CSV fetch+parse per (entity, statistic) in the selector (25 for five columns); `console.log` of every value in hot loops.                                                                                   | Seconds for a handful of columns, unusable for hundreds.                                                                                                              |
| 9   | All selected factors were always used.                                                                                                                                                                                                                          | With 14 statistics (and `pop` an exact sum of three age groups) overfitting is certain.                                                                               |

## 2. What it does now

**Model.** `amount(a, e) = c_a · s_e · (1 + noise)`; `s_e` is the formula value of entity `e`, `c_a` the
typical scaled value of account `a` ("level"). The optimiser minimises

`Σ_a (1/n_a) Σ_e ( y_ae / (c_a · s_e) − 1 )²`

which is the sum of the squared coefficients of variation of the scaled values (the number shown as
"CV before → after"). Each account counts equally whatever its magnitude; relative errors mean a
village matters as much as a city. This is a constant-CV (Gamma, identity link) model, solved by
iteratively reweighted least squares with weights `1/s_e²`. All accounts of an entity share one
design row, so the stacked problem collapses exactly to **one weighted row per entity**: the cost does
not depend on the number of accounts.

**Numerics.** Columns are normalised by their mean (coefficients read as "share of an average
entity's size"), equilibrated, compressed by Householder QR and solved with a column-pivoted QR that
reveals the numerical rank (dependent columns get 0 and are reported), or by Lawson–Hanson NNLS on the
compressed system. No normal equations, no ad-hoc diagonal term. Everything is deterministic (fixed
tie-breaking by factor order, fold assignment by sorted group key).

**Fit modes** (`mode`):

| mode               | coefficients              | loss                                                                   |
| ------------------ | ------------------------- | ---------------------------------------------------------------------- |
| `ols`              | any sign                  | squared relative error                                                 |
| `nonneg` (default) | `≥ 0`, also the intercept | squared relative error                                                 |
| `robust`           | `≥ 0`                     | Huber (k = 1.345 robust σ, MAD) on the relative errors, level = median |

plus `ridge` (shrinkage relative to the fit weight, intercept exempt) and `includeIntercept`
(default off: a constant size component costs a degree of freedom the data rarely has).

**Unit of the formula.** Only ratios of coefficients matter, so the scale is fixed by an anchor: the
mean of the formula over the fitted entities equals the mean of `pop` (otherwise of the first model
factor). Scaled values read as "CHF per equivalent inhabitant". Coefficients are rounded to six
significant digits _before_ the metrics are computed, so the formula string, the metrics and the
simulations always describe the same model.

**Data hygiene** (nothing is dropped silently; every exclusion has a reason in `FitResult.exclusions`):
accounts with mixed signs, mostly zeros, fewer than two entities or no variation; a factor that is
negative, constant, or missing (for fewer than 20 entities it must exist for every entity, otherwise
for ≥ 90 %; entities that lack it are then dropped and listed); entities without any account value.
Accounts that are negative everywhere are fitted as their absolute value and shown with their sign.
Fewer than two entities is an error.

**Honest quality metrics** (`FitResult.metrics`):

- `rSquared = 1 − mean(afterCV²)/mean(beforeCV²)`: share of the squared CV that scaling removes.
- `adjustedRSquared`: corrected for the shape parameters (`parameters − 1`, because the overall scale is
  fixed by the anchor).
- **Cross-validated** CV per account and overall, `cvRSquared` (negative = worse than not scaling),
  `cvRmse` (typical relative deviation of an unseen entity; this is the ± range in the what-if
  simulation). Leave-one-_group_-out for up to 40 groups (one municipality in several years is one
  group, so a later year cannot leak into its own prediction), otherwise 10 deterministic folds.
- `overfitRisk` (`low | medium | high`) from entities per shape parameter, residual degrees of freedom
  and the gap between in-sample and out-of-sample CV; warnings: `fewEntities` (< 4), `overfitRisk`,
  `selectionOptimism`, `cvWorseThanUnscaled`, `nonPositiveScale`, `negativeCoefficient`,
  `collinearFactors`, `tooManyFactors`, `notConverged`, `noFactorEffect`, plus the exclusions.

**Factor selection** (`selection: { enabled, maxFactors }`, on by default for scenarios). Candidates
are _all_ statistics found in `stats.json` (labels in four languages come from there); a new statistic
needs no code change. The best subset of at most `maxFactors` (capped by the number of entities) is
chosen by cross-validated error: exhaustively while ≤ 300 subsets, otherwise forward selection plus a
swap pass. The **smallest** subset whose error is within 5 % of the best wins. Subsets with exactly
dependent factors are never evaluated (`pop` + its three age groups). Result: `selection.bestBySize`
(best error for 1, 2, 3 … factors), `importance[]` (share of the formula and the CV error increase when
the factor is dropped). Without selection exactly dependent candidates are skipped in listing order
(`pop` wins over `pop_65plus`) and reported; with at least as many candidates as entities nothing is
pruned arbitrarily and `tooManyFactors` is raised.

## 3. Scenarios, simulations, persistence (UI)

`src/components/optimization/`: `OptimizerPanel` (mounted lazily inside the "Benutzerdefinierte Formel"
section of `FinancialDataScalingSelector`), `ScenarioList`, `ScenarioEditor`, `OptimizationResult`,
`ScenarioComparison`, `SimulationPanel` (`WhatIfSimulation`, `DeviationRanking`, `SensitivityTable`).
State: Pinia store `src/stores/optimizer.ts`.

- A **constellation** = entities (null = all table columns), accounts (own codes `36,46`/`400+401`, or all
  children of Aufwand `3` / Ertrag `4` / both), candidate factors (null = every statistic in stats.json),
  intercept, fit mode, ridge, automatic selection (+ max factors). A **scenario** = constellation + result.
  Up to 8 scenarios; add, duplicate (definition only), remove, re-run, run all; the comparison table
  lists formula, CV before / after (cross-validated, fitted in brackets), improvement and overfit risk.
  A result is marked outdated as soon as its definition or the table columns change (signature compare).
- **What-if**: hypothetical factor values (optionally starting from a real entity) -> expected amount per
  account with a range of ± the account's cross-validated CV, next to the entity's actual amount.
  **Expected vs actual**: out-of-fold expectation per entity, ranked by deviation (rank 1 = furthest above).
  **Sensitivity**: ±10 / 25 % on one factor (or all) for one entity: change of the expectation and of
  its rank; the model of the fold that never saw the entity stays fixed, so nothing leaks.
- **Persistence**: scenario _definitions_ live in the URL (`?opt=`, base64url JSON, about 100 characters
  per scenario, entities as `010261:2024`), debounced `router.replace`, nothing for the untouched
  default. The URL is the app's sharing mechanism and also ties scenarios to the datasets they refer
  to (sessionStorage would survive a dataset change that makes entity references meaningless). Results
  are never stored; a link with `opt` opens the formula section and recomputes. `scalingFactors.ts`
  caches every statistics file per (statistic, level, year).
- Apply = emits `scalingChanged('custom:<formula>')`, exactly like the manual apply button.

## 4. Cost

Measured in this sandbox (Node/V8), 2,000 municipalities × 5 factors:
fit + 10-fold CV 0.1–0.4 s (2 to 20 accounts); with automatic selection 0.4–1.1 s; Huber fit 0.3–0.7 s,
Huber with selection 1.3–2.6 s. A Web Worker is not needed for the table sizes the UI produces (tens of
columns: milliseconds); the UI yields to the event loop before each run so the spinner paints.
Statistics files are fetched and parsed once per (statistic, level, year) and cached.

## 5. Known limits (deliberately not hidden)

- The model is multiplicative with one size formula per scenario. Accounts that are not size related
  (financial result, one-off items) should not be fitted together with those that are.
- Cross-validation answers "how does the formula do on _another entity of this kind_"; with 3-6 columns
  that estimate is itself noisy. Choosing the best of many subsets on so few entities makes it
  optimistic: the UI shows this (`selectionOptimism`, risk badge) instead of a single flattering number.
- Aggregates in the table (`std/fs/gdn_zh` = all municipalities of a canton, the Bund) are handled with
  the factor value of the canton/Bund; they are legitimate columns but very different from a village.
- Statistics are matched to the nearest available year (shown in the factor data of each run).
