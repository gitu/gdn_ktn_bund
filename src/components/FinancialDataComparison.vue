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
    <div v-else class="w-full">
      <!-- Scaling selector -->
      <div class="mb-6">
        <FinancialDataScalingSelector
          :financial-data="combinedFinancialData"
          @scaling-changed="handleScalingChanged"
          @error="handleScalingError"
        />
      </div>

      <!-- Single FinancialDataDisplay for combined data -->
      <div class="w-full">
        <FinancialDataDisplay
          :financial-data="combinedFinancialData!"
          :loading="false"
          :error="null"
          :initial-expanded-all="expandedAll"
          :initial-show-codes="showCodes"
          :initial-show-zero-values="!hideZeroValues"
          @error="handleDatasetError"
        />
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
import { DataLoader } from '@/utils/DataLoader'
import { StatsDataLoader } from '@/utils/StatsDataLoader'
import { createEmptyFinancialDataStructure } from '@/data/emptyFinancialDataStructure'
import type { FinancialData } from '@/types/FinancialDataStructure'
import type { MultiLanguageLabels } from '@/types/DataStructures'

import { EntitySemanticMapper } from '@/utils/EntitySemanticMapper.ts'
import { getCantonByAbbreviation, getMunicipalityByGdnId } from '@/utils/GeographicalDataLoader.ts'

// Props
interface Props {
  datasets: string[]
}

const props = defineProps<Props>()

// Emits
interface Emits {
  error: [error: string]
  dataLoaded: [count: number]
}

const emit = defineEmits<Emits>()

// Vue i18n
const { t, locale } = useI18n()

// Reactive state
const loading = ref(false)
const error = ref<string | null>(null)
const combinedFinancialData = ref<FinancialData | null>(null)
const loadedDatasetCount = ref(0)
const expandedAll = ref(false)
const showCodes = ref(false)
const hideZeroValues = ref(true)
const currentScalingId = ref<string | null>(null)
const statsDataLoader = StatsDataLoader.getInstance()

// Computed properties
const hasValidData = computed(() => {
  return combinedFinancialData.value !== null && loadedDatasetCount.value > 0
})

