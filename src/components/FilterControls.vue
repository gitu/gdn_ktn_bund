<template>
  <div class="filter-controls">
    <!-- Header -->
    <div class="filter-header mb-4">
      <h4 class="text-lg font-semibold text-surface-900 dark:text-surface-50 mb-2">
        {{ $t('filterControls.title') }}
      </h4>
      <p class="text-sm text-surface-600 dark:text-surface-300">
        {{ $t('filterControls.description') }}
      </p>
    </div>

    <!-- Main Toggle -->
    <div class="filter-toggle-section mb-6">
      <div
        class="flex items-center justify-between p-4 bg-surface-50 dark:bg-surface-800 rounded-lg"
      >
        <div class="flex-1">
          <label class="block font-medium text-surface-900 dark:text-surface-50 mb-1">
            {{ $t('filterControls.enableFiltering') }}
          </label>
          <p class="text-sm text-surface-600 dark:text-surface-300">
            {{ $t('filterControls.enableFilteringDescription') }}
          </p>
        </div>
        <ToggleButton
          v-model="localFilterConfig.enabled"
          :onLabel="$t('filterControls.enabled')"
          :offLabel="$t('filterControls.disabled')"
          @update:modelValue="onFilterEnabledChange"
          data-testid="filter-enabled-toggle"
        />
      </div>
    </div>

    <!-- Filter Configuration (shown when enabled) -->
    <div v-if="localFilterConfig.enabled" class="filter-configuration">
      <!-- Preset Filters Section -->
      <Card class="mb-6">
        <template #title>
          <div class="flex items-center gap-2">
            <i class="pi pi-bookmark text-primary"></i>
            {{ $t('filterControls.presets.title') }}
          </div>
        </template>
        <template #content>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              v-for="preset in availablePresets"
              :key="preset.id"
              :label="preset.name"
              :severity="isPresetActive(preset.id) ? 'primary' : 'secondary'"
              :outlined="!isPresetActive(preset.id)"
              @click="applyPreset(preset)"
              class="justify-start text-left"
              data-testid="preset-button"
            >
              <template #default>
                <div class="text-left">
                  <div class="font-medium">{{ preset.name }}</div>
                  <div class="text-xs opacity-75 mt-1">{{ preset.description }}</div>
                </div>
              </template>
            </Button>
          </div>
        </template>
      </Card>

      <!-- Custom Rules Section -->
      <Card class="mb-6">
        <template #title>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <i class="pi pi-cog text-primary"></i>
              {{ $t('filterControls.customRules.title') }}
            </div>
            <Button
              icon="pi pi-plus"
              :label="$t('filterControls.customRules.addRule')"
              size="small"
              @click="addNewRule"
              data-testid="add-rule-button"
            />
          </div>
        </template>
        <template #content>
          <div
            v-if="localFilterConfig.rules.length === 0"
            class="text-center py-8 text-surface-500"
          >
            <i class="pi pi-filter text-4xl mb-4 block"></i>
            <p>{{ $t('filterControls.customRules.noRules') }}</p>
          </div>

          <div v-else class="space-y-4">
            <div
              v-for="(rule, index) in localFilterConfig.rules"
              :key="rule.id"
              class="rule-item p-4 border border-surface-200 dark:border-surface-700 rounded-lg"
            >
              <div class="flex items-start gap-4">
                <!-- Rule Toggle -->
                <div class="flex items-center pt-2">
                  <ToggleButton
                    v-model="rule.enabled"
                    onIcon="pi pi-check"
                    offIcon="pi pi-times"
                    @update:modelValue="onRuleToggle(rule.id, $event)"
                    data-testid="rule-enabled-toggle"
                  />
                </div>

                <!-- Rule Configuration -->
                <div class="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <!-- Rule Name -->
                  <FloatLabel>
                    <InputText
                      :id="`rule-name-${index}`"
                      v-model="rule.name"
                      class="w-full"
                      @input="onRuleChange"
                    />
                    <label :for="`rule-name-${index}`">{{
                      $t('filterControls.customRules.ruleName')
                    }}</label>
                  </FloatLabel>

                  <!-- Pattern Type -->
                  <FloatLabel>
                    <Select
                      :id="`rule-type-${index}`"
                      v-model="rule.type"
                      :options="patternTypeOptions"
                      option-label="label"
                      option-value="value"
                      class="w-full"
                      @change="onRuleChange"
                    />
                    <label :for="`rule-type-${index}`">{{
                      $t('filterControls.customRules.patternType')
                    }}</label>
                  </FloatLabel>

                  <!-- Pattern -->
                  <FloatLabel>
                    <InputText
                      :id="`rule-pattern-${index}`"
                      v-model="rule.pattern"
                      class="w-full"
                      :class="{ 'p-invalid': !isValidPattern(rule) }"
                      @input="onRuleChange"
                    />
                    <label :for="`rule-pattern-${index}`">{{
                      $t('filterControls.customRules.pattern')
                    }}</label>
                  </FloatLabel>
                </div>

                <!-- Action Selector -->
                <div class="flex items-center gap-2 pt-2">
                  <SelectButton
                    v-model="rule.action"
                    :options="actionOptions"
                    option-label="label"
                    option-value="value"
                    @change="onRuleChange"
                    data-testid="rule-action-selector"
                  />
                </div>

                <!-- Remove Button -->
                <div class="flex items-center pt-2">
                  <Button
                    icon="pi pi-trash"
                    severity="danger"
                    text
                    @click="removeRule(rule.id)"
                    :aria-label="$t('filterControls.customRules.removeRule')"
                    data-testid="remove-rule-button"
                  />
                </div>
              </div>

              <!-- Rule Description -->
              <div
                v-if="rule.description"
                class="mt-3 text-sm text-surface-600 dark:text-surface-300"
              >
                {{ rule.description }}
              </div>

              <!-- Pattern Validation Error -->
              <div v-if="!isValidPattern(rule)" class="mt-2">
                <Message severity="error" :closable="false">
                  {{ getPatternValidationError(rule) }}
                </Message>
              </div>
            </div>
          </div>
        </template>
      </Card>

      <!-- Combine Mode Section -->
      <Card class="mb-6" v-if="localFilterConfig.rules.length > 1">
        <template #title>
          <div class="flex items-center gap-2">
            <i class="pi pi-sitemap text-primary"></i>
            {{ $t('filterControls.combineMode.title') }}
          </div>
        </template>
        <template #content>
          <div class="flex flex-col gap-4">
            <p class="text-sm text-surface-600 dark:text-surface-300">
              {{ $t('filterControls.combineMode.description') }}
            </p>
            <SelectButton
              v-model="localFilterConfig.combineMode"
              :options="combineModeOptions"
              option-label="label"
              option-value="value"
              @change="onConfigChange"
              data-testid="combine-mode-selector"
            />
          </div>
        </template>
      </Card>

      <!-- Preview Section -->
      <Card class="mb-6">
        <template #title>
          <div class="flex items-center gap-2">
            <i class="pi pi-eye text-primary"></i>
            {{ $t('filterControls.preview.title') }}
          </div>
        </template>
        <template #content>
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <span class="text-sm font-medium"
                >{{ $t('filterControls.preview.filteringActive') }}:</span
              >
              <Tag
                :value="
                  filterStats.isActive
                    ? $t('filterControls.preview.active')
                    : $t('filterControls.preview.inactive')
                "
                :severity="filterStats.isActive ? 'success' : 'secondary'"
              />
            </div>

            <div
              v-if="filterStats.isActive"
              class="grid grid-cols-2 md:grid-cols-4 gap-4 text-center"
            >
              <div class="p-3 bg-surface-50 dark:bg-surface-800 rounded">
                <div class="text-2xl font-bold text-primary">{{ filterStats.totalRules }}</div>
                <div class="text-xs text-surface-600 dark:text-surface-300">
                  {{ $t('filterControls.preview.totalRules') }}
                </div>
              </div>
              <div class="p-3 bg-surface-50 dark:bg-surface-800 rounded">
                <div class="text-2xl font-bold text-green-600">{{ filterStats.enabledRules }}</div>
                <div class="text-xs text-surface-600 dark:text-surface-300">
                  {{ $t('filterControls.preview.enabledRules') }}
                </div>
              </div>
              <div class="p-3 bg-surface-50 dark:bg-surface-800 rounded">
                <div class="text-2xl font-bold text-blue-600">{{ filterStats.includeRules }}</div>
                <div class="text-xs text-surface-600 dark:text-surface-300">
                  {{ $t('filterControls.preview.includeRules') }}
                </div>
              </div>
              <div class="p-3 bg-surface-50 dark:bg-surface-800 rounded">
                <div class="text-2xl font-bold text-orange-600">{{ filterStats.excludeRules }}</div>
                <div class="text-xs text-surface-600 dark:text-surface-300">
                  {{ $t('filterControls.preview.excludeRules') }}
                </div>
              </div>
            </div>

            <div v-if="lastFilterResult" class="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <h5 class="font-medium mb-2">{{ $t('filterControls.preview.lastFilterResult') }}:</h5>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span class="font-medium">{{ $t('filterControls.preview.originalCount') }}:</span>
                  {{ lastFilterResult.originalCount }}
                </div>
                <div>
                  <span class="font-medium">{{ $t('filterControls.preview.filteredCount') }}:</span>
                  {{ lastFilterResult.filteredCount }}
                </div>
                <div>
                  <span class="font-medium">{{ $t('filterControls.preview.excludedCount') }}:</span>
                  {{ lastFilterResult.excludedCount }}
                </div>
              </div>
              <div v-if="lastFilterResult.excludedCodes.length > 0" class="mt-2">
                <span class="font-medium">{{ $t('filterControls.preview.excludedCodes') }}:</span>
                <div class="flex flex-wrap gap-1 mt-1">
                  <Tag
                    v-for="code in lastFilterResult.excludedCodes.slice(0, 10)"
                    :key="code"
                    :value="code"
                    severity="secondary"
                    size="small"
                  />
                  <Tag
                    v-if="lastFilterResult.excludedCodes.length > 10"
                    :value="`+${lastFilterResult.excludedCodes.length - 10} more`"
                    severity="info"
                    size="small"
                  />
                </div>
              </div>
            </div>
          </div>
        </template>
      </Card>

      <!-- Action Buttons -->
      <div class="flex flex-wrap gap-4 justify-between">
        <div class="flex gap-2">
          <Button
            :label="$t('filterControls.actions.applyFilters')"
            icon="pi pi-check"
            @click="applyFilters"
            :disabled="!hasValidRules"
            data-testid="apply-filters-button"
          />
          <Button
            :label="$t('filterControls.actions.resetFilters')"
            icon="pi pi-refresh"
            severity="secondary"
            outlined
            @click="resetFilters"
            data-testid="reset-filters-button"
          />
        </div>

        <div class="flex gap-2">
          <Button
            :label="$t('filterControls.actions.enableDebugLogging')"
            icon="pi pi-bug"
            severity="info"
            text
            @click="toggleDebugLogging"
            :class="{ 'p-button-outlined': !localFilterConfig.logFiltered }"
            data-testid="debug-logging-button"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import Card from 'primevue/card'
