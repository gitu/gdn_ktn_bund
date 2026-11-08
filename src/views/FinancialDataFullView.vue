<template>
  <div class="full-view">
    <!-- Header with back button -->
    <div class="full-view-header">
      <Button
        :label="$t('financialDataFullView.backToSelection')"
        :title="$t('financialDataFullView.backToSelectionTooltip')"
        icon="pi pi-arrow-left"
        severity="secondary"
        outlined
        @click="goBackToComparison"
        class="back-button"
      />

      <AmountUnitSelect />

      <!-- Dataset count indicator -->
      <div v-if="hasValidData" class="dataset-count">
        <i class="pi pi-database" aria-hidden="true"></i>
        <span>{{ $t('financialDataFullView.datasetsLoaded', { count: datasets.length }) }}</span>
      </div>
    </div>

    <!-- Main content area -->
    <div class="full-view-content">
      <!-- Loading state -->
      <div
        v-if="loading"
        class="full-view-loading"
        role="status"
        :aria-label="$t('financialDataFullView.loadingDatasets')"
      >
        <span class="sr-only">{{ $t('financialDataFullView.loadingDatasets') }}</span>
        <Skeleton v-for="n in 4" :key="n" height="2.5rem" aria-hidden="true" />
      </div>

      <!-- No datasets state -->
      <div v-else-if="!hasValidData" class="flex items-center justify-center py-8">
        <Card class="max-w-md">
          <template #content>
            <div class="text-center">
              <i class="pi pi-exclamation-triangle text-4xl text-orange-500 mb-4"></i>
              <h3 class="empty-title">
                {{ $t('financialDataFullView.noDatasets') }}
              </h3>
              <p class="muted mb-6">
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
        <RestOfCantonNotice :datasets="datasets" />
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
import Skeleton from 'primevue/skeleton'
import Toast from 'primevue/toast'
import FinancialDataComparison from '@/components/FinancialDataComparison.vue'
import RestOfCantonNotice from '@/components/RestOfCantonNotice.vue'
import AmountUnitSelect from '@/components/AmountUnitSelect.vue'

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
/* The layout already provides the page gutter: no extra padding here */
.full-view-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem 1rem;
  padding-bottom: 1rem;
}

.back-button {
  flex: none;
  min-height: 2.75rem;
}

.dataset-count {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: var(--gk-muted);
}

.full-view-loading {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem;
  border: 1px solid var(--gk-border);
  border-radius: var(--radius-lg);
  background: var(--gk-surface);
}

.empty-title {
  margin: 0 0 0.5rem;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--gk-ink);
}

.muted {
  color: var(--gk-muted);
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
</style>
