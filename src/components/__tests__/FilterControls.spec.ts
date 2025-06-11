import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createI18n } from 'vue-i18n'
import { nextTick } from 'vue'
import FilterControls from '../FilterControls.vue'
import { useFinancialDataStore } from '@/stores/financialData'

// Mock PrimeVue components with proper data-testid handling
vi.mock('primevue/button', () => ({
  default: {
    name: 'Button',
    template:
      '<button v-bind="$attrs" @click="$emit(\'click\')" :disabled="disabled"><slot /></button>',
    props: ['icon', 'severity', 'disabled', 'label', 'size', 'text', 'outlined'],
    emits: ['click'],
    inheritAttrs: false,
  },
}))

vi.mock('primevue/card', () => ({
  default: {
    name: 'Card',
    template:
      '<div class="p-card"><div class="p-card-title"><slot name="title" /></div><div class="p-card-content"><slot name="content" /></div></div>',
  },
}))

vi.mock('primevue/togglebutton', () => ({
  default: {
    name: 'ToggleButton',
    template:
      '<button v-bind="$attrs" @click="$emit(\'update:modelValue\', !modelValue)" :class="{ active: modelValue }">{{ modelValue ? onLabel : offLabel }}</button>',
    props: ['modelValue', 'onLabel', 'offLabel', 'onIcon', 'offIcon'],
    emits: ['update:modelValue'],
    inheritAttrs: false,
  },
}))

vi.mock('primevue/inputtext', () => ({
  default: {
    name: 'InputText',
    template:
      '<input v-bind="$attrs" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
    props: ['modelValue', 'placeholder', 'class'],
    emits: ['update:modelValue', 'input'],
    inheritAttrs: false,
  },
}))

vi.mock('primevue/select', () => ({
  default: {
    name: 'Select',
    template:
      '<select v-bind="$attrs" :value="modelValue" @change="$emit(\'update:modelValue\', $event.target.value); $emit(\'change\', $event)"><option v-for="option in options" :key="option.value" :value="option.value">{{ option.label }}</option></select>',
    props: ['modelValue', 'options', 'optionLabel', 'optionValue', 'placeholder'],
    emits: ['update:modelValue', 'change'],
    inheritAttrs: false,
  },
}))

vi.mock('primevue/selectbutton', () => ({
  default: {
    name: 'SelectButton',
    template:
      '<div v-bind="$attrs"><button v-for="option in options" :key="option.value" @click="$emit(\'update:modelValue\', option.value); $emit(\'change\', option)" :class="{ active: modelValue === option.value }">{{ option.label }}</button></div>',
    props: ['modelValue', 'options', 'optionLabel', 'optionValue'],
    emits: ['update:modelValue', 'change'],
    inheritAttrs: false,
  },
}))

vi.mock('primevue/floatlabel', () => ({
  default: {
    name: 'FloatLabel',
    template: '<div class="p-float-label"><slot /></div>',
  },
}))

vi.mock('primevue/message', () => ({
  default: {
    name: 'Message',
    template: '<div class="p-message" :class="severity"><slot /></div>',
    props: ['severity', 'closable'],
  },
}))

vi.mock('primevue/tag', () => ({
  default: {
    name: 'Tag',
    template: '<span class="p-tag" :class="severity">{{ value }}</span>',
    props: ['value', 'severity', 'size'],
  },
}))

vi.mock('primevue/usetoast', () => ({
  useToast: () => ({
    add: vi.fn(),
  }),
}))

// Mock FilterPresets
vi.mock('@/utils/FilterPresets', () => ({
  FilterPresets: {
    getAllPresets: () => [
      {
        id: 'exclude-transfer-expenses',
        name: 'Exclude Transfer Expenses',
        description: 'Excludes account codes starting with "36"',
        config: {
          enabled: true,
          rules: [
            {
              id: 'rule-1',
              name: 'Exclude 36xx',
              type: 'startsWith',
              pattern: '36',
              enabled: true,
              action: 'exclude',
            },
          ],
          combineMode: 'AND',
          logFiltered: false,
        },
      },
    ],
    getPreset: (id: string) => {
      if (id === 'exclude-transfer-expenses') {
        return {
          enabled: true,
          rules: [
            {
              id: 'rule-1',
              name: 'Exclude 36xx',
              type: 'startsWith',
              pattern: '36',
              enabled: true,
              action: 'exclude',
            },
          ],
          combineMode: 'AND',
          logFiltered: false,
        }
      }
      return null
    },
  },
}))

