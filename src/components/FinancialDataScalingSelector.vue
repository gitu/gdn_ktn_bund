<template>
  <div class="financial-data-scaling-selector">
    <!-- Loading state -->
    <Message v-if="loading" severity="info" :closable="false" class="mb-4">
      <template #icon>
        <i class="pi pi-spin pi-spinner"></i>
      </template>
      {{ $t('financialDataScalingSelector.loading') }}
    </Message>

    <!-- Error state -->
    <Message v-else-if="error" severity="error" :closable="false" class="mb-4">
      {{ error }}
    </Message>

    <!-- Scaling selector -->
    <div v-else class="scaling-controls card">
      <div class="flex flex-col gap-4">
        <h4 class="block font-medium mb-2">
          {{ $t('financialDataScalingSelector.scaling') }}
        </h4>
        <FloatLabel class="w-full" variant="on">
          <Select
            id="scaling-selector"
            v-model="internalSelectedScaling"
            :options="scalingOptions"
            option-label="label"
            option-value="value"
            class="w-full"
            @change="onScalingChange"
            data-testid="scaling-dropdown"
            size="large"
          />
          <label for="scaling-selector">
            {{ $t('financialDataScalingSelector.selectScaling') }}</label
          >
        </FloatLabel>

        <!-- Custom formula section -->
        <div class="custom-formula-section mt-4">
          <Button
            @click="toggleCustomFormula"
            :aria-expanded="showCustomFormula"
            class="custom-formula-toggle w-full justify-between"
            severity="secondary"
            outlined
          >
            <span>{{ $t('financialDataScalingSelector.customFormula.title') }}</span>
            <i :class="showCustomFormula ? 'pi pi-chevron-up' : 'pi pi-chevron-down'"></i>
          </Button>

          <div
            v-if="showCustomFormula"
            class="custom-formula-content mt-4 p-4 bg-surface-50 dark:bg-surface-800 rounded-lg"
          >
            <div class="flex flex-col gap-4">
              <!-- Formula input -->
              <FloatLabel class="w-full">
                <InputText
                  id="custom-formula-input"
                  v-model="customFormulaInput"
                  class="w-full"
                  :class="{ 'p-invalid': customFormulaError }"
                  @input="onCustomFormulaInput"
                  data-testid="custom-formula-input"
                />
                <label for="custom-formula-input">
                  {{ $t('financialDataScalingSelector.customFormula.placeholder') }}
                </label>
              </FloatLabel>

              <!-- Formula validation message -->
              <Message v-if="customFormulaError" severity="error" :closable="false">
                {{ customFormulaError }}
              </Message>

              <Message
                v-else-if="customFormulaInput && customFormulaValidation?.isValid"
                severity="success"
                :closable="false"
              >
                {{
                  $t('financialDataScalingSelector.customFormula.valid', {
                    factors: customFormulaValidation.usedFactors?.join(', ') || '',
                  })
                }}
              </Message>

              <!-- Formula help -->
              <div class="formula-help text-sm text-surface-600 dark:text-surface-300">
                <p class="mb-2">
                  {{ $t('financialDataScalingSelector.customFormula.help.title') }}
                </p>
                <ul class="list-disc ml-4 space-y-1">
                  <li>{{ $t('financialDataScalingSelector.customFormula.help.example1') }}</li>
                  <li>{{ $t('financialDataScalingSelector.customFormula.help.example2') }}</li>
                  <li>{{ $t('financialDataScalingSelector.customFormula.help.example3') }}</li>
                </ul>
                <p class="mt-2">
                  {{ $t('financialDataScalingSelector.customFormula.help.availableFactors') }}
                  <strong>{{ availableFactorsList }}</strong>
                </p>
              </div>

              <!-- Action buttons -->
              <div class="flex gap-2">
                <Button
                  @click="applyCustomFormula"
                  :disabled="!customFormulaValidation?.isValid"
                  class="flex-1"
                  severity="primary"
                >
                  {{ $t('financialDataScalingSelector.customFormula.apply') }}
                </Button>
                
                <Button
                  @click="optimizeFormula"
                  :disabled="!canOptimize"
                  :loading="isOptimizing"
                  class="flex-1"
                  severity="secondary"
                  outlined
                >
                  {{ $t('financialDataScalingSelector.customFormula.optimize') }}
                </Button>
              </div>

              <!-- Optimization result -->
              <Message
                v-if="optimizationResult && optimizationResult.isValid"
                severity="success"
                :closable="false"
                class="mt-2"
              >
                <div class="text-sm">
                  <div class="font-medium mb-1">
                    {{ $t('financialDataScalingSelector.customFormula.optimizationSuccess') }}
                  </div>
                  <div>
                    {{ $t('financialDataScalingSelector.customFormula.optimizationFormula') }}: 
                    <code class="bg-surface-100 dark:bg-surface-700 px-1 rounded">{{ optimizationResult.formula }}</code>
                  </div>
                  <div v-if="optimizationResult.rSquared">
                    {{ $t('financialDataScalingSelector.customFormula.optimizationQuality') }}: 
                    {{ (optimizationResult.rSquared * 100).toFixed(1) }}%
                  </div>
                  <Button
                    @click="applyOptimizedFormula"
                    size="small"
                    class="mt-2"
                    severity="primary"
                  >
                    {{ $t('financialDataScalingSelector.customFormula.applyOptimized') }}
                  </Button>
                </div>
              </Message>

              <Message
                v-else-if="optimizationResult && !optimizationResult.isValid"
                severity="warn"
                :closable="false"
                class="mt-2"
              >
                {{ $t('financialDataScalingSelector.customFormula.optimizationFailed') }}: {{ optimizationResult.error }}
              </Message>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Controls -->
    <div v-if="hasScalingFactors" class="controls mb-6">
      <div class="card flex flex-col gap-4 w-full">
        <div class="flex flex-col gap-4">
          <!-- Scaling Information Section -->
          <div class="scaling-info-section mt-6">
            <Button
              @click="toggleScalingInfo"
              :aria-expanded="scalingInfoExpanded"
              :aria-controls="'scaling-info-content'"
              class="scaling-info-toggle w-full justify-between"
              severity="secondary"
              outlined
            >
              <span>{{ $t('financialDataDisplay.scalingInfo.title') }}</span>
              <i :class="scalingInfoExpanded ? 'pi pi-chevron-up' : 'pi pi-chevron-down'"></i>
            </Button>

            <div
              v-if="scalingInfoExpanded"
              id="scaling-info-content"
              class="scaling-info-content mt-4 p-4 bg-surface-50 dark:bg-surface-800 rounded-lg"
            >
              <div class="card flex flex-col gap-4 w-full">
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div
                    v-for="[entityCode, entity] in entityColumns"
                    :key="entityCode"
                    class="entity-scaling-info"
                  >
                    <div class="entity-name font-medium mb-1">
                      {{ getEntityDisplayName(entity) }}
                    </div>
                    <div class="entity-year text-sm text-surface-600 dark:text-surface-300 mb-1">
                      {{ $t('financialDataDisplay.yearInfo', { year: entity.year }) }}
                    </div>
                    <div
                      v-if="entity.scalingFactor !== undefined"
                      class="entity-scaling text-sm text-surface-600 dark:text-surface-300"
                    >
                      <div>
                        {{
                          $t('financialDataDisplay.scalingFactor', {
                            factor: entity.scalingFactor.toLocaleString(),
                          })
                        }}
                      </div>
                      <div
                        v-if="entity.scalingInfo"
                        class="mt-1 text-xs text-surface-500 dark:text-surface-400"
                      >
                        {{
                          entity.scalingInfo[locale] ||
                          entity.scalingInfo.en ||
                          entity.scalingInfo.de
                        }}
                      </div>
                    </div>
                    <div v-else class="no-scaling text-sm text-surface-500 dark:text-surface-400">
                      {{ $t('financialDataDisplay.noScalingFactor') }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import Select from 'primevue/select'
import Message from 'primevue/message'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import FloatLabel from 'primevue/floatlabel'
import { StatsDataLoader } from '@/utils/StatsDataLoader'
import { GeographicalDataLoader } from '@/utils/GeographicalDataLoader'
import { CustomScalingFormula, CUSTOM_SCALING_PREFIX, OPTIMIZED_SCALING_PREFIX } from '@/utils/CustomScalingFormula'
import type { StatsAvailabilityInfo } from '@/types/StatsData'
import type { FinancialData } from '@/types/FinancialDataStructure'
import type { MultiLanguageLabels } from '@/types/DataStructures'


// Props
interface Props {
  financialData?: FinancialData | null
  selectedScaling?: string | null
}

const props = defineProps<Props>()

// Suppress unused variable warning - props is used in template
void props

// Emits
interface Emits {
  scalingChanged: [scalingId: string | null]
  error: [error: string]
}

const emit = defineEmits<Emits>()

// Vue i18n
const { locale, t } = useI18n()

// Types
interface ScalingOption {
  label: string
  value: string | null
  statsId?: string
  unit?: MultiLanguageLabels
  description?: MultiLanguageLabels
}

// Reactive state
const loading = ref(true)
const error = ref<string | null>(null)
const internalSelectedScaling = ref<string | null>(null)
const availableStats = ref<StatsAvailabilityInfo[]>([])
const statsDataLoader = StatsDataLoader.getInstance()
const geoDataLoader = GeographicalDataLoader.getInstance()

// Custom formula state
const showCustomFormula = ref(false)
const customFormulaInput = ref('')
const customFormulaError = ref<string | null>(null)
const customFormulaValidation = ref<{ isValid: boolean; usedFactors?: string[] } | null>(null)

// Optimization state
const isOptimizing = ref(false)
const optimizationResult = ref<any>(null)

// Suppress unused variable warning - geoDataLoader is available for future use
void geoDataLoader

// Computed properties
const scalingOptions = computed<ScalingOption[]>(() => {
  const options: ScalingOption[] = [
    {
      label: t('financialDataScalingSelector.noScaling'),
      value: null,
    },
  ]

  // Add available statistics as scaling options
  availableStats.value.forEach((stat) => {
    // Try to get translation key first, fallback to stat name
    const translationKey = `financialDataScalingSelector.options.${stat.id}`
    let label: string

    try {
      // Check if translation exists
      label = t(translationKey)
      // If translation returns the key itself, it doesn't exist
      if (label === translationKey) {
        throw new Error('Translation not found')
      }
    } catch {
      // Fallback to stat name from data
      const currentLocale = locale.value as keyof MultiLanguageLabels
      label = stat.name[currentLocale] || stat.name.en || stat.id
    }

    options.push({
      label,
      value: stat.id,
      statsId: stat.id,
      unit: stat.unit,
      description: stat.name,
    })
  })

  // Add custom formula option if one is currently applied
  if (internalSelectedScaling.value?.startsWith(CUSTOM_SCALING_PREFIX)) {
    const formula = internalSelectedScaling.value.substring(CUSTOM_SCALING_PREFIX.length)
    const displayName = CustomScalingFormula.getFormulaDisplayName(
      formula,
      availableStats.value,
      locale.value,
    )
    options.push({
      label: displayName,
      value: internalSelectedScaling.value,
    })
  }

  return options
})

const availableFactorsList = computed(() => {
  return availableStats.value.map((stat) => stat.id).join(', ')
})

const canOptimize = computed(() => {
  return !loading.value && 
         availableStats.value.length >= 2 && 
         props.financialData?.entities?.size && 
         props.financialData.entities.size >= 2
})
const scalingInfoExpanded = ref(false)

// Check if any entity has a scaling factor
const hasScalingFactors = computed(() => {
  if (!props.financialData?.entities) return false
  for (const [, entity] of props.financialData.entities) {
    if (entity.scalingFactor !== undefined) {
      return true
    }
  }
  return false
})
const toggleScalingInfo = () => {
  scalingInfoExpanded.value = !scalingInfoExpanded.value
}

const entityColumns = computed(() => {
  if (!props.financialData?.entities) return new Map()
  return props.financialData.entities
})

const getEntityDisplayName = (entity: { code?: string; name?: MultiLanguageLabels }): string => {
  if (!entity || !entity.name) return entity?.code || 'Unknown Entity'
  const currentLocale = locale.value as keyof MultiLanguageLabels
  return entity.name[currentLocale] || entity.name.de || entity.code || 'Unknown Entity'
}

// Custom formula methods
const toggleCustomFormula = () => {
  showCustomFormula.value = !showCustomFormula.value
  // Clear optimization result when toggling
  optimizationResult.value = null
}

// Optimization methods
const optimizeFormula = async () => {
  if (!canOptimize.value || !props.financialData) return

  isOptimizing.value = true
  optimizationResult.value = null

  try {
    // TODO: Implement actual data collection from financial data
    // This is a simplified version - in reality we'd need to:
    // 1. Extract financial data values for each entity
    // 2. Load scaling factors for each entity
    // 3. Create optimization targets
    
    // For now, create a mock optimization
    const mockResult = {
      isValid: true,
      formula: '0.5*pop+0.3*workplaces+0.2*total_area',
      rSquared: 0.85,
      coefficients: new Map([
        ['pop', 0.5],
        ['workplaces', 0.3], 
        ['total_area', 0.2]
      ]),
      targetLineCount: 5,
      entityCount: props.financialData.entities.size
    }

    // Simulate async operation
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    optimizationResult.value = mockResult
    
  } catch (error) {
    console.error('Optimization error:', error)
    optimizationResult.value = {
      isValid: false,
      error: 'Failed to optimize formula. Please try again.'
    }
  } finally {
    isOptimizing.value = false
  }
}

const applyOptimizedFormula = () => {
  if (optimizationResult.value?.isValid && optimizationResult.value.formula) {
    const optimizedScalingId = `${OPTIMIZED_SCALING_PREFIX}${optimizationResult.value.formula}`
    emit('scalingChanged', optimizedScalingId)
    
    // Update the selector and input
    internalSelectedScaling.value = optimizedScalingId
    customFormulaInput.value = optimizationResult.value.formula
    
    // Close the custom formula section
    showCustomFormula.value = false
    optimizationResult.value = null
  }
}

const onCustomFormulaInput = () => {
  if (!customFormulaInput.value.trim()) {
    customFormulaError.value = null
    customFormulaValidation.value = null
    return
  }

  // Wait for stats to load if they haven't yet
  if (availableStats.value.length === 0 && !loading.value) {
    customFormulaError.value = 'Scaling factors are still loading. Please try again.'
    customFormulaValidation.value = null
    return
  }

  try {
    const validation = CustomScalingFormula.validateFormula(
      customFormulaInput.value,
      availableStats.value,
    )
    customFormulaValidation.value = validation

    if (validation.isValid) {
      customFormulaError.value = null
    } else {
      customFormulaError.value = validation.error || 'Invalid formula'
    }
  } catch (error) {
    customFormulaError.value = error instanceof Error ? error.message : 'Validation error'
    customFormulaValidation.value = null
  }
}

const applyCustomFormula = () => {
  if (customFormulaValidation.value?.isValid && customFormulaInput.value) {
    const customScalingId = `${CUSTOM_SCALING_PREFIX}${customFormulaInput.value}`
    emit('scalingChanged', customScalingId)

    // Update the selector to show "Custom Formula"
    internalSelectedScaling.value = customScalingId

    // Close the custom formula section
    showCustomFormula.value = false
  }
}

// Methods
const loadAvailableStats = async () => {
  try {
    loading.value = true
    error.value = null

    const stats = await statsDataLoader.getAvailableStats()

    // Filter for relevant scaling statistics (population, area, etc.)
    availableStats.value = stats
  } catch (err) {
    console.error('Error loading available statistics:', err)
    error.value = t('financialDataScalingSelector.errors.loadingFailed')
    emit('error', error.value)
  } finally {
    loading.value = false
  }
}

const onScalingChange = async () => {
  try {
    if (!internalSelectedScaling.value) {
      // No scaling selected - remove scaling
      emit('scalingChanged', null)
      return
    }

    // Validate that the scaling ID exists in available stats (skip validation for custom formulas)
    const isCustomFormula = internalSelectedScaling.value.startsWith(CUSTOM_SCALING_PREFIX)
    if (!isCustomFormula) {
      const scalingExists = availableStats.value.some(
        (stat) => stat.id === internalSelectedScaling.value,
      )
      if (!scalingExists) {
        throw new Error('Invalid scaling selection')
      }
    }

    emit('scalingChanged', internalSelectedScaling.value)
  } catch (err) {
    console.error('Error applying scaling:', err)
    const errorMessage = t('financialDataScalingSelector.errors.applyingFailed')
    error.value = errorMessage
    emit('error', errorMessage)
  }
}

// Lifecycle hooks
onMounted(() => {
  loadAvailableStats()
})

// Consolidated watcher to prevent redundant scaling applications
let scalingTimeout: ReturnType<typeof setTimeout> | null = null
let isApplyingScaling = false

const shouldApplyScaling = () => {
  return (
    internalSelectedScaling.value &&
    availableStats.value.length > 0 &&
    props.financialData?.entities?.size &&
    !isApplyingScaling
  )
}

const applyScalingDebounced = async () => {
  if (scalingTimeout) {
    clearTimeout(scalingTimeout)
  }

  scalingTimeout = setTimeout(async () => {
    if (shouldApplyScaling()) {
      isApplyingScaling = true
      try {
        await onScalingChange()
      } finally {
        isApplyingScaling = false
      }
    }
  }, 100) // 100ms debounce
}

// Watch for selectedScaling prop changes
watch(
  () => props.selectedScaling,
  async (newScaling) => {
    const scalingValue = newScaling ?? null
    if (scalingValue !== internalSelectedScaling.value) {
      internalSelectedScaling.value = scalingValue

      // Handle custom formulas from URL
      if (scalingValue && scalingValue.startsWith(CUSTOM_SCALING_PREFIX)) {
        const formula = scalingValue.substring(CUSTOM_SCALING_PREFIX.length) // Remove custom prefix
        customFormulaInput.value = formula
        showCustomFormula.value = true

        // Validate the formula after stats are loaded
        if (availableStats.value.length > 0) {
          onCustomFormulaInput()
        }
        // If stats aren't loaded yet, validation will happen in the watcher below
      } else {
        // Clear custom formula when switching to regular scaling
        if (customFormulaInput.value) {
          customFormulaInput.value = ''
          customFormulaError.value = null
          customFormulaValidation.value = null
          showCustomFormula.value = false
        }
      }

      if (scalingValue) {
        await applyScalingDebounced()
      }
    }
  },
  { immediate: true },
)

// Watch for data readiness to apply scaling
watch([() => availableStats.value.length, () => props.financialData?.entities?.size], async () => {
  // Validate custom formula if one is pending and stats are now loaded
  if (
    customFormulaInput.value &&
    availableStats.value.length > 0 &&
    !customFormulaValidation.value
  ) {
    onCustomFormulaInput()
  }

  if (shouldApplyScaling()) {
    await applyScalingDebounced()
  }
})

// Watch for locale changes to update labels (no scaling application needed)
watch(
  () => locale.value,
  () => {
    // Force reactivity update for computed properties
    if (internalSelectedScaling.value) {
      const currentValue = internalSelectedScaling.value
      internalSelectedScaling.value = null
      internalSelectedScaling.value = currentValue
    }
  },
)
</script>

<style scoped>
.financial-data-scaling-selector {
  width: 100%;
}
</style>