import ToggleButton from 'primevue/togglebutton'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import SelectButton from 'primevue/selectbutton'
import FloatLabel from 'primevue/floatlabel'
import Message from 'primevue/message'
import Tag from 'primevue/tag'

import { useFinancialDataStore } from '@/stores/financialData'
import { FilterPresets } from '@/utils/FilterPresets'
import type {
  AccountCodeFilterConfig,
  AccountCodeFilterRule,
  FilterResult,
} from '@/types/DataFilters'
import { DEFAULT_FILTER_CONFIG } from '@/types/DataFilters'

// Composables
const { t } = useI18n()
const toast = useToast()
const financialDataStore = useFinancialDataStore()

// Props
interface Props {
  /** Show advanced configuration options */
  showAdvanced?: boolean
  /** Compact mode for smaller spaces */
  compact?: boolean
}

withDefaults(defineProps<Props>(), {
  showAdvanced: true,
  compact: false,
})

// Emits
const emit = defineEmits<{
  filtersApplied: [config: AccountCodeFilterConfig]
  filtersReset: []
  configChanged: [config: AccountCodeFilterConfig]
}>()

// Local state
const localFilterConfig = ref<AccountCodeFilterConfig>({ ...DEFAULT_FILTER_CONFIG })
const lastFilterResult = ref<FilterResult | null>(null)

