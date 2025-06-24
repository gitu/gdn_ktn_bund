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

              <!-- Manual formula section -->
              <div class="manual-formula-section mt-4">
                <Button
                  @click="applyCustomFormula"
                  :disabled="!customFormulaValidation?.isValid"
                  class="w-full"
                  severity="primary"
                >
                  {{ $t('financialDataScalingSelector.customFormula.apply') }}
                </Button>
              </div>

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

              <!-- Target account codes for optimization -->
              <div
                class="optimization-section mt-4 p-4 bg-surface-50 dark:bg-surface-800 rounded-lg border"
              >
                <h5 class="text-sm font-medium mb-2">
                  {{ $t('financialDataScalingSelector.customFormula.optimization.title') }}
                </h5>
                <p class="text-xs text-surface-600 dark:text-surface-300 mb-3">
                  {{ $t('financialDataScalingSelector.customFormula.optimization.description') }}
                </p>

                <FloatLabel class="w-full mb-3">
                  <InputText
                    id="target-accounts-input"
                    v-model="targetAccountCodes"
                    class="w-full"
                    @input="onTargetAccountsInput"
                  />
                  <label for="target-accounts-input">
                    {{ $t('financialDataScalingSelector.customFormula.optimization.targetCodes') }}
                  </label>
                </FloatLabel>

                <Message
                  v-if="targetAccountsError"
                  severity="warn"
                  :closable="false"
                  class="text-xs"
                >
                  {{ targetAccountsError }}
                </Message>

                <Button
                  @click="optimizeFormula"
                  :disabled="!canOptimizeWithTargets"
                  :loading="isOptimizing"
                  class="w-full"
                  severity="secondary"
                  outlined
                >
                  {{ $t('financialDataScalingSelector.customFormula.optimization.optimize') }}
                </Button>

                <!-- Entity Selection -->
                <Fieldset
                  :legend="
                    $t(
                      'financialDataScalingSelector.customFormula.optimization.entitySelection.title',
                    )
                  "
                  class="mt-4"
                  :toggleable="true"
                >
                  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    <div
                      v-for="entity in availableEntities"
                      :key="entity.code"
                      class="flex items-center gap-2"
                    >
                      <Checkbox
                        :id="`entity-${entity.code}`"
                        v-model="selectedEntities"
                        :value="entity.code"
                      />
                      <label :for="`entity-${entity.code}`" class="text-sm">
                        {{ entity.displayName }}
                      </label>
                    </div>
                  </div>
                  <div class="mt-2 flex gap-2">
                    <Button
                      @click="selectedEntities = availableEntities.map((e) => e.code)"
                      size="small"
                      severity="secondary"
                      text
                    >
                      {{
                        $t(
                          'financialDataScalingSelector.customFormula.optimization.entitySelection.selectAll',
                        )
                      }}
                    </Button>
                    <Button @click="selectedEntities = []" size="small" severity="secondary" text>
                      {{
                        $t(
                          'financialDataScalingSelector.customFormula.optimization.entitySelection.selectNone',
                        )
                      }}
                    </Button>
                  </div>
                </Fieldset>

                <!-- Scaling Factor Selection -->
                <Fieldset
                  :legend="
                    $t(
                      'financialDataScalingSelector.customFormula.optimization.factorSelection.title',
                    )
                  "
                  class="mt-4"
                  :toggleable="true"
                >
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div
                      v-for="factor in availableScalingFactorsList"
                      :key="factor.id"
                      class="flex items-center gap-2"
                    >
                      <Checkbox
                        :id="`factor-${factor.id}`"
                        v-model="selectedScalingFactors"
                        :value="factor.id"
                      />
                      <label :for="`factor-${factor.id}`" class="text-sm">
                        {{ factor.label }}
                      </label>
                    </div>
                  </div>
                  <div class="mt-2 flex gap-2">
                    <Button
                      @click="selectedScalingFactors = availableScalingFactorsList.map((f) => f.id)"
                      size="small"
                      severity="secondary"
                      text
                    >
                      {{
                        $t(
                          'financialDataScalingSelector.customFormula.optimization.factorSelection.selectAll',
                        )
                      }}
                    </Button>
                    <Button
                      @click="selectedScalingFactors = []"
                      size="small"
                      severity="secondary"
                      text
                    >
                      {{
                        $t(
                          'financialDataScalingSelector.customFormula.optimization.factorSelection.selectNone',
                        )
                      }}
                    </Button>
                  </div>
                </Fieldset>
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
                    <code class="bg-surface-100 dark:bg-surface-700 px-1 rounded">{{
                      optimizationResult.formula
                    }}</code>
                  </div>
                  <div v-if="optimizationResult.rSquared">
                    {{ $t('financialDataScalingSelector.customFormula.optimizationQuality') }}:
                    {{ (optimizationResult.rSquared * 100).toFixed(1) }}%
                  </div>

                  <!-- Account Summary -->
                  <div
                    v-if="
                      optimizationResult.accountSummary &&
                      optimizationResult.accountSummary.length > 0
                    "
                    class="mt-3"
                  >
                    <div class="font-medium mb-2">Account Optimization Results:</div>
                    <div class="space-y-1">
                      <div
                        v-for="account in optimizationResult.accountSummary"
                        :key="account.accountCode"
                        class="text-xs bg-surface-50 dark:bg-surface-800 p-2 rounded"
                      >
                        <div class="font-medium">
                          Account {{ account.accountCode }} ({{ account.entityCount }} entities)
                        </div>
                        <div>CV improvement: {{ account.improvement.toFixed(1) }}%</div>
                        <div>
                          Before: {{ account.beforeCV.toFixed(3) }} → After:
                          {{ account.afterCV.toFixed(3) }}
                        </div>
                      </div>
                    </div>
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
                {{ $t('financialDataScalingSelector.customFormula.optimizationFailed') }}:
                {{ optimizationResult.error }}
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
import Checkbox from 'primevue/checkbox'
import Fieldset from 'primevue/fieldset'
import { StatsDataLoader } from '@/utils/StatsDataLoader'
import {
  GeographicalDataLoader,
  getCantonByAbbreviation,
  getMunicipalityByGdnId,
} from '@/utils/GeographicalDataLoader'
import { EntitySemanticMapper } from '@/utils/EntitySemanticMapper'
import { CustomScalingFormula, CUSTOM_SCALING_PREFIX } from '@/utils/CustomScalingFormula'
import { ScalingOptimization, type AccountOptimizationResult } from '@/utils/ScalingOptimization'
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
const optimizationResult = ref<AccountOptimizationResult | null>(null)
const targetAccountCodes = ref('36,46')
const targetAccountsError = ref<string | null>(null)

