<template>
  <div class="scaling-step" data-testid="scaling-step">
    <!-- What the amounts are divided by -->
    <div class="choice-grid" role="radiogroup" :aria-label="$t('scalingStep.choiceLabel')">
      <label
        v-for="choice in choices"
        :key="choice.key"
        class="choice"
        :class="{ 'is-active': activeChoice === choice.key }"
        :data-testid="`scaling-choice-${choice.key}`"
      >
        <input
          type="radio"
          name="scaling-choice"
          class="choice-input"
          :value="choice.key"
          :checked="activeChoice === choice.key"
          @change="choose(choice.key)"
        />
        <i :class="choice.icon" aria-hidden="true"></i>
        <span class="choice-text">
          <span class="choice-title">{{ choice.title }}</span>
          <span class="choice-description">{{ choice.description }}</span>
        </span>
      </label>
    </div>

    <!-- Another statistic from the list -->
    <div v-if="activeChoice === 'other'" class="sub-panel">
      <label for="other-stat" class="field-label">{{ $t('scalingStep.otherLabel') }}</label>
      <Select
        input-id="other-stat"
        :model-value="otherStatId"
        :options="otherStats"
        option-label="label"
        option-value="id"
        :placeholder="$t('scalingStep.otherPlaceholder')"
        class="w-full"
        data-testid="other-stat"
        @update:model-value="(id: string) => (scaling = id)"
      />
    </div>

    <!-- Custom formula: built from statistics and operators, applied with a button -->
    <div v-if="activeChoice === 'custom'" class="sub-panel" data-testid="formula-builder">
      <label for="formula-input" class="field-label">{{ $t('scalingStep.formula.label') }}</label>
      <InputText
        id="formula-input"
        ref="formulaInput"
        v-model="formulaDraft"
        class="w-full formula-input"
        :class="{ 'p-invalid': formulaDraft && !validation.isValid }"
        :placeholder="$t('scalingStep.formula.placeholder')"
        autocomplete="off"
        spellcheck="false"
        data-testid="custom-formula-input"
        @keydown.enter.prevent="applyFormula"
      />

      <div class="token-row" role="group" :aria-label="$t('scalingStep.formula.operators')">
        <button
          v-for="operator in OPERATORS"
          :key="operator.value"
          type="button"
          class="token operator"
          :aria-label="$t(`scalingStep.formula.operator.${operator.name}`)"
          @click="insert(operator.value)"
        >
          {{ operator.symbol }}
        </button>
      </div>
      <div class="token-row" role="group" :aria-label="$t('scalingStep.formula.statistics')">
        <button
          v-for="stat in statOptions"
          :key="stat.id"
          type="button"
          class="token"
          :title="stat.description"
          @click="insert(stat.id)"
        >
          {{ stat.label }}
        </button>
      </div>

      <p
        v-if="formulaDraft"
        class="formula-status"
        :class="validation.isValid ? 'is-valid' : 'is-invalid'"
        role="status"
        data-testid="formula-status"
      >
        <i
          :class="validation.isValid ? 'pi pi-check-circle' : 'pi pi-exclamation-circle'"
          aria-hidden="true"
        ></i>
        <span>{{ validationText }}</span>
      </p>

      <div class="formula-actions">
        <Button
          :label="$t('scalingStep.formula.apply')"
          icon="pi pi-check"
          :disabled="!validation.isValid || appliedFormula === formulaDraft.trim()"
          data-testid="apply-formula"
          @click="applyFormula"
        />
      </div>

      <details class="formula-examples">
        <summary>{{ $t('scalingStep.formula.examplesTitle') }}</summary>
        <ul>
          <li v-for="example in EXAMPLES" :key="example.formula">
            <button type="button" class="example" @click="formulaDraft = example.formula">
              <code>{{ example.formula }}</code>
            </button>
            <span>{{ $t(`scalingStep.formula.examples.${example.key}`) }}</span>
          </li>
        </ul>
      </details>
    </div>

    <!-- Let the optimiser find weights that make the places most alike for chosen accounts -->
    <div v-if="activeChoice === 'optimize'" class="sub-panel" data-testid="optimizer-step">
      <p class="optimizer-intro">{{ $t('scalingStep.optimizer.intro') }}</p>
      <p v-if="!financialData" class="optimizer-wait">
        <i class="pi pi-spin pi-spinner" aria-hidden="true"></i>
        {{ $t('scalingStep.optimizer.waiting') }}
      </p>
      <OptimizerPanel
        v-else
        :financial-data="financialData"
        :stats="stats"
        @apply="applyOptimized"
      />
    </div>

    <!-- The calculation on its own: what each column will be divided by -->
    <section v-if="scaling" class="preview" data-testid="scaling-preview">
      <h3 class="preview-title">{{ $t('scalingStep.preview.title') }}</h3>
      <p class="preview-intro">{{ previewIntro }}</p>

      <p v-if="previewError" class="formula-status is-invalid">{{ previewError }}</p>
      <div v-else class="preview-table-wrap">
        <table class="preview-table">
          <thead>
            <tr>
              <th scope="col">{{ $t('charts.place') }}</th>
              <th v-for="year in previewYears" :key="year" scope="col">{{ year }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="place in previewPlaces" :key="place.key">
              <th scope="row">{{ place.label }}</th>
              <td v-for="year in previewYears" :key="year">
                <template v-if="cell(place.key, year) === undefined">
                  <span class="muted">{{ calculating ? '…' : '–' }}</span>
                </template>
                <template v-else-if="cell(place.key, year)!.factor === null">
                  <span class="missing">{{ $t('scalingStep.preview.missing') }}</span>
                </template>
                <template v-else>
                  {{ formatFactor(cell(place.key, year)!.factor!) }}
                  <sup
                    v-if="otherYear(cell(place.key, year)!, year)"
                    class="year-mark"
                    :title="
                      $t('scalingStep.preview.fromYear', {
                        year: otherYear(cell(place.key, year)!, year),
                      })
                    "
                    >{{ otherYear(cell(place.key, year)!, year) }}</sup
                  >
                </template>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p v-if="hasOtherYears" class="preview-note">{{ $t('scalingStep.preview.otherYears') }}</p>
      <p v-if="hasMissing" class="preview-note">{{ $t('scalingStep.preview.missingNote') }}</p>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import { CustomScalingFormula, CUSTOM_SCALING_PREFIX } from '@/utils/CustomScalingFormula'
import {
  ScalingCalculator,
  describeFormula,
  statisticName,
  formulaOf,
  isCustomScaling,
  type ScalingOutcome,
} from '@/utils/ScalingCalculator'
import { datasetIdOf, selectionFromDatasets } from '@/utils/ComparisonSelection'
import type { StatsAvailabilityInfo } from '@/types/StatsData'
import type { FinancialData } from '@/types/FinancialDataStructure'
import type { MultiLanguageLabels } from '@/types/DataStructures'

// The optimiser is only loaded once its box is opened
const OptimizerPanel = defineAsyncComponent(() => import('../optimization/OptimizerPanel.vue'))

const props = defineProps<{
  /** Dataset ids of the comparison, for the preview */
  datasets: string[]
  stats: StatsAvailabilityInfo[]
  /** Loaded financial data, needed by the optimiser only */
  financialData?: FinancialData | null
  placeName: (placeKey: string) => string
}>()

/** null = francs, a statistic id, or `custom:<formula>` */
const scaling = defineModel<string | null>({ required: true })

type ChoiceKey = 'none' | 'pop' | 'workplaces' | 'total_area' | 'other' | 'custom' | 'optimize'
const PRESETS = ['pop', 'workplaces', 'total_area'] as const

const OPERATORS = [
  { value: '+', symbol: '+', name: 'plus' },
  { value: '-', symbol: '−', name: 'minus' },
  { value: '*', symbol: '×', name: 'times' },
  { value: '/', symbol: '÷', name: 'divide' },
  { value: '(', symbol: '(', name: 'open' },
  { value: ')', symbol: ')', name: 'close' },
]

const EXAMPLES = [
  { key: 'mixed', formula: 'pop+workplaces/2' },
  { key: 'adults', formula: 'pop_20_64' },
  { key: 'weighted', formula: '1.5*pop_65plus+pop' },
]

const { t, locale } = useI18n()
const lang = computed(() => locale.value as keyof MultiLanguageLabels)

const statLabel = (stat: StatsAvailabilityInfo) => {
  const key = `financialDataScalingSelector.options.${stat.id}`
  const translated = t(key)
  return translated !== key ? translated : stat.name[lang.value] || stat.id
}

const statOptions = computed(() =>
  props.stats.map((stat) => ({
    id: stat.id,
    label: statLabel(stat),
    description: stat.name[lang.value],
  })),
)
const otherStats = computed(() =>
  statOptions.value.filter((stat) => !(PRESETS as readonly string[]).includes(stat.id)),
)

// ---- Which card is active. "other", "custom" and "optimize" wait for a statistic or a formula
// before they change the numbers, so the card is kept apart from the scaling itself.
const cardFor = (value: string | null): ChoiceKey => {
  if (!value) return 'none'
  if (isCustomScaling(value)) return 'custom'
  if ((PRESETS as readonly string[]).includes(value)) return value as ChoiceKey
  return 'other'
}

// A shared link with optimiser scenarios (?opt=) opens the optimiser
const linkHasScenarios =
  typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('opt')
const selectedCard = ref<ChoiceKey>(linkHasScenarios ? 'optimize' : cardFor(scaling.value))
const activeChoice = computed(() => selectedCard.value)

// A value set from outside (link, back button) moves the selection to its card. The optimiser
// card stays when its own formula is applied.
watch(scaling, (value) => {
  if (selectedCard.value === 'optimize' && value && isCustomScaling(value)) return
  selectedCard.value = cardFor(value)
})

const otherStatId = computed(() =>
  activeChoice.value === 'other' && scaling.value && cardFor(scaling.value) === 'other'
    ? scaling.value
    : null,
)

const choices = computed(() => [
  {
    key: 'none' as const,
    icon: 'pi pi-wallet',
    title: t('scalingStep.choices.none.title'),
    description: t('scalingStep.choices.none.description'),
  },
  ...PRESETS.map((id) => ({
    key: id,
    icon: { pop: 'pi pi-users', workplaces: 'pi pi-briefcase', total_area: 'pi pi-map' }[id],
    title: t(`scalingStep.choices.${id}.title`),
    description: t(`scalingStep.choices.${id}.description`),
  })),
  {
    key: 'other' as const,
    icon: 'pi pi-list',
    title: t('scalingStep.choices.other.title'),
    description: t('scalingStep.choices.other.description'),
  },
  {
    key: 'custom' as const,
    icon: 'pi pi-calculator',
    title: t('scalingStep.choices.custom.title'),
    description: t('scalingStep.choices.custom.description'),
  },
  {
    key: 'optimize' as const,
    icon: 'pi pi-sparkles',
    title: t('scalingStep.choices.optimize.title'),
    description: t('scalingStep.choices.optimize.description'),
  },
])

const choose = (key: ChoiceKey) => {
  selectedCard.value = key
  if (key === 'none') scaling.value = null
  else if ((PRESETS as readonly string[]).includes(key)) scaling.value = key
}

// ---- Formula builder
const formulaInput = ref<{ $el: HTMLInputElement } | null>(null)
const formulaDraft = ref(
  scaling.value && isCustomScaling(scaling.value) ? formulaOf(scaling.value) : '',
)
const appliedFormula = computed(() =>
  scaling.value && isCustomScaling(scaling.value) ? formulaOf(scaling.value) : '',
)
watch(appliedFormula, (formula) => {
  if (formula) formulaDraft.value = formula
})

const validation = computed(() =>
  formulaDraft.value.trim()
    ? CustomScalingFormula.validateFormula(formulaDraft.value, props.stats)
    : { isValid: false as const, error: undefined, usedFactors: undefined },
)

const validationText = computed(() =>
  validation.value.isValid
    ? t('scalingStep.formula.valid', {
        statistics: (validation.value.usedFactors ?? [])
          .map((id) => statOptions.value.find((stat) => stat.id === id)?.label ?? id)
          .join(', '),
      })
    : t('scalingStep.formula.invalid', { error: validation.value.error ?? '' }),
)

const insert = (token: string) => {
  const input = formulaInput.value?.$el as HTMLInputElement | undefined
  const text = formulaDraft.value
  const start = input?.selectionStart ?? text.length
  const end = input?.selectionEnd ?? text.length
  formulaDraft.value = text.slice(0, start) + token + text.slice(end)
  const caret = start + token.length
  requestAnimationFrame(() => {
    input?.focus()
    input?.setSelectionRange(caret, caret)
  })
}

const applyFormula = () => {
  if (!validation.value.isValid) return
  scaling.value = `${CUSTOM_SCALING_PREFIX}${formulaDraft.value.trim()}`
}

const applyOptimized = (formula: string) => {
  if (!formula) return
  formulaDraft.value = formula
  scaling.value = `${CUSTOM_SCALING_PREFIX}${formula}`
}

// ---- Preview: the divisors themselves, before any account is shown
const calculator = new ScalingCalculator()
const outcomes = ref(new Map<string, ScalingOutcome>())
const previewError = ref<string | null>(null)
const calculating = ref(false)
let run = 0

watch(
  [scaling, () => props.datasets.join(',')],
  async () => {
    const id = scaling.value
    const current = ++run
    previewError.value = null
    if (!id || props.datasets.length === 0) {
      outcomes.value = new Map()
      return
    }
    calculating.value = true
    try {
      const result = await calculator.calculate(id, props.datasets)
      if (current !== run) return
      if (result.ok) {
        outcomes.value = result.outcomes
      } else {
        outcomes.value = new Map()
        previewError.value = result.unknown
          ? t('scalingStep.preview.unknown')
          : t('scalingStep.formula.invalid', { error: result.error ?? '' })
      }
    } finally {
      if (current === run) calculating.value = false
    }
  },
  { immediate: true },
)

const selection = computed(() => selectionFromDatasets(props.datasets))
const previewPlaces = computed(() =>
  selection.value.places.map((key) => ({ key, label: props.placeName(key) })),
)
const previewYears = computed(() => selection.value.years)

const cell = (place: string, year: string) => outcomes.value.get(datasetIdOf(place, year))

/** The statistics year when it differs from the year of the finances */
const otherYear = (outcome: ScalingOutcome, year: string) => {
  const used = outcome.inputs.find(
    (input) => input.year !== undefined && String(input.year) !== year,
  )
  return used ? String(used.year) : ''
}

const hasOtherYears = computed(() =>
  [...outcomes.value.values()].some((outcome) => {
    const year = outcome.datasetId.split(':')[1]
    return otherYear(outcome, year) !== ''
  }),
)
const hasMissing = computed(() =>
  [...outcomes.value.values()].some((outcome) => outcome.factor === null),
)

const formatFactor = (value: number) =>
  new Intl.NumberFormat(locale.value, {
    maximumFractionDigits: value >= 100 ? 0 : 2,
  }).format(value)

const previewIntro = computed(() => {
  const id = scaling.value
  if (!id) return ''
  if (isCustomScaling(id)) {
    return t('scalingStep.preview.introFormula', {
      formula: describeFormula(formulaOf(id), (statId) =>
        statisticName(statId, props.stats, locale.value),
      ),
    })
  }
  const stat = props.stats.find((s) => s.id === id)
  return t('scalingStep.preview.introStat', {
    name: stat ? statLabel(stat) : id,
    unit: stat?.unit[lang.value] ?? '',
  })
})
</script>

<style scoped>
.scaling-step {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  min-width: 0;
}

.choice-grid {
  display: grid;
  gap: 0.5rem;
}

@media (min-width: 640px) {
  .choice-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (min-width: 1100px) {
  .choice-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

.choice {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.85rem 1rem;
  border: 1px solid var(--gk-border-strong);
  border-radius: var(--radius-md);
  background: var(--gk-surface);
  cursor: pointer;
}

.choice:hover {
  background: var(--gk-surface-2);
}

.choice.is-active {
  border-color: var(--gk-accent);
  background: color-mix(in srgb, var(--gk-accent) 10%, var(--gk-surface));
  box-shadow: 0 0 0 1px var(--gk-accent);
}

.choice:focus-within {
  outline: 2px solid var(--gk-accent);
  outline-offset: 2px;
}

.choice > .pi {
  margin-top: 0.15rem;
  color: var(--gk-accent-strong);
  font-size: 1.1rem;
}

.choice-input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.choice-text {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  min-width: 0;
}

.choice-title {
  font-weight: 650;
}

.choice-description {
  color: var(--gk-muted);
  font-size: 0.8125rem;
  line-height: 1.4;
}

.sub-panel {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  min-width: 0;
  padding: 0.9rem;
  border: 1px solid var(--gk-border);
  border-radius: var(--radius-md);
  background: var(--gk-surface-2);
}

.field-label {
  font-size: 0.875rem;
  font-weight: 600;
}

.formula-input {
  min-height: 2.75rem;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 1rem;
}

.token-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
}

.token {
  min-height: 2.5rem;
  padding: 0 0.7rem;
  border: 1px solid var(--gk-border-strong);
  border-radius: var(--radius-md);
  background: var(--gk-surface);
  color: var(--gk-ink);
  font: inherit;
  font-size: 0.8125rem;
  cursor: pointer;
}

.token.operator {
  min-width: 2.75rem;
  font-size: 1rem;
  font-weight: 650;
}

.token:hover {
  border-color: var(--gk-accent);
}

.token:focus-visible {
  outline: 2px solid var(--gk-accent);
  outline-offset: 2px;
}

.formula-status {
  display: flex;
  gap: 0.5rem;
  margin: 0;
  font-size: 0.875rem;
  line-height: 1.45;
  overflow-wrap: anywhere;
}

.formula-status .pi {
  margin-top: 0.2rem;
}

.formula-status.is-valid .pi {
  color: var(--gk-positive);
}

.formula-status.is-invalid {
  color: var(--gk-negative);
}

.formula-actions :deep(.p-button) {
  min-height: 2.75rem;
}

.formula-examples summary {
  min-height: 2.75rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  cursor: pointer;
}

.formula-examples ul {
  display: grid;
  gap: 0.35rem;
  margin: 0.25rem 0 0;
  padding: 0;
  list-style: none;
  color: var(--gk-muted);
  font-size: 0.8125rem;
}

.formula-examples li {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.25rem 0.5rem;
}

.example {
  min-height: 2.25rem;
  padding: 0 0.5rem;
  border: 1px dashed var(--gk-border-strong);
  border-radius: var(--radius-md);
  background: var(--gk-surface);
  color: var(--gk-ink);
  cursor: pointer;
}

.optimizer-intro,
.optimizer-wait {
  margin: 0 0 0.75rem;
  color: var(--gk-muted);
  font-size: 0.8125rem;
  line-height: 1.45;
}

.preview {
  padding: 1rem;
  border: 1px solid var(--gk-border);
  border-radius: var(--radius-lg);
  background: var(--gk-surface);
}

.preview-title {
  margin: 0;
  font-size: 1rem;
  font-weight: 650;
}

.preview-intro,
.preview-note {
  margin: 0.25rem 0 0.75rem;
  color: var(--gk-muted);
  font-size: 0.8125rem;
  line-height: 1.45;
}

.preview-note {
  margin: 0.5rem 0 0;
}

.preview-table-wrap {
  max-width: 100%;
  overflow-x: auto;
}

.preview-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.8125rem;
}

.preview-table th,
.preview-table td {
  padding: 0.45rem 0.5rem;
  border-bottom: 1px solid var(--gk-border);
  text-align: right;
  white-space: nowrap;
}

.preview-table th:first-child {
  text-align: left;
  white-space: normal;
  min-width: 8rem;
}

.preview-table thead th {
  color: var(--gk-muted);
  font-weight: 600;
}

.preview-table td {
  font-variant-numeric: tabular-nums;
}

.year-mark {
  margin-left: 0.15rem;
  color: var(--gk-muted);
  font-size: 0.625rem;
}

.missing,
.muted {
  color: var(--gk-muted);
}
</style>