// Computed properties
const filterStats = computed(() => {
  const enabledRules = localFilterConfig.value.rules.filter((rule) => rule.enabled)
  const includeRules = enabledRules.filter((rule) => rule.action === 'include')
  const excludeRules = enabledRules.filter((rule) => rule.action === 'exclude')

  return {
    totalRules: localFilterConfig.value.rules.length,
    enabledRules: enabledRules.length,
    includeRules: includeRules.length,
    excludeRules: excludeRules.length,
    isActive: localFilterConfig.value.enabled && enabledRules.length > 0,
  }
})

const hasValidRules = computed(() => {
  return localFilterConfig.value.rules.some((rule) => rule.enabled && isValidPattern(rule))
})

const availablePresets = computed(() => {
  return FilterPresets.getAllPresets()
})

// Options for dropdowns
const patternTypeOptions = [
  { label: t('filterControls.patternTypes.startsWith'), value: 'startsWith' },
  { label: t('filterControls.patternTypes.endsWith'), value: 'endsWith' },
  { label: t('filterControls.patternTypes.contains'), value: 'contains' },
  { label: t('filterControls.patternTypes.exact'), value: 'exact' },
  { label: t('filterControls.patternTypes.regex'), value: 'regex' },
]

const actionOptions = [
  { label: t('filterControls.actions.include'), value: 'include' },
  { label: t('filterControls.actions.exclude'), value: 'exclude' },
]

