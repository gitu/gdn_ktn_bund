<template>
  <div class="sens" data-testid="sim-sensitivity">
    <p class="hint">{{ $t('optimizer.sim.sensitivity.intro') }}</p>

    <div class="selectors">
      <div class="field">
        <label :for="`${uid}-ent`">{{ $t('optimizer.sim.sensitivity.entity') }}</label>
        <Select
          :input-id="`${uid}-ent`"
          v-model="entityId"
          :options="entityOptions"
          option-label="label"
          option-value="code"
          class="w-full"
          data-testid="sim-sensitivity-entity"
        />
      </div>
      <div class="field">
        <label :for="`${uid}-acc`">{{ $t('optimizer.sim.account') }}</label>
        <Select
          :input-id="`${uid}-acc`"
          v-model="accountId"
          :options="accountOptions"
          option-label="label"
          option-value="value"
          class="w-full"
          data-testid="sim-sensitivity-account"
        />
      </div>
    </div>

    <template v-if="data">
      <p class="baseline" data-testid="sim-sensitivity-baseline">
        {{
          $t('optimizer.sim.sensitivity.baseline', {
            deviation: pct(data.baselineDeviation),
            rank: data.baselineRank,
            total: data.entityCount,
          })
        }}
      </p>

      <ul class="factors">
        <li
          v-for="row in data.rows"
          :key="row.factorId ?? '_all'"
          class="factor"
          data-testid="sim-sensitivity-row"
        >
          <div class="factor-name">
            {{
              row.factorId === null
                ? $t('optimizer.sim.sensitivity.allFactors')
                : labels.factor(row.factorId)
            }}
          </div>
          <div class="cells">
            <div v-for="cell in row.cells" :key="cell.delta" class="cell">
              <div class="delta">{{ pct(cell.delta) }}</div>
              <div class="change" :class="cell.expectedChange >= 0 ? 'up' : 'down'">
                {{ pct(cell.expectedChange) }}
              </div>
              <div class="rank" :class="rankClass(cell.rank)">
                {{ data.baselineRank }} <i class="pi pi-arrow-right" aria-hidden="true"></i>
                {{ cell.rank }}
              </div>
            </div>
          </div>
        </li>
      </ul>
      <p class="hint">{{ $t('optimizer.sim.sensitivity.legend') }}</p>
    </template>
    <Message v-else severity="info" :closable="false" class="text-xs">
      {{ $t('optimizer.sim.sensitivity.unavailable') }}
    </Message>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, useId } from 'vue'
import { useI18n } from 'vue-i18n'
import Message from 'primevue/message'
import Select from 'primevue/select'
import { sensitivity } from '@/utils/optimization/simulation'
import type { FitResult } from '@/utils/optimization/types'
import { formatPercent } from './format'
import type { OptimizerLabels } from './useOptimizerLabels'

const props = defineProps<{ result: FitResult; labels: OptimizerLabels }>()

const { t, locale } = useI18n()
const uid = useId()

const entityOptions = computed(() =>
  props.result.entities.map((e) => ({ code: e.id, label: props.labels.entity(e.id) })),
)
const accountOptions = computed(() => [
  { value: ALL, label: t('optimizer.sim.allAccounts') },
  ...props.result.accounts.map((a) => ({
    value: a.id as string | null,
    label: props.labels.account(a.id),
  })),
])

const entityId = ref<string>(props.result.entities[0]?.id ?? '')
/** Select option value for "all accounts" (PrimeVue treats null as "nothing selected"). */
const ALL = '__all__'
const accountId = ref<string>(ALL)

const data = computed(() =>
  sensitivity(props.result, entityId.value, accountId.value === ALL ? null : accountId.value),
)

const pct = (v: number) =>
  formatPercent(v, locale.value, Math.abs(v) < 0.095 && v !== 0 ? 1 : 0, true)
const rankClass = (rank: number) =>
  data.value && rank < data.value.baselineRank
    ? 'up'
    : rank > (data.value?.baselineRank ?? 0)
      ? 'down'
      : ''
</script>

<style scoped>
.sens {
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

.selectors {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 0.75rem;
}

@media (min-width: 768px) {
  .selectors {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
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
}

.sens :deep(.p-select) {
  min-height: 2.75rem;
}

.sens :deep(.p-select-label) {
  font-size: 1rem;
}

.baseline {
  margin: 0;
  font-size: 0.875rem;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.factors {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.factor {
  padding: 0.5rem 0.625rem;
  border-radius: var(--radius-md);
  background: var(--gk-surface-2);
  min-width: 0;
}

.factor-name {
  margin-bottom: 0.375rem;
  font-size: 0.8125rem;
  font-weight: 600;
  overflow-wrap: anywhere;
}

.cells {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.25rem;
}

.cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.125rem;
  padding: 0.25rem 0.125rem;
  border-radius: 0.375rem;
  background: var(--gk-surface);
  font-size: 0.75rem;
  font-variant-numeric: tabular-nums;
  text-align: center;
  min-width: 0;
}

.delta {
  color: var(--gk-muted);
}

.change {
  font-weight: 700;
}

.up {
  color: var(--gk-accent-strong);
}

.down {
  color: var(--gk-muted);
}

.rank {
  display: flex;
  align-items: center;
  gap: 0.125rem;
  white-space: nowrap;
}

.rank .pi {
  font-size: 0.5625rem;
}

.rank.up,
.rank.down {
  font-weight: 700;
}
</style>
