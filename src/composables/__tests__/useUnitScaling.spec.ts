/**
 * Tests for useUnitScaling composable
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ref, nextTick } from 'vue'
import { useUnitScaling, useSimpleUnitScaling, useConfigurableUnitScaling } from '../useUnitScaling'

// Mock vue-i18n
const mockLocale = ref('en')
vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    locale: mockLocale,
  }),
}))

describe('useUnitScaling', () => {
  beforeEach(() => {
    mockLocale.value = 'en'
  })

  describe('basic functionality', () => {
    it('should initialize with default configuration', () => {
      const { config, isEnabled } = useUnitScaling()

      expect(config.value.threshold).toBe(1000)
      expect(config.value.precision).toBe(1)
      expect(config.value.useAbbreviated).toBe(true)
      expect(isEnabled.value).toBe(true)
    })

    it('should initialize with custom configuration', () => {
      const { config } = useUnitScaling({
        config: {
          threshold: 500,
          precision: 2,
          useAbbreviated: false,
        },
      })

      expect(config.value.threshold).toBe(500)
      expect(config.value.precision).toBe(2)
      expect(config.value.useAbbreviated).toBe(false)
    })

    it('should format numbers correctly', () => {
      const { formatNumber } = useUnitScaling()
      
      const result1 = formatNumber(999)
      expect(result1.formatted).toBe('999')
      expect(result1.unit).toBe('')
      
      const result2 = formatNumber(1500)
      expect(result2.formatted).toBe('1.5K')
      expect(result2.unit).toBe('K')
    })

    it('should format currency correctly', () => {
      const { formatCurrency } = useUnitScaling()
      
      const result = formatCurrency(1500, 'CHF')
      expect(result.formatted).toMatch(/CHF.*1\.5K|1\.5K.*CHF/)
    })
  })

  describe('configuration updates', () => {
    it('should update configuration reactively', async () => {
      // Force English locale for consistent test results
      mockLocale.value = 'en'
      const { config, updateConfig, formatNumber } = useUnitScaling()

      // Initial format
      const result1 = formatNumber(1500)
      expect(result1.formatted).toBe('1.5K')

      // Update to use full names
      updateConfig({ useAbbreviated: false })
      expect(config.value.useAbbreviated).toBe(false)

      // Wait for reactivity to take effect
      await nextTick()

      // Format should now use full names
      const result2 = formatNumber(1500)
      expect(result2.formatted).toBe('1.5Thousand')
    })

    it('should update threshold and affect formatting', async () => {
      // Force English locale for consistent test results
      mockLocale.value = 'en'
      const { updateConfig, formatNumber } = useUnitScaling()

      // Set high threshold
      updateConfig({ threshold: 10000 })

      // Wait for reactivity to take effect
      await nextTick()

      const result = formatNumber(1500)
      expect(result.formatted).toBe('1,500') // Should not scale
      expect(result.unit).toBe('')
    })
  })

  describe('locale reactivity', () => {
    it('should use current locale by default', () => {
      const { currentLocale } = useUnitScaling()

      expect(currentLocale.value).toBe('en')

      mockLocale.value = 'de'
      expect(currentLocale.value).toBe('de')
    })

    it('should use forced locale when specified', () => {
      const { currentLocale } = useUnitScaling({
        config: { forceLocale: 'fr' },
      })

      expect(currentLocale.value).toBe('fr')

      // Should not change when global locale changes
      mockLocale.value = 'de'
      expect(currentLocale.value).toBe('fr')
    })

    it('should disable reactive locale when specified', () => {
      const { currentLocale } = useUnitScaling({
        reactiveLocale: false,
        config: { forceLocale: 'it' },
      })

      expect(currentLocale.value).toBe('it')
    })
  })

  describe('scaling units management', () => {
    it('should provide access to scaling units', () => {
      const { scalingUnits } = useUnitScaling()

      expect(scalingUnits.value.length).toBeGreaterThan(0)
      expect(scalingUnits.value[0]).toHaveProperty('factor')
      expect(scalingUnits.value[0]).toHaveProperty('abbreviated')
      expect(scalingUnits.value[0]).toHaveProperty('full')
    })

    it('should allow updating scaling units', () => {
      const { scalingUnits, updateScalingUnits } = useUnitScaling()

      const originalLength = scalingUnits.value.length

      const customUnits = [
        {
          factor: 100,
          abbreviated: { de: 'H', en: 'H', fr: 'C', it: 'C' },
          full: { de: 'Hundert', en: 'Hundred', fr: 'Cent', it: 'Cento' },
        },
      ]

      updateScalingUnits(customUnits)

      expect(scalingUnits.value.length).toBe(1)
      expect(scalingUnits.value[0].factor).toBe(100)
    })
  })
})

describe('useSimpleUnitScaling', () => {
  it('should provide simple formatting functions', () => {
    const { formatNumber, formatCurrency } = useSimpleUnitScaling()
    
    expect(typeof formatNumber).toBe('function')
    expect(typeof formatCurrency).toBe('function')
    
    const numberResult = formatNumber(1500)
    expect(numberResult).toBe('1.5K')
    
    const currencyResult = formatCurrency(1500, 'CHF')
    expect(currencyResult).toMatch(/CHF.*1\.5K|1\.5K.*CHF/)
  })

  it('should react to locale changes', () => {
    const { formatNumber } = useSimpleUnitScaling()
    
    mockLocale.value = 'en'
    const resultEn = formatNumber(1500)
    expect(resultEn).toBe('1.5K')
    
    mockLocale.value = 'de'
    const resultDe = formatNumber(1500)
    expect(resultDe).toBe('1,5T') // German uses comma as decimal separator and 'T' for thousand
  })
})

describe('useConfigurableUnitScaling', () => {
  it('should provide user preferences', () => {
    const { userPreferences } = useConfigurableUnitScaling()

    expect(userPreferences.value.enableScaling).toBe(true)
    expect(userPreferences.value.preferAbbreviated).toBe(true)
    expect(userPreferences.value.customThreshold).toBe(1000)
    expect(userPreferences.value.customPrecision).toBe(1)
  })

  it('should toggle scaling on/off', async () => {
    // Force English locale for consistent test results
    mockLocale.value = 'en'
    const { userPreferences, toggleScaling, formatNumber } = useConfigurableUnitScaling()

    // Initially enabled
    expect(userPreferences.value.enableScaling).toBe(true)
    let result = formatNumber(1500)
    expect(result.formatted).toBe('1.5K')

    // Toggle off
    toggleScaling()
    expect(userPreferences.value.enableScaling).toBe(false)
    await nextTick()
    result = formatNumber(1500)
    expect(result.formatted).toBe('1,500') // Should not scale

    // Toggle back on
    toggleScaling()
    expect(userPreferences.value.enableScaling).toBe(true)
    await nextTick()
    result = formatNumber(1500)
    expect(result.formatted).toBe('1.5K')
  })

  it('should toggle abbreviation mode', async () => {
    // Force English locale for consistent test results
    mockLocale.value = 'en'
    const { userPreferences, toggleAbbreviation, formatNumber } = useConfigurableUnitScaling()

    // Initially abbreviated
    expect(userPreferences.value.preferAbbreviated).toBe(true)
    let result = formatNumber(1500)
    expect(result.formatted).toBe('1.5K')

    // Toggle to full names
    toggleAbbreviation()
    expect(userPreferences.value.preferAbbreviated).toBe(false)
    await nextTick()
    result = formatNumber(1500)
    expect(result.formatted).toBe('1.5Thousand')

    // Toggle back to abbreviated
    toggleAbbreviation()
    expect(userPreferences.value.preferAbbreviated).toBe(true)
    await nextTick()
    result = formatNumber(1500)
    expect(result.formatted).toBe('1.5K')
  })

  it('should set custom threshold', async () => {
    // Force English locale for consistent test results
    mockLocale.value = 'en'
    const { userPreferences, setThreshold, formatNumber } = useConfigurableUnitScaling()

    // Set higher threshold
    setThreshold(5000)
    expect(userPreferences.value.customThreshold).toBe(5000)

    await nextTick()
    const result = formatNumber(1500)
    expect(result.formatted).toBe('1,500') // Should not scale
  })

  it('should set custom precision', async () => {
    // Force English locale for consistent test results
    mockLocale.value = 'en'
    const { userPreferences, setPrecision, formatNumber } = useConfigurableUnitScaling()

    // Set precision to 0
    setPrecision(0)
    expect(userPreferences.value.customPrecision).toBe(0)

    await nextTick()
    const result = formatNumber(1567)
    expect(result.formatted).toBe('2K') // Should round to nearest
  })

  it('should validate threshold bounds', () => {
    const { userPreferences, setThreshold } = useConfigurableUnitScaling()

    // Negative threshold should be set to 0
    setThreshold(-100)
    expect(userPreferences.value.customThreshold).toBe(0)
  })

  it('should validate precision bounds', () => {
    const { userPreferences, setPrecision } = useConfigurableUnitScaling()

    // Negative precision should be set to 0
    setPrecision(-1)
    expect(userPreferences.value.customPrecision).toBe(0)

    // Precision above 10 should be clamped to 10
    setPrecision(15)
    expect(userPreferences.value.customPrecision).toBe(10)
  })
})
