/**
 * Tests for UnitScalingFormatter utility
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  UnitScalingFormatter,
  formatWithUnits,
  formatCurrencyWithUnits,
  DEFAULT_CONFIG,
  DEFAULT_SCALING_UNITS,
  type UnitScalingConfig,
} from '../UnitScalingFormatter'

describe('UnitScalingFormatter', () => {
  let formatter: UnitScalingFormatter

  beforeEach(() => {
    formatter = new UnitScalingFormatter()
  })

  describe('constructor', () => {
    it('should use default configuration when no config provided', () => {
      const config = formatter.getConfig()
      expect(config).toEqual(DEFAULT_CONFIG)
    })

    it('should merge provided config with defaults', () => {
      const customConfig: Partial<UnitScalingConfig> = {
        threshold: 500,
        precision: 2,
      }
      const customFormatter = new UnitScalingFormatter(customConfig)
      const config = customFormatter.getConfig()
      
      expect(config.threshold).toBe(500)
      expect(config.precision).toBe(2)
      expect(config.useAbbreviated).toBe(DEFAULT_CONFIG.useAbbreviated)
    })

    it('should use custom scaling units when provided', () => {
      const customUnits = [
        {
          factor: 1000,
          abbreviated: { de: 'K', en: 'K', fr: 'k', it: 'k' },
          full: { de: 'Tausend', en: 'Thousand', fr: 'Millier', it: 'Migliaio' },
        },
      ]
      const customFormatter = new UnitScalingFormatter({}, customUnits)
      const units = customFormatter.getScalingUnits()
      
      expect(units).toEqual(customUnits)
    })
  })

  describe('format method', () => {
    it('should not scale values below threshold', () => {
      const result = formatter.format(999, 'en')
      
      expect(result.value).toBe(999)
      expect(result.unit).toBe('')
      expect(result.formatted).toBe('999')
      expect(result.scalingFactor).toBe(1)
      expect(result.original).toBe(999)
    })

    it('should scale thousands correctly', () => {
      const result = formatter.format(1500, 'en')
      
      expect(result.value).toBe(1.5)
      expect(result.unit).toBe('K')
      expect(result.formatted).toBe('1.5K')
      expect(result.scalingFactor).toBe(1000)
      expect(result.original).toBe(1500)
    })

    it('should scale millions correctly', () => {
      const result = formatter.format(2500000, 'en')
      
      expect(result.value).toBe(2.5)
      expect(result.unit).toBe('M')
      expect(result.formatted).toBe('2.5M')
      expect(result.scalingFactor).toBe(1000000)
      expect(result.original).toBe(2500000)
    })

    it('should scale billions correctly', () => {
      const result = formatter.format(3500000000, 'en')
      
      expect(result.value).toBe(3.5)
      expect(result.unit).toBe('B')
      expect(result.formatted).toBe('3.5B')
      expect(result.scalingFactor).toBe(1000000000)
      expect(result.original).toBe(3500000000)
    })

    it('should handle negative values correctly', () => {
      const result = formatter.format(-1500, 'en')
      
      expect(result.value).toBe(-1.5)
      expect(result.unit).toBe('K')
      expect(result.formatted).toBe('-1.5K')
      expect(result.scalingFactor).toBe(1000)
      expect(result.original).toBe(-1500)
    })

    it('should use full unit names when configured', () => {
      formatter.updateConfig({ useAbbreviated: false })
      const result = formatter.format(1500, 'en')
      
      expect(result.unit).toBe('Thousand')
      expect(result.formatted).toBe('1.5Thousand')
    })

    it('should respect precision setting', () => {
      formatter.updateConfig({ precision: 0 })
      const result = formatter.format(1567, 'en')
      
      expect(result.formatted).toBe('2K')
    })

    it('should handle different locales correctly', () => {
      const resultEn = formatter.format(1500, 'en')
      const resultDe = formatter.format(1500, 'de')
      const resultFr = formatter.format(1500, 'fr')
      
      expect(resultEn.unit).toBe('K')
      expect(resultDe.unit).toBe('T')
      expect(resultFr.unit).toBe('k')
    })
  })

  describe('formatCurrency method', () => {
    it('should format currency with scaling', () => {
      const result = formatter.formatCurrency(1500, 'en', 'CHF')
      
      expect(result.formatted).toMatch(/CHF.*1\.5K|1\.5K.*CHF/)
    })

    it('should format currency without scaling for small values', () => {
      const result = formatter.formatCurrency(999, 'en', 'CHF')
      
      expect(result.formatted).toMatch(/CHF.*999|999.*CHF/)
      expect(result.unit).toBe('')
    })

    it('should handle different currencies', () => {
      const result = formatter.formatCurrency(1500, 'en', 'USD')
      
      expect(result.formatted).toMatch(/USD|\$/)
    })
  })

  describe('configuration methods', () => {
    it('should update configuration correctly', () => {
      const newConfig: Partial<UnitScalingConfig> = {
        threshold: 2000,
        precision: 3,
        useAbbreviated: false,
      }
      
      formatter.updateConfig(newConfig)
      const config = formatter.getConfig()
      
      expect(config.threshold).toBe(2000)
      expect(config.precision).toBe(3)
      expect(config.useAbbreviated).toBe(false)
    })

    it('should update scaling units correctly', () => {
      const newUnits = [
        {
          factor: 100,
          abbreviated: { de: 'H', en: 'H', fr: 'C', it: 'C' },
          full: { de: 'Hundert', en: 'Hundred', fr: 'Cent', it: 'Cento' },
        },
      ]
      
      formatter.updateScalingUnits(newUnits)
      const units = formatter.getScalingUnits()
      
      expect(units).toEqual(newUnits)
    })
  })

  describe('edge cases', () => {
    it('should handle zero values', () => {
      const result = formatter.format(0, 'en')
      
      expect(result.value).toBe(0)
      expect(result.unit).toBe('')
      expect(result.formatted).toBe('0')
    })

    it('should handle very large numbers', () => {
      const result = formatter.format(1500000000000, 'en')
      
      expect(result.value).toBe(1.5)
      expect(result.unit).toBe('T')
      expect(result.formatted).toBe('1.5T')
    })

    it('should handle numbers exactly at threshold', () => {
      const result = formatter.format(1000, 'en')
      
      expect(result.value).toBe(1)
      expect(result.unit).toBe('K')
      expect(result.formatted).toBe('1K')
    })

    it('should handle invalid locale gracefully', () => {
      const result = formatter.format(1500, 'invalid-locale')
      
      expect(result.unit).toBe('K') // Should fallback to English
      expect(result.formatted).toBe('1.5K')
    })
  })
})

describe('convenience functions', () => {
  describe('formatWithUnits', () => {
    it('should format with default configuration', () => {
      const result = formatWithUnits(1500, 'en')
      
      expect(result.formatted).toBe('1.5K')
    })

    it('should format with custom configuration', () => {
      const result = formatWithUnits(1500, 'en', { useAbbreviated: false })
      
      expect(result.formatted).toBe('1.5Thousand')
    })
  })

  describe('formatCurrencyWithUnits', () => {
    it('should format currency with default configuration', () => {
      const result = formatCurrencyWithUnits(1500, 'en', 'CHF')
      
      expect(result.formatted).toMatch(/CHF.*1\.5K|1\.5K.*CHF/)
    })

    it('should format currency with custom configuration', () => {
      const result = formatCurrencyWithUnits(1500, 'en', 'CHF', { precision: 0 })
      
      expect(result.formatted).toMatch(/CHF.*2K|2K.*CHF/)
    })
  })
})

describe('DEFAULT_SCALING_UNITS', () => {
  it('should be ordered from largest to smallest', () => {
    for (let i = 0; i < DEFAULT_SCALING_UNITS.length - 1; i++) {
      expect(DEFAULT_SCALING_UNITS[i].factor).toBeGreaterThan(DEFAULT_SCALING_UNITS[i + 1].factor)
    }
  })

  it('should have all required properties', () => {
    DEFAULT_SCALING_UNITS.forEach((unit) => {
      expect(unit).toHaveProperty('factor')
      expect(unit).toHaveProperty('abbreviated')
      expect(unit).toHaveProperty('full')
      
      expect(typeof unit.factor).toBe('number')
      expect(unit.factor).toBeGreaterThan(0)
      
      // Check all required locales
      const locales = ['de', 'en', 'fr', 'it']
      locales.forEach((locale) => {
        expect(unit.abbreviated).toHaveProperty(locale)
        expect(unit.full).toHaveProperty(locale)
        expect(typeof unit.abbreviated[locale as keyof typeof unit.abbreviated]).toBe('string')
        expect(typeof unit.full[locale as keyof typeof unit.full]).toBe('string')
      })
    })
  })
})
