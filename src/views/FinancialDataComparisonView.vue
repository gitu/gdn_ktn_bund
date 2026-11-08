<template>
  <div class="compare-page">
    <header class="page-head">
      <h1>{{ $t('financialDataComparison.title') }}</h1>
      <p>{{ $t('wizard.intro') }}</p>
    </header>

    <ComparisonStepper :steps="steps" :current="step" class="page-stepper" @go="goTo" />

    <!-- Step 1: places -->
    <section v-if="step === 'places'" class="step-card" data-testid="step-panel-places">
      <div class="step-head">
        <h2>{{ $t('wizard.places.title') }}</h2>
        <p>{{ $t('wizard.places.help') }}</p>
      </div>
      <PlaceStep
        :model-value="places"
        :catalog="catalog"
        :loading="catalogLoading"
        @update:model-value="onPlacesChange"
      />

      <!-- Ready-made comparisons for a quick start -->
      <div v-if="places.length === 0" class="demo">
        <h3>{{ $t('financialDataComparison.demoTitle') }}</h3>
        <p class="demo-intro">{{ $t('financialDataComparison.demoDescription') }}</p>
        <div class="demo-grid">
          <button
            v-for="(sample, key) in SAMPLE_COMPARISONS"
            :key="key"
            type="button"
            class="demo-card"
            :data-testid="`demo-${key}`"
            @click="loadSample(key)"
          >
            <span class="demo-name">{{
              $t(`financialDataComparison.sampleDatasets.${key}.name`)
            }}</span>
            <span class="demo-text">{{
              $t(`financialDataComparison.sampleDatasets.${key}.description`)
            }}</span>
            <span class="demo-action">
              <i class="pi pi-play" aria-hidden="true"></i>
              {{ $t('financialDataComparison.loadDemoData') }}
            </span>
          </button>
        </div>
      </div>
    </section>

    <!-- Step 2: years -->
    <section v-else-if="step === 'years'" class="step-card" data-testid="step-panel-years">
      <div class="step-head">
        <h2>{{ $t('wizard.years.title') }}</h2>
        <p>{{ $t('wizard.years.help') }}</p>
      </div>
      <Message v-if="customCombination" severity="info" :closable="false">
        {{ $t('wizard.years.customCombination') }}
      </Message>
      <YearPicker
        :places="places"
        :available="availability"
        :years="years"
        :mode="yearMode"
        @update:years="onYearsChange"
        @update:mode="(mode: YearMode) => (yearMode = mode)"
      />
    </section>

    <!-- Step 3: conversion, calculated on its own before the finances are shown -->
    <section v-else-if="step === 'scaling'" class="step-card" data-testid="step-panel-scaling">
      <div class="step-head">
        <h2>{{ $t('wizard.scaling.title') }}</h2>
        <p>{{ $t('wizard.scaling.help') }}</p>
      </div>
      <ScalingStep
        :model-value="scaling"
        :datasets="datasets"
        :stats="stats"
        :financial-data="dataReady ? store.combinedFinancialData : null"
        :place-name="placeName"
        @update:model-value="onScalingChange"
      />
    </section>

    <!-- Back / next, always in reach (sticky above the phone navigation) -->
    <div v-if="step !== 'result'" class="step-actions">
      <Button
        v-if="step !== 'places'"
        :label="$t('common.back')"
        icon="pi pi-arrow-left"
        severity="secondary"
        outlined
        class="step-back"
        data-testid="step-back"
        @click="goTo(previousStep!)"
      />
      <span class="step-status">{{ stepStatus }}</span>
      <Button
        :label="nextLabel"
        icon="pi pi-arrow-right"
        icon-pos="right"
        :disabled="!canContinue"
        class="step-next"
        data-testid="step-next"
        @click="goTo(nextStep!)"
      />
    </div>

    <!-- Step 4: the result. Mounted from step 3 on, so the data is loaded in the background and
         the optimiser in step 3 can use it -->
    <section
      v-if="datasets.length > 0 && (step === 'scaling' || step === 'result')"
      v-show="step === 'result'"
      class="results"
      data-testid="comparison-results"
    >
      <ResultBar
        :place-names="places.map(placeName)"
        :years="years"
        :all-years="allYears"
        :scaling="scaling"
        :scaling-options="scalingOptions"
        @edit="goTo"
        @year="onBrowseYear"
        @scaling="onScalingChange"
      />

      <Message v-if="missingPlaces.length > 0" severity="warn" :closable="false">
        {{ $t('wizard.result.missingPlaces', { names: missingPlaces.join(', ') }) }}
      </Message>
      <RestOfCantonNotice :datasets="datasets" />

      <div class="result-tools">
        <div class="view-switch" role="tablist" :aria-label="$t('wizard.result.viewLabel')">
          <button
            v-for="option in VIEWS"
            :key="option"
            type="button"
            role="tab"
            class="view-tab"
            :aria-selected="view === option"
            :data-testid="`view-${option}`"
            @click="setView(option)"
          >
            <i
              :class="option === 'charts' ? 'pi pi-chart-bar' : 'pi pi-table'"
              aria-hidden="true"
            ></i>
            {{ $t(`wizard.result.views.${option}`) }}
          </button>
        </div>
        <Button
          v-if="view === 'table' && dataLoadedCount > 0"
          :label="$t('financialDataComparison.openFullView')"
          :title="$t('financialDataComparison.openFullViewTooltip')"
          icon="pi pi-external-link"
          severity="secondary"
          outlined
          class="full-view-button"
          @click="openFullView"
        />
      </div>

      <HowToRead />

      <!-- Charts -->
      <div v-if="view === 'charts'" role="tabpanel" class="charts-panel">
        <FinancialCharts
          v-if="dataReady && store.combinedFinancialData"
          :data="store.combinedFinancialData"
          :unit-label="chartUnitLabel"
          :scaled="!!store.appliedScalingId"
          :class="{ 'is-recalculating': store.isApplyingScaling }"
          :aria-busy="store.isApplyingScaling"
        />
        <div v-else-if="!store.error" class="charts-loading" role="status">
          <span class="visually-hidden">{{ $t('financialDataComparison.loading') }}</span>
          <Skeleton v-for="n in 2" :key="n" height="14rem" class="chart-skeleton" />
        </div>
      </div>

      <!-- The table; it also loads the data for the charts, so it stays mounted -->
      <div v-show="view === 'table'" role="tabpanel" class="table-panel">
        <FinancialDataComparison
          :datasets="datasets"
          :selected-scaling="scaling"
          :comparison-pairs="comparisonPairs"
          :show-scaling="false"
          :show-dev-info="view === 'table'"
          @error="handleError"
          @data-loaded="handleDataLoaded"
          @scaling-changed="onScalingChange"
          @comparison-changed="handleComparisonChanged"
        />
      </div>

      <PlaceFacts :datasets="factsDatasets" />
    </section>

    <Message v-if="errorMessage" severity="error" :closable="false" class="mb-4">
      {{ errorMessage }}
    </Message>

    <!-- Announced to screen readers; the charts and the table are the visible confirmation -->
    <p v-if="dataLoadedCount > 0" class="visually-hidden" role="status" aria-live="polite">
      {{ $t('financialDataComparison.datasetsLoaded', { count: dataLoadedCount }) }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import Button from 'primevue/button'
import Message from 'primevue/message'
import Skeleton from 'primevue/skeleton'
import FinancialDataComparison from '@/components/FinancialDataComparison.vue'
import HowToRead from '@/components/HowToRead.vue'
import RestOfCantonNotice from '@/components/RestOfCantonNotice.vue'
import PlaceFacts from '@/components/PlaceFacts.vue'
import FinancialCharts from '@/components/charts/FinancialCharts.vue'
import ComparisonStepper, { type WizardStep } from '@/components/wizard/ComparisonStepper.vue'
import PlaceStep from '@/components/wizard/PlaceStep.vue'
import YearPicker, { type YearMode } from '@/components/wizard/YearPicker.vue'
import ScalingStep from '@/components/wizard/ScalingStep.vue'
import ResultBar from '@/components/wizard/ResultBar.vue'
import { SAMPLE_COMPARISONS, type SampleComparisonKey } from '@/data/sampleComparisons'
import { useFinancialDataStore } from '@/stores/financialData'
import { loadAvailableDataCatalog } from '@/utils/AvailableDataLoader'
import { StatsDataLoader } from '@/utils/StatsDataLoader'
import {
  describeFormula,
  formulaOf,
  isCustomScaling,
  statisticName,
} from '@/utils/ScalingCalculator'
import {
  buildDatasets,
  catalogAvailability,
  defaultYear,
  isGrid,
  placeKeyOf,
  placeKeyOfEntry,
  selectionFromDatasets,
  sortYears,
  yearCoverage,
} from '@/utils/ComparisonSelection'
import type { AvailableDataEntry, MultiLanguageLabels } from '@/types/DataStructures'
import type { StatsAvailabilityInfo } from '@/types/StatsData'

type StepKey = 'places' | 'years' | 'scaling' | 'result'
type ViewKey = 'charts' | 'table'
const STEP_KEYS: StepKey[] = ['places', 'years', 'scaling', 'result']
const VIEWS: ViewKey[] = ['charts', 'table']

const router = useRouter()
const route = useRoute()
const { t, locale } = useI18n()
const store = useFinancialDataStore()
const lang = computed(() => locale.value as keyof MultiLanguageLabels)

// ---- Reference data
const catalog = ref<AvailableDataEntry[]>([])
const catalogLoading = ref(true)
const availability = computed(() => catalogAvailability(catalog.value))
const stats = ref<StatsAvailabilityInfo[]>([])

// ---- The comparison
const places = ref<string[]>([])
const years = ref<string[]>([])
const yearMode = ref<YearMode>('single')
/** Dataset ids: what the store loads and the URL carries */
const datasets = ref<string[]>([])
/** A link listed its own mix of places and years (not every place in every year) */
const customCombination = ref(false)
const scaling = ref<string | null>(null)
const comparisonPairs = ref<Record<string, string[]>>({})
const step = ref<StepKey>('places')
const view = ref<ViewKey>('charts')

const errorMessage = ref<string | null>(null)
const dataLoadedCount = ref(0)

// ---- Names
const entryByPlace = computed(
  () => new Map(catalog.value.map((entry) => [placeKeyOfEntry(entry), entry])),
)
const placeName = (place: string) => {
  const entry = entryByPlace.value.get(place)
  return entry ? entry.displayName[lang.value] || entry.displayName.de : place
}

const allYears = computed(() =>
  sortYears(yearCoverage(places.value, availability.value).map((c) => c.year)),
)

const statLabel = (id: string) => statisticName(id, stats.value, locale.value)

const labelOf = (id: string | null) => {
  if (!id) return t('financialDataScalingSelector.noScaling')
  return isCustomScaling(id) ? describeFormula(formulaOf(id), statLabel) : statLabel(id)
}

const scalingLabel = computed(() => labelOf(scaling.value))

// The charts name the scaling their numbers are divided by right now: while a new one is being
// calculated they still show (dimmed) the old numbers, with the old unit
const chartUnitLabel = computed(() => {
  const id = store.appliedScalingId
  if (!id) return t('charts.unit.francs')
  if (isCustomScaling(id)) return t('charts.unit.perFormula', { formula: labelOf(id) })
  const unit = stats.value.find((stat) => stat.id === id)?.unit[lang.value]
  return t('charts.unit.per', { unit: unit ?? statLabel(id) })
})

const scalingOptions = computed(() => {
  const options: { label: string; value: string | null }[] = [
    { label: t('financialDataScalingSelector.noScaling'), value: null },
    ...stats.value.map((stat) => ({ label: statLabel(stat.id), value: stat.id })),
  ]
  if (scaling.value && isCustomScaling(scaling.value)) {
    options.push({ label: scalingLabel.value, value: scaling.value })
  }
  return options
})

// One card per place in "places at a glance", for its newest year in the comparison
const factsDatasets = computed(() => {
  const newest = new Map<string, string>()
  for (const id of datasets.value) {
    const place = placeKeyOf(id)
    if (place) newest.set(place, id) // ids run oldest to newest per place
  }
  return [...newest.values()]
})

// Places of the comparison that have no column in the chosen year(s)
const missingPlaces = computed(() =>
  places.value
    .filter((place) => !datasets.value.some((id) => placeKeyOf(id) === place))
    .map(placeName),
)

// ---- Steps
const steps = computed<WizardStep<StepKey>[]>(() => [
  {
    key: 'places',
    label: t('wizard.steps.places'),
    summary: places.value.length ? t('wizard.summary.places', places.value.length) : '',
    done: places.value.length > 0,
    enabled: true,
  },
  {
    key: 'years',
    label: t('wizard.steps.years'),
    summary:
      years.value.length > 1
        ? `${years.value[0]}–${years.value[years.value.length - 1]}`
        : (years.value[0] ?? ''),
    done: datasets.value.length > 0,
    enabled: places.value.length > 0,
  },
  {
    key: 'scaling',
    label: t('wizard.steps.scaling'),
    summary: datasets.value.length ? scalingLabel.value : '',
    done: datasets.value.length > 0 && step.value === 'result',
    enabled: datasets.value.length > 0,
  },
  {
    key: 'result',
    label: t('wizard.steps.result'),
    summary: '',
    done: false,
    enabled: datasets.value.length > 0,
  },
])

const stepIndex = computed(() => STEP_KEYS.indexOf(step.value))
const previousStep = computed(() => STEP_KEYS[stepIndex.value - 1])
const nextStep = computed(() => STEP_KEYS[stepIndex.value + 1])
const canContinue = computed(() => steps.value[stepIndex.value + 1]?.enabled ?? false)

const nextLabel = computed(() =>
  nextStep.value === 'result'
    ? t('wizard.showResult')
    : t('wizard.next', { step: t(`wizard.steps.${nextStep.value}`) }),
)

const stepStatus = computed(() => {
  if (step.value === 'places') {
    return places.value.length
      ? t('wizard.summary.places', places.value.length)
      : t('wizard.places.none')
  }
  if (step.value === 'years') {
    return t('wizard.summary.columns', datasets.value.length)
  }
  return scalingLabel.value
})

const goTo = (target: string) => {
  const key = target as StepKey
  if (!STEP_KEYS.includes(key) || !steps.value.find((s) => s.key === key)?.enabled) return
  if (key === step.value) return
  step.value = key
  updateURL(true)
  window.scrollTo?.({ top: 0, behavior: 'smooth' })
}

// ---- Changes from the steps
const rebuild = () => {
  customCombination.value = false
  datasets.value = buildDatasets({ places: places.value, years: years.value }, availability.value)
}

const onPlacesChange = (next: string[]) => {
  places.value = next
  // First places, or years none of them has: start with the newest year they share
  const coverage = new Set(yearCoverage(next, availability.value).map((c) => c.year))
  if (years.value.length === 0 || !years.value.some((year) => coverage.has(year))) {
    const year = defaultYear(next, availability.value)
    years.value = year ? [year] : []
    yearMode.value = 'single'
  } else {
    years.value = years.value.filter((year) => coverage.has(year))
  }
  rebuild()
  updateURL()
}

const onYearsChange = (next: string[]) => {
  years.value = sortYears(next)
  rebuild()
  updateURL()
}

// Browsing to another year keeps the places and the conversion
const onBrowseYear = (year: string) => {
  onYearsChange([year])
}

const onScalingChange = (next: string | null) => {
  if (next === scaling.value) return
  scaling.value = next
  updateURL()
}

const handleComparisonChanged = (pairs: Record<string, string[]>) => {
  if (JSON.stringify(pairs) !== JSON.stringify(comparisonPairs.value)) comparisonPairs.value = pairs
  updateURL()
}

const setView = (next: ViewKey) => {
  view.value = next
  updateURL()
}

const loadSample = (key: SampleComparisonKey) => {
  const sample: { datasets: readonly string[]; scaling?: string } = SAMPLE_COMPARISONS[key]
  applyDatasets([...sample.datasets])
  scaling.value = sample.scaling ?? null
  step.value = 'result'
  updateURL(true)
}

const handleError = (error: string) => {
  errorMessage.value = error
}

const handleDataLoaded = (count: number) => {
  dataLoadedCount.value = count
  errorMessage.value = null
}

const openFullView = () => {
  const query: Record<string, string> = { datasets: datasets.value.join(',') }
  if (scaling.value) query.scaling = scaling.value
  router.push({ name: 'financial-data-full-view', query })
}

// Charts only show the data that belongs to the current selection
const dataReady = computed(
  () =>
    !store.loading &&
    store.hasValidData &&
    store.datasets.length === datasets.value.length &&
    store.datasets.every((id, index) => id === datasets.value[index]),
)

// ---- URL: datasets, scaling, comparisons (as before), plus step and view
const sameList = (a: readonly string[], b: readonly string[]) =>
  a.length === b.length && a.every((item, index) => item === b[index])

const applyDatasets = (ids: string[]) => {
  // Other parameters (e.g. the optimiser's `opt`) change the URL too: an unchanged list must not
  // become a new array, or the data would be loaded again
  if (sameList(ids, datasets.value)) return
  datasets.value = ids
  const selection = selectionFromDatasets(ids)
  places.value = selection.places
  years.value = selection.years
  yearMode.value = selection.years.length > 1 ? 'multi' : 'single'
  customCombination.value =
    catalog.value.length > 0 && ids.length > 0 && !isGrid(ids, availability.value)
}

let lastQuery = ''

const updateURL = (push = false) => {
  const query: Record<string, string> = {}
  // Keep parameters owned by others (e.g. the optimiser scenarios in `opt`)
  for (const [key, value] of Object.entries(route.query)) {
    if (typeof value === 'string') query[key] = value
    else if (Array.isArray(value) && typeof value[0] === 'string') query[key] = value[0]
  }

  if (datasets.value.length > 0) query.datasets = datasets.value.join(',')
  else delete query.datasets

  // Custom formulas are encoded once more, as links made before always were
  if (scaling.value) query.scaling = encodeURIComponent(scaling.value)
  else delete query.scaling

  const pairs = Object.entries(comparisonPairs.value).flatMap(([column, bases]) =>
    bases.map((base) => `${column},${base}`),
  )
  if (pairs.length > 0) query.comparisons = pairs.join('|')
  else delete query.comparisons

  // The result is the default page of a link with data, the place step the default without
  const defaultStep: StepKey = datasets.value.length > 0 ? 'result' : 'places'
  if (step.value !== defaultStep) query.step = step.value
  else delete query.step

  if (view.value !== 'charts') query.view = view.value
  else delete query.view

  const next = new URLSearchParams(query).toString()
  const current = new URLSearchParams(route.query as Record<string, string>).toString()
  if (next === current) return
  lastQuery = next
  const location = {
    name: 'financial-comparison',
    query: Object.keys(query).length ? query : undefined,
  }
  if (push) router.push(location)
  else router.replace(location)
}

const loadStateFromURL = () => {
  const {
    datasets: datasetsParam,
    scaling: scalingParam,
    comparisons,
    step: stepParam,
    view: viewParam,
  } = route.query

  const ids =
    typeof datasetsParam === 'string'
      ? datasetsParam.split(',').filter((id) => id.trim().length > 0)
      : Array.isArray(datasetsParam)
        ? (datasetsParam.filter((id) => typeof id === 'string' && id.trim()) as string[])
        : []
  applyDatasets(ids)

  scaling.value =
    typeof scalingParam === 'string' && scalingParam.trim()
      ? decodeURIComponent(scalingParam)
      : null

  const pairs: Record<string, string[]> = {}
  if (typeof comparisons === 'string') {
    for (const pair of comparisons.split('|')) {
      const [column, base] = pair.split(',')
      if (column && base) {
        pairs[column] = pairs[column] ?? []
        if (!pairs[column].includes(base)) pairs[column].push(base)
      }
    }
  }
  comparisonPairs.value = pairs

  const requested = STEP_KEYS.find((key) => key === stepParam)
  const fallback: StepKey = ids.length > 0 ? 'result' : 'places'
  // A step that needs data is not reachable without it
  step.value =
    requested &&
    (requested === 'places' ||
      (requested === 'years' ? ids.length > 0 || places.value.length > 0 : ids.length > 0))
      ? requested
      : fallback

  view.value = viewParam === 'table' ? 'table' : 'charts'
}

watch(
  () => route.query,
  () => {
    // Our own replace/push is already applied; react to back/forward and links only
    const current = new URLSearchParams(route.query as Record<string, string>).toString()
    if (current === lastQuery) return
    lastQuery = current
    loadStateFromURL()
  },
  { deep: true },
)

onMounted(async () => {
  lastQuery = new URLSearchParams(route.query as Record<string, string>).toString()
  loadStateFromURL()
  try {
    catalog.value = await loadAvailableDataCatalog()
    // Only now can a link be checked against the years each place has
    if (datasets.value.length > 0) {
      customCombination.value = !isGrid(datasets.value, availability.value)
    }
  } catch (error) {
    errorMessage.value = t('datasetSelector.errors.loadingFailed')
    console.error('Failed to load the catalogue', error)
  } finally {
    catalogLoading.value = false
  }
  try {
    stats.value = await StatsDataLoader.getInstance().getAvailableStats()
  } catch (error) {
    console.error('Failed to load the statistics', error)
  }
})
</script>

<style scoped>
.compare-page {
  display: flex;
  flex-direction: column;
  gap: clamp(1rem, 2.5vw, 1.5rem);
  max-width: 80rem;
  margin: 0 auto;
}

.page-head h1 {
  margin: 0 0 0.4rem;
}

.page-head p {
  margin: 0;
  max-width: 46rem;
  color: var(--gk-muted);
}

.step-card {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  min-width: 0;
  padding: clamp(1rem, 3vw, 1.5rem);
  border: 1px solid var(--gk-border);
  border-radius: var(--radius-lg);
  background: var(--gk-surface);
  box-shadow: var(--gk-shadow-1);
}

.step-head h2 {
  margin: 0 0 0.3rem;
  font-size: clamp(1.15rem, 1rem + 0.6vw, 1.4rem);
}

.step-head p {
  margin: 0;
  max-width: 48rem;
  color: var(--gk-muted);
  line-height: 1.5;
}

/* Back / next stay in reach while scrolling a long list */
.step-actions {
  position: sticky;
  bottom: 1rem;
  z-index: 5;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.65rem;
  border: 1px solid var(--gk-border);
  border-radius: var(--radius-lg);
  background: var(--gk-glass);
  box-shadow: var(--gk-shadow-2);
  backdrop-filter: blur(12px);
}

@media (max-width: 767px) {
  .step-actions {
    bottom: calc(var(--bottomnav-h) + env(safe-area-inset-bottom, 0px) + 0.5rem);
  }
}

.step-actions :deep(.p-button) {
  min-height: 2.75rem;
}

.step-status {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  color: var(--gk-muted);
  font-size: 0.875rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.step-next {
  margin-inline-start: auto;
}

@media (max-width: 420px) {
  .step-status {
    display: none;
  }

  .step-next {
    flex: 1;
  }
}

.results {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  min-width: 0;
}

.result-tools {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.view-switch {
  display: inline-flex;
  padding: 0.25rem;
  border: 1px solid var(--gk-border);
  border-radius: 999px;
  background: var(--gk-surface-2);
}

.view-tab {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  min-height: 2.5rem;
  padding: 0 1rem;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: var(--gk-muted);
  font: inherit;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
}

.view-tab[aria-selected='true'] {
  background: var(--gk-surface);
  box-shadow: var(--gk-shadow-1);
  color: var(--gk-ink);
}

.view-tab:focus-visible {
  outline: 2px solid var(--gk-accent);
  outline-offset: 2px;
}

.full-view-button {
  min-height: 2.75rem;
}

/* Hold the previous charts, dimmed, while a new conversion is calculated (no layout jump) */
.charts-panel :deep(.is-recalculating) {
  opacity: 0.5;
  transition: opacity 0.2s ease;
}

.charts-loading {
  display: grid;
  gap: 1rem;
}

.chart-skeleton {
  border-radius: var(--radius-lg);
}

.table-panel {
  min-width: 0;
  padding: clamp(0.75rem, 2vw, 1.25rem);
  border: 1px solid var(--gk-border);
  border-radius: var(--radius-lg);
  background: var(--gk-surface);
  box-shadow: var(--gk-shadow-1);
}

.demo {
  padding-top: 0.5rem;
  border-top: 1px solid var(--gk-border);
}

.demo h3 {
  margin: 0.5rem 0 0.3rem;
  font-size: 1rem;
}

.demo-intro {
  margin: 0 0 0.75rem;
  color: var(--gk-muted);
}

.demo-grid {
  display: grid;
  gap: 0.75rem;
}

@media (min-width: 640px) {
  .demo-grid {
    grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr));
  }
}

.demo-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.4rem;
  padding: 1rem 1.1rem;
  border: 1px solid var(--gk-border);
  border-radius: var(--radius-lg);
  background: var(--gk-surface-2);
  color: var(--gk-ink);
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition:
    transform 0.18s ease,
    border-color 0.18s ease,
    box-shadow 0.18s ease;
}

.demo-card:hover,
.demo-card:focus-visible {
  transform: translateY(-2px);
  border-color: color-mix(in srgb, var(--gk-accent) 55%, var(--gk-border));
  box-shadow: var(--gk-shadow-2);
}

.demo-name {
  font-weight: 650;
  line-height: 1.3;
}

.demo-text {
  color: var(--gk-muted);
  font-size: 0.875rem;
  line-height: 1.45;
}

.demo-action {
  margin-top: 0.25rem;
  color: var(--gk-accent-strong);
  font-size: 0.875rem;
  font-weight: 600;
}

.demo-action i {
  margin-right: 0.35rem;
  font-size: 0.8rem;
}

/* The table needs every pixel on a phone */
@media (max-width: 767px) {
  .table-panel {
    padding: 0.5rem;
  }
}
</style>
