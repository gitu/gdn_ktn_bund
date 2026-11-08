<template>
  <div class="year-picker" data-testid="year-picker">
    <div class="mode-options" role="radiogroup" :aria-label="$t('yearPicker.modeLabel')">
      <label
        v-for="option in MODES"
        :key="option"
        class="mode-option"
        :class="{ 'is-active': mode === option }"
        :data-testid="`year-mode-${option}`"
      >
        <input v-model="mode" type="radio" name="year-mode" :value="option" class="mode-input" />
        <i
          :class="option === 'single' ? 'pi pi-calendar' : 'pi pi-chart-line'"
          aria-hidden="true"
        ></i>
        <span class="mode-text">
          <span class="mode-title">{{ $t(`yearPicker.modes.${option}.title`) }}</span>
          <span class="mode-description">{{ $t(`yearPicker.modes.${option}.description`) }}</span>
        </span>
      </label>
    </div>

    <p v-if="coverage.length === 0" class="year-empty">{{ $t('yearPicker.noYears') }}</p>

    <template v-else>
      <div v-if="mode === 'multi'" class="presets">
        <Button
          v-for="preset in presets"
          :key="preset.key"
          :label="preset.label"
          severity="secondary"
          outlined
          size="small"
          class="preset"
          @click="years = preset.years"
        />
      </div>

      <div class="year-grid" role="group" :aria-label="$t('yearPicker.yearsLabel')">
        <button
          v-for="item in coverage"
          :key="item.year"
          type="button"
          class="year-chip"
          :class="{ 'is-partial': item.count < places.length }"
          :aria-pressed="years.includes(item.year)"
          :data-testid="`year-${item.year}`"
          @click="pick(item.year)"
        >
          <span class="year-value">{{ item.year }}</span>
          <span class="year-coverage">
            {{
              item.count === places.length
                ? $t('yearPicker.allPlaces')
                : $t('yearPicker.somePlaces', { count: item.count, total: places.length })
            }}
          </span>
        </button>
      </div>

      <p class="year-summary" aria-live="polite" data-testid="year-summary">
        {{ summary }}
      </p>
      <p v-if="columnCount > MANY_COLUMNS" class="year-warning">
        <i class="pi pi-exclamation-triangle" aria-hidden="true"></i>
        {{ $t('yearPicker.manyColumns', { count: columnCount }) }}
      </p>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import Button from 'primevue/button'
import {
  buildDatasets,
  defaultYear,
  latestYears,
  sortYears,
  yearCoverage,
  type AvailableYears,
} from '@/utils/ComparisonSelection'

export type YearMode = 'single' | 'multi'

const props = defineProps<{
  places: string[]
  available: AvailableYears
}>()

const years = defineModel<string[]>('years', { required: true })
const mode = defineModel<YearMode>('mode', { required: true })

const MODES: YearMode[] = ['single', 'multi']
/** Above this the table gets very wide; the charts still read well */
const MANY_COLUMNS = 60

const { t } = useI18n()

const coverage = computed(() => yearCoverage(props.places, props.available))
const allYears = computed(() => sortYears(coverage.value.map((item) => item.year)))

const presets = computed(() => {
  const list = [3, 5]
    .filter((count) => count < allYears.value.length)
    .map((count) => ({
      key: `last${count}`,
      label: t('yearPicker.lastYears', { count }),
      years: latestYears(allYears.value, count),
    }))
  if (allYears.value.length > 1) {
    list.push({
      key: 'all',
      label: t('yearPicker.allYears', {
        from: allYears.value[0],
        to: allYears.value[allYears.value.length - 1],
      }),
      years: [...allYears.value],
    })
  }
  return list
})

const pick = (year: string) => {
  if (mode.value === 'single') {
    years.value = [year]
    return
  }
  years.value = years.value.includes(year)
    ? years.value.filter((y) => y !== year)
    : sortYears([...years.value, year])
}

