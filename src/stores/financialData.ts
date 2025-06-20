import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { DataLoader } from '@/utils/DataLoader'
import { StatsDataLoader } from '@/utils/StatsDataLoader'
import { createEmptyFinancialDataStructure } from '@/data/emptyFinancialDataStructure'
import { EntitySemanticMapper } from '@/utils/EntitySemanticMapper'
import { getCantonByAbbreviation, getMunicipalityByGdnId } from '@/utils/GeographicalDataLoader'
import type { FinancialData } from '@/types/FinancialDataStructure'
import type { MultiLanguageLabels } from '@/types/DataStructures.ts'
import { i18n } from '@/i18n'

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

  // Cache for scaling factors to avoid redundant API calls
  const scalingFactorCache = new Map<string, number | null>()

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
    scalingFactorCache.clear()
  }

  const loadDatasets = async () => {
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

      // Load each dataset into the combined structure
      for (const dataset of datasets.value) {
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
        } catch (datasetError) {
          console.error(`Error loading dataset ${dataset}:`, datasetError)
          const errorMessage =
            datasetError instanceof Error ? datasetError.message : 'Unknown error'
          throw new Error(`Dataset ${dataset}: ${errorMessage}`)
        }
      }

      // Apply scaling if applicable
      if (currentScalingId.value) {
        const scalingInfo = await getScalingInfo(currentScalingId.value)
        if (scalingInfo) {
          await applyScalingToEntities(currentScalingId.value, scalingInfo)
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
        console.warn(`Statistics entry not found for scaling ID: ${scalingId}`)
        return null
      }

      return {
        id: statsEntry.id,
        name: statsEntry.name,
        unit: statsEntry.unit,
      }
    } catch (error) {
      console.error('Error getting scaling info:', error)
      return null
    }
  }

  const setScaling = async (scalingId: string | null) => {
    // Prevent concurrent scaling operations
    if (isApplyingScaling.value) {
      console.log('Scaling operation already in progress, skipping')
      return
    }

    // Skip if scaling hasn't actually changed
    if (scalingId === currentScalingId.value) {
      console.log('Scaling ID unchanged, skipping')
      return
    }

    try {
      isApplyingScaling.value = true
      currentScalingId.value = scalingId

      if (!combinedFinancialData.value) return

      if (!scalingId) {
        // Remove scaling from all entities
        for (const [, entity] of combinedFinancialData.value.entities) {
          entity.scalingFactor = undefined
          entity.scalingInfo = undefined
          entity.scalingMode = undefined
        }
        return
      }

      // Get scaling information from the scaling ID
      const scalingInfo = await getScalingInfo(scalingId)
      if (!scalingInfo) {
        console.error(`Failed to get scaling info for ID: ${scalingId}`)
        error.value = 'Invalid scaling selection'
        return
      }

      // Apply scaling to all entities
      await applyScalingToEntities(scalingId, scalingInfo)
    } catch (scalingError) {
      console.error('Error setting scaling:', scalingError)
      error.value = 'Error applying scaling to datasets'
    } finally {
      isApplyingScaling.value = false
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
              const canton = await getCantonByAbbreviation(cantonCode.toUpperCase())
              geoId = canton?.cantonId || 'XYX'
            }
          } else {
            // assume bund for now
            geoId = 'bund'
          }
        } else if (source === 'gdn') {
          const municipality = await getMunicipalityByGdnId(entityId)
          geoId = municipality?.municipalityId || entityId // Use gdnId or fallback to entityId
        }

        // Load scaling data for this entity
        const scalingFactor = await loadScalingFactorForEntity(
          scalingId,
          geoId,
          parseInt(year),
          source,
        )

        if (scalingFactor !== null && scalingFactor > 0) {
          entity.scalingFactor = scalingFactor
          entity.scalingInfo = {
            de: (i18n.global as { t: (key: string, params?: Record<string, unknown>) => string }).t(
              'financialDataScalingSelector.scalingInfo.format',
              {
                name: scalingInfo.name.de,
                unit: scalingInfo.unit.de,
              },
            ),
            fr: (i18n.global as { t: (key: string, params?: Record<string, unknown>) => string }).t(
              'financialDataScalingSelector.scalingInfo.format',
              {
                name: scalingInfo.name.fr,
                unit: scalingInfo.unit.fr,
              },
            ),
            it: (i18n.global as { t: (key: string, params?: Record<string, unknown>) => string }).t(
              'financialDataScalingSelector.scalingInfo.format',
              {
                name: scalingInfo.name.it,
                unit: scalingInfo.unit.it,
              },
            ),
            en: (i18n.global as { t: (key: string, params?: Record<string, unknown>) => string }).t(
              'financialDataScalingSelector.scalingInfo.format',
              {
                name: scalingInfo.name.en,
                unit: scalingInfo.unit.en,
              },
            ),
          }
          entity.scalingMode = 'divide' // Divide financial values by scaling factor for per-capita/per-unit values
        }
      } catch (entityError) {
        console.error(`Error applying scaling to entity ${entityCode}:`, entityError)
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
    // Create cache key
    const cacheKey = `${scalingId}:${entityId}:${year}:${source}`

    // Check cache first
    if (scalingFactorCache.has(cacheKey)) {
      return scalingFactorCache.get(cacheKey)!
    }

    try {
      let value: number | null = null

      if (source === 'gdn') {
        // For municipalities, load GDN data
        const result = await statsDataLoader.loadGdnData(scalingId, year, {
          geoIds: [entityId],
        })

        const record = result.data.find((r: { key: string; value: number }) => r.key === entityId)
        value = record ? record.value : null
      } else {
        if (entityId === 'bund') {
          const bundResult = await statsDataLoader.getBundData(scalingId, year)
          value = bundResult.totalValue
        } else {
          // For standard entities, load KTN data if applicable
          const result = await statsDataLoader.loadKtnData(scalingId, year, {
            geoIds: [entityId],
          })

          const record = result.data.find((r: { key: string; value: number }) => r.key === entityId)
          value = record ? record.value : null
        }
      }

      // Cache the result
      scalingFactorCache.set(cacheKey, value)
      return value
    } catch (loadError) {
      console.error(`Error loading scaling factor for entity ${entityId}:`, loadError)
      // Cache null result to avoid repeated failed requests
      scalingFactorCache.set(cacheKey, null)
      return null
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
