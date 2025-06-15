import { describe, it, expect, beforeEach } from 'vitest'
import { AccountCodeFilter } from '../AccountCodeFilter'
import type { AccountCodeFilterConfig, AccountCodeFilterRule } from '../../types/DataFilters'
import type { DataRecord } from '../../types/DataStructures'

describe('AccountCodeFilter', () => {
  let filter: AccountCodeFilter

  beforeEach(() => {
    filter = new AccountCodeFilter()
  })

  describe('constructor and configuration', () => {
    it('should initialize with default configuration', () => {
      const config = filter.getConfig()
      expect(config.enabled).toBe(false)
      expect(config.rules).toEqual([])
      expect(config.combineMode).toBe('AND')
      expect(config.logFiltered).toBe(false)
    })

    it('should accept custom configuration', () => {
      const customConfig: AccountCodeFilterConfig = {
        enabled: true,
        rules: [],
        combineMode: 'OR',
        logFiltered: true,
      }
      const customFilter = new AccountCodeFilter(customConfig)
      const config = customFilter.getConfig()
      expect(config.enabled).toBe(true)
      expect(config.combineMode).toBe('OR')
      expect(config.logFiltered).toBe(true)
    })

    it('should update configuration', () => {
      filter.updateConfig({ enabled: true, logFiltered: true })
      const config = filter.getConfig()
      expect(config.enabled).toBe(true)
      expect(config.logFiltered).toBe(true)
      expect(config.combineMode).toBe('AND') // Should preserve existing values
    })
  })

  describe('shouldIncludeAccountCode', () => {
    it('should include all codes when filtering is disabled', () => {
      expect(filter.shouldIncludeAccountCode('3600')).toBe(true)
      expect(filter.shouldIncludeAccountCode('4000')).toBe(true)
      expect(filter.shouldIncludeAccountCode('1000')).toBe(true)
    })

    it('should include all codes when no rules are enabled', () => {
      filter.updateConfig({ enabled: true })
      expect(filter.shouldIncludeAccountCode('3600')).toBe(true)
      expect(filter.shouldIncludeAccountCode('4000')).toBe(true)
    })

    it('should exclude codes matching exclude rules', () => {
      const rule: AccountCodeFilterRule = {
        id: 'exclude-36',
        name: 'Exclude 36xx',
        type: 'startsWith',
        pattern: '36',
        enabled: true,
        action: 'exclude',
      }

      filter.updateConfig({ enabled: true, rules: [rule] })

      expect(filter.shouldIncludeAccountCode('3600')).toBe(false)
      expect(filter.shouldIncludeAccountCode('3650')).toBe(false)
      expect(filter.shouldIncludeAccountCode('4000')).toBe(true)
      expect(filter.shouldIncludeAccountCode('3500')).toBe(true)
    })

    it('should include only codes matching include rules', () => {
      const rule: AccountCodeFilterRule = {
        id: 'include-4x',
        name: 'Include 4xxx',
        type: 'startsWith',
        pattern: '4',
        enabled: true,
        action: 'include',
      }

      filter.updateConfig({ enabled: true, rules: [rule] })

      expect(filter.shouldIncludeAccountCode('4000')).toBe(true)
      expect(filter.shouldIncludeAccountCode('4100')).toBe(true)
      expect(filter.shouldIncludeAccountCode('3600')).toBe(false)
      expect(filter.shouldIncludeAccountCode('1000')).toBe(false)
    })

    it('should handle different pattern types', () => {
      const rules: AccountCodeFilterRule[] = [
        {
          id: 'starts-with',
          name: 'Starts with 36',
          type: 'startsWith',
          pattern: '36',
          enabled: true,
          action: 'exclude',
        },
        {
          id: 'ends-with',
          name: 'Ends with 00',
          type: 'endsWith',
          pattern: '00',
          enabled: true,
          action: 'exclude',
        },
        {
          id: 'contains',
          name: 'Contains 99',
          type: 'contains',
          pattern: '99',
          enabled: true,
          action: 'exclude',
        },
        {
          id: 'exact',
          name: 'Exact 1234',
          type: 'exact',
          pattern: '1234',
          enabled: true,
          action: 'exclude',
        },
        {
          id: 'regex',
          name: 'Regex pattern',
          type: 'regex',
          pattern: '^[34]\\d{3}$',
          enabled: true,
          action: 'include',
        },
      ]

      filter.updateConfig({ enabled: true, rules, combineMode: 'AND' })

      // Should be excluded by starts-with rule
      expect(filter.shouldIncludeAccountCode('3600')).toBe(false)
      // Should be excluded by ends-with rule
      expect(filter.shouldIncludeAccountCode('4100')).toBe(false)
      // Should be excluded by contains rule
      expect(filter.shouldIncludeAccountCode('3990')).toBe(false)
      // Should be excluded by exact rule
      expect(filter.shouldIncludeAccountCode('1234')).toBe(false)
      // Should be included (matches regex, doesn't match exclude rules)
      expect(filter.shouldIncludeAccountCode('3456')).toBe(true)
      // Should be excluded (doesn't match regex include rule)
      expect(filter.shouldIncludeAccountCode('5000')).toBe(false)
    })
  })

  describe('filterDataRecords', () => {
    const mockRecords: DataRecord[] = [
      { arten: '3600', funk: '', jahr: '2023', value: '1000', dim: 'aufwand', unit: 'CHF' },
      { arten: '3650', funk: '', jahr: '2023', value: '2000', dim: 'aufwand', unit: 'CHF' },
      { arten: '4000', funk: '', jahr: '2023', value: '3000', dim: 'ertrag', unit: 'CHF' },
      { arten: '4100', funk: '', jahr: '2023', value: '4000', dim: 'ertrag', unit: 'CHF' },
      { arten: '1000', funk: '', jahr: '2023', value: '5000', dim: 'bilanz', unit: 'CHF' },
    ]

    it('should return all records when filtering is disabled', () => {
      const { filteredRecords, result } = filter.filterDataRecords(mockRecords)

      expect(filteredRecords).toHaveLength(5)
      expect(result.originalCount).toBe(5)
      expect(result.filteredCount).toBe(5)
      expect(result.excludedCount).toBe(0)
      expect(result.wasFiltered).toBe(false)
    })

    it('should filter out records matching exclude rules', () => {
      const rule: AccountCodeFilterRule = {
        id: 'exclude-36',
        name: 'Exclude 36xx',
        type: 'startsWith',
        pattern: '36',
        enabled: true,
        action: 'exclude',
      }

      filter.updateConfig({ enabled: true, rules: [rule] })
      const { filteredRecords, result } = filter.filterDataRecords(mockRecords)

      expect(filteredRecords).toHaveLength(3)
      expect(result.originalCount).toBe(5)
      expect(result.filteredCount).toBe(3)
      expect(result.excludedCount).toBe(2)
      expect(result.excludedCodes).toEqual(['3600', '3650'])
      expect(result.wasFiltered).toBe(true)

      // Check that the right records were kept
      const artenCodes = filteredRecords.map((r) => r.arten)
      expect(artenCodes).toEqual(['4000', '4100', '1000'])
    })

    it('should handle multiple rules with AND combination', () => {
      const rules: AccountCodeFilterRule[] = [
        {
          id: 'include-4x',
          name: 'Include 4xxx',
          type: 'startsWith',
          pattern: '4',
          enabled: true,
          action: 'include',
        },
        {
          id: 'exclude-4100',
          name: 'Exclude 4100',
          type: 'exact',
          pattern: '4100',
          enabled: true,
          action: 'exclude',
        },
      ]

      filter.updateConfig({ enabled: true, rules, combineMode: 'AND' })
      const { filteredRecords, result } = filter.filterDataRecords(mockRecords)

      expect(filteredRecords).toHaveLength(1)
      expect(result.filteredCount).toBe(1)
      expect(filteredRecords[0].arten).toBe('4000')
    })
  })

  describe('rule management', () => {
    it('should add new rules', () => {
      const rule: AccountCodeFilterRule = {
        id: 'test-rule',
        name: 'Test Rule',
        type: 'startsWith',
        pattern: '36',
        enabled: true,
        action: 'exclude',
      }

      filter.addRule(rule)
      const config = filter.getConfig()
      expect(config.rules).toHaveLength(1)
      expect(config.rules[0]).toEqual(rule)
    })

    it('should replace existing rules with same ID', () => {
      const rule1: AccountCodeFilterRule = {
        id: 'test-rule',
        name: 'Test Rule 1',
        type: 'startsWith',
        pattern: '36',
        enabled: true,
        action: 'exclude',
      }

      const rule2: AccountCodeFilterRule = {
        id: 'test-rule',
        name: 'Test Rule 2',
        type: 'endsWith',
        pattern: '00',
        enabled: false,
        action: 'include',
      }

      filter.addRule(rule1)
      filter.addRule(rule2)

      const config = filter.getConfig()
      expect(config.rules).toHaveLength(1)
      expect(config.rules[0].name).toBe('Test Rule 2')
      expect(config.rules[0].type).toBe('endsWith')
    })

    it('should remove rules by ID', () => {
      const rule: AccountCodeFilterRule = {
        id: 'test-rule',
        name: 'Test Rule',
        type: 'startsWith',
        pattern: '36',
        enabled: true,
        action: 'exclude',
      }

      filter.addRule(rule)
      expect(filter.getConfig().rules).toHaveLength(1)

      const removed = filter.removeRule('test-rule')
      expect(removed).toBe(true)
      expect(filter.getConfig().rules).toHaveLength(0)

      const notRemoved = filter.removeRule('non-existent')
      expect(notRemoved).toBe(false)
    })

    it('should toggle rule enabled state', () => {
      const rule: AccountCodeFilterRule = {
        id: 'test-rule',
        name: 'Test Rule',
        type: 'startsWith',
        pattern: '36',
        enabled: true,
        action: 'exclude',
      }

      filter.addRule(rule)

      // Toggle to disabled
      const toggled1 = filter.toggleRule('test-rule')
      expect(toggled1).toBe(true)
      expect(filter.getConfig().rules[0].enabled).toBe(false)

      // Toggle back to enabled
      const toggled2 = filter.toggleRule('test-rule')
      expect(toggled2).toBe(true)
      expect(filter.getConfig().rules[0].enabled).toBe(true)

      // Set explicitly to false
      const set = filter.toggleRule('test-rule', false)
      expect(set).toBe(true)
      expect(filter.getConfig().rules[0].enabled).toBe(false)

      // Try to toggle non-existent rule
      const notToggled = filter.toggleRule('non-existent')
      expect(notToggled).toBe(false)
    })
  })

  describe('getFilterStats', () => {
    it('should return correct statistics', () => {
      const rules: AccountCodeFilterRule[] = [
        {
          id: 'rule1',
          name: 'Rule 1',
          type: 'startsWith',
          pattern: '36',
          enabled: true,
          action: 'exclude',
        },
        {
          id: 'rule2',
          name: 'Rule 2',
          type: 'startsWith',
          pattern: '4',
          enabled: false,
          action: 'include',
        },
        {
          id: 'rule3',
          name: 'Rule 3',
          type: 'exact',
          pattern: '1000',
          enabled: true,
          action: 'include',
        },
      ]

      filter.updateConfig({ enabled: true, rules })
      const stats = filter.getFilterStats()

      expect(stats.totalRules).toBe(3)
      expect(stats.enabledRules).toBe(2)
      expect(stats.includeRules).toBe(1)
      expect(stats.excludeRules).toBe(1)
      expect(stats.isActive).toBe(true)
    })

    it('should indicate inactive when filtering is disabled', () => {
      const rule: AccountCodeFilterRule = {
        id: 'rule1',
        name: 'Rule 1',
        type: 'startsWith',
        pattern: '36',
        enabled: true,
        action: 'exclude',
      }

      filter.updateConfig({ enabled: false, rules: [rule] })
      const stats = filter.getFilterStats()

      expect(stats.isActive).toBe(false)
    })
  })
})
