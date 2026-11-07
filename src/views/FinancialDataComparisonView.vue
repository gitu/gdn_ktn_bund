<template>
  <div class="compare-page">
    <!-- Header -->
    <header class="page-head">
      <h1>{{ $t('financialDataComparison.title') }}</h1>
      <p>{{ $t('financialDataComparison.subtitle') }}</p>
    </header>

    <!-- Dataset Selection Section -->
    <Card class="section-card">
      <template #content>
        <DatasetSelector v-model="selectedDatasets" @error="handleSelectorError" />
      </template>
    </Card>

    <!-- Comparison Results Section -->
    <section v-if="selectedDatasets.length > 0" class="results" data-testid="comparison-results">
      <div class="results-head">
        <div class="results-title">
          <h2>{{ $t('financialDataComparison.comparisonResults') }}</h2>
          <p>
            {{
              $t('financialDataComparison.comparisonDescription', {
                count: selectedDatasets.length,
              })
            }}
          </p>
        </div>

        <Button
          v-if="dataLoadedCount > 0"
          :label="$t('financialDataComparison.openFullView')"
          :title="$t('financialDataComparison.openFullViewTooltip')"
          icon="pi pi-external-link"
          severity="secondary"
          outlined
          class="full-view-button"
          @click="openFullView"
        />
      </div>

      <RestOfCantonNotice :datasets="selectedDatasets" />
      <HowToRead />

      <Card class="section-card">
        <template #content>
          <FinancialDataComparison
            :datasets="selectedDatasets"
            :selected-scaling="selectedScaling"
            :comparison-pairs="comparisonPairs"
            @error="handleError"
            @dataLoaded="handleDataLoaded"
            @scaling-changed="handleScalingChanged"
            @comparison-changed="handleComparisonChanged"
          />
        </template>
      </Card>

      <PlaceFacts :datasets="selectedDatasets" />
    </section>

    <!-- Demo Section (shown when no datasets selected) -->
    <section v-else class="demo">
      <h2>{{ $t('financialDataComparison.demoTitle') }}</h2>
      <p class="demo-intro">{{ $t('financialDataComparison.demoDescription') }}</p>

      <div class="demo-grid">
        <button
          v-for="(sample, key) in SAMPLE_COMPARISONS"
          :key="key"
          type="button"
          class="demo-card"
          :data-testid="`demo-${key}`"
          @click="loadSampleDataset(key)"
        >
          <span class="demo-name">{{
            $t(`financialDataComparison.sampleDatasets.${key}.name`)
          }}</span>
          <span class="demo-text">{{
            $t(`financialDataComparison.sampleDatasets.${key}.description`)
          }}</span>
          <span class="demo-meta">
            {{ $t('homeView.quickStart.datasets', { count: sample.datasets.length }) }}
            <template v-if="'scaling' in sample">
              · {{ $t(`financialDataScalingSelector.options.${sample.scaling}`) }}
            </template>
          </span>
          <span class="demo-action">
            <i class="pi pi-play" aria-hidden="true"></i>
            {{ $t('financialDataComparison.loadDemoData') }}
          </span>
        </button>
      </div>
    </section>

    <!-- Error Message -->
    <Message v-if="errorMessage" severity="error" :closable="false" class="mb-4">
      {{ errorMessage }}
    </Message>

    <!-- Announced to screen readers; the table itself is the visible confirmation -->
    <p v-if="dataLoadedCount > 0" class="visually-hidden" role="status" aria-live="polite">
      {{ $t('financialDataComparison.datasetsLoaded', { count: dataLoadedCount }) }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import Button from 'primevue/button'
import Card from 'primevue/card'
import Message from 'primevue/message'
import FinancialDataComparison from '../components/FinancialDataComparison.vue'
import DatasetSelector from '../components/DatasetSelector.vue'
import HowToRead from '../components/HowToRead.vue'
import RestOfCantonNotice from '../components/RestOfCantonNotice.vue'
import PlaceFacts from '../components/PlaceFacts.vue'
import { SAMPLE_COMPARISONS, type SampleComparisonKey } from '@/data/sampleComparisons'

// Vue composables
const router = useRouter()
const route = useRoute()

// Reactive state
const errorMessage = ref<string | null>(null)
const dataLoadedCount = ref(0)
const selectedDatasets = ref<string[]>([])
const selectedScaling = ref<string | null>(null)
const comparisonPairs = ref<Record<string, string[]>>({})

// Event handlers
const handleError = (error: string) => {
  errorMessage.value = error
  console.error('FinancialDataComparison error:', error)
}

const handleDataLoaded = (count: number) => {
  dataLoadedCount.value = count
  errorMessage.value = null // Clear any previous errors
}

const handleSelectorError = (error: string) => {
  errorMessage.value = error
  console.error('Dataset selector error:', error)
}

const handleScalingChanged = (scalingId: string | null) => {
  selectedScaling.value = scalingId
  updateURL()
}

const handleComparisonChanged = (newComparisonPairs: Record<string, string[]>) => {
  comparisonPairs.value = newComparisonPairs
  updateURL()
}

const loadSampleDataset = (sampleKey: SampleComparisonKey) => {
  const sample: { datasets: readonly string[]; scaling?: string } = SAMPLE_COMPARISONS[sampleKey]
  selectedDatasets.value = [...sample.datasets]
  selectedScaling.value = sample.scaling ?? null
  updateURL()
}

const openFullView = () => {
  if (selectedDatasets.value.length === 0) {
    console.warn('Cannot open full view: no selected datasets')
    return
  }

  // Navigate to full view with datasets and scaling as query parameters
  const query: Record<string, string> = {
    datasets: selectedDatasets.value.join(','),
  }

  if (selectedScaling.value) {
    query.scaling = selectedScaling.value
  }

  router.push({
    name: 'financial-data-full-view',
    query,
  })
}

const handleDatasetsChanged = () => {
  updateURL()
}

// URL management functions
const updateURL = () => {
  const query: Record<string, string> = {}

  // Preserve existing query parameters
  Object.keys(route.query).forEach((key) => {
    const value = route.query[key]
    if (typeof value === 'string') {
      query[key] = value
    } else if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'string') {
      query[key] = value[0] as string
    }
  })

  // Update datasets
  if (selectedDatasets.value.length > 0) {
    query.datasets = selectedDatasets.value.join(',')
  } else {
    delete query.datasets
  }

  // Update scaling (URL encode for custom formulas)
  if (selectedScaling.value) {
    query.scaling = encodeURIComponent(selectedScaling.value)
  } else {
    delete query.scaling
  }

  // Update comparison pairs using simple format: "columnA,baseA|columnB,baseB"
  if (Object.keys(comparisonPairs.value).length > 0) {
    const pairs: string[] = []
    Object.entries(comparisonPairs.value).forEach(([column, bases]) => {
      bases.forEach((base) => {
        pairs.push(`${column},${base}`)
      })
    })
    query.comparisons = pairs.join('|')
  } else {
    delete query.comparisons
  }

  // Only update if the query actually changed
  const currentQuery = route.query
  const newQueryString = new URLSearchParams(query).toString()
  const currentQueryString = new URLSearchParams(currentQuery as Record<string, string>).toString()

  if (newQueryString !== currentQueryString) {
    router.replace({
      name: 'financial-comparison',
      query: Object.keys(query).length > 0 ? query : undefined,
    })
  }
}

