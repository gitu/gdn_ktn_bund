<template>
  <section
    class="result"
    data-testid="optimization-result"
    :aria-label="$t('optimizer.result.title')"
  >
    <h5 class="title">{{ $t('optimizer.result.title', { name }) }}</h5>

    <Message v-if="stale" severity="warn" :closable="false" class="text-xs">
      {{ $t('optimizer.result.stale') }}
    </Message>

    <!-- The formula and the one button that matters -->
    <div class="card formula-card">
      <div class="label">
        {{ $t('financialDataScalingSelector.customFormula.optimizationFormula') }}
      </div>
      <code class="formula-code" data-testid="optimized-formula">{{ result.model.formula }}</code>
      <p v-if="result.model.anchorFactor" class="hint">
        {{ $t('optimizer.result.unitNote', { factor: labels.factor(result.model.anchorFactor) }) }}
      </p>
      <Button
        size="small"
        class="action-button"
        severity="primary"
        data-testid="apply-optimized"
        @click="$emit('apply')"
      >
        {{ $t('financialDataScalingSelector.customFormula.applyOptimized') }}
      </Button>
    </div>

    <!-- Warnings: overfitting must be visible, not buried -->
    <ul v-if="result.warnings.length" class="warnings" data-testid="optimization-warnings">
      <li v-for="w in warningItems" :key="w.key" :class="w.level">
        <i
          :class="w.level === 'bad' ? 'pi pi-exclamation-triangle' : 'pi pi-info-circle'"
          aria-hidden="true"
        ></i>
        <span>{{ w.text }}</span>
      </li>
    </ul>

    <!-- Quality -->
    <div class="card">
      <div class="label">{{ $t('optimizer.result.quality') }}</div>
      <dl class="metrics">
        <div class="metric">
          <dt>{{ $t('optimizer.result.cvBefore') }}</dt>
          <dd>{{ cv(m.beforeCV) }}</dd>
        </div>
        <div class="metric">
          <dt>{{ $t('optimizer.result.cvFit') }}</dt>
          <dd>{{ cv(m.afterCV) }}</dd>
        </div>
        <div class="metric strong">
          <dt>{{ $t('optimizer.result.cvCross') }}</dt>
          <dd>{{ cv(m.cvCV) }}</dd>
        </div>
        <div class="metric">
          <dt>{{ $t('optimizer.result.cvImprovement') }}</dt>
          <dd :class="m.cvImprovement < 0 ? 'neg' : 'pos'">
            {{ pct(m.cvImprovement / 100, 0, true) }}
          </dd>
        </div>
        <div class="metric">
          <dt>{{ $t('financialDataScalingSelector.customFormula.optimizationQuality') }}</dt>
          <dd>{{ pct(m.rSquared, 1) }}</dd>
        </div>
        <div class="metric">
          <dt>{{ $t('optimizer.result.adjustedR2') }}</dt>
          <dd>{{ Number.isFinite(m.adjustedRSquared) ? pct(m.adjustedRSquared, 1) : '–' }}</dd>
        </div>
        <div class="metric">
          <dt>{{ $t('optimizer.result.cvR2') }}</dt>
          <dd :class="m.cvRSquared < 0 ? 'neg' : ''">{{ pct(m.cvRSquared, 1) }}</dd>
        </div>
        <div class="metric">
          <dt>{{ $t('optimizer.result.overfit') }}</dt>
          <dd :class="`risk-${m.overfitRisk}`" data-testid="overfit-risk">
            {{ $t(`optimizer.result.risk.${m.overfitRisk}`) }}
          </dd>
        </div>
      </dl>
      <p class="hint">
        {{
          $t('optimizer.result.basis', {
            entities: m.entityCount,
            accounts: m.accountCount,
            parameters: m.parameterCount,
            method: $t(`optimizer.result.cvMethod.${m.cvMethod}`, { folds: m.cvFolds }),
          })
        }}
      </p>
      <p class="hint">{{ $t('optimizer.result.cvExplain') }}</p>
    </div>

    <!-- Which factors matter -->
    <div class="card">
      <div class="label">{{ $t('optimizer.result.factorsTitle') }}</div>
      <ul class="factors">
        <li v-for="item in result.importance" :key="item.id">
          <div class="factor-row">
            <span class="factor-name">{{
              item.id === '_intercept' ? $t('optimizer.result.intercept') : labels.factor(item.id)
            }}</span>
            <span class="factor-share">{{ pct(item.share, 0) }}</span>
          </div>
          <div class="bar" aria-hidden="true">
            <span
              :style="{ width: `${Math.max(2, Math.min(100, Math.abs(item.share) * 100))}%` }"
            ></span>
          </div>
          <div class="factor-sub">
            <template v-if="item.id === '_intercept'">{{
              number(result.model.intercept)
            }}</template>
            <template v-else>
              {{ number(result.model.coefficients[item.id]) }} × <code>{{ item.id }}</code>
              <span v-if="item.dropEffect > 0.005">
                · {{ $t('optimizer.result.dropEffect', { percent: pct(item.dropEffect, 0) }) }}
              </span>
            </template>
          </div>
        </li>
      </ul>

      <details v-if="result.selection" class="details">
        <summary>{{ $t('optimizer.result.selectionTitle') }}</summary>
        <p class="hint">
          {{
            $t('optimizer.result.selectionInfo', {
              tried: result.selection.tried,
              candidates: result.selection.candidateCount,
              method: $t(`optimizer.result.selectionMethod.${result.selection.method}`),
            })
          }}
        </p>
        <ol class="path">
          <li v-for="(step, i) in result.selection.bestBySize" :key="i">
            <span class="path-factors">{{ step.factorIds.map(labels.factor).join(' + ') }}</span>
            <span class="path-score">{{ pct(step.cvScore, 0) }}</span>
          </li>
        </ol>
        <p class="hint">{{ $t('optimizer.result.selectionRule') }}</p>
      </details>
    </div>

    <!-- Per account -->
    <div class="card">
      <div class="label">
        {{ $t('financialDataScalingSelector.customFormula.optimization.summary.title') }}
      </div>
      <ul class="accounts">
        <li v-for="a in result.accounts" :key="a.id" class="account">
          <div class="account-name">{{ labels.account(a.id) }}</div>
          <div class="account-values">
            <span>{{ cv(a.beforeCV) }}</span>
            <i class="pi pi-arrow-right" aria-hidden="true"></i>
            <span>{{ cv(a.afterCV) }}</span>
            <span class="muted">/</span>
            <strong>{{ cv(a.cvCV) }}</strong>
            <span class="improve" :class="a.cvImprovement < 0 ? 'neg' : 'pos'">
              {{ pct(a.cvImprovement / 100, 0, true) }}
            </span>
          </div>
        </li>
      </ul>
      <p class="hint">{{ $t('optimizer.result.accountsLegend') }}</p>
    </div>

    <!-- Everything that was left out, with the reason -->
    <details v-if="exclusionItems.length" class="details" data-testid="optimization-exclusions">
      <summary>
        {{ $t('optimizer.result.excludedTitle', { count: exclusionItems.length }) }}
      </summary>
      <ul class="excluded">
        <li v-for="e in exclusionItems" :key="e.key">{{ e.text }}</li>
      </ul>
    </details>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import Button from 'primevue/button'
