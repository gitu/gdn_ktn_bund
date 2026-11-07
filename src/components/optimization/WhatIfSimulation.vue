<template>
  <div class="whatif" data-testid="sim-whatif">
    <p class="hint">{{ $t('optimizer.sim.whatIf.intro') }}</p>

    <div class="field">
      <label :for="`${uid}-ref`">{{ $t('optimizer.sim.whatIf.startFrom') }}</label>
      <Select
        :input-id="`${uid}-ref`"
        :model-value="referenceId"
        :options="entityOptions"
        option-label="label"
        option-value="code"
        :placeholder="$t('optimizer.sim.whatIf.noReference')"
        show-clear
        class="w-full"
        data-testid="sim-whatif-reference"
        @update:model-value="chooseReference($event ?? null)"
      />
    </div>

    <div class="inputs">
      <div v-for="id in result.model.factorIds" :key="id" class="field">
        <label :for="`${uid}-${id}`">
          {{ labels.factor(id) }}
          <span v-if="labels.factorUnit(id)" class="unit">({{ labels.factorUnit(id) }})</span>
        </label>
        <InputNumber
          :input-id="`${uid}-${id}`"
          :model-value="values[id] ?? null"
          :min="0"
          :min-fraction-digits="0"
          :max-fraction-digits="2"
          :locale="intlLocale"
          fluid
          inputmode="decimal"
          :data-testid="`sim-whatif-${id}`"
          @update:model-value="setValue(id, $event)"
        />
      </div>
    </div>

    <Message v-if="!sim.valid" severity="warn" :closable="false" class="text-xs">
      {{
        sim.missingFactors.length
          ? $t('optimizer.sim.whatIf.missing')
          : $t('optimizer.sim.whatIf.notPositive')
      }}
    </Message>

    <ul v-else class="rows" data-testid="sim-whatif-rows">
      <li v-for="a in sim.accounts" :key="a.id" class="row">
        <div class="account">{{ labels.account(a.id) }}</div>
        <div class="expected">
          <strong>{{ amount(a.expected) }}</strong>
          <span class="range">{{ amount(a.low) }} – {{ amount(a.high) }}</span>
        </div>
        <div class="track" aria-hidden="true">
          <span class="band" :style="bandStyle(a)"></span>
          <span class="tick" :style="{ left: pos(a, a.expected) }"></span>
          <span v-if="a.actual !== null" class="dot" :style="{ left: pos(a, a.actual) }"></span>
        </div>
        <div v-if="a.actual !== null" class="actual">
          {{ $t('optimizer.sim.whatIf.actual') }}: <strong>{{ amount(a.actual) }}</strong>
          <span
            v-if="a.deviation !== null"
            :class="Math.abs(a.deviation) > a.range ? 'outside' : 'inside'"
          >
            {{ pct(a.deviation) }}
          </span>
        </div>
      </li>
    </ul>

    <p class="hint">{{ $t('optimizer.sim.whatIf.footnote') }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, useId } from 'vue'
import { useI18n } from 'vue-i18n'
import InputNumber from 'primevue/inputnumber'
import Message from 'primevue/message'
import Select from 'primevue/select'
import { whatIf, type WhatIfAccount } from '@/utils/optimization/simulation'
import type { FitResult } from '@/utils/optimization/types'
import { formatAmount, formatPercent } from './format'
import type { OptimizerLabels } from './useOptimizerLabels'

const props = defineProps<{ result: FitResult; labels: OptimizerLabels }>()

const { locale } = useI18n()
const uid = useId()
const intlLocale = computed(
  () => ({ de: 'de-CH', fr: 'fr-CH', it: 'it-CH', en: 'en-CH' })[props.labels.locale],
)

const referenceId = reactive<{ value: string | null }>({ value: null })
const entityOptions = computed(() =>
  props.result.entities.map((e) => ({ code: e.id, label: props.labels.entity(e.id) })),
)

/** Start from the entity of median size so the table is filled with plausible numbers. */
function medianEntity() {
  const sorted = [...props.result.entities].sort((a, b) => a.scale - b.scale)
  return sorted[Math.floor(sorted.length / 2)]
}

