/**
 * Unit Scaling Formatter Utility
 * 
 * Provides centralized, configurable system for formatting numbers with unit scaling
 * Supports multiple languages and various scaling factors (K, M, B, T, etc.)
 */

import type { MultiLanguageLabels } from '@/types/DataStructures'

export interface UnitScalingConfig {
  /** Minimum value to apply scaling (default: 1000) */
  threshold: number
  /** Maximum decimal places to show (default: 1) */
  precision: number
  /** Use abbreviated units (K, M, B) vs full names (thousand, million, billion) */
  useAbbreviated: boolean
  /** Force specific locale instead of using current i18n locale */
  forceLocale?: string
}

export interface ScalingUnit {
  /** Scaling factor (e.g., 1000, 1000000) */
  factor: number
  /** Abbreviated unit labels (K, M, B, etc.) */
  abbreviated: MultiLanguageLabels
  /** Full unit labels (thousand, million, billion, etc.) */
  full: MultiLanguageLabels
}

export interface FormattedNumber {
  /** The scaled numeric value */
  value: number
  /** The unit label in the requested language */
  unit: string
  /** The complete formatted string */
  formatted: string
  /** The original unscaled value */
  original: number
  /** The scaling factor that was applied */
  scalingFactor: number
}

/**
 * Default scaling units configuration
 * Ordered from largest to smallest for proper scaling detection
 */
export const DEFAULT_SCALING_UNITS: ScalingUnit[] = [
  {
    factor: 1_000_000_000_000, // Trillion
    abbreviated: {
      de: 'T',
      en: 'T',
      fr: 'T',
      it: 'T',
    },
    full: {
      de: 'Billion',
      en: 'Trillion',
      fr: 'Billion',
      it: 'Trilione',
    },
  },
  {
    factor: 1_000_000_000, // Billion
    abbreviated: {
      de: 'Mrd',
      en: 'B',
      fr: 'Md',
      it: 'Mrd',
    },
    full: {
      de: 'Milliarde',
      en: 'Billion',
      fr: 'Milliard',
      it: 'Miliardo',
    },
  },
  {
    factor: 1_000_000, // Million
    abbreviated: {
      de: 'Mio',
      en: 'M',
      fr: 'M',
      it: 'Mln',
    },
    full: {
      de: 'Million',
      en: 'Million',
      fr: 'Million',
      it: 'Milione',
    },
  },
  {
    factor: 1_000, // Thousand
    abbreviated: {
      de: 'T',
      en: 'K',
      fr: 'k',
      it: 'k',
    },
    full: {
      de: 'Tausend',
      en: 'Thousand',
      fr: 'Millier',
      it: 'Migliaio',
    },
  },
]

/**
 * Default configuration for unit scaling
 */
export const DEFAULT_CONFIG: UnitScalingConfig = {
  threshold: 1000,
  precision: 1,
  useAbbreviated: true,
}

/**
 * UnitScalingFormatter class
 * Handles formatting numbers with appropriate unit scaling
 */
export class UnitScalingFormatter {
  private config: UnitScalingConfig
  private scalingUnits: ScalingUnit[]

  constructor(config: Partial<UnitScalingConfig> = {}, customUnits?: ScalingUnit[]) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.scalingUnits = customUnits || DEFAULT_SCALING_UNITS
  }

  /**
   * Format a number with appropriate unit scaling
   */
  format(value: number, locale: string = 'en'): FormattedNumber {
    const absValue = Math.abs(value)
    
    // If below threshold, return without scaling
    if (absValue < this.config.threshold) {
      return {
        value,
        unit: '',
        formatted: this.formatNumber(value, locale),
        original: value,
        scalingFactor: 1,
      }
    }

    // Find appropriate scaling unit
    const scalingUnit = this.findScalingUnit(absValue)
    if (!scalingUnit) {
      return {
        value,
        unit: '',
        formatted: this.formatNumber(value, locale),
        original: value,
        scalingFactor: 1,
      }
    }

    const scaledValue = value / scalingUnit.factor
    const unitLabel = this.config.useAbbreviated 
      ? scalingUnit.abbreviated[locale as keyof MultiLanguageLabels] || scalingUnit.abbreviated.en
      : scalingUnit.full[locale as keyof MultiLanguageLabels] || scalingUnit.full.en

    const formattedValue = this.formatNumber(scaledValue, locale)
    
    return {
      value: scaledValue,
      unit: unitLabel,
      formatted: `${formattedValue}${unitLabel}`,
      original: value,
      scalingFactor: scalingUnit.factor,
    }
  }

  /**
   * Format a currency value with unit scaling
   */
  formatCurrency(
    value: number, 
    locale: string = 'en', 
    currency: string = 'CHF'
  ): FormattedNumber {
    const result = this.format(value, locale)
    
    // Format the scaled value as currency
    const currencyFormatted = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: this.config.precision,
    }).format(result.value)

    return {
      ...result,
      formatted: result.unit ? `${currencyFormatted}${result.unit}` : currencyFormatted,
    }
  }

  /**
   * Find the appropriate scaling unit for a given value
   */
  private findScalingUnit(value: number): ScalingUnit | null {
    return this.scalingUnits.find(unit => value >= unit.factor) || null
  }

  /**
   * Format a number with locale-specific formatting
   */
  private formatNumber(value: number, locale: string): string {
    return new Intl.NumberFormat(locale, {
      minimumFractionDigits: 0,
      maximumFractionDigits: this.config.precision,
    }).format(value)
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<UnitScalingConfig>): void {
    this.config = { ...this.config, ...newConfig }
  }

  /**
   * Get current configuration
   */
  getConfig(): UnitScalingConfig {
    return { ...this.config }
  }

  /**
   * Add or update scaling units
   */
  updateScalingUnits(units: ScalingUnit[]): void {
    this.scalingUnits = [...units].sort((a, b) => b.factor - a.factor)
  }

  /**
   * Get current scaling units
   */
  getScalingUnits(): ScalingUnit[] {
    return [...this.scalingUnits]
  }
}

/**
 * Create a default formatter instance
 */
export const defaultFormatter = new UnitScalingFormatter()

/**
 * Convenience function for quick formatting
 */
export function formatWithUnits(
  value: number, 
  locale: string = 'en', 
  config?: Partial<UnitScalingConfig>
): FormattedNumber {
  if (config) {
    const formatter = new UnitScalingFormatter(config)
    return formatter.format(value, locale)
  }
  return defaultFormatter.format(value, locale)
}

/**
 * Convenience function for currency formatting with units
 */
export function formatCurrencyWithUnits(
  value: number, 
  locale: string = 'en', 
  currency: string = 'CHF',
  config?: Partial<UnitScalingConfig>
): FormattedNumber {
  if (config) {
    const formatter = new UnitScalingFormatter(config)
    return formatter.formatCurrency(value, locale, currency)
  }
  return defaultFormatter.formatCurrency(value, locale, currency)
}