import Message from 'primevue/message'
import type { FitResult } from '@/utils/optimization/types'
import { formatCv, formatNumber, formatPercent } from './format'
import type { OptimizerLabels } from './useOptimizerLabels'

const props = defineProps<{
  result: FitResult
  name: string
  stale: boolean
  labels: OptimizerLabels
}>()

defineEmits<{ apply: [] }>()

const { t, locale } = useI18n()
const m = computed(() => props.result.metrics)

const cv = (v: number) => formatCv(v, locale.value)
const pct = (v: number, digits: number, signed = false) =>
  formatPercent(v, locale.value, digits, signed)
const number = (v: number) => {
  const abs = Math.abs(v)
  const digits = abs >= 100 ? 0 : abs >= 1 ? 2 : abs >= 0.01 ? 4 : 6
  return formatNumber(v, locale.value, digits)
}

const SEVERE = new Set([
  'overfitRisk',
  'cvWorseThanUnscaled',
  'nonPositiveScale',
  'noFactorEffect',
  'tooManyFactors',
])

const warningItems = computed(() =>
  props.result.warnings
    // exclusions have their own, more detailed list
    .filter((w) => !['excludedAccounts', 'excludedFactors', 'excludedEntities'].includes(w.code))
    .map((w, i) => {
      const params: Record<string, string | number> = { ...w.params }
      if (w.code === 'overfitRisk')
        params.risk = t(`optimizer.result.risk.${String(w.params?.risk)}`)
      if (w.code === 'collinearFactors' && typeof w.params?.factors === 'string') {
        params.factors = w.params.factors.split(', ').map(props.labels.factor).join(', ')
      }
      const level: 'bad' | 'note' =
        SEVERE.has(w.code) && !(w.code === 'overfitRisk' && w.params?.risk === 'medium')
          ? 'bad'
          : 'note'
      return { key: `${w.code}-${i}`, level, text: t(`optimizer.warn.${w.code}`, params) }
    }),
)

const exclusionItems = computed(() => {
  const ex = props.result.exclusions
  const items: { key: string; text: string }[] = []
  for (const a of ex.accounts) {
    items.push({
      key: `a-${a.id}`,
      text: t(`optimizer.exclusion.account.${a.reason}`, { name: props.labels.account(a.id) }),
    })
  }
  for (const f of ex.factors) {
    items.push({
      key: `f-${f.id}`,
      text: t(`optimizer.exclusion.factor.${f.reason}`, {
        name: props.labels.factor(f.id),
        entities: (f.entities ?? []).map(props.labels.entity).join(', '),
        by: (f.by ?? []).slice(0, 4).map(props.labels.factor).join(', '),
      }),
    })
  }
  for (const e of ex.entities) {
    items.push({
      key: `e-${e.id}`,
      text: t(`optimizer.exclusion.entity.${e.reason}`, {
        name: props.labels.entity(e.id),
        factors: (e.factors ?? []).map(props.labels.factor).join(', '),
      }),
    })
  }
  return items
})
</script>