const loadStateFromURL = () => {
  const datasetsParam = route.query.datasets
  const scalingParam = route.query.scaling
  const comparisonsParam = route.query.comparisons

  // Load datasets from URL
  if (typeof datasetsParam === 'string' && datasetsParam.trim()) {
    const datasets = datasetsParam.split(',').filter((d) => d.trim().length > 0)
    selectedDatasets.value = datasets
  } else if (Array.isArray(datasetsParam)) {
    const datasets = datasetsParam.filter(
      (d) => typeof d === 'string' && d.trim().length > 0,
    ) as string[]
    selectedDatasets.value = datasets
  } else {
    selectedDatasets.value = []
  }

  // Load scaling from URL (URL decode for custom formulas)
  if (typeof scalingParam === 'string' && scalingParam.trim()) {
    selectedScaling.value = decodeURIComponent(scalingParam)
  } else {
    selectedScaling.value = null
  }

  // Load comparisons from URL - new simple format: "columnA,baseA|columnB,baseB"
  if (typeof comparisonsParam === 'string' && comparisonsParam.trim()) {
    try {
      const pairs = comparisonsParam.split('|')
      const newComparisonPairs: Record<string, string[]> = {}

      pairs.forEach((pair) => {
        const [column, base] = pair.split(',')
        if (column && base) {
          if (!newComparisonPairs[column]) {
            newComparisonPairs[column] = []
          }
          if (!newComparisonPairs[column].includes(base)) {
            newComparisonPairs[column].push(base)
          }
        }
      })

      comparisonPairs.value = newComparisonPairs
    } catch (error) {
      console.warn('Failed to parse comparisons from URL:', error)
      comparisonPairs.value = {}
    }
  } else {
    comparisonPairs.value = {}
  }
}

