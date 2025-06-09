<template>
  <div class="max-w-7xl mx-auto">
    <!-- Header -->
    <div class="text-center mb-8">
      <h1 class="text-4xl font-bold text-surface-900 dark:text-surface-50 mb-2">
        {{ $t('financialDataComparison.title') }}
      </h1>
      <p class="text-lg text-surface-600 dark:text-surface-300">
        {{ $t('financialDataComparison.subtitle') }}
      </p>
    </div>

    <!-- Dataset Selection Section -->
    <Card class="mb-12">
      <template #content>
        <DatasetSelector v-model="selectedDatasets" @error="handleSelectorError" />
      </template>
    </Card>

    <!-- Comparison Results Section -->
    <div v-if="selectedDatasets.length > 0" class="mb-12">
      <div class="flex justify-between items-center mb-6">
        <div>
          <h2 class="text-2xl font-semibold text-surface-900 dark:text-surface-50 mb-2">
            {{ $t('financialDataComparison.comparisonResults') }}
          </h2>
          <p class="text-surface-600 dark:text-surface-300">
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
          @click="openFullView"
          class="shrink-0"
        />
      </div>

      <Card>
        <template #content>
          <FinancialDataComparison
            :datasets="selectedDatasets"
            :selected-scaling="selectedScaling"
            @error="handleError"
            @dataLoaded="handleDataLoaded"
            @scaling-changed="handleScalingChanged"
          />
        </template>
      </Card>
    </div>

    <!-- Demo Section (shown when no datasets selected) -->
    <Card v-else class="mb-12">
      <template #content>
        <div class="text-center">
          <h2 class="text-2xl font-semibold text-surface-900 dark:text-surface-50 mb-4">
            {{ $t('financialDataComparison.demoTitle') }}
          </h2>

          <p class="text-surface-600 dark:text-surface-300 mb-6">
            {{ $t('financialDataComparison.demoDescription') }}
          </p>

          <div class="flex flex-col gap-4 max-w-2xl mx-auto">
            <div
              v-for="(sample, key) in sampleDatasets"
              :key="key"
              class="border border-surface-200 dark:border-surface-700 rounded-lg p-4 hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors cursor-pointer"
              @click="loadSampleDataset(key)"
            >
              <div class="flex justify-between items-start">
                <div class="text-left flex-1">
                  <h3 class="font-semibold text-surface-900 dark:text-surface-50 mb-2">
                    {{ $t(`financialDataComparison.sampleDatasets.${key}.name`) }}
                  </h3>
                  <p class="text-sm text-surface-600 dark:text-surface-300 mb-3">
                    {{ $t(`financialDataComparison.sampleDatasets.${key}.description`) }}
                  </p>
                  <div class="text-xs text-surface-500 dark:text-surface-400">
                    {{ sample.datasets.length }} datasets
                    <span v-if="sample.scaling">
                      • {{ $t('financialDataScaling.options.' + sample.scaling) }}</span
                    >
                  </div>
                </div>
                <Button
                  :label="$t('financialDataComparison.loadDemoData')"
                  icon="pi pi-play"
                  size="small"
                  @click.stop="loadSampleDataset(key)"
                />
              </div>
            </div>
          </div>
        </div>
      </template>
    </Card>

    <!-- Error Message -->
    <Message v-if="errorMessage" severity="error" :closable="false" class="mb-4">
      {{ errorMessage }}
    </Message>

    <!-- Success Message -->
    <Message v-if="dataLoadedCount > 0" severity="success" :closable="false" class="mb-4">
      Successfully loaded {{ dataLoadedCount }} datasets
    </Message>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter, useRoute } from 'vue-router'
import Button from 'primevue/button'
import Card from 'primevue/card'
import Message from 'primevue/message'
import FinancialDataComparison from '../components/FinancialDataComparison.vue'
import DatasetSelector from '../components/DatasetSelector.vue'

// Types
interface SampleDataset {
  datasets: string[]
  scaling?: string
}

// Vue composables
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const { t } = useI18n()
const router = useRouter()
const route = useRoute()

// Reactive state
const errorMessage = ref<string | null>(null)
const dataLoadedCount = ref(0)
const selectedDatasets = ref<string[]>([])
const selectedScaling = ref<string | null>(null)

// Sample datasets for demonstration
const sampleDatasets: Record<string, SampleDataset> = {
  governmentalLevels: {
    datasets: [
      'std/fs/gdn:2022',
      'std/fs/ktn:2022',
      'std/fs/bund:2022',
      'std/fs/bund_ktn_gdn:2022',
    ],
  },
  zurichMunicipalities: {
    datasets: [
      'gdn/fs/010261:2022',
      'gdn/fs/010230:2022',
      'gdn/fs/010156:2022',
      'gdn/fs/010058:2022',
      'std/fs/gdn_zh:2022',
    ],
    scaling: 'pop',
  },
}

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
  if (import.meta.env.DEV) {
    console.log('Selected scaling changed:', scalingId)
  }
}

const loadSampleDataset = (sampleKey: string) => {
  const sample = sampleDatasets[sampleKey as keyof typeof sampleDatasets]
  if (sample) {
    selectedDatasets.value = sample.datasets
    if (sample.scaling) {
      selectedScaling.value = sample.scaling
    } else {
      selectedScaling.value = null
    }
    updateURL()
  }
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

  if (selectedDatasets.value.length > 0) {
    query.datasets = selectedDatasets.value.join(',')
  }

  if (selectedScaling.value) {
    query.scaling = selectedScaling.value
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

  // Load scaling from URL
  if (typeof scalingParam === 'string' && scalingParam.trim()) {
    selectedScaling.value = scalingParam
  } else {
    selectedScaling.value = null
  }

  if (import.meta.env.DEV) {
    console.log('Loaded state from URL:', {
      datasets: selectedDatasets.value,
      scaling: selectedScaling.value,
    })
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