// Entity and scaling factor selection state
const selectedEntities = ref<string[]>([])
const selectedScalingFactors = ref<string[]>([])

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
  return (
    !loading.value &&
    availableStats.value.length >= 2 &&
    props.financialData?.entities?.size &&
    props.financialData.entities.size >= 1 &&
    selectedEntities.value.length >= 1 &&
    selectedScalingFactors.value.length >= 1
  )
})

const canOptimizeWithTargets = computed(() => {
  return canOptimize.value && targetAccountCodes.value.trim() && !targetAccountsError.value
})

// Store municipality names for caching
const municipalityNames = ref<Map<string, string>>(new Map())
// Reactive trigger to update computed properties when municipality names change
const municipalityNamesVersion = ref(0)

const availableEntities = computed(() => {
  if (!props.financialData?.entities) return []

  // Explicitly depend on municipalityNames and version to ensure reactivity
  const municipalityNamesMap = municipalityNames.value
  // Force reactivity by depending on the version
  void municipalityNamesVersion.value

  return Array.from(props.financialData.entities.keys()).map((entityCode) => {
    // Extract entity information for display
    const parts = entityCode.split('/')
    const source = parts[0]
    const entityAndYear = parts[2]
    const [entityId, year] = entityAndYear.split(':')

    let displayName = `${source}/${entityId} (${year})`

    // Handle GDN numeric IDs first with municipality lookup
    if (source === 'gdn' && /^\d+$/.test(entityId)) {
      const cachedName = municipalityNamesMap.get(entityId)
      if (cachedName) {
        displayName = `${cachedName} (${year})`
      } else {
        displayName = `Municipality ${entityId} (${year})`
      }
    } else {
      // Try to get human-readable name from EntitySemanticMapper for non-GDN entities
      try {
        const entityDisplayName = EntitySemanticMapper.getEntityDisplayName(entityId)
        const currentLocale = locale.value as keyof MultiLanguageLabels
        const humanReadableName = entityDisplayName[currentLocale] || entityDisplayName.en

        if (humanReadableName && !humanReadableName.includes('Unknown')) {
          displayName = `${humanReadableName} (${year})`
        }
      } catch (error) {
        // Use fallback display name if mapping fails
        console.warn(`Failed to get display name for entity ${entityId}:`, error)
      }
    }

    return {
      code: entityCode,
      displayName,
      source,
      entityId,
      year,
    }
  })
})

