import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { DataLoader } from '@/utils/DataLoader'
import { StatsDataLoader } from '@/utils/StatsDataLoader'
import { ScalingCalculator } from '@/utils/ScalingCalculator'
import { createEmptyFinancialDataStructure } from '@/data/emptyFinancialDataStructure'
import { Logger } from '@/utils/Logger'
import type { FinancialData, FinancialDataEntity } from '@/types/FinancialDataStructure'
import type { MultiLanguageLabels } from '@/types/DataStructures.ts'

interface ScalingInfo {
  id: string
  name: MultiLanguageLabels
  unit: MultiLanguageLabels
  factor?: number
}

export const useFinancialDataStore = defineStore('financialData', () => {
  // State
  const combinedFinancialData = ref<FinancialData | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const loadedDatasetCount = ref(0)
  const currentScalingId = ref<string | null>(null)
  const datasets = ref<string[]>([])
  const isApplyingScaling = ref(false)

  // Dependencies
  const statsDataLoader = StatsDataLoader.getInstance()

  // Divisors per column (statistics or a custom formula); caches the statistics it loads
  const scalingCalculator = new ScalingCalculator()

  // Computed
  const hasValidData = computed(() => {
    return combinedFinancialData.value !== null && loadedDatasetCount.value > 0
  })

  // Actions
  const setDatasets = (newDatasets: string[]) => {
    datasets.value = [...newDatasets]
  }

  const clearData = () => {
    combinedFinancialData.value = null
    loadedDatasetCount.value = 0
    error.value = null
    currentScalingId.value = null
    isApplyingScaling.value = false
    scalingCalculator.clear()
  }

  /**
   * Load all selected datasets and apply the active scaling before `loading` turns false, so the
   * table never renders unscaled values first.
   *
   * @param scalingId Scaling that must already be applied when the data is first shown (e.g. the
   *   `scaling` URL parameter). `undefined` keeps the store's current scaling, `null` loads the
   *   datasets unscaled. Custom formula ids (`custom:...`) are supported.
   */
  const orderEntitiesBySelection = (data: FinancialData) => {
    const ordered = new Map<string, FinancialDataEntity>()
    for (const id of datasets.value) {
      const entity = data.entities.get(id)
      if (entity) ordered.set(id, entity)
    }
    for (const [id, entity] of data.entities) {
      if (!ordered.has(id)) ordered.set(id, entity)
    }
    data.entities = ordered
  }

  const loadDatasets = async (scalingId?: string | null) => {
    if (scalingId !== undefined) {
      currentScalingId.value = scalingId
    }

    if (datasets.value.length === 0) {
      clearData()
      return
    }

    loading.value = true
    error.value = null
    loadedDatasetCount.value = 0

    try {
      // Start with empty financial data structure
      combinedFinancialData.value = createEmptyFinancialDataStructure()
      const dataLoader = new DataLoader()

      // Parse all datasets first to validate them
      const parsedDatasets = datasets.value.map((dataset) => {
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

        return { dataset, source, model, entity, year }
      })

      // Load all datasets in parallel
      const loadPromises = parsedDatasets.map(async ({ dataset, source, model, entity, year }) => {
        try {
          await dataLoader.loadAndIntegrateFinancialData(
            entity,
            model,
            year,
            combinedFinancialData.value!,
            source,
          )
          return { success: true, dataset }
        } catch (datasetError) {
          Logger.error('Failed to load dataset', datasetError, { dataset })
          const errorMessage =
            datasetError instanceof Error ? datasetError.message : 'Unknown error'
          return { success: false, dataset, error: `Dataset ${dataset}: ${errorMessage}` }
        }
      })

      // Wait for all datasets to load
      const results = await Promise.all(loadPromises)

      // Check for any errors and count successful loads
      const errors = results.filter((r) => !r.success)
      if (errors.length > 0) {
        // If any dataset failed, throw the first error
        throw new Error(errors[0].error)
      }

      loadedDatasetCount.value = results.filter((r) => r.success).length

      // The loads run in parallel and finish in any order; keep the columns in the order the user chose
      orderEntitiesBySelection(combinedFinancialData.value!)

      // Apply the active scaling (traditional or custom formula) to the freshly loaded entities
      if (currentScalingId.value) {
        const applied = await applyScalingById(currentScalingId.value)
        if (!applied) {
          // Unknown scaling id: show the data unscaled and keep the state truthful
          currentScalingId.value = null
        }
      }

      if (loadedDatasetCount.value === 0) {
        error.value = 'No valid datasets could be loaded'
        combinedFinancialData.value = null
      }
    } catch (loadError) {
      error.value = loadError instanceof Error ? loadError.message : 'Error loading datasets'
      combinedFinancialData.value = null
    } finally {
      loading.value = false
    }
  }

  const getScalingInfo = async (scalingId: string): Promise<ScalingInfo | null> => {
    try {
      const statsEntry = await statsDataLoader.getStatsEntry(scalingId)
      if (!statsEntry) {
        Logger.warn('Statistics entry not found for scaling ID', { scalingId })
        return null
      }

      return {
        id: statsEntry.id,
        name: statsEntry.name,
        unit: statsEntry.unit,
      }
    } catch (error) {
      Logger.error('Failed to get scaling info', error)
      return null
    }
  }

  /**
   * Apply a scaling id (a statistic or `custom:<formula>`) to the loaded entities. Returns false when
   * the id is unknown. Does not touch `currentScalingId`; callers own that state.
   */
  const applyScalingById = async (scalingId: string): Promise<boolean> => {
    const data = combinedFinancialData.value
    if (!data) return true

    const calculation = await scalingCalculator.calculate(scalingId, [...data.entities.keys()])
    if (!calculation.ok) {
      if (calculation.unknown) {
        Logger.warn('Statistics entry not found for scaling ID', { scalingId })
        return false
      }
      error.value = `Invalid custom formula: ${calculation.error}`
      return true
    }

    for (const [entityCode, entity] of data.entities) {
      const outcome = calculation.outcomes.get(entityCode)
      if (outcome?.factor) {
        entity.scalingFactor = outcome.factor
        entity.scalingInfo = calculation.label
        entity.scalingMode = 'divide' // per-capita / per-unit values
        entity.scalingInputs = outcome.inputs
      } else {
        // No statistic for this column (or a formula result that is not positive): show francs
        removeScaling(entity)
      }
    }
    return true
  }

  const removeScaling = (entity: FinancialDataEntity) => {
    entity.scalingFactor = undefined
    entity.scalingInfo = undefined
    entity.scalingMode = undefined
    entity.scalingInputs = undefined
  }

  const setScaling = async (scalingId: string | null) => {
    // Prevent concurrent scaling operations
    if (isApplyingScaling.value) {
      return
    }

    // Skip if scaling hasn't actually changed
    if (scalingId === currentScalingId.value) {
      return
    }

    try {
      isApplyingScaling.value = true
      currentScalingId.value = scalingId

      if (!combinedFinancialData.value) return

      if (!scalingId) {
        for (const [, entity] of combinedFinancialData.value.entities) removeScaling(entity)
        return
      }

      if (!(await applyScalingById(scalingId))) {
        Logger.error('Failed to get scaling info', undefined, { scalingId })
        error.value = 'Invalid scaling selection'
      }
    } catch (scalingError) {
      Logger.error('Failed to set scaling', scalingError)
      error.value = 'Error applying scaling to datasets'
    } finally {
      isApplyingScaling.value = false
    }
  }

  return {
    // State
    combinedFinancialData,
    loading,
    error,
    loadedDatasetCount,
    currentScalingId,
    datasets,
    isApplyingScaling,

    // Computed
    hasValidData,

    // Actions
    setDatasets,
    clearData,
    loadDatasets,
    setScaling,
    getScalingInfo,
  }
})
