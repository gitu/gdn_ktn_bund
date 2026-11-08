<template>
  <div class="measure-picker">
    <div class="figure-chips" role="group" :aria-label="$t('charts.measure.pick')">
      <button
        v-for="choice in keyFigures"
        :key="choice.code"
        type="button"
        class="figure-chip"
        :aria-pressed="model === choice.code"
        :data-testid="`measure-${choice.code}`"
        @click="model = choice.code"
      >
        {{ choice.label }}
      </button>
    </div>
    <Select
      :model-value="isKeyFigure ? null : model"
      :options="accounts"
      option-label="label"
      option-value="code"
      filter
      :filter-placeholder="$t('charts.measure.search')"
      :placeholder="$t('charts.measure.otherAccount')"
      class="account-select"
      :aria-label="$t('charts.measure.otherAccount')"
      data-testid="measure-account"
      @update:model-value="(code: string | null) => code && (model = code)"
    >
      <template #option="{ option }">
        <span :style="{ paddingInlineStart: `${option.depth * 0.75}rem` }">{{ option.label }}</span>
      </template>
    </Select>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import Select from 'primevue/select'

export interface MeasureChoice {
  code: string
  label: string
  /** Offered as a chip (revenue, expenses, result, net debt) instead of in the account list */
  keyFigure: boolean
  depth: number
}

const props = defineProps<{ options: MeasureChoice[] }>()
const model = defineModel<string>({ required: true })

const keyFigures = computed(() => props.options.filter((option) => option.keyFigure))
const accounts = computed(() => props.options.filter((option) => !option.keyFigure))
const isKeyFigure = computed(() => keyFigures.value.some((option) => option.code === model.value))
</script>

<style scoped>
.measure-picker {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  min-width: 0;
  width: 100%;
}

.figure-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
}

.figure-chip {
  min-height: 2.5rem;
  padding: 0 0.85rem;
  border: 1px solid var(--gk-border-strong);
  border-radius: 999px;
  background: transparent;
  color: var(--gk-ink);
  font: inherit;
  font-size: 0.8125rem;
  font-weight: 550;
  cursor: pointer;
}

.figure-chip:hover {
  background: var(--gk-surface-2);
}

.figure-chip[aria-pressed='true'] {
  border-color: var(--gk-accent);
  background: color-mix(in srgb, var(--gk-accent) 14%, var(--gk-surface));
  color: var(--gk-ink);
}

.figure-chip:focus-visible {
  outline: 2px solid var(--gk-accent);
  outline-offset: 2px;
}

.account-select {
  flex: 1 1 14rem;
  min-width: 0;
  max-width: 100%;
}
</style>