function factorsOf(entityId: string | null): Record<string, number | null> {
  const entity = props.result.entities.find((e) => e.id === entityId) ?? medianEntity()
  return Object.fromEntries(
    props.result.model.factorIds.map((id) => [id, entity.factors[id] ?? null]),
  )
}

const values = reactive<Record<string, number | null>>(factorsOf(null))

function chooseReference(id: string | null) {
  referenceId.value = id
  Object.assign(values, factorsOf(id))
}

function setValue(id: string, value: number | null) {
  values[id] = value
}

const sim = computed(() => {
  const numeric: Record<string, number> = {}
  for (const [id, v] of Object.entries(values)) {
    if (typeof v === 'number' && Number.isFinite(v)) numeric[id] = v
  }
  return whatIf(props.result, numeric, referenceId.value)
})

const amount = (v: number) => `CHF\u00a0${formatAmount(v, locale.value)}`
const pct = (v: number) => formatPercent(v, locale.value, 0, true)

/** Horizontal scale of one account's track: 0 .. 1.15 x the largest number involved. */
function maxOf(a: WhatIfAccount): number {
  return Math.max(Math.abs(a.high), Math.abs(a.actual ?? 0), Math.abs(a.expected)) * 1.15 || 1
}
const pos = (a: WhatIfAccount, v: number) =>
  `${Math.max(0, Math.min(100, (Math.abs(v) / maxOf(a)) * 100))}%`
function bandStyle(a: WhatIfAccount) {
  const lo = Math.min(Math.abs(a.low), Math.abs(a.high))
  const hi = Math.max(Math.abs(a.low), Math.abs(a.high))
  return {
    left: `${(lo / maxOf(a)) * 100}%`,
    width: `${Math.max(1, ((hi - lo) / maxOf(a)) * 100)}%`,
  }
}
</script>

<style scoped>
.whatif {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  min-width: 0;
}

.hint {
  margin: 0;
  font-size: 0.75rem;
  line-height: 1.45;
  color: var(--gk-muted);
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  min-width: 0;
  font-size: 0.8125rem;
}

.field label {
  font-weight: 600;
  overflow-wrap: anywhere;
}

.unit {
  font-weight: 400;
  color: var(--gk-muted);
}

.inputs {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 0.75rem;
}

@media (min-width: 768px) {
  .inputs {
    grid-template-columns: repeat(auto-fill, minmax(14rem, 1fr));
  }
}

/* 16px inputs (no iOS zoom) with a 44px touch target */
.whatif :deep(input) {
  min-height: 2.75rem;
  font-size: 1rem;
  font-variant-numeric: tabular-nums;
}

.whatif :deep(.p-select) {
  min-height: 2.75rem;
}

.whatif :deep(.p-select-label) {
  font-size: 1rem;
}

.rows {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.row {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.5rem 0.625rem;
  border-radius: var(--radius-md);
  background: var(--gk-surface-2);
  font-size: 0.8125rem;
  font-variant-numeric: tabular-nums;
  min-width: 0;
}

.account {
  font-weight: 600;
  overflow-wrap: anywhere;
}

.expected {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.125rem 0.625rem;
}

.expected strong {
  font-size: 1rem;
}

.range {
  color: var(--gk-muted);
  font-size: 0.75rem;
}

.track {
  position: relative;
  height: 0.75rem;
  border-radius: 999px;
  background: var(--gk-border);
}

.band {
  position: absolute;
  top: 0;
  bottom: 0;
  border-radius: 999px;
  background: color-mix(in srgb, var(--gk-accent) 45%, transparent);
}

.tick {
  position: absolute;
  top: -0.125rem;
  bottom: -0.125rem;
  width: 2px;
  margin-inline-start: -1px;
  background: var(--gk-accent-strong);
}

.dot {
  position: absolute;
  top: 50%;
  width: 0.75rem;
  height: 0.75rem;
  margin: -0.375rem 0 0 -0.375rem;
  border: 2px solid var(--gk-surface);
  border-radius: 50%;
  background: var(--gk-ink);
}

.actual {
  display: flex;
  flex-wrap: wrap;
  gap: 0.125rem 0.5rem;
  color: var(--gk-muted);
}

.actual strong {
  color: var(--gk-ink);
}

.outside {
  color: var(--gk-negative);
  font-weight: 600;
}

.inside {
  color: var(--gk-positive);
  font-weight: 600;
}
</style>
