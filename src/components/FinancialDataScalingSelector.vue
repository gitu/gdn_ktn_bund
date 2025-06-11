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
                      <div v-if="entity.scalingInfo">
                        {{ entity.scalingInfo[locale] || entity.scalingInfo.en || entity.scalingInfo.de }}
                      </div>
                      <div v-else>
                        {{
                          $t('financialDataDisplay.scalingFactor', {
                            factor: entity.scalingFactor.toLocaleString(),
                          })
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
import { StatsDataLoader } from '@/utils/StatsDataLoader'
import { GeographicalDataLoader } from '@/utils/GeographicalDataLoader'
import type { StatsAvailabilityInfo } from '@/types/StatsData'
import type { FinancialData } from '@/types/FinancialDataStructure'
import type { MultiLanguageLabels } from '@/types/DataStructures'
import Button from 'primevue/button'

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

  return options
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

    // Validate that the scaling ID exists in available stats
    const scalingExists = availableStats.value.some(
      (stat) => stat.id === internalSelectedScaling.value,
    )
    if (!scalingExists) {
      throw new Error('Invalid scaling selection')
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

      if (scalingValue) {
        await applyScalingDebounced()
      }
    }
  },
  { immediate: true },
)

// Watch for data readiness to apply scaling
watch([() => availableStats.value.length, () => props.financialData?.entities?.size], async () => {
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
