<template>
  <div class="min-h-screen">
    <!-- Header with back button -->
    <div class="px-6 py-4">
      <div class="flex items-center justify-between max-w-full">
        <div class="flex items-center gap-6">
          <Button
            :label="$t('financialDataFullView.backToSelection')"
            :title="$t('financialDataFullView.backToSelectionTooltip')"
            icon="pi pi-arrow-left"
            severity="secondary"
            outlined
            @click="goBackToComparison"
            class="shrink-0"
          />
        </div>

        <!-- Dataset count indicator -->
        <div v-if="hasValidData" class="flex items-center gap-2 text-sm">
          <i class="pi pi-database"></i>
          <span>{{ $t('financialDataFullView.datasetsLoaded', { count: datasets.length }) }}</span>
        </div>
      </div>
    </div>

    <!-- Main content area -->
    <div class="p-6">
      <!-- Loading state -->
      <div v-if="loading" class="flex items-center justify-center py-16">
        <div class="text-center">
          <i class="pi pi-spin pi-spinner text-4xl text-primary-500 mb-4"></i>
          <p class="text-lg text-surface-600 dark:text-surface-300">
            {{ $t('financialDataFullView.loadingDatasets') }}
          </p>
        </div>
      </div>

      <!-- No datasets state -->
      <div v-else-if="!hasValidData" class="flex items-center justify-center py-16">
        <Card class="max-w-md">
          <template #content>
            <div class="text-center">
              <i class="pi pi-exclamation-triangle text-4xl text-orange-500 mb-4"></i>
              <h3 class="text-xl font-semibold text-surface-900 dark:text-surface-50 mb-2">
                {{ $t('financialDataFullView.noDatasets') }}
              </h3>
              <p class="text-surface-600 dark:text-surface-300 mb-6">
                {{ $t('financialDataFullView.noDataMessage') }}
              </p>
              <Button
                :label="$t('financialDataFullView.backToSelection')"
                icon="pi pi-arrow-left"
                @click="goBackToComparison"
              />
            </div>
          </template>
        </Card>
      </div>

      <!-- Financial data display -->
      <div v-else class="w-full">
        <FinancialDataComparison
          :datasets="datasets"
          :selected-scaling="selectedScaling"
          :comparison-pairs="comparisonPairs"
          @error="handleError"
          @dataLoaded="handleDataLoaded"
          @scaling-changed="handleScalingChanged"
          @comparison-changed="handleComparisonChanged"
        />
      </div>
    </div>

    <!-- Error toast -->
    <Toast />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import Card from 'primevue/card'
import Toast from 'primevue/toast'
import FinancialDataComparison from '@/components/FinancialDataComparison.vue'

// Composables
const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const toast = useToast()

// Reactive state
const loading = ref(true)
const datasets = ref<string[]>([])
const dataLoadedCount = ref(0)
const selectedScaling = ref<string | null>(null)
const comparisonPairs = ref<Record<string, string[]>>({})

// Computed properties
const hasValidData = computed(() => {
  return datasets.value.length > 0
})

// Methods
const goBackToComparison = () => {
  // Navigate back to comparison view with current datasets and scaling preserved in URL
  const query: Record<string, string> = {}

  if (datasets.value.length > 0) {
    query.datasets = datasets.value.join(',')
  }

  if (selectedScaling.value) {
    query.scaling = encodeURIComponent(selectedScaling.value)
  }

  router.push({
    name: 'financial-comparison',
    query: Object.keys(query).length > 0 ? query : undefined,
  })
}

const handleError = (error: string) => {
  console.error('FinancialDataFullView error:', error)
  toast.add({
    severity: 'error',
    summary: t('common.error'),
    detail: error,
    life: 5000,
  })
}

const handleDataLoaded = (count: number) => {
  dataLoadedCount.value = count
}

const handleScalingChanged = (scalingId: string | null) => {
  selectedScaling.value = scalingId
  updateURL()
}

const handleComparisonChanged = (newComparisonPairs: Record<string, string[]>) => {
  comparisonPairs.value = newComparisonPairs
  // Use requestAnimationFrame to break out of the current reactive cycle
  requestAnimationFrame(() => {
    updateURL()
  })
}

const loadDatasetsFromRoute = () => {
  loading.value = true

  try {
    // Get datasets from route query parameters
    const datasetsParam = route.query.datasets
    const scalingParam = route.query.scaling
    const comparisonsParam = route.query.comparisons

    if (typeof datasetsParam === 'string') {
      // Single dataset or comma-separated list
      datasets.value = datasetsParam.split(',').filter((d) => d.trim().length > 0)
    } else if (Array.isArray(datasetsParam)) {
      // Array of datasets
      datasets.value = datasetsParam.filter(
        (d) => typeof d === 'string' && d.trim().length > 0,
      ) as string[]
    } else {
      // No datasets provided
      datasets.value = []
    }

    // Load scaling from URL (URL decode for custom formulas)
    if (typeof scalingParam === 'string' && scalingParam.trim()) {
      selectedScaling.value = decodeURIComponent(scalingParam)
    } else {
      selectedScaling.value = null
    }

    // Load comparisons from URL - simple format: "columnA,baseA|columnB,baseB"
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
  } catch (error) {
    console.error('Error loading datasets from route:', error)
    handleError(t('financialDataFullView.noDataMessage'))
  } finally {
    loading.value = false
  }
}

const updateURL = () => {
  const query: Record<string, string> = {}

  if (datasets.value.length > 0) {
    query.datasets = datasets.value.join(',')
  }

  if (selectedScaling.value) {
    query.scaling = encodeURIComponent(selectedScaling.value)
  }

  // Update comparison pairs using simple format: "columnA,baseA|columnB,baseB"
  if (Object.keys(comparisonPairs.value).length > 0) {
    const pairs: string[] = []
    Object.entries(comparisonPairs.value).forEach(([column, bases]) => {
      bases.forEach((base) => {
        pairs.push(`${column},${base}`)
      })
    })
    if (pairs.length > 0) {
      query.comparisons = pairs.join('|')
    }
  }

  // Only update if the query actually changed
  const currentQuery = route.query
  const newQueryString = new URLSearchParams(query).toString()
  const currentQueryString = new URLSearchParams(currentQuery as Record<string, string>).toString()

  if (newQueryString !== currentQueryString) {
    router
      .replace({
        name: 'financial-data-full-view',
        query: Object.keys(query).length > 0 ? query : undefined,
      })
      .catch(() => {
        // Ignore navigation errors silently
      })
  }
}

// Lifecycle
onMounted(() => {
  loadDatasetsFromRoute()
})
</script>

<style scoped>
/* Additional styles for full-screen layout */
.min-h-screen {
  min-height: 100vh;
}
</style>
