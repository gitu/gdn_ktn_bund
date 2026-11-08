<template>
  <div class="w-full max-w-full">
    <!-- Loading state: skeleton rows of the table plus a placeholder for the scaling card, so the
         layout does not jump once the data is there -->
    <div v-if="showLoading" class="w-full flex flex-col gap-y-3">
      <FinancialDataDisplay :financial-data="null" :loading="true" :error="null" />
      <Skeleton
        v-if="showScaling"
        class="comparison-skeleton-card"
        height="7.5rem"
        aria-hidden="true"
      />
    </div>

    <!-- Error state -->
    <Message v-else-if="error" severity="error" :closable="false" class="mb-4">
      {{ error }}
    </Message>

    <!-- No data state -->
    <Message v-else-if="!hasValidData" severity="warn" :closable="false" class="mb-4">
      {{ $t('financialDataComparison.noData') }}
    </Message>

    <!-- Main comparison content -->
    <div v-else class="w-full flex flex-col gap-y-3">
      <!-- Single FinancialDataDisplay for combined data -->
      <div class="w-full">
        <FinancialDataDisplay
          :financial-data="combinedFinancialData!"
          :loading="false"
          :error="null"
          :initial-expanded-all="expandedAll"
          :initial-show-codes="showCodes"
          :initial-show-zero-values="!hideZeroValues"
          :comparison-pairs="props.comparisonPairs"
          @error="handleDatasetError"
          @comparison-changed="handleComparisonChanged"
        />
      </div>
      <!-- Scaling selector (the comparison wizard has its own step for it) -->
      <div v-if="showScaling" class="mb-6">
        <FinancialDataScalingSelector
          :financial-data="combinedFinancialData"
          :selected-scaling="props.selectedScaling"
          @error="handleScalingError"
          @scaling-changed="handleScalingChanged"
        />
      </div>
    </div>
  </div>
  <!-- list of entities in combined data - only show on localhost-->
  <div class="w-full flex flex-col gap-y-2 dev-entity-list" v-if="isDev && showDevInfo">
    <div v-if="combinedFinancialData?.entities" class="w-full flex flex-col gap-y-2">
      <div
        v-for="[entityCode, entity] in combinedFinancialData.entities"
        :key="entityCode"
        class="entity-info"
      >
        {{ entityCode }} - {{ entity.name[locale as keyof MultiLanguageLabels] }} -
        {{ entity.year }} - {{ entity.model }} - {{ entity.source }} -
        {{ entity.description[locale as keyof MultiLanguageLabels] }} - {{ entity.scalingFactor }} -
        {{ entity.scalingInfo }} - {{ entity.scalingMode }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import Message from 'primevue/message'
import Skeleton from 'primevue/skeleton'
import FinancialDataDisplay from './FinancialDataDisplay.vue'
import FinancialDataScalingSelector from './FinancialDataScalingSelector.vue'
import { useFinancialDataStore } from '@/stores/financialData'
import type { MultiLanguageLabels } from '@/types/DataStructures'

// Props
interface Props {
  datasets: string[]
  selectedScaling?: string | null
  comparisonPairs?: Record<string, string[]>
  /** Show the scaling selector under the table */
  showScaling?: boolean
  /** Show the list of loaded entities in development (off where the table is not the main view) */
  showDevInfo?: boolean
}

const isDev = import.meta.env.MODE === 'development'
const props = withDefaults(defineProps<Props>(), {
  comparisonPairs: () => ({}),
  showScaling: true,
  showDevInfo: true,
})

// Emits
interface Emits {
  error: [error: string]
  dataLoaded: [count: number]
  scalingChanged: [scalingId: string | null]
  comparisonChanged: [comparisonPairs: Record<string, string[]>]
}

const emit = defineEmits<Emits>()

// Vue i18n and store
const { locale } = useI18n()
const financialDataStore = useFinancialDataStore()

// Local UI state
const expandedAll = ref(false)
const showCodes = ref(false)
const hideZeroValues = ref(true)
// True from the moment a (debounced) load is scheduled until it has finished. Without it the
// table of a previous visit / previous selection would be visible until the store starts loading.
const loadPending = ref(false)

// Computed properties from store
const loading = computed(() => financialDataStore.loading)
const showLoading = computed(() => loading.value || loadPending.value)
const error = computed(() => financialDataStore.error)
const combinedFinancialData = computed(() => financialDataStore.combinedFinancialData)
const hasValidData = computed(() => financialDataStore.hasValidData)
const currentScalingId = computed(() => financialDataStore.currentScalingId)

// Methods
const loadDatasets = async () => {
  // The scaling from the URL/props is handed to the store so that it is applied before the table
  // is rendered for the first time (no flash of unscaled values). Custom formulas are handled by
  // the store as well.
  await financialDataStore.loadDatasets(props.selectedScaling)

  // Emit events based on store state
  if (financialDataStore.error) {
    emit('error', financialDataStore.error)
  } else if (financialDataStore.loadedDatasetCount > 0) {
    emit('dataLoaded', financialDataStore.loadedDatasetCount)
  }
}

// Event handlers
const handleDatasetError = (errorMessage: string) => {
  console.error('Dataset error:', errorMessage)
  emit('error', errorMessage)
}

const handleScalingError = (errorMessage: string) => {
  console.error('Scaling error:', errorMessage)
  emit('error', errorMessage)
}

const handleScalingChanged = async (scalingId: string | null) => {
  try {
    // Apply scaling through store (store will calculate scaling info internally)
    await financialDataStore.setScaling(scalingId)

    // Emit scaling change to parent
    emit('scalingChanged', scalingId)
  } catch (error) {
    console.error('Error handling scaling change:', error)
    emit('error', 'Error applying scaling to datasets')
  }
}

const handleComparisonChanged = (comparisonPairs: Record<string, string[]>) => {
  emit('comparisonChanged', comparisonPairs)
}

// Consolidated watcher to prevent redundant operations
let loadingTimeout: ReturnType<typeof setTimeout> | null = null
let scheduledLoads = 0

// Watch for dataset changes
watch(
  () => props.datasets,
  async (newDatasets) => {
    // Debounce dataset loading to prevent rapid successive calls
    if (loadingTimeout) {
      clearTimeout(loadingTimeout)
    }
    loadPending.value = true
    const thisLoad = ++scheduledLoads

    loadingTimeout = setTimeout(async () => {
      loadingTimeout = null
      try {
        // Update store with new datasets
        financialDataStore.setDatasets(newDatasets)
        await loadDatasets()
      } finally {
        // A newer change may have been scheduled meanwhile: keep showing the placeholder for it
        if (thisLoad === scheduledLoads) {
          loadPending.value = false
        }
      }
    }, 50) // 50ms debounce
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  if (loadingTimeout) {
    clearTimeout(loadingTimeout)
    loadingTimeout = null
  }
})

// Watch for selectedScaling prop changes
let scalingWatcherInitialised = false
watch(
  () => props.selectedScaling,
  async (newScaling) => {
    const scalingValue = newScaling ?? null

    // Only act if scaling actually changed
    if (scalingValue !== currentScalingId.value) {
      // Changed from outside (e.g. browser back/forward) while data is shown: bring the loaded
      // data in line. The initial value is applied by loadDatasets, changes made through the
      // scaling selector are already known to the store and skipped here.
      if (
        scalingWatcherInitialised &&
        !financialDataStore.loading &&
        financialDataStore.combinedFinancialData
      ) {
        await financialDataStore.setScaling(scalingValue)
      }
      emit('scalingChanged', scalingValue)
    }
    scalingWatcherInitialised = true
  },
  { immediate: true },
)
</script>

<style scoped>
.comparison-skeleton-card {
  border-radius: var(--radius-lg);
}

.dev-entity-list {
  margin-top: 1rem;
}

.entity-info {
  font-size: 0.6875rem;
  line-height: 1.4;
  color: var(--gk-muted);
  overflow-wrap: anywhere;
  word-break: break-word;
}
</style>
