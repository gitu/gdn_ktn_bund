import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { DataLoader } from '@/utils/DataLoader'
import { StatsDataLoader } from '@/utils/StatsDataLoader'
import { CustomScalingFormula, CUSTOM_SCALING_PREFIX, type ScalingVariable } from '@/utils/CustomScalingFormula'
import { createEmptyFinancialDataStructure } from '@/data/emptyFinancialDataStructure'
import { EntitySemanticMapper } from '@/utils/EntitySemanticMapper'
import { getCantonByAbbreviation, getMunicipalityByGdnId } from '@/utils/GeographicalDataLoader'
import type { FinancialData, FinancialDataEntity } from '@/types/FinancialDataStructure'
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
          console.error(`Error loading dataset ${dataset}:`, datasetError)
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
        // Remove scaling from all entities
        for (const [, entity] of combinedFinancialData.value.entities) {
          entity.scalingFactor = undefined
          entity.scalingInfo = undefined
          entity.scalingMode = undefined
        }
        return
      }

      // Check if this is a custom formula (starts with the custom prefix)
      if (scalingId.startsWith(CUSTOM_SCALING_PREFIX)) {
        const formula = scalingId.substring(CUSTOM_SCALING_PREFIX.length) // Remove custom prefix
        await applyCustomScalingFormula(formula)
        return
      }


      // Get scaling information from the scaling ID (traditional scaling)
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

  const applyCustomScalingFormula = async (formula: string) => {
    if (!combinedFinancialData.value) return

    try {
      // Get available stats for validation
      const availableStats = await statsDataLoader.getAvailableStats()

      // Validate the formula
      const validation = CustomScalingFormula.validateFormula(formula, availableStats)
      if (!validation.isValid) {
        error.value = `Invalid custom formula: ${validation.error}`
        return
      }

      // Prepare scaling requests for all entities
      const entityScalingPromises: Array<{
        entityCode: string
        entity: FinancialDataEntity
        promise: Promise<number | null>
      }> = []

      for (const [entityCode, entity] of combinedFinancialData.value.entities) {
        try {
          // Extract entity information from the entity code
          const parts = entityCode.split('/')
          if (parts.length !== 3) continue

          const source = parts[0] as 'gdn' | 'std'
          const entityAndYear = parts[2]
          const [entityId, year] = entityAndYear.split(':')

          if (!entityId || !year) continue

          // Create promise for calculating custom scaling
          const customScalingPromise = (async () => {
            // Load all required scaling factors for this entity
            const scalingVariables = new Map<string, ScalingVariable>()

            let geoId = ''
            if (source === 'std') {
              if (EntitySemanticMapper.isCantonSpecific(entityId)) {
                const cantonCode = EntitySemanticMapper.getCantonCodeFromEntity(entityId)
                if (cantonCode) {
                  const canton = await getCantonByAbbreviation(cantonCode.toUpperCase())
                  geoId = canton?.cantonId || 'XYX'
                }
              } else {
                geoId = 'bund'
              }
            } else if (source === 'gdn') {
              const municipality = await getMunicipalityByGdnId(entityId)
              geoId = municipality?.municipalityId || entityId
            }

            // Load all scaling factors needed by the formula
            for (const factorId of validation.usedFactors || []) {
              const stat = availableStats.find((s) => s.id === factorId)
              if (stat) {
                const factorValue = await loadScalingFactorForEntity(
                  factorId,
                  geoId,
                  parseInt(year),
                  source,
                )
                if (factorValue !== null) {
                  scalingVariables.set(factorId, {
                    id: factorId,
                    name: stat.name,
                    value: factorValue,
                    unit: stat.unit,
                  })
                }
              }
            }

            // Evaluate the formula with the loaded variables
            const result = CustomScalingFormula.evaluateFormula(formula, scalingVariables)
            if (result.isValid && result.result !== undefined) {
              return result.result
            }

            return null
          })()

          entityScalingPromises.push({
            entityCode,
            entity,
            promise: customScalingPromise,
          })
        } catch (error) {
          console.error(`Error preparing custom scaling for entity ${entityCode}:`, error)
        }
      }

      // Execute all scaling calculations in parallel
      const results = await Promise.allSettled(entityScalingPromises.map((req) => req.promise))

      // Apply results to entities
      for (let i = 0; i < entityScalingPromises.length; i++) {
        const { entity } = entityScalingPromises[i]
        const result = results[i]

        if (result.status === 'fulfilled' && result.value !== null && result.value > 0) {
          entity.scalingFactor = result.value
          entity.scalingInfo = {
            de: `Benutzerdefinierte Formel: ${CustomScalingFormula.getFormulaDisplayName(formula, availableStats, 'de')}`,
            fr: `Formule personnalisée: ${CustomScalingFormula.getFormulaDisplayName(formula, availableStats, 'fr')}`,
            it: `Formula personalizzata: ${CustomScalingFormula.getFormulaDisplayName(formula, availableStats, 'it')}`,
            en: `Custom formula: ${CustomScalingFormula.getFormulaDisplayName(formula, availableStats, 'en')}`,
          }
          entity.scalingMode = 'divide'
        } else {
          // Clear scaling if calculation failed
          entity.scalingFactor = undefined
          entity.scalingInfo = undefined
          entity.scalingMode = undefined
        }
      }
    } catch (scalingError) {
      console.error('Error applying custom scaling formula:', scalingError)
      error.value = 'Error applying custom scaling formula'
    }
  }

  const applyScalingToEntities = async (scalingId: string, scalingInfo: ScalingInfo) => {
    if (!combinedFinancialData.value) return

    // Prepare all scaling requests first
    const scalingRequests: Array<{
      entityCode: string
      entity: FinancialDataEntity
      promise: Promise<number | null>
    }> = []

    for (const [entityCode, entity] of combinedFinancialData.value.entities) {
      try {
        // Extract entity information from the entity code
        const parts = entityCode.split('/')
        if (parts.length !== 3) continue

        const source = parts[0] as 'gdn' | 'std'
        const entityAndYear = parts[2]
        const [entityId, year] = entityAndYear.split(':')

        if (!entityId || !year) continue

        // Create promise for loading scaling factor
        const scalingPromise = (async () => {
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
          return await loadScalingFactorForEntity(scalingId, geoId, parseInt(year), source)
        })()

        scalingRequests.push({
          entityCode,
          entity,
          promise: scalingPromise,
        })
      } catch (error) {
        console.error(`Error preparing scaling request for entity ${entityCode}:`, error)
      }
    }

    // Execute all scaling requests in parallel
    const results = await Promise.allSettled(scalingRequests.map((req) => req.promise))

    // Apply results to entities
    for (let i = 0; i < scalingRequests.length; i++) {
      const { entity } = scalingRequests[i]
      const result = results[i]

      if (result.status === 'fulfilled' && result.value !== null && result.value > 0) {
        const scalingFactor = result.value
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
      } else if (result.status === 'rejected') {
        console.error(
          `Error loading scaling factor for entity ${scalingRequests[i].entityCode}:`,
          result.reason,
        )
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
