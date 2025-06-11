import { describe, it, expect, beforeEach } from 'vitest'
import { DataLoader } from '../DataLoader'
import type { AccountCodeFilterConfig } from '../../types/DataFilters'

describe('DataLoader - Filtering Integration', () => {
  let dataLoader: DataLoader

  beforeEach(() => {
    dataLoader = new DataLoader()
  })

  describe('filter configuration management', () => {
    it('should initialize with default filter configuration', () => {
      const config = dataLoader.getFilterConfig()
      expect(config.enabled).toBe(false)
      expect(config.rules).toEqual([])
    })

    it('should update filter configuration', () => {
      const newConfig: AccountCodeFilterConfig = {
        enabled: true,
        rules: [
          {
            id: 'test-rule',
            name: 'Test Rule',
            type: 'startsWith',
            pattern: '36',
            enabled: true,
            action: 'exclude',
            description: 'Test exclude rule',
          },
        ],
        combineMode: 'AND',
        logFiltered: true,
      }

      dataLoader.updateFilterConfig(newConfig)
      const updatedConfig = dataLoader.getFilterConfig()

      expect(updatedConfig.enabled).toBe(true)
      expect(updatedConfig.rules).toHaveLength(1)
      expect(updatedConfig.rules[0].pattern).toBe('36')
      expect(updatedConfig.logFiltered).toBe(true)
    })

    it('should provide filter statistics', () => {
      const config: AccountCodeFilterConfig = {
        enabled: true,
        rules: [
          {
            id: 'exclude-36',
            name: 'Exclude 36xx',
            type: 'startsWith',
            pattern: '36',
            enabled: true,
            action: 'exclude',
          },
          {
            id: 'include-4x',
            name: 'Include 4xxx',
            type: 'startsWith',
            pattern: '4',
            enabled: false,
            action: 'include',
          },
        ],
        combineMode: 'AND',
        logFiltered: false,
      }

      dataLoader.updateFilterConfig(config)
      const stats = dataLoader.getFilterStats()

      expect(stats.totalRules).toBe(2)
      expect(stats.enabledRules).toBe(1)
      expect(stats.excludeRules).toBe(1)
      expect(stats.includeRules).toBe(0)
      expect(stats.isActive).toBe(true)
    })
  })

  describe('constructor with filter configuration', () => {
    it('should accept filter configuration in constructor', () => {
      const filterConfig: AccountCodeFilterConfig = {
        enabled: true,
        rules: [
          {
            id: 'test-rule',
            name: 'Test Rule',
            type: 'startsWith',
            pattern: '36',
            enabled: true,
            action: 'exclude',
          },
        ],
        combineMode: 'OR',
        logFiltered: true,
      }

      const customDataLoader = new DataLoader(filterConfig)
      const config = customDataLoader.getFilterConfig()

      expect(config.enabled).toBe(true)
      expect(config.rules).toHaveLength(1)
      expect(config.combineMode).toBe('OR')
      expect(config.logFiltered).toBe(true)
    })
  })

  describe('integration with existing methods', () => {
    it('should maintain existing functionality when filtering is disabled', () => {
      // This test ensures that adding filtering doesn't break existing functionality
      const config = dataLoader.getFilterConfig()
      expect(config.enabled).toBe(false)

      // The DataLoader should still work normally with filtering disabled
      // We can't easily test the full data loading pipeline in unit tests
      // since it requires actual CSV files and network requests,
      // but we can verify the configuration is properly set up
      expect(dataLoader.getFilterStats().isActive).toBe(false)
    })

    it('should properly configure filtering when enabled', () => {
      const filterConfig: AccountCodeFilterConfig = {
        enabled: true,
        rules: [
          {
            id: 'exclude-transfers',
            name: 'Exclude Transfer Expenses',
            description: 'Excludes account codes starting with 36',
            type: 'startsWith',
            pattern: '36',
            enabled: true,
            action: 'exclude',
          },
        ],
        combineMode: 'AND',
        logFiltered: false,
      }

      dataLoader.updateFilterConfig(filterConfig)
      const stats = dataLoader.getFilterStats()

      expect(stats.isActive).toBe(true)
      expect(stats.enabledRules).toBe(1)
      expect(stats.excludeRules).toBe(1)
    })
  })

  describe('predefined filter scenarios', () => {
    it('should handle transfer expense exclusion scenario', () => {
      // This simulates the main use case: excluding transfer expenses (36xx codes)
      const filterConfig: AccountCodeFilterConfig = {
        enabled: true,
        rules: [
          {
            id: 'exclude-transfer-expenses',
            name: 'Exclude Transfer Expenses',
            description: 'Excludes all account codes starting with "36" (Transferexpenses)',
            type: 'startsWith',
            pattern: '36',
            enabled: true,
            action: 'exclude',
          },
        ],
        combineMode: 'AND',
        logFiltered: false,
      }

      dataLoader.updateFilterConfig(filterConfig)
      const config = dataLoader.getFilterConfig()

      expect(config.enabled).toBe(true)
      expect(config.rules[0].pattern).toBe('36')
      expect(config.rules[0].action).toBe('exclude')
      expect(config.rules[0].type).toBe('startsWith')

      const stats = dataLoader.getFilterStats()
      expect(stats.isActive).toBe(true)
      expect(stats.excludeRules).toBe(1)
    })

    it('should handle multiple exclusion patterns', () => {
      // This simulates excluding multiple patterns
      const filterConfig: AccountCodeFilterConfig = {
        enabled: true,
        rules: [
          {
            id: 'exclude-36',
            name: 'Exclude 36xx',
            type: 'startsWith',
            pattern: '36',
            enabled: true,
            action: 'exclude',
          },
          {
            id: 'exclude-39',
            name: 'Exclude 39xx',
            type: 'startsWith',
            pattern: '39',
            enabled: true,
            action: 'exclude',
          },
        ],
        combineMode: 'AND',
        logFiltered: false,
      }

      dataLoader.updateFilterConfig(filterConfig)
      const stats = dataLoader.getFilterStats()

      expect(stats.enabledRules).toBe(2)
      expect(stats.excludeRules).toBe(2)
      expect(stats.isActive).toBe(true)
    })
  })
})