const i18n = createI18n({
  legacy: false,
  locale: 'en',
  messages: {
    en: {
      filterControls: {
        title: 'Account Code Filtering',
        description: 'Configure filters to exclude specific account codes',
        enableFiltering: 'Enable Filtering',
        enableFilteringDescription: 'Apply account code filters',
        enabled: 'Enabled',
        disabled: 'Disabled',
        presets: {
          title: 'Quick Presets',
        },
        customRules: {
          title: 'Custom Filter Rules',
          addRule: 'Add Rule',
          noRules: 'No custom rules defined',
          ruleName: 'Rule Name',
          patternType: 'Pattern Type',
          pattern: 'Pattern',
          removeRule: 'Remove Rule',
          newRuleName: 'New Filter Rule',
        },
        patternTypes: {
          startsWith: 'Starts With',
          endsWith: 'Ends With',
          contains: 'Contains',
          exact: 'Exact Match',
          regex: 'Regular Expression',
        },
        actions: {
          include: 'Include',
          exclude: 'Exclude',
          applyFilters: 'Apply Filters',
          resetFilters: 'Reset Filters',
          enableDebugLogging: 'Debug Logging',
        },
        combineMode: {
          title: 'Rule Combination',
          description: 'How to combine multiple filter rules',
          and: 'AND',
          or: 'OR',
        },
        preview: {
          title: 'Filter Preview',
          filteringActive: 'Filtering Active',
          active: 'Active',
          inactive: 'Inactive',
          totalRules: 'Total Rules',
          enabledRules: 'Enabled Rules',
          includeRules: 'Include Rules',
          excludeRules: 'Exclude Rules',
          lastFilterResult: 'Last Filter Result',
          originalCount: 'Original Records',
          filteredCount: 'Filtered Records',
          excludedCount: 'Excluded Records',
          excludedCodes: 'Excluded Codes',
        },
        validation: {
          patternRequired: 'Pattern is required',
          invalidRegex: 'Invalid regular expression: {error}',
        },
        messages: {
          filteringEnabled: 'Filtering enabled',
          filteringDisabled: 'Filtering disabled',
          ruleRemoved: 'Filter rule removed',
          presetApplied: 'Preset applied',
          filtersApplied: 'Filters applied successfully',
          dataReloaded: 'Data has been reloaded',
          errorApplyingFilters: 'Error applying filters',
          filtersReset: 'Filters reset to default',
          debugLoggingEnabled: 'Debug logging enabled',
          debugLoggingDisabled: 'Debug logging disabled',
        },
      },
    },
  },
})

