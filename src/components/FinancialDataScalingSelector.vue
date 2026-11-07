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

    <!-- Scaling selector: one card with the dropdown and two disclosure sections -->
    <section v-else class="scaling-card scaling-controls">
      <h3 class="scaling-title">
        {{ $t('financialDataScalingSelector.scaling') }}
      </h3>
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
      <div class="custom-formula-section disclosure">
        <Button
          @click="toggleCustomFormula"
          :aria-expanded="showCustomFormula"
          class="custom-formula-toggle disclosure-toggle"
          severity="secondary"
          outlined
        >
          <span>{{ $t('financialDataScalingSelector.customFormula.title') }}</span>
          <i :class="showCustomFormula ? 'pi pi-chevron-up' : 'pi pi-chevron-down'"></i>
        </Button>

        <div v-if="showCustomFormula" class="custom-formula-content disclosure-panel">
          <!-- Formula input -->
          <FloatLabel class="w-full" variant="on">
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

          <!-- Manual formula section -->
          <div class="manual-formula-section">
            <Button
              @click="applyCustomFormula"
              :disabled="!customFormulaValidation?.isValid"
              class="action-button"
              severity="primary"
            >
              {{ $t('financialDataScalingSelector.customFormula.apply') }}
            </Button>
          </div>

          <!-- Formula help -->
          <div class="formula-help">
            <p>
              {{ $t('financialDataScalingSelector.customFormula.help.title') }}
            </p>
            <ul>
              <li>{{ $t('financialDataScalingSelector.customFormula.help.example1') }}</li>
              <li>{{ $t('financialDataScalingSelector.customFormula.help.example2') }}</li>
              <li>{{ $t('financialDataScalingSelector.customFormula.help.example3') }}</li>
            </ul>
            <p>
              {{ $t('financialDataScalingSelector.customFormula.help.availableFactors') }}
              <strong>{{ availableFactorsList }}</strong>
            </p>
          </div>

          <!-- Account-specific optimisation, scenarios and simulations (loaded on demand) -->
          <OptimizerPanel
            v-if="props.financialData"
            :financial-data="props.financialData"
            :stats="availableStats"
            @apply="applyOptimizedFormula"
          />
        </div>
      </div>

      <!-- Scaling Information Section -->
      <div v-if="hasScalingFactors" class="scaling-info-section disclosure">
        <Button
          @click="toggleScalingInfo"
          :aria-expanded="scalingInfoExpanded"
          :aria-controls="'scaling-info-content'"
          class="scaling-info-toggle disclosure-toggle"
          severity="secondary"
          outlined
        >
          <span>{{ $t('financialDataDisplay.scalingInfo.title') }}</span>
          <i :class="scalingInfoExpanded ? 'pi pi-chevron-up' : 'pi pi-chevron-down'"></i>
        </Button>

        <div
          v-if="scalingInfoExpanded"
          id="scaling-info-content"
          class="scaling-info-content disclosure-panel"
        >
          <div class="entity-scaling-grid">
            <div
              v-for="[entityCode, entity] in entityColumns"
              :key="entityCode"
              class="entity-scaling-info"
            >
              <div class="entity-name">
                {{ getEntityDisplayName(entity) }}
              </div>
              <div class="entity-year">
                {{ $t('financialDataDisplay.yearInfo', { year: entity.year }) }}
              </div>
              <div v-if="entity.scalingFactor !== undefined" class="entity-scaling">
                <div class="entity-scaling-factor">
                  {{
                    $t('financialDataDisplay.scalingFactor', {
                      factor: entity.scalingFactor.toLocaleString(),
                    })
                  }}
                </div>
                <div v-if="entity.scalingInfo" class="entity-scaling-note">
                  {{ entity.scalingInfo[locale] || entity.scalingInfo.en || entity.scalingInfo.de }}
                </div>
              </div>
              <div v-else class="no-scaling">
                {{ $t('financialDataDisplay.noScalingFactor') }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, defineAsyncComponent } from 'vue'
import { useI18n } from 'vue-i18n'
import Select from 'primevue/select'
import Message from 'primevue/message'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import FloatLabel from 'primevue/floatlabel'
import { StatsDataLoader } from '@/utils/StatsDataLoader'
import { GeographicalDataLoader } from '@/utils/GeographicalDataLoader'
import { CustomScalingFormula, CUSTOM_SCALING_PREFIX } from '@/utils/CustomScalingFormula'
import { Logger } from '@/utils/Logger'
import type { StatsAvailabilityInfo } from '@/types/StatsData'
import type { FinancialData } from '@/types/FinancialDataStructure'
import type { MultiLanguageLabels } from '@/types/DataStructures'