// Load municipality names when component mounts or when financial data changes
const loadMunicipalityNames = async () => {
  if (!props.financialData?.entities) return

  const gdnEntityIds = new Set<string>()

  // Collect all GDN entity IDs
  for (const entityCode of props.financialData.entities.keys()) {
    const parts = entityCode.split('/')
    if (parts[0] === 'gdn') {
      const entityAndYear = parts[2]
      const [entityId] = entityAndYear.split(':')
      if (/^\d+$/.test(entityId)) {
        gdnEntityIds.add(entityId)
      }
    }
  }

  // Load municipality names for each GDN ID
  for (const gdnId of gdnEntityIds) {
    if (!municipalityNames.value.has(gdnId)) {
      try {
        const municipality = await getMunicipalityByGdnId(gdnId)
        if (municipality) {
          municipalityNames.value.set(gdnId, municipality.municipalityLongName)
          municipalityNamesVersion.value++ // Trigger reactivity
        }
      } catch (error) {
        console.warn(`Failed to load municipality name for GDN ID ${gdnId}:`, error)
      }
    }
  }
}

const availableScalingFactorsList = computed(() => {
  return availableStats.value.map((stat) => {
    const currentLocale = locale.value as keyof MultiLanguageLabels
    const label = stat.name[currentLocale] || stat.name.en || stat.id

    return {
      id: stat.id,
      label,
      description: stat.name,
    }
  })
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

// Target account validation
const onTargetAccountsInput = () => {
  const input = targetAccountCodes.value.trim()
  if (!input) {
    targetAccountsError.value = null
    return
  }

  // Validate comma-separated account codes (with + for sums)
  const codeGroups = input
    .split(',')
    .map((group) => group.trim())
    .filter((group) => group)
  const invalidGroups: string[] = []

  for (const group of codeGroups) {
    // Split by + and validate each individual code
    const codes = group
      .split('+')
      .map((code) => code.trim())
      .filter((code) => code)
    const invalidCodes = codes.filter((code) => !/^\d+$/.test(code))
    if (invalidCodes.length > 0 || codes.length === 0) {
      invalidGroups.push(group)
    }
  }

  if (invalidGroups.length > 0) {
    targetAccountsError.value = `Invalid account codes: ${invalidGroups.join(', ')}. Use numeric codes only, optionally combined with + (e.g., 400+401).`
  } else if (codeGroups.length === 0) {
    targetAccountsError.value = 'Please enter at least one account code.'
  } else {
    targetAccountsError.value = null
  }
}

// Optimization methods
const optimizeFormula = async () => {
  if (!canOptimize.value || !props.financialData) return

  isOptimizing.value = true
  optimizationResult.value = null

  try {
    // Parse target account codes
    const input = targetAccountCodes.value.trim()
    const accountCodes = input
      ? input
          .split(',')
          .map((code) => code.trim())
          .filter((code) => code)
      : []

    if (accountCodes.length === 0) {
      optimizationResult.value = {
        isValid: false,
        error: 'Please enter target account codes (e.g., 36,46)',
      }
      return
    }

    // Validate selections
    if (selectedEntities.value.length === 0) {
      optimizationResult.value = {
        isValid: false,
        error: 'Please select at least one entity for optimization.',
      }
      return
    }

    if (selectedScalingFactors.value.length === 0) {
      optimizationResult.value = {
        isValid: false,
        error: 'Please select at least one scaling factor for optimization.',
      }
      return
    }

    // Load scaling factors for ALL entities (not just selected ones)
    const allScalingVariables = new Map<string, Map<string, number>>()

    for (const [entityCode] of props.financialData.entities) {
      try {
        // Extract entity information from the entity code
        const parts = entityCode.split('/')
        if (parts.length !== 3) continue

        const source = parts[0] as 'gdn' | 'std'
        const entityAndYear = parts[2]
        const [entityId, year] = entityAndYear.split(':')

        if (!entityId || !year) continue

        // Determine geoId for the entity
        let geoId = ''
        if (source === 'std') {
          // Map canton-specific entities to their canton code
          if (EntitySemanticMapper.isCantonSpecific(entityId)) {
            const cantonCode = EntitySemanticMapper.getCantonCodeFromEntity(entityId)
            if (cantonCode) {
              const canton = await getCantonByAbbreviation(cantonCode.toUpperCase())
              geoId = canton?.cantonId || ''
            }
          } else {
            // Federal/confederation data
            geoId = 'bund'
          }
        } else if (source === 'gdn') {
          // For municipalities, get the proper municipality ID
          const municipality = await getMunicipalityByGdnId(entityId)
          geoId = municipality?.municipalityId || entityId // Use municipalityId or fallback to entityId
          console.log(
            `  Municipality lookup for ${entityId}: found=${!!municipality}, geoId=${geoId}`,
          )
        }

        if (!geoId) {
          console.warn(
            `No geoId determined for entity ${entityCode} (source: ${source}, entityId: ${entityId})`,
          )
          continue
        }

        // Load scaling factors for this entity
        const entityVariables = new Map<string, number>()

        console.log(
          `Loading scaling data for entity ${entityCode} (source: ${source}, geoId: ${geoId}, year: ${year})`,
        )

        // Load ALL scaling factors for this entity (not just selected ones)
        for (const stat of availableStats.value) {
          try {
            let value: number | null = null

            if (source === 'gdn') {
              // Load municipality data using GDN loader
              const result = await statsDataLoader.loadGdnData(stat.id, parseInt(year), {
                geoIds: [geoId],
              })
              const record = result.data.find(
                (r: { key: string; value: number }) => r.key === geoId,
              )
              value = record ? record.value : null
              console.log(`  ${stat.id}: ${value} (municipality via loadGdnData)`)
            } else if (source === 'std') {
              if (geoId === 'bund') {
                // Load federal data
                const result = await statsDataLoader.getBundData(stat.id, parseInt(year))
                value = result?.totalValue || null
                console.log(`  ${stat.id}: ${value} (federal)`)
              } else {
                // Load canton data using KTN loader
                const result = await statsDataLoader.loadKtnData(stat.id, parseInt(year), {
                  geoIds: [geoId],
                })
                const record = result.data.find(
                  (r: { key: string; value: number }) => r.key === geoId,
                )
                value = record ? record.value : null
                console.log(`  ${stat.id}: ${value} (canton via loadKtnData)`)
              }
            }

            if (value !== null && value > 0) {
              entityVariables.set(stat.id, value)
            }
          } catch (error) {
            console.warn(`Failed to load ${stat.id} for entity ${entityCode}:`, error)
          }
        }

        if (entityVariables.size > 0) {
          allScalingVariables.set(entityCode, entityVariables)
          console.log(
            `  Successfully loaded ${entityVariables.size} scaling factors for ${entityCode}`,
          )
        } else {
          console.warn(`  No scaling factors loaded for ${entityCode}`)
        }
      } catch (error) {
        console.warn(`Failed to process entity ${entityCode}:`, error)
      }
    }

    console.log(`Total entities with scaling data: ${allScalingVariables.size}`)

    // Log summary of scaling variables
    for (const [entityCode, variables] of allScalingVariables) {
      const values = Array.from(variables.entries())
      console.log(`Entity ${entityCode}:`, values)
    }

    if (allScalingVariables.size === 0) {
      optimizationResult.value = {
        isValid: false,
        error:
          'No scaling factors could be loaded for any entities. Please ensure statistical data is available.',
      }
      return
    }

    // Create filtered scaling variables for optimization (only selected entities and factors)
    const filteredScalingVariables = new Map<string, Map<string, number>>()

    for (const entityCode of selectedEntities.value) {
      const allFactors = allScalingVariables.get(entityCode)
      if (allFactors) {
        const selectedFactors = new Map<string, number>()
        for (const factorId of selectedScalingFactors.value) {
          const value = allFactors.get(factorId)
          if (value !== undefined) {
            selectedFactors.set(factorId, value)
          }
        }
        if (selectedFactors.size > 0) {
          filteredScalingVariables.set(entityCode, selectedFactors)
        }
      }
    }

    // Run account-specific optimization with selected scaling factors only
    const selectedStats = availableStats.value.filter((stat) =>
      selectedScalingFactors.value.includes(stat.id),
    )

    // Debug logging
    console.log(`Selected entities: ${selectedEntities.value.length}`)
    console.log(`Selected scaling factors: ${selectedScalingFactors.value.length}`)
    console.log(`All scaling variables loaded: ${allScalingVariables.size}`)
    console.log(`Filtered scaling variables for optimization: ${filteredScalingVariables.size}`)
    console.log(`Account codes: [${accountCodes.join(', ')}]`)

    const result = ScalingOptimization.optimizeForAccountCodes(
      props.financialData,
      accountCodes,
      selectedStats,
      filteredScalingVariables,
      {
        minRSquared: 0.1, // Lower threshold for single entity optimization
        includeIntercept: selectedEntities.value.length > 1, // No intercept for single entity
        varianceWeight: 0.8, // Prioritize variance minimization
      },
    )

    optimizationResult.value = result
  } catch (error) {
    console.error('Optimization error:', error)
    optimizationResult.value = {
      isValid: false,
      error: 'Failed to optimize formula. Please try again.',
    }
  } finally {
    isOptimizing.value = false
  }
}

const applyOptimizedFormula = () => {
  if (optimizationResult.value?.isValid && optimizationResult.value.formula) {
    const optimizedScalingId = `${CUSTOM_SCALING_PREFIX}${optimizationResult.value.formula}`
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

  // Initialize entity selection with all entities if available
  if (props.financialData?.entities) {
    selectedEntities.value = Array.from(props.financialData.entities.keys())
  }

  // Load municipality names
  loadMunicipalityNames()
})

// Watch for changes in financial data to update entity selection
watch(
  () => props.financialData,
  (newData) => {
    if (newData?.entities) {
      // Initialize all entities as selected by default
      selectedEntities.value = Array.from(newData.entities.keys())
      // Load municipality names for the new data
      loadMunicipalityNames()
    }
  },
  { deep: true },
)

// Watch for changes in available stats to initialize scaling factors selection
watch(
  availableStats,
  (newStats) => {
    if (newStats && newStats.length > 0) {
      // Initialize all scaling factors as selected by default
      selectedScalingFactors.value = newStats.map((stat) => stat.id)
    }
  },
  { immediate: true },
)

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