// Methods
const loadDatasets = async () => {
  if (props.datasets.length === 0) return

  loading.value = true
  error.value = null
  loadedDatasetCount.value = 0

  try {
    // Start with empty financial data structure
    combinedFinancialData.value = createEmptyFinancialDataStructure()
    const dataLoader = new DataLoader()

    // Load each dataset into the combined structure
    for (const dataset of props.datasets) {
      try {
        // Parse dataset identifier (e.g., 'gdn/fs/010002:2016')
        const parts = dataset.split('/')
        if (parts.length !== 3) {
          throw new Error(`Invalid dataset identifier format: ${dataset}`)
        }

        const source = parts[0] as 'gdn' | 'std'
        const model = parts[1]
        const entityAndYear = parts[2]
        const [entity, year] = entityAndYear.split(':')

        if (!entity || !year) {
          throw new Error(`Invalid entity:year format in dataset: ${dataset}`)
        }

        // Load and integrate data into the combined structure
        await dataLoader.loadAndIntegrateFinancialData(
          entity,
          model,
          year,
          combinedFinancialData.value,
          source,
        )

        loadedDatasetCount.value++
      } catch (error) {
        console.error(`Error loading dataset ${dataset}:`, error)
        emit(
          'error',
          t('financialDataComparison.datasetError', {
            dataset,
            error: error instanceof Error ? error.message : 'Unknown error',
          }),
        )
      }
    }

    if (loadedDatasetCount.value === 0) {
      error.value = t('financialDataComparison.noValidData')
      combinedFinancialData.value = null
    } else {
      emit('dataLoaded', loadedDatasetCount.value)
    }
  } catch {
    error.value = t('financialDataComparison.error')
    emit('error', error.value)
  } finally {
    loading.value = false
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

interface ScalingInfo {
  id: string
  name: string
  unit: string
  description: string
  factor?: number
}

const handleScalingChanged = async (scalingId: string | null, scalingInfo: ScalingInfo | null) => {
  try {
    currentScalingId.value = scalingId

    if (!combinedFinancialData.value) return

    if (!scalingId || !scalingInfo) {
      // Remove scaling from all entities
      for (const [, entity] of combinedFinancialData.value.entities) {
        entity.scalingFactor = undefined
        entity.scalingInfo = undefined
        entity.scalingMode = undefined
      }
      return
    }

    // Apply scaling to all entities
    await applyScalingToEntities(scalingId, scalingInfo)
  } catch (error) {
    console.error('Error handling scaling change:', error)
    emit('error', t('financialDataComparison.scalingError'))
  }
}

const applyScalingToEntities = async (scalingId: string, scalingInfo: ScalingInfo) => {
  if (!combinedFinancialData.value) return

  for (const [entityCode, entity] of combinedFinancialData.value.entities) {
    try {
      // Extract entity information from the entity code
      const parts = entityCode.split('/')
      if (parts.length !== 3) continue

      const source = parts[0] as 'gdn' | 'std'
      const entityAndYear = parts[2]
      const [entityId, year] = entityAndYear.split(':')

      if (!entityId || !year) continue

      let geoId = ''
      if (source === 'std') {
        // Map canton-specific entities to their canton code
        if (EntitySemanticMapper.isCantonSpecific(entityId)) {
          const cantonCode = EntitySemanticMapper.getCantonCodeFromEntity(entityId)
          if (cantonCode) {
            console.log('cantonCode', cantonCode)
            const canton = await getCantonByAbbreviation(cantonCode.toUpperCase())
            geoId = canton?.cantonId || 'XYX'
          }
        } else {
          // assume bund for now
          geoId = 'bund'
        }
      } else if (source === 'gdn') {
        const muncipality = await getMunicipalityByGdnId(entityId)
        geoId = muncipality?.municipalityId || 'XXX'
      }

      // Load scaling data for this entity
      const scalingFactor = await loadScalingFactorForEntity(
        scalingId,
        geoId,
        parseInt(year),
        source,
      )
      console.log(
        'scalingFactor',
        scalingFactor,
        'for entity',
        entityCode,
        'entityid',
        entityId,
        'year',
        year,
        'geoId',
        geoId,
      )
      if (scalingFactor !== null) {
        entity.scalingFactor = scalingFactor
        entity.scalingInfo = {
          de: `${scalingInfo.name} (${scalingInfo.unit})`,
          fr: `${scalingInfo.name} (${scalingInfo.unit})`,
          it: `${scalingInfo.name} (${scalingInfo.unit})`,
          en: `${scalingInfo.name} (${scalingInfo.unit})`,
        }
        entity.scalingMode = 'divide' // Divide financial values by scaling factor for per-capita/per-unit values
      }
    } catch (error) {
      console.error(`Error applying scaling to entity ${entityCode}:`, error)
      // Continue with other entities even if one fails
    }
  }
}

const loadScalingFactorForEntity = async (
  scalingId: string,
  entityId: string,
  year: number,
  source: 'gdn' | 'std',
): Promise<number | null> => {
  try {
    if (source === 'gdn') {
      // For municipalities, load GDN data
      const result = await statsDataLoader.loadGdnData(scalingId, year, {
        geoIds: [entityId],
      })

      const record = result.data.find((r: { geoId: string; value: number }) => r.geoId === entityId)
      return record ? record.value : null
    } else {
      if (entityId === 'bund')
        return (await statsDataLoader.getBundData(scalingId, year)).totalValue
      // For standard entities, load KTN data if applicable
      const result = await statsDataLoader.loadKtnData(scalingId, year, {
        geoIds: [entityId],
      })

      const record = result.data.find((r: { geoId: string; value: number }) => r.geoId === entityId)
      return record ? record.value : null
    }
  } catch (error) {
    console.error(`Error loading scaling factor for entity ${entityId}:`, error)
    return null
  }
}

// Watch for dataset changes
watch(
  () => props.datasets,
  () => {
    loadDatasets()
  },
  { immediate: true },
)

// Watch for data changes and reapply scaling if needed
watch(
  () => combinedFinancialData.value,
  async (newData) => {
    if (newData && currentScalingId.value) {
      // Reapply current scaling to newly loaded data
      const scalingInfo = availableStats.value.find((s) => s.id === currentScalingId.value)
      if (scalingInfo) {
        const currentLocale = (locale as { value: keyof MultiLanguageLabels }).value
        await applyScalingToEntities(currentScalingId.value, {
          id: scalingInfo.id,
          name: scalingInfo.name[currentLocale] || scalingInfo.name.en || scalingInfo.id,
          unit: scalingInfo.unit[currentLocale] || scalingInfo.unit.en || '',
          description: t('financialDataScalingSelector.scalingInfo.description'),
        })
      }
    }
  },
  { deep: false },
)

// Store available stats for reapplying scaling
const availableStats = ref<{ id: string; name: MultiLanguageLabels; unit: MultiLanguageLabels }[]>(
  [],
)
</script>