// The optimiser (scenarios, simulations) is only needed once the formula section is opened
const OptimizerPanel = defineAsyncComponent(() => import('./optimization/OptimizerPanel.vue'))

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
}

// Apply a formula found by the optimiser (same behaviour as the manual "apply" button)
const applyOptimizedFormula = (formula: string) => {
  if (!formula) return
  const optimizedScalingId = `${CUSTOM_SCALING_PREFIX}${formula}`
  emit('scalingChanged', optimizedScalingId)

  // Update the selector and input
  internalSelectedScaling.value = optimizedScalingId
  customFormulaInput.value = formula

  // Close the custom formula section
  showCustomFormula.value = false
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
    Logger.error('Failed to load available statistics', err)
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
    Logger.error('Failed to apply scaling', err)
    const errorMessage = t('financialDataScalingSelector.errors.applyingFailed')
    error.value = errorMessage
    emit('error', errorMessage)
  }
}

// Lifecycle hooks
onMounted(() => {
  loadAvailableStats()

  // A shared link that carries optimiser scenarios (?opt=) opens the formula section
  if (new URLSearchParams(window.location.search).has('opt')) {
    showCustomFormula.value = true
  }
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

/* Long float labels stay on one line (the examples are repeated in the help text) */
.financial-data-scaling-selector :deep(.p-floatlabel > label) {
  max-width: calc(100% - 1.75rem);
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

/* Same card as the table frame: hairline border, soft shadow, 16px radius */
.scaling-card {
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
  padding: 1rem;
  border: 1px solid var(--gk-border);
  border-radius: var(--radius-lg);
  background: var(--gk-surface);
  box-shadow: var(--gk-shadow-1);
  color: var(--gk-ink);
}

@media (min-width: 768px) {
  .scaling-card {
    padding: 1.25rem;
  }
}

.scaling-title {
  margin: 0;
  font-size: 1rem;
  font-weight: 650;
  color: var(--gk-ink);
}

/* Disclosure rows (custom formula, scaling information) */
.disclosure {
  display: flex;
  flex-direction: column;
}

.disclosure-toggle.p-button {
  --p-button-outlined-secondary-border-color: var(--gk-border-strong);
  --p-button-outlined-secondary-color: var(--gk-ink);
  --p-button-outlined-secondary-hover-background: var(--gk-surface-2);
  justify-content: space-between;
  width: 100%;
  min-height: 2.75rem;
  text-align: start;
}

.disclosure-panel {
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
  margin-top: 0.75rem;
  padding: 0.875rem;
  border: 1px solid var(--gk-border);
  border-radius: var(--radius-md);
  background: var(--gk-surface-2);
}

/* Buttons are full width on phones, natural width from md up */
.action-button.p-button {
  width: 100%;
  min-height: 2.75rem;
}

@media (min-width: 768px) {
  .action-button.p-button {
    width: auto;
    align-self: flex-start;
  }
}

.manual-formula-section {
  display: flex;
  flex-direction: column;
}

/* Formula help */
.formula-help {
  font-size: 0.8125rem;
  line-height: 1.5;
  color: var(--gk-muted);
  overflow-wrap: anywhere;
}

.formula-help p {
  margin: 0 0 0.375rem;
}

.formula-help ul {
  margin: 0 0 0.5rem;
  padding-inline-start: 1.25rem;
  list-style: disc;
}

.formula-help li + li {
  margin-top: 0.25rem;
}

.formula-help strong {
  color: var(--gk-ink);
  font-weight: 600;
}

/* Scaling information */
.entity-scaling-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 15rem), 1fr));
  gap: 0.625rem;
}

.entity-scaling-info {
  padding: 0.625rem 0.75rem;
  border: 1px solid var(--gk-border);
  border-radius: var(--radius-md);
  background: var(--gk-surface);
  overflow-wrap: anywhere;
}

.entity-scaling-info .entity-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--gk-ink);
}

.entity-scaling-info .entity-year {
  margin-top: 0.125rem;
  font-size: 0.75rem;
  color: var(--gk-muted);
  font-variant-numeric: tabular-nums;
}

.entity-scaling {
  margin-top: 0.375rem;
  font-size: 0.8125rem;
  color: var(--gk-ink);
  font-variant-numeric: tabular-nums;
}

.entity-scaling-note {
  margin-top: 0.125rem;
  font-size: 0.75rem;
  color: var(--gk-muted);
}

.no-scaling {
  margin-top: 0.375rem;
  font-size: 0.8125rem;
  color: var(--gk-muted);
}
</style>