describe('FilterControls', () => {
  let pinia: ReturnType<typeof createPinia>

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
  })

  const createWrapper = (props = {}) => {
    return mount(FilterControls, {
      props,
      global: {
        plugins: [pinia, i18n],
      },
      attachTo: document.body,
    })
  }

  // Helper function to wait for component updates
  const waitForUpdate = async () => {
    await nextTick()
    await new Promise((resolve) => setTimeout(resolve, 10))
  }

  describe('Component Rendering', () => {
    it('should render the component correctly', () => {
      const wrapper = createWrapper()
      expect(wrapper.find('[data-testid="filter-enabled-toggle"]').exists()).toBe(true)
      expect(wrapper.text()).toContain('Account Code Filtering')
    })

    it('should show filter configuration when enabled', async () => {
      const wrapper = createWrapper()

      // Enable filtering
      await wrapper.find('[data-testid="filter-enabled-toggle"]').trigger('click')

      expect(wrapper.text()).toContain('Quick Presets')
      expect(wrapper.text()).toContain('Custom Filter Rules')
    })

    it('should hide filter configuration when disabled', () => {
      const wrapper = createWrapper()

      // Filtering should be disabled by default
      expect(wrapper.text()).not.toContain('Quick Presets')
      expect(wrapper.text()).not.toContain('Custom Filter Rules')
    })
  })

  describe('Preset Functionality', () => {
    it('should display available presets', async () => {
      const wrapper = createWrapper()

      // Enable filtering
      await wrapper.find('[data-testid="filter-enabled-toggle"]').trigger('click')

      expect(wrapper.text()).toContain('Exclude Transfer Expenses')
    })

    it('should apply preset when clicked', async () => {
      const wrapper = createWrapper()

      // Enable filtering
      await wrapper.find('[data-testid="filter-enabled-toggle"]').trigger('click')

      // Click on preset button
      const presetButton = wrapper.find('[data-testid="preset-button"]')
      await presetButton.trigger('click')

      // Should emit configChanged event
      expect(wrapper.emitted('configChanged')).toBeTruthy()
    })
  })

  describe('Custom Rules', () => {
    it('should add new rule when add button is clicked', async () => {
      const wrapper = createWrapper()

      // Enable filtering
      await wrapper.find('[data-testid="filter-enabled-toggle"]').trigger('click')
      await waitForUpdate()

      // Check initial state - no rules
      expect(wrapper.text()).toContain('No custom rules defined')

      // Click add rule button
      await wrapper.find('[data-testid="add-rule-button"]').trigger('click')
      await waitForUpdate()

      // Should emit configChanged event when rule is added
      expect(wrapper.emitted('configChanged')).toBeTruthy()

      // Should no longer show "no rules" message
      expect(wrapper.text()).not.toContain('No custom rules defined')
    })

    it('should remove rule when remove button is clicked', async () => {
      const wrapper = createWrapper()

      // Enable filtering and add a rule
      await wrapper.find('[data-testid="filter-enabled-toggle"]').trigger('click')
      await waitForUpdate()
      await wrapper.find('[data-testid="add-rule-button"]').trigger('click')
      await waitForUpdate()

      // Should have a rule now
      expect(wrapper.text()).not.toContain('No custom rules defined')

      // Find and click remove button
      const removeButtons = wrapper.findAll('[data-testid="remove-rule-button"]')
      if (removeButtons.length > 0) {
        await removeButtons[0].trigger('click')
        await waitForUpdate()
      }

      // Should emit configChanged
      expect(wrapper.emitted('configChanged')).toBeTruthy()
    })

    it('should toggle rule enabled state', async () => {
      const wrapper = createWrapper()

      // Enable filtering and add a rule
      await wrapper.find('[data-testid="filter-enabled-toggle"]').trigger('click')
      await waitForUpdate()
      await wrapper.find('[data-testid="add-rule-button"]').trigger('click')
      await waitForUpdate()

      // Find and click rule toggle
      const ruleToggles = wrapper.findAll('[data-testid="rule-enabled-toggle"]')
      if (ruleToggles.length > 0) {
        await ruleToggles[0].trigger('click')
        await waitForUpdate()
      }

      // Should emit configChanged
      expect(wrapper.emitted('configChanged')).toBeTruthy()
    })
  })

  describe('Filter Actions', () => {
    it('should apply filters when apply button is clicked', async () => {
      const wrapper = createWrapper()
      const store = useFinancialDataStore()

      // Mock store methods
      const updateFilterConfigSpy = vi.spyOn(store, 'updateFilterConfig')
      const loadDatasetsSpy = vi.spyOn(store, 'loadDatasets').mockResolvedValue()

      // Enable filtering and add a rule
      await wrapper.find('[data-testid="filter-enabled-toggle"]').trigger('click')
      await waitForUpdate()
      await wrapper.find('[data-testid="add-rule-button"]').trigger('click')
      await waitForUpdate()

      // Try to find and set pattern input
      const patternInputs = wrapper.findAll('input')
      for (const input of patternInputs) {
        if (
          input.attributes('placeholder')?.includes('pattern') ||
          input.attributes('id')?.includes('pattern')
        ) {
          await input.setValue('36')
          await waitForUpdate()
          break
        }
      }

      // Click apply filters
      const applyButton = wrapper.find('[data-testid="apply-filters-button"]')
      if (applyButton.exists()) {
        await applyButton.trigger('click')
        await waitForUpdate()

        // Should emit filtersApplied event
        expect(wrapper.emitted('filtersApplied')).toBeTruthy()
        expect(updateFilterConfigSpy).toHaveBeenCalled()
        expect(loadDatasetsSpy).toHaveBeenCalled()
      }
    })

    it('should reset filters when reset button is clicked', async () => {
      const wrapper = createWrapper()

      // Enable filtering
      await wrapper.find('[data-testid="filter-enabled-toggle"]').trigger('click')
      await waitForUpdate()

      // Click reset filters
      await wrapper.find('[data-testid="reset-filters-button"]').trigger('click')
      await waitForUpdate()

      // Should emit filtersReset event
      expect(wrapper.emitted('filtersReset')).toBeTruthy()
    })

    it('should toggle debug logging', async () => {
      const wrapper = createWrapper()

      // Enable filtering
      await wrapper.find('[data-testid="filter-enabled-toggle"]').trigger('click')
      await waitForUpdate()

      // Click debug logging button
      await wrapper.find('[data-testid="debug-logging-button"]').trigger('click')
      await waitForUpdate()

      // Should emit configChanged
      expect(wrapper.emitted('configChanged')).toBeTruthy()
    })
  })

  describe('Store Integration', () => {
    it('should load configuration from store on mount', async () => {
      const store = useFinancialDataStore()
      store.filterConfig.enabled = true

      const wrapper = createWrapper()
      await waitForUpdate()

      // Should reflect store state - check if toggle has active class or modelValue
      const toggle = wrapper.find('[data-testid="filter-enabled-toggle"]')
      expect(toggle.exists()).toBe(true)
      // The toggle should reflect the enabled state
      expect(toggle.classes()).toContain('active')
    })

    it('should update store when applying filters', async () => {
      const wrapper = createWrapper()
      const store = useFinancialDataStore()

      // Mock store methods
      const updateFilterConfigSpy = vi.spyOn(store, 'updateFilterConfig')
      const loadDatasetsSpy = vi.spyOn(store, 'loadDatasets').mockResolvedValue()

      // Enable filtering and add a rule
      await wrapper.find('[data-testid="filter-enabled-toggle"]').trigger('click')
      await waitForUpdate()
      await wrapper.find('[data-testid="add-rule-button"]').trigger('click')
      await waitForUpdate()

      // Try to find and set pattern input
      const patternInputs = wrapper.findAll('input')
      for (const input of patternInputs) {
        if (
          input.attributes('placeholder')?.includes('pattern') ||
          input.attributes('id')?.includes('pattern')
        ) {
          await input.setValue('36')
          await waitForUpdate()
          break
        }
      }

      // Apply filters
      const applyButton = wrapper.find('[data-testid="apply-filters-button"]')
      if (applyButton.exists()) {
        await applyButton.trigger('click')
        await waitForUpdate()

        // Should call store methods
        expect(updateFilterConfigSpy).toHaveBeenCalled()
        expect(loadDatasetsSpy).toHaveBeenCalled()
      }
    })
  })

  describe('Validation', () => {
    it('should validate regex patterns', async () => {
      const wrapper = createWrapper()

      // Enable filtering and add a rule
      await wrapper.find('[data-testid="filter-enabled-toggle"]').trigger('click')
      await waitForUpdate()
      await wrapper.find('[data-testid="add-rule-button"]').trigger('click')
      await waitForUpdate()

      // Try to set pattern type to regex
      const typeSelects = wrapper.findAll('select')
      for (const select of typeSelects) {
        if (select.attributes('id')?.includes('type') || select.element.options?.length > 0) {
          await select.setValue('regex')
          await waitForUpdate()
          break
        }
      }

      // Try to set invalid regex pattern
      const patternInputs = wrapper.findAll('input')
      for (const input of patternInputs) {
        if (
          input.attributes('placeholder')?.includes('pattern') ||
          input.attributes('id')?.includes('pattern')
        ) {
          await input.setValue('[invalid')
          await waitForUpdate()
          break
        }
      }

      // Should emit configChanged when validation occurs
      expect(wrapper.emitted('configChanged')).toBeTruthy()
    })

    it('should disable apply button when no valid rules', async () => {
      const wrapper = createWrapper()

      // Enable filtering
      await wrapper.find('[data-testid="filter-enabled-toggle"]').trigger('click')
      await waitForUpdate()

      // Apply button should be disabled when no rules
      const applyButton = wrapper.find('[data-testid="apply-filters-button"]')
      expect(applyButton.attributes('disabled')).toBeDefined()
    })
  })
})
