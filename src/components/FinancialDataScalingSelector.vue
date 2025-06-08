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
                      {{
                        $t('financialDataDisplay.scalingFactor', {
                          factor: entity.scalingFactor.toLocaleString(),
                        })
                      }}
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
  scalingChanged: [scalingId: string | null, scalingInfo: ScalingInfo | null]
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

interface ScalingInfo {
  id: string
  name: string
  unit: string
  description: string
  factor?: number
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
    const currentLocale = locale.value as keyof MultiLanguageLabels
    options.push({
      label: stat.name[currentLocale] || stat.name.en || stat.id,
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

const currentScalingInfo = computed<ScalingInfo | null>(() => {
  if (!internalSelectedScaling.value) return null

  const stat = availableStats.value.find((s) => s.id === internalSelectedScaling.value)
  if (!stat) return null

  const currentLocale = locale.value as keyof MultiLanguageLabels
  return {
    id: stat.id,
    name: stat.name[currentLocale] || stat.name.en || stat.id,
    unit: stat.unit[currentLocale] || stat.unit.en || '',
    description: t('financialDataScalingSelector.scalingInfo.description'),
  }
})

// Methods
const loadAvailableStats = async () => {
  try {
    loading.value = true
    error.value = null

    const stats = await statsDataLoader.getAvailableStats()

    // Filter for relevant scaling statistics (population, area, etc.)
    availableStats.value = stats.filter((stat: StatsAvailabilityInfo) => {
      const id = stat.id.toLowerCase()
      return (
        id.includes('pop') ||
        id.includes('area') ||
        id.includes('household') ||
        id.includes('employee')
      )
    })
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
      emit('scalingChanged', null, null)
      return
    }

    const scalingInfo = currentScalingInfo.value
    if (!scalingInfo) {
      throw new Error('Invalid scaling selection')
    }

    emit('scalingChanged', internalSelectedScaling.value, scalingInfo)
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

// Watch for selectedScaling prop changes
watch(
  () => props.selectedScaling,
  async (newScaling) => {
    const scalingValue = newScaling ?? null
    if (scalingValue !== internalSelectedScaling.value) {
      internalSelectedScaling.value = scalingValue

      // Auto-apply scaling when prop changes and we have the necessary data
      if (scalingValue && availableStats.value.length > 0 && props.financialData?.entities.size) {
        await onScalingChange()
      }
    }
  },
  { immediate: true },
)

// Watch for availableStats to apply scaling if needed
watch(
  () => availableStats.value,
  async () => {
    // If we have a selected scaling from props and financial data, apply it
    if (internalSelectedScaling.value && availableStats.value.length > 0 && props.financialData?.entities.size) {
      await onScalingChange()
    }
  },
)

// Watch for financial data changes to apply scaling if needed
watch(
  () => props.financialData?.entities.size,
  async (hasEntities) => {
    // If we have entities and a selected scaling, apply it
    if (hasEntities && internalSelectedScaling.value && availableStats.value.length > 0) {
      await onScalingChange()
    }
  },
)

// Watch for locale changes to update labels
watch(
  () => locale.value,
  () => {
    // Force reactivity update for computed properties by triggering a re-render
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