// Lifecycle hooks
onMounted(() => {
  loadStateFromURL()
})

// Watch for route changes (browser back/forward)
watch(
  () => route.query,
  () => {
    loadStateFromURL()
  },
  { deep: true },
)

// Watch for selectedDatasets changes
watch(
  selectedDatasets,
  () => {
    handleDatasetsChanged()
  },
  { deep: true },
)
</script>

<style scoped>
.compare-page {
  max-width: 80rem;
  margin: 0 auto;
}

.page-head {
  margin-bottom: clamp(1rem, 3vw, 1.75rem);
}

.page-head h1 {
  margin: 0 0 0.4rem;
}

.page-head p {
  margin: 0;
  max-width: 46rem;
  color: var(--gk-muted);
}

.section-card {
  margin-bottom: clamp(1.25rem, 4vw, 2.5rem);
}

.results-head {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 0.75rem 1rem;
  margin-bottom: 1rem;
}

.results-title {
  min-width: 0;
}

.results-title h2 {
  margin: 0 0 0.25rem;
}

.results-title p {
  margin: 0;
  color: var(--gk-muted);
}

.full-view-button {
  flex: none;
  min-height: 2.75rem;
}

.demo h2 {
  margin: 0 0 0.4rem;
}

.demo-intro {
  margin: 0 0 1rem;
  color: var(--gk-muted);
}

.demo-grid {
  display: grid;
  gap: 0.875rem;
}

.demo-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.4rem;
  padding: 1.1rem 1.2rem;
  border: 1px solid var(--gk-border);
  border-radius: var(--radius-lg);
  background: var(--gk-surface);
  box-shadow: var(--gk-shadow-1);
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
  font-size: 1.1rem;
  font-weight: 650;
  line-height: 1.3;
}

.demo-text {
  color: var(--gk-muted);
  font-size: 0.9rem;
  line-height: 1.45;
}

.demo-meta {
  color: var(--gk-muted);
  font-size: 0.78rem;
}

.demo-action {
  margin-top: 0.4rem;
  color: var(--gk-accent-strong);
  font-size: 0.9rem;
  font-weight: 600;
}

.demo-action i {
  margin-right: 0.35rem;
  font-size: 0.8rem;
}

/* The result table needs every pixel on a phone: tighter card padding there. */
@media (max-width: 767px) {
  .section-card :deep(.p-card-body) {
    padding: 0.75rem;
  }
}

@media (min-width: 640px) {
  .demo-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
