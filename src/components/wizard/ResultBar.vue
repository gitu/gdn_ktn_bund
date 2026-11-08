<template>
  <div class="result-bar" data-testid="result-bar">
    <!-- Places -->
    <div class="bar-item">
      <span class="item-label">{{ $t('resultBar.places') }}</span>
      <button
        type="button"
        class="item-value"
        data-testid="edit-places"
        @click="emit('edit', 'places')"
      >
        <span class="value-text">{{ placesText }}</span>
        <i class="pi pi-pencil" aria-hidden="true"></i>
        <span class="sr-only">{{ $t('resultBar.edit') }}</span>
      </button>
    </div>

    <!-- Years: one year can be browsed right here, keeping places and conversion -->
    <div class="bar-item">
      <span class="item-label">{{
        years.length > 1 ? $t('resultBar.years') : $t('resultBar.year')
      }}</span>
      <div v-if="years.length === 1" class="year-browser" data-testid="year-browser">
        <Button
          icon="pi pi-chevron-left"
          text
          rounded
          severity="secondary"
          :disabled="!previousYear"
          :aria-label="
            previousYear
              ? $t('resultBar.toYear', { year: previousYear })
              : $t('charts.previousYear')
          "
          data-testid="year-previous"
          @click="previousYear && emit('year', previousYear)"
        />
        <Select
          :model-value="years[0]"
          :options="yearOptions"
          class="year-select"
          :aria-label="$t('resultBar.year')"
          data-testid="year-select"
          @update:model-value="(year: string) => emit('year', year)"
        />
        <Button
          icon="pi pi-chevron-right"
          text
          rounded
          severity="secondary"
          :disabled="!nextYear"
          :aria-label="
            nextYear ? $t('resultBar.toYear', { year: nextYear }) : $t('charts.nextYear')
          "
          data-testid="year-next"
          @click="nextYear && emit('year', nextYear)"
        />
      </div>
      <button
        v-else
        type="button"
        class="item-value"
        data-testid="edit-years"
        @click="emit('edit', 'years')"
      >
        <span class="value-text">{{ years[0] }}–{{ years[years.length - 1] }}</span>
        <i class="pi pi-pencil" aria-hidden="true"></i>
        <span class="sr-only">{{ $t('resultBar.edit') }}</span>
      </button>
    </div>

    <!-- Conversion: the common ones switch here, a formula is edited in its own step -->
    <div class="bar-item bar-item-wide">
      <span class="item-label">{{ $t('resultBar.scaling') }}</span>
      <div class="scaling-row">
        <Select
          :model-value="scaling"
          :options="scalingOptions"
          option-label="label"
          option-value="value"
          class="scaling-select"
          :aria-label="$t('resultBar.scaling')"
          data-testid="scaling-dropdown"
          @update:model-value="(value: string | null) => emit('scaling', value)"
        />
        <Button
          icon="pi pi-calculator"
          :label="$t('resultBar.formula')"
          severity="secondary"
          outlined
          class="formula-button"
          data-testid="edit-scaling"
          @click="emit('edit', 'scaling')"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import Button from 'primevue/button'
import Select from 'primevue/select'
import { stepYear } from '@/utils/ComparisonSelection'

const props = defineProps<{
  placeNames: string[]
  years: string[]
  /** Every year the chosen places have, to browse through */
  allYears: string[]
  scaling: string | null
  scalingOptions: { label: string; value: string | null }[]
}>()

const emit = defineEmits<{
  edit: [step: 'places' | 'years' | 'scaling']
  year: [year: string]
  scaling: [scaling: string | null]
}>()

const placesText = computed(() => {
  const [first, second, ...rest] = props.placeNames
  if (!second) return first ?? ''
  const shown = `${first}, ${second}`
  return rest.length > 0 ? `${shown} +${rest.length}` : shown
})

const yearOptions = computed(() => [...props.allYears].sort((a, b) => Number(b) - Number(a)))
const previousYear = computed(() => stepYear(props.years[0], -1, props.allYears))
const nextYear = computed(() => stepYear(props.years[0], 1, props.allYears))
</script>

<style scoped>
.result-bar {
  display: grid;
  gap: 0.75rem;
  padding: 0.85rem 1rem;
  border: 1px solid var(--gk-border);
  border-radius: var(--radius-lg);
  background: var(--gk-surface);
  box-shadow: var(--gk-shadow-1);
}

@media (min-width: 900px) {
  .result-bar {
    grid-template-columns: minmax(0, 1.2fr) auto minmax(0, 1.6fr);
    align-items: end;
  }
}

.bar-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  min-width: 0;
}

.item-label {
  color: var(--gk-muted);
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  text-transform: uppercase;
}

.item-value {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-height: 2.75rem;
  min-width: 0;
  padding: 0 0.75rem;
  border: 1px solid var(--gk-border-strong);
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--gk-ink);
  font: inherit;
  font-weight: 600;
  text-align: start;
  cursor: pointer;
}

.item-value:hover {
  background: var(--gk-surface-2);
}

.item-value:focus-visible {
  outline: 2px solid var(--gk-accent);
  outline-offset: 2px;
}

.value-text {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-value .pi {
  flex: none;
  color: var(--gk-muted);
  font-size: 0.8rem;
}

.year-browser {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.year-browser :deep(.p-button) {
  width: 2.75rem;
  height: 2.75rem;
}

.year-select {
  min-width: 6.5rem;
}

.scaling-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.scaling-select {
  flex: 1 1 12rem;
  min-width: 0;
}

.formula-button {
  min-height: 2.75rem;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
}
</style>
