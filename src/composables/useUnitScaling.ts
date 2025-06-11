/**
 * Vue Composable for Unit Scaling
 * 
 * Provides reactive unit scaling functionality with i18n integration
 */

import { computed, ref, watch, readonly, type Ref } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  UnitScalingFormatter,
  type UnitScalingConfig,
  type FormattedNumber,
  type ScalingUnit,
  DEFAULT_CONFIG
} from '@/utils/UnitScalingFormatter'

export interface UseUnitScalingOptions {
  /** Initial configuration for the formatter */
  config?: Partial<UnitScalingConfig>
  /** Custom scaling units */
  customUnits?: ScalingUnit[]
  /** Whether to automatically update when locale changes */
  reactiveLocale?: boolean
}

export interface UseUnitScalingReturn {
  /** Format a number with unit scaling */
  formatNumber: (value: number) => FormattedNumber
  /** Format a currency value with unit scaling */
  formatCurrency: (value: number, currency?: string) => FormattedNumber
  /** Current formatter configuration */
  config: Readonly<Ref<UnitScalingConfig>>
  /** Update the formatter configuration */
  updateConfig: (newConfig: Partial<UnitScalingConfig>) => void
  /** Current locale being used */
  currentLocale: Readonly<Ref<string>>
  /** Whether unit scaling is enabled (based on threshold) */
  isEnabled: Readonly<Ref<boolean>>
  /** Available scaling units */
  scalingUnits: Readonly<Ref<readonly ScalingUnit[]>>
  /** Update scaling units */
  updateScalingUnits: (units: ScalingUnit[]) => void
}

/**
 * Composable for unit scaling functionality
 */
export function useUnitScaling(options: UseUnitScalingOptions = {}): UseUnitScalingReturn {
  const { locale } = useI18n()
  
  // Reactive configuration
  const config = ref<UnitScalingConfig>({
    ...DEFAULT_CONFIG,
    ...options.config,
  })

  // Create formatter instance
  const formatter = ref(new UnitScalingFormatter(config.value, options.customUnits))

  // Current locale (reactive or static)
  const currentLocale = computed(() => {
    if (config.value.forceLocale) {
      return config.value.forceLocale
    }
    return options.reactiveLocale !== false ? locale.value : locale.value
  })

  // Whether scaling is enabled
  const isEnabled = computed(() => config.value.threshold > 0)

  // Available scaling units
  const scalingUnits = computed(() => formatter.value.getScalingUnits())

  // Watch for locale changes and update formatter if reactive
  if (options.reactiveLocale !== false) {
    watch(locale, () => {
      // Formatter will use the new locale automatically
    })
  }

  // Watch for config changes and update formatter
  watch(config, (newConfig) => {
    formatter.value.updateConfig(newConfig)
  }, { deep: true, immediate: true })

  /**
   * Format a number with current settings
   */
  const formatNumber = (value: number): FormattedNumber => {
    return formatter.value.format(value, currentLocale.value)
  }

  /**
   * Format a currency value with current settings
   */
  const formatCurrency = (value: number, currency: string = 'CHF'): FormattedNumber => {
    return formatter.value.formatCurrency(value, currentLocale.value, currency)
  }

  /**
   * Update configuration
   */
  const updateConfig = (newConfig: Partial<UnitScalingConfig>): void => {
    config.value = { ...config.value, ...newConfig }
  }

  /**
   * Update scaling units
   */
  const updateScalingUnits = (units: ScalingUnit[]): void => {
    formatter.value.updateScalingUnits(units)
  }

  return {
    formatNumber,
    formatCurrency,
    config: readonly(config),
    updateConfig,
    currentLocale: readonly(currentLocale),
    isEnabled: readonly(isEnabled),
    scalingUnits: readonly(scalingUnits),
    updateScalingUnits,
  }
}

/**
 * Composable for simple number formatting with unit scaling
 * Uses default configuration and reactive locale
 */
export function useSimpleUnitScaling() {
  const { locale } = useI18n()
  const formatter = new UnitScalingFormatter()

  const formatNumber = (value: number): string => {
    const result = formatter.format(value, locale.value)
    return result.formatted
  }

  const formatCurrency = (value: number, currency: string = 'CHF'): string => {
    const result = formatter.formatCurrency(value, locale.value, currency)
    return result.formatted
  }

  return {
    formatNumber,
    formatCurrency,
  }
}

/**
 * Composable for configurable unit scaling with user preferences
 */
export function useConfigurableUnitScaling() {
  const unitScaling = useUnitScaling({
    reactiveLocale: true,
  })

  // Additional user preference state
  const userPreferences = ref({
    enableScaling: true,
    preferAbbreviated: true,
    customThreshold: 1000,
    customPrecision: 1,
  })

  // Watch user preferences and update config
  watch(userPreferences, (prefs) => {
    unitScaling.updateConfig({
      threshold: prefs.enableScaling ? prefs.customThreshold : Infinity,
      useAbbreviated: prefs.preferAbbreviated,
      precision: prefs.customPrecision,
    })
  }, { deep: true, immediate: true })

  /**
   * Toggle unit scaling on/off
   */
  const toggleScaling = (): void => {
    userPreferences.value.enableScaling = !userPreferences.value.enableScaling
  }

  /**
   * Toggle between abbreviated and full unit names
   */
  const toggleAbbreviation = (): void => {
    userPreferences.value.preferAbbreviated = !userPreferences.value.preferAbbreviated
  }

  /**
   * Set custom threshold for scaling
   */
  const setThreshold = (threshold: number): void => {
    userPreferences.value.customThreshold = Math.max(0, threshold)
  }

  /**
   * Set precision for scaled numbers
   */
  const setPrecision = (precision: number): void => {
    userPreferences.value.customPrecision = Math.max(0, Math.min(10, precision))
  }

  return {
    ...unitScaling,
    userPreferences: readonly(userPreferences),
    toggleScaling,
    toggleAbbreviation,
    setThreshold,
    setPrecision,
  }
}


