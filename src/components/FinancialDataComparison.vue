<template>
  <div class="w-full max-w-full">
    <!-- Loading state -->
    <Message v-if="loading" severity="info" :closable="false" class="mb-4">
      <template #icon>
        <i class="pi pi-spin pi-spinner"></i>
      </template>
      {{ $t('financialDataComparison.loading') }}
    </Message>

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
      <!-- Scaling selector -->
      <div class="mb-6">
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
  <div class="w-full flex flex-col gap-y-3" v-if="isDev">
    <div v-if="combinedFinancialData?.entities" class="w-full flex flex-col gap-y-3">
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
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import Message from 'primevue/message'
import FinancialDataDisplay from './FinancialDataDisplay.vue'
import FinancialDataScalingSelector from './FinancialDataScalingSelector.vue'
import { useFinancialDataStore } from '@/stores/financialData'
import type { MultiLanguageLabels } from '@/types/DataStructures'

// Props
interface Props {
  datasets: string[]
  selectedScaling?: string | null
  comparisonPairs?: Record<string, string[]>
}

const isDev = import.meta.env.MODE === 'development'
const props = defineProps<Props>()

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

// Computed properties from store
const loading = computed(() => financialDataStore.loading)
const error = computed(() => financialDataStore.error)
const combinedFinancialData = computed(() => financialDataStore.combinedFinancialData)
const hasValidData = computed(() => financialDataStore.hasValidData)
const currentScalingId = computed(() => financialDataStore.currentScalingId)

// Methods
const loadDatasets = async () => {
  await financialDataStore.loadDatasets()

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

// Watch for dataset changes
watch(
  () => props.datasets,
  async (newDatasets) => {
    // Debounce dataset loading to prevent rapid successive calls
    if (loadingTimeout) {
      clearTimeout(loadingTimeout)
    }

    loadingTimeout = setTimeout(async () => {
      // Update store with new datasets
      financialDataStore.setDatasets(newDatasets)
      await loadDatasets()
    }, 50) // 50ms debounce
  },
  { immediate: true },
)

// Watch for selectedScaling prop changes (simplified)
watch(
  () => props.selectedScaling,
  async (newScaling) => {
    const scalingValue = newScaling ?? null

    // Only emit if scaling actually changed
    if (scalingValue !== currentScalingId.value) {
      emit('scalingChanged', scalingValue)
    }
  },
  { immediate: true },
)
</script>
