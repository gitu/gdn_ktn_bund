<template>
  <div class="max-w-7xl mx-auto p-8">
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
        <DatasetSelector
          :initial-datasets="selectedDatasets"
          @datasets-changed="handleDatasetsChanged"
          @error="handleSelectorError"
        />
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
          class="flex-shrink-0"
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

          <div class="mb-8">
            <Button
              :label="$t('financialDataComparison.loadDemoData')"
              icon="pi pi-play"
              @click="loadDemoData"
            />
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
const sampleDatasets = [
  'gdn/fs/010002:2016', // Municipality 010002 in 2016
  'gdn/fs/010009:2016', // Municipality 010009 in 2016
  'std/fs/gdn_zh:2016', // All municipalities in Canton Zurich in 2016
]

// Event handlers
const handleError = (error: string) => {
  errorMessage.value = error
  console.error('FinancialDataComparison error:', error)
}

const handleDataLoaded = (count: number) => {
  dataLoadedCount.value = count
  errorMessage.value = null // Clear any previous errors
}

const handleDatasetsChanged = (datasets: string[]) => {
  selectedDatasets.value = datasets
  updateURL()
  console.log('Selected datasets changed:', datasets)
}

const handleSelectorError = (error: string) => {
  errorMessage.value = error
  console.error('Dataset selector error:', error)
}

const handleScalingChanged = (scalingId: string | null) => {
  selectedScaling.value = scalingId
  updateURL()
  console.log('Selected scaling changed:', scalingId)
}

const loadDemoData = () => {
  selectedDatasets.value = sampleDatasets
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

  console.log('Loaded state from URL:', {
    datasets: selectedDatasets.value,
    scaling: selectedScaling.value,
  })
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
</script>
