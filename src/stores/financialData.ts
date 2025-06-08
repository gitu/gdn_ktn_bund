import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { useI18n } from 'vue-i18n'
import { DataLoader } from '@/utils/DataLoader'
import { StatsDataLoader } from '@/utils/StatsDataLoader'
import { createEmptyFinancialDataStructure } from '@/data/emptyFinancialDataStructure'
import { EntitySemanticMapper } from '@/utils/EntitySemanticMapper'
import { getCantonByAbbreviation, getMunicipalityByGdnId } from '@/utils/GeographicalDataLoader'
import type { FinancialData } from '@/types/FinancialDataStructure'
import type { MultiLanguageLabels } from '@/types/DataStructures'

interface ScalingInfo {
  id: string
  name: string
  unit: string
  description: string
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

  // Dependencies
  const statsDataLoader = StatsDataLoader.getInstance()

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
          const errorMessage = datasetError instanceof Error ? datasetError.message : 'Unknown error'
          throw new Error(`Dataset ${dataset}: ${errorMessage}`)
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

  const setScaling = async (scalingId: string | null, scalingInfo: ScalingInfo | null = null) => {
    try {
      console.log('Setting scaling:', scalingId, scalingInfo)
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
    } catch (scalingError) {
      console.error('Error setting scaling:', scalingError)
      error.value = 'Error applying scaling to datasets'
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
          const municipality = await getMunicipalityByGdnId(entityId)
          geoId = municipality?.municipalityId || entityId // Use gdnId or fallback to entityId
        }

        // Load scaling data for this entity
        console.log(
          'Loading scaling factor for entity:',
          entityCode,
          'entityId:',
          entityId,
          'geoId:',
          geoId,
          'year:',
          year,
          'source:',
          source,
        )

        const scalingFactor = await loadScalingFactorForEntity(
          scalingId,
          geoId,
          parseInt(year),
          source,
        )

        console.log('Scaling factor result:', scalingFactor, 'for entity', entityCode)
        if (scalingFactor !== null && scalingFactor > 0) {
          entity.scalingFactor = scalingFactor
          entity.scalingInfo = {
            de: `${scalingInfo.name} (${scalingInfo.unit})`,
            fr: `${scalingInfo.name} (${scalingInfo.unit})`,
            it: `${scalingInfo.name} (${scalingInfo.unit})`,
            en: `${scalingInfo.name} (${scalingInfo.unit})`,
          }
          entity.scalingMode = 'divide' // Divide financial values by scaling factor for per-capita/per-unit values
          console.log(`Successfully applied scaling to entity ${entityCode}: factor=${scalingFactor}`)
        } else {
          console.warn(
            `No valid scaling factor found for entity ${entityCode}: factor=${scalingFactor}`,
          )
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
    try {
      console.log(
        `Loading scaling factor: scalingId=${scalingId}, entityId=${entityId}, year=${year}, source=${source}`,
      )

      if (source === 'gdn') {
        // For municipalities, load GDN data
        const result = await statsDataLoader.loadGdnData(scalingId, year, {
          geoIds: [entityId],
        })

        console.log(`GDN data result for ${entityId}:`, result.data)
        const record = result.data.find((r: { geoId: string; value: number }) => r.geoId === entityId)
        const value = record ? record.value : null
        console.log(`Found GDN record for ${entityId}:`, record, 'value:', value)
        return value
      } else {
        if (entityId === 'bund') {
          const bundResult = await statsDataLoader.getBundData(scalingId, year)
          console.log(`Bund data result:`, bundResult)
          return bundResult.totalValue
        }
        // For standard entities, load KTN data if applicable
        const result = await statsDataLoader.loadKtnData(scalingId, year, {
          geoIds: [entityId],
        })

        console.log(`KTN data result for ${entityId}:`, result.data)
        const record = result.data.find((r: { geoId: string; value: number }) => r.geoId === entityId)
        const value = record ? record.value : null
        console.log(`Found KTN record for ${entityId}:`, record, 'value:', value)
        return value
      }
    } catch (loadError) {
      console.error(`Error loading scaling factor for entity ${entityId}:`, loadError)
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
    
    // Computed
    hasValidData,
    
    // Actions
    setDatasets,
    clearData,
    loadDatasets,
    setScaling,
  }
})