const combineModeOptions = [
  { label: t('filterControls.combineMode.and'), value: 'AND' },
  { label: t('filterControls.combineMode.or'), value: 'OR' },
]

// Methods
const generateRuleId = (): string => {
  return `rule-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

const addNewRule = (): void => {
  const newRule: AccountCodeFilterRule = {
    id: generateRuleId(),
    name: t('filterControls.customRules.newRuleName'),
    description: '',
    type: 'startsWith',
    pattern: '',
    enabled: true,
    action: 'exclude',
  }

  localFilterConfig.value.rules.push(newRule)
  onConfigChange()
}

const removeRule = (ruleId: string): void => {
  const index = localFilterConfig.value.rules.findIndex((rule) => rule.id === ruleId)
  if (index >= 0) {
    localFilterConfig.value.rules.splice(index, 1)
    onConfigChange()

    toast.add({
      severity: 'info',
      summary: t('filterControls.messages.ruleRemoved'),
      life: 3000,
    })
  }
}

const onRuleToggle = (ruleId: string, enabled: boolean): void => {
  const rule = localFilterConfig.value.rules.find((r) => r.id === ruleId)
  if (rule) {
    rule.enabled = enabled
    onConfigChange()
  }
}

const onRuleChange = (): void => {
  onConfigChange()
}

const onFilterEnabledChange = (): void => {
  onConfigChange()

  if (localFilterConfig.value.enabled) {
    toast.add({
      severity: 'success',
      summary: t('filterControls.messages.filteringEnabled'),
      life: 3000,
    })
  } else {
    toast.add({
      severity: 'info',
      summary: t('filterControls.messages.filteringDisabled'),
      life: 3000,
    })
  }
}

const onConfigChange = (): void => {
  emit('configChanged', { ...localFilterConfig.value })
}

const isValidPattern = (rule: AccountCodeFilterRule): boolean => {
  if (!rule.pattern.trim()) {
    return false
  }

  if (rule.type === 'regex') {
    try {
      new RegExp(rule.pattern)
      return true
    } catch {
      return false
    }
  }

  return true
}

const getPatternValidationError = (rule: AccountCodeFilterRule): string => {
  if (!rule.pattern.trim()) {
    return t('filterControls.validation.patternRequired')
  }

  if (rule.type === 'regex') {
    try {
      new RegExp(rule.pattern)
    } catch (error) {
      return t('filterControls.validation.invalidRegex', {
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  return ''
}

const applyPreset = (preset: {
  id: string
  name: string
  description: string
  config: AccountCodeFilterConfig
}): void => {
  localFilterConfig.value = { ...preset.config }
  onConfigChange()

  toast.add({
    severity: 'success',
    summary: t('filterControls.messages.presetApplied'),
    detail: preset.name,
    life: 3000,
  })
}

const isPresetActive = (presetId: string): boolean => {
  const preset = FilterPresets.getPreset(presetId)
  if (!preset) return false

  // Simple comparison - check if current config matches preset
  return (
    localFilterConfig.value.enabled === preset.enabled &&
    localFilterConfig.value.combineMode === preset.combineMode &&
    localFilterConfig.value.rules.length === preset.rules.length &&
    localFilterConfig.value.rules.every((rule, index) => {
      const presetRule = preset.rules[index]
      return (
        presetRule &&
        rule.type === presetRule.type &&
        rule.pattern === presetRule.pattern &&
        rule.action === presetRule.action &&
        rule.enabled === presetRule.enabled
      )
    })
  )
}

const applyFilters = async (): Promise<void> => {
  try {
    // Update the store configuration
    financialDataStore.updateFilterConfig(localFilterConfig.value)

    // Reload datasets to apply the new filters
    await financialDataStore.loadDatasets()

    emit('filtersApplied', { ...localFilterConfig.value })

    toast.add({
      severity: 'success',
      summary: t('filterControls.messages.filtersApplied'),
      detail: t('filterControls.messages.dataReloaded'),
      life: 5000,
    })
  } catch (error) {
    console.error('Error applying filters:', error)
    toast.add({
      severity: 'error',
      summary: t('filterControls.messages.errorApplyingFilters'),
      detail: error instanceof Error ? error.message : 'Unknown error',
      life: 5000,
    })
  }
}

const resetFilters = (): void => {
  localFilterConfig.value = { ...DEFAULT_FILTER_CONFIG }
  financialDataStore.resetFilterConfig()
  lastFilterResult.value = null

  emit('filtersReset')
  onConfigChange()

  toast.add({
    severity: 'info',
    summary: t('filterControls.messages.filtersReset'),
    life: 3000,
  })
}

const toggleDebugLogging = (): void => {
  localFilterConfig.value.logFiltered = !localFilterConfig.value.logFiltered
  onConfigChange()

  toast.add({
    severity: 'info',
    summary: localFilterConfig.value.logFiltered
      ? t('filterControls.messages.debugLoggingEnabled')
      : t('filterControls.messages.debugLoggingDisabled'),
    life: 3000,
  })
}

// Initialize component
onMounted(() => {
  // Load current configuration from store
  localFilterConfig.value = { ...financialDataStore.filterConfig }
})

// Watch for store changes
watch(
  () => financialDataStore.filterConfig,
  (newConfig) => {
    localFilterConfig.value = { ...newConfig }
  },
  { deep: true },
)
</script>

<style scoped>
.filter-controls {
  max-width: 56rem;
  margin: 0 auto;
}

.filter-header {
  border-bottom: 1px solid var(--p-surface-200);
  padding-bottom: 1rem;
}

.filter-toggle-section {
  border: 1px solid var(--p-surface-200);
  border-radius: 0.5rem;
}

.rule-item {
  transition: all 0.2s ease;
}

.rule-item:hover {
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  border-color: var(--p-primary-200);
}

/* Custom styling for better visual hierarchy */
:deep(.p-card-title) {
  font-size: 1rem;
  font-weight: 600;
}

:deep(.p-card-content) {
  padding-top: 1rem;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .filter-controls {
    padding: 0 0.5rem;
  }

  .rule-item .grid {
    grid-template-columns: 1fr;
    gap: 0.5rem;
  }
}

/* Animation for rule addition/removal */
.rule-item {
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Highlight active preset buttons */
:deep(.p-button.p-button-primary) {
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

/* Custom toggle button styling */
:deep(.p-togglebutton) {
  transition: all 0.2s ease;
}

:deep(.p-togglebutton.p-togglebutton-checked) {
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
}
</style>
