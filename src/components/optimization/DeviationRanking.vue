<template>
  <div class="ranking" data-testid="sim-expected">
    <p class="hint">{{ $t('optimizer.sim.expected.intro') }}</p>

    <div class="field">
      <label :for="`${uid}-acc`">{{ $t('optimizer.sim.account') }}</label>
      <Select
        :input-id="`${uid}-acc`"
        v-model="accountId"
        :options="accountOptions"
        option-label="label"
        option-value="value"
        class="w-full"
        data-testid="sim-expected-account"
      />
    </div>

    <ol class="rows" data-testid="sim-expected-rows">
      <li v-for="row in visible" :key="row.entityId" class="row">
        <div class="head">
          <span class="rank">{{ row.rank }}</span>
          <span class="entity">{{ labels.entity(row.entityId) }}</span>
          <span class="dev" :class="row.deviation >= 0 ? 'up' : 'down'">{{
            pct(row.deviation)
          }}</span>
        </div>
        <div class="axis" aria-hidden="true">
          <span
            class="bar"
            :class="row.deviation >= 0 ? 'up' : 'down'"
            :style="barStyle(row.deviation)"
          ></span>
        </div>
        <div v-if="row.actual !== null && row.expected !== null" class="amounts">
          {{ $t('optimizer.sim.expected.actual') }} <strong>{{ amount(row.actual) }}</strong> ·
          {{ $t('optimizer.sim.expected.expected') }} {{ amount(row.expected) }}
        </div>
      </li>
    </ol>

    <Button
      v-if="rows.length > LIMIT"
      size="small"
      severity="secondary"
      text
      class="more"
      @click="showAll = !showAll"
    >
      {{
        showAll
          ? $t('optimizer.sim.expected.showLess')
          : $t('optimizer.sim.expected.showAll', { count: rows.length })
      }}
    </Button>

    <p class="hint">{{ $t('optimizer.sim.expected.footnote') }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, useId } from 'vue'
import { useI18n } from 'vue-i18n'
import Button from 'primevue/button'
import Select from 'primevue/select'
import { expectedVsActual } from '@/utils/optimization/simulation'
import type { FitResult } from '@/utils/optimization/types'
import { formatAmount, formatPercent } from './format'
import type { OptimizerLabels } from './useOptimizerLabels'

const props = defineProps<{ result: FitResult; labels: OptimizerLabels }>()

const { t, locale } = useI18n()
const uid = useId()
/** More entities than this are shortened to the most extreme ones on both ends. */
const LIMIT = 12

/** Select option value for "all accounts" (PrimeVue treats null as "nothing selected"). */
const ALL = '__all__'
const accountId = ref<string>(ALL)
const showAll = ref(false)

const accountOptions = computed(() => [
  { value: ALL, label: t('optimizer.sim.allAccounts') },
  ...props.result.accounts.map((a) => ({
    value: a.id as string | null,
    label: props.labels.account(a.id),
  })),
])

const rows = computed(() =>
  expectedVsActual(props.result, accountId.value === ALL ? null : accountId.value),
)
const visible = computed(() =>
  showAll.value || rows.value.length <= LIMIT
    ? rows.value
    : [...rows.value.slice(0, LIMIT / 2), ...rows.value.slice(-LIMIT / 2)],
)

const maxAbs = computed(() => Math.max(0.1, ...rows.value.map((r) => Math.abs(r.deviation))))
const barStyle = (d: number) => {
  const w = (Math.min(Math.abs(d), maxAbs.value) / maxAbs.value) * 50
  return d >= 0 ? { left: '50%', width: `${w}%` } : { left: `${50 - w}%`, width: `${w}%` }
}

const pct = (v: number) => formatPercent(v, locale.value, 0, true)
const amount = (v: number) => `CHF\u00a0${formatAmount(v, locale.value)}`
</script>

<style scoped>
.ranking {
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
  font-size: 0.8125rem;
}

.field label {
  font-weight: 600;
}

.ranking :deep(.p-select) {
  min-height: 2.75rem;
}

.ranking :deep(.p-select-label) {
  font-size: 1rem;
}

.rows {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.row {
  padding: 0.375rem 0.625rem;
  border-radius: var(--radius-md);
  background: var(--gk-surface-2);
  font-size: 0.8125rem;
  font-variant-numeric: tabular-nums;
  min-width: 0;
}

.head {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
}

.rank {
  flex: 0 0 1.5rem;
  color: var(--gk-muted);
  font-size: 0.75rem;
}

.entity {
  flex: 1 1 auto;
  min-width: 0;
  font-weight: 600;
  overflow-wrap: anywhere;
}

.dev {
  flex: 0 0 auto;
  font-weight: 700;
}

.dev.up,
.bar.up {
  color: var(--gk-accent-strong);
}

.dev.down,
.bar.down {
  color: var(--gk-muted);
}

.axis {
  position: relative;
  height: 0.5rem;
  margin-top: 0.25rem;
  border-radius: 999px;
  background: var(--gk-border);
}

.axis::after {
  content: '';
  position: absolute;
  top: -0.125rem;
  bottom: -0.125rem;
  left: 50%;
  width: 1px;
  background: var(--gk-border-strong);
}

.bar {
  position: absolute;
  top: 0;
  bottom: 0;
  border-radius: 999px;
  background: currentColor;
}

.amounts {
  margin-top: 0.25rem;
  font-size: 0.75rem;
  color: var(--gk-muted);
}

.amounts strong {
  color: var(--gk-ink);
}

.more.p-button {
  min-height: 2.75rem;
  align-self: flex-start;
}
</style>