const columnCount = computed(
  () => buildDatasets({ places: props.places, years: years.value }, props.available).length,
)

const summary = computed(() => {
  if (years.value.length === 0) return t('yearPicker.pickOne')
  const range =
    years.value.length === 1
      ? years.value[0]
      : `${years.value[0]}–${years.value[years.value.length - 1]}`
  return t('yearPicker.summary', {
    years: range,
    count: years.value.length,
    columns: columnCount.value,
  })
})

// Keep the choice valid: years the places do not have are dropped, and switching to one year
// keeps the newest chosen one; switching to several years starts with the last five.
watch(
  [mode, allYears],
  ([newMode], [oldMode]) => {
    const valid = years.value.filter((year) => allYears.value.includes(year))
    if (newMode === 'single') {
      const keep = valid[valid.length - 1] ?? defaultYear(props.places, props.available)
      years.value = keep ? [keep] : []
    } else if (oldMode === 'single' && valid.length <= 1) {
      years.value = latestYears(allYears.value, 5)
    } else if (valid.length !== years.value.length) {
      years.value = valid
    }
  },
  { immediate: false },
)
</script>

<style scoped>
.year-picker {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  min-width: 0;
}

.mode-options {
  display: grid;
  gap: 0.5rem;
}

@media (min-width: 640px) {
  .mode-options {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

.mode-option {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.85rem 1rem;
  border: 1px solid var(--gk-border-strong);
  border-radius: var(--radius-md);
  background: var(--gk-surface);
  cursor: pointer;
}

.mode-option:hover {
  background: var(--gk-surface-2);
}

.mode-option.is-active {
  border-color: var(--gk-accent);
  background: color-mix(in srgb, var(--gk-accent) 10%, var(--gk-surface));
  box-shadow: 0 0 0 1px var(--gk-accent);
}

.mode-option:focus-within {
  outline: 2px solid var(--gk-accent);
  outline-offset: 2px;
}

.mode-option > .pi {
  margin-top: 0.15rem;
  color: var(--gk-accent-strong);
  font-size: 1.1rem;
}

/* The native radio stays for keyboard and screen readers, the card is its visual */
.mode-input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.mode-text {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  min-width: 0;
}

.mode-title {
  font-weight: 650;
}

.mode-description {
  color: var(--gk-muted);
  font-size: 0.8125rem;
  line-height: 1.4;
}

.presets {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
}

.preset {
  min-height: 2.5rem;
}

.year-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(5.25rem, 1fr));
  gap: 0.375rem;
}

.year-chip {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.1rem;
  min-height: 3.25rem;
  padding: 0.4rem 0.25rem;
  border: 1px solid var(--gk-border-strong);
  border-radius: var(--radius-md);
  background: var(--gk-surface);
  color: var(--gk-ink);
  font: inherit;
  cursor: pointer;
}

.year-chip:hover {
  background: var(--gk-surface-2);
}

.year-chip[aria-pressed='true'] {
  border-color: var(--gk-accent);
  background: color-mix(in srgb, var(--gk-accent) 14%, var(--gk-surface));
  box-shadow: 0 0 0 1px var(--gk-accent);
}

.year-chip:focus-visible {
  outline: 2px solid var(--gk-accent);
  outline-offset: 2px;
}

.year-value {
  font-size: 1rem;
  font-variant-numeric: tabular-nums;
  font-weight: 650;
}

.year-coverage {
  color: var(--gk-muted);
  font-size: 0.6875rem;
  line-height: 1.2;
  text-align: center;
}

.year-chip.is-partial .year-value {
  color: var(--gk-muted);
}

.year-summary,
.year-empty {
  margin: 0;
  color: var(--gk-muted);
  font-size: 0.875rem;
}

.year-warning {
  display: flex;
  gap: 0.5rem;
  margin: 0;
  color: var(--gk-ink);
  font-size: 0.8125rem;
}

.year-warning .pi {
  margin-top: 0.15rem;
  color: #d97706;
}
</style>