<style scoped>
.result {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  min-width: 0;
}

.title {
  margin: 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--gk-ink);
  overflow-wrap: anywhere;
}

.card {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  min-width: 0;
  padding: 0.75rem;
  border: 1px solid var(--gk-border);
  border-radius: var(--radius-md);
  background: var(--gk-surface);
}

.formula-card {
  border-color: color-mix(in srgb, var(--gk-accent) 40%, var(--gk-border));
}

.label {
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  color: var(--gk-muted);
}

.formula-code {
  display: block;
  padding: 0.5rem 0.625rem;
  border-radius: 0.375rem;
  background: var(--gk-surface-2);
  color: var(--gk-ink);
  font-size: 0.8125rem;
  font-variant-numeric: tabular-nums;
  word-break: break-all;
}

.hint {
  margin: 0;
  font-size: 0.75rem;
  line-height: 1.45;
  color: var(--gk-muted);
}

.action-button.p-button {
  width: 100%;
  min-height: 2.75rem;
}

@media (min-width: 768px) {
  .action-button.p-button {
    width: auto;
    align-self: flex-start;
  }
}

.warnings {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.warnings li {
  display: flex;
  gap: 0.5rem;
  padding: 0.5rem 0.625rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--gk-border);
  background: var(--gk-surface-2);
  font-size: 0.8125rem;
  line-height: 1.4;
  color: var(--gk-ink);
}

.warnings li.bad {
  border-color: color-mix(in srgb, var(--gk-negative) 45%, transparent);
  background: color-mix(in srgb, var(--gk-negative) 8%, var(--gk-surface));
}

.warnings i {
  margin-top: 0.1875rem;
  flex: 0 0 auto;
}

.warnings li.bad i {
  color: var(--gk-negative);
}

.metrics {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.5rem 0.75rem;
  margin: 0;
}

@media (min-width: 768px) {
  .metrics {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

.metric dt {
  font-size: 0.75rem;
  line-height: 1.3;
  color: var(--gk-muted);
}

.metric dd {
  margin: 0.125rem 0 0;
  font-size: 1.0625rem;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: var(--gk-ink);
}

.metric.strong dd {
  color: var(--gk-accent-strong);
}

.pos {
  color: var(--gk-positive);
}

.neg {
  color: var(--gk-negative);
}

.risk-low {
  color: var(--gk-positive) !important;
}

.risk-high {
  color: var(--gk-negative) !important;
}

.factors,
.accounts,
.excluded,
.path {
  margin: 0;
  padding: 0;
  list-style: none;
}

.factors {
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
}

.factor-row {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  font-size: 0.875rem;
}

.factor-name {
  min-width: 0;
  font-weight: 600;
  overflow-wrap: anywhere;
}

.factor-share {
  font-variant-numeric: tabular-nums;
}

.bar {
  height: 0.375rem;
  margin-top: 0.25rem;
  border-radius: 999px;
  background: var(--gk-surface-2);
  overflow: hidden;
}

.bar span {
  display: block;
  height: 100%;
  border-radius: 999px;
  background: var(--gk-gradient);
}

.factor-sub {
  margin-top: 0.25rem;
  font-size: 0.75rem;
  color: var(--gk-muted);
  font-variant-numeric: tabular-nums;
  overflow-wrap: anywhere;
}

.details summary {
  display: flex;
  align-items: center;
  min-height: 2.75rem;
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--gk-accent-strong);
  cursor: pointer;
}

.path {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  counter-reset: step;
}

.path li {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  font-size: 0.8125rem;
  font-variant-numeric: tabular-nums;
}

.path-factors {
  min-width: 0;
  overflow-wrap: anywhere;
}

.accounts {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.account {
  padding: 0.5rem 0.625rem;
  border-radius: var(--radius-md);
  background: var(--gk-surface-2);
  font-size: 0.8125rem;
}

.account-name {
  font-weight: 600;
  overflow-wrap: anywhere;
}

.account-values {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.25rem 0.5rem;
  margin-top: 0.25rem;
  font-variant-numeric: tabular-nums;
}

.account-values .pi {
  font-size: 0.6875rem;
  color: var(--gk-muted);
}

.improve {
  margin-inline-start: auto;
  font-weight: 600;
}

.muted {
  color: var(--gk-muted);
}

.excluded {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  font-size: 0.8125rem;
  color: var(--gk-muted);
  overflow-wrap: anywhere;
}
</style>
