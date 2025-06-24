import { describe, it, expect } from 'vitest'
import { CustomScalingFormula } from '../CustomScalingFormula'
import type { StatsAvailabilityInfo } from '@/types/StatsData'
import type { ScalingVariable } from '../CustomScalingFormula'

describe('CustomScalingFormula', () => {
  // Test tokenizer with scientific notation
  describe('tokenizeExpression', () => {
    it('should correctly tokenize scientific notation', () => {
      // Access private method through type casting for testing
      const tokenize = (expr: string) => (CustomScalingFormula as unknown as { tokenizeExpression: (expr: string) => string[] }).tokenizeExpression(expr)
      
      expect(tokenize('1.23e-4 * pop')).toEqual(['1.23e-4', '*', 'pop'])
      expect(tokenize('5.67E+2*area')).toEqual(['5.67E+2', '*', 'area'])
      expect(tokenize('1e-6 * pop + 2.5e+3 * area')).toEqual(['1e-6', '*', 'pop', '+', '2.5e+3', '*', 'area'])
      expect(tokenize('0.0002*pop + 0.0005*employment')).toEqual(['0.0002', '*', 'pop', '+', '0.0005', '*', 'employment'])
    })
  })
  const mockAvailableStats: StatsAvailabilityInfo[] = [
    {
      id: 'pop',
      name: { de: 'Bevölkerung', en: 'Population', fr: 'Population', it: 'Popolazione' },
      unit: { de: 'Personen', en: 'Persons', fr: 'Personnes', it: 'Persone' },
      type: 'scaling',
      description: {
        de: 'Einwohnerzahl',
        en: 'Population count',
        fr: "Nombre d'habitants",
        it: 'Numero di abitanti',
      },
      availableKtnYears: [2023],
      availableGdnYears: [2023],
      source: 'Test Source',
      lastUpdate: '2024-01-01',
    },
    {
      id: 'area',
      name: { de: 'Fläche', en: 'Area', fr: 'Surface', it: 'Superficie' },
      unit: { de: 'km²', en: 'km²', fr: 'km²', it: 'km²' },
      type: 'scaling',
      description: {
        de: 'Gesamtfläche',
        en: 'Total area',
        fr: 'Surface totale',
        it: 'Superficie totale',
      },
      availableKtnYears: [2023],
      availableGdnYears: [2023],
      source: 'Test Source',
      lastUpdate: '2024-01-01',
    },
    {
      id: 'employment',
      name: { de: 'Beschäftigung', en: 'Employment', fr: 'Emploi', it: 'Occupazione' },
      unit: { de: 'Arbeitsplätze', en: 'Jobs', fr: 'Emplois', it: 'Posti di lavoro' },
      type: 'scaling',
      description: {
        de: 'Anzahl Arbeitsplätze',
        en: 'Number of jobs',
        fr: "Nombre d'emplois",
        it: 'Numero di posti di lavoro',
      },
      availableKtnYears: [2023],
      availableGdnYears: [2023],
      source: 'Test Source',
      lastUpdate: '2024-01-01',
    },
  ]

  const createScalingVariables = (values: {
    [key: string]: number
  }): Map<string, ScalingVariable> => {
    const variables = new Map<string, ScalingVariable>()

    Object.entries(values).forEach(([id, value]) => {
      const stat = mockAvailableStats.find((s) => s.id === id)
      if (stat) {
        variables.set(id, {
          id,
          name: stat.name,
          value,
          unit: stat.unit,
        })
      }
    })

    return variables
  }

  describe('validateFormula', () => {
    it('should validate simple single variable formula', () => {
      const result = CustomScalingFormula.validateFormula('pop', mockAvailableStats)
      expect(result.isValid).toBe(true)
      expect(result.usedFactors).toEqual(['pop'])
      expect(result.formula).toBe('pop')
    })

    it('should validate arithmetic formula with multiple variables', () => {
      const result = CustomScalingFormula.validateFormula('1.5*pop+30*area', mockAvailableStats)
      expect(result.isValid).toBe(true)
      expect(result.usedFactors).toContain('pop')
      expect(result.usedFactors).toContain('area')
    })

    it('should validate complex formula with parentheses', () => {
      const result = CustomScalingFormula.validateFormula(
        '(pop + employment) * 0.5 / area',
        mockAvailableStats,
      )
      expect(result.isValid).toBe(true)
      expect(result.usedFactors).toContain('pop')
      expect(result.usedFactors).toContain('employment')
      expect(result.usedFactors).toContain('area')
    })

    it('should handle formula with spaces', () => {
      const result = CustomScalingFormula.validateFormula(
        ' 2 * pop + area / 1000 ',
        mockAvailableStats,
      )
      expect(result.isValid).toBe(true)
      expect(result.usedFactors).toContain('pop')
      expect(result.usedFactors).toContain('area')
    })

    it('should reject empty formula', () => {
      const result = CustomScalingFormula.validateFormula('', mockAvailableStats)
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('cannot be empty')
    })

    it('should reject formula with unknown variables', () => {
      const result = CustomScalingFormula.validateFormula('unknown_var * 2', mockAvailableStats)
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('Unknown scaling variables: unknown_var')
    })

    it('should reject formula without variables', () => {
      const result = CustomScalingFormula.validateFormula('100 + 50', mockAvailableStats)
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('must contain at least one scaling variable')
    })

    it('should detect unbalanced parentheses', () => {
      const result = CustomScalingFormula.validateFormula('(pop + area', mockAvailableStats)
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('Unbalanced parentheses')
    })

    it('should detect consecutive operators', () => {
      const result = CustomScalingFormula.validateFormula('pop + * area', mockAvailableStats)
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('Invalid operator sequence')
    })

    it('should reject formula starting with invalid operator', () => {
      const result = CustomScalingFormula.validateFormula('* pop + area', mockAvailableStats)
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('cannot start with operator')
    })

    it('should reject formula ending with operator', () => {
      const result = CustomScalingFormula.validateFormula('pop + area *', mockAvailableStats)
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('cannot end with operator')
    })

    it('should allow formula starting with minus (negative)', () => {
      const result = CustomScalingFormula.validateFormula('-pop + area', mockAvailableStats)
      expect(result.isValid).toBe(true)
    })

    it('should validate formulas with scientific notation', () => {
      const result1 = CustomScalingFormula.validateFormula('1.23e-4 * pop', mockAvailableStats)
      expect(result1.isValid).toBe(true)
      
      const result2 = CustomScalingFormula.validateFormula('5.67E+2 * area + 1e-6 * pop', mockAvailableStats)
      expect(result2.isValid).toBe(true)
      
      const result3 = CustomScalingFormula.validateFormula('0.0002*pop + 0.0005*employment', mockAvailableStats)
      expect(result3.isValid).toBe(true)
    })
  })

  describe('evaluateFormula', () => {
    it('should evaluate simple single variable formula', () => {
      const variables = createScalingVariables({ pop: 10000 })
      const result = CustomScalingFormula.evaluateFormula('pop', variables)
      expect(result.isValid).toBe(true)
      expect(result.result).toBe(10000)
      expect(result.usedFactors).toEqual(['pop'])
    })

    it('should evaluate arithmetic operations', () => {
      const variables = createScalingVariables({ pop: 10000, area: 50 })
      const result = CustomScalingFormula.evaluateFormula('pop + area', variables)
      expect(result.isValid).toBe(true)
      expect(result.result).toBe(10050)
    })

    it('should evaluate multiplication and division', () => {
      const variables = createScalingVariables({ pop: 10000, area: 50 })
      const result = CustomScalingFormula.evaluateFormula('pop / area', variables)
      expect(result.isValid).toBe(true)
      expect(result.result).toBe(200)
    })

    it('should evaluate complex formula with constants', () => {
      const variables = createScalingVariables({ pop: 10000, area: 50 })
      const result = CustomScalingFormula.evaluateFormula('1.5 * pop + 30 * area', variables)
      expect(result.isValid).toBe(true)
      expect(result.result).toBe(16500) // 1.5 * 10000 + 30 * 50 = 15000 + 1500
    })

    it('should respect operator precedence', () => {
      const variables = createScalingVariables({ pop: 100, area: 10 })
      const result = CustomScalingFormula.evaluateFormula('pop + area * 2', variables)
      expect(result.isValid).toBe(true)
      expect(result.result).toBe(120) // 100 + (10 * 2) = 120, not (100 + 10) * 2 = 220
    })

    it('should handle parentheses correctly', () => {
      const variables = createScalingVariables({ pop: 100, area: 10 })
      const result = CustomScalingFormula.evaluateFormula('(pop + area) * 2', variables)
      expect(result.isValid).toBe(true)
      expect(result.result).toBe(220) // (100 + 10) * 2 = 220
    })

    it('should handle negative values', () => {
      const variables = createScalingVariables({ pop: 100, area: 10 })
      const result = CustomScalingFormula.evaluateFormula('-pop + area', variables)
      expect(result.isValid).toBe(true)
      expect(result.result).toBe(-90)
    })

    it('should handle decimal constants', () => {
      const variables = createScalingVariables({ pop: 1000 })
      const result = CustomScalingFormula.evaluateFormula('pop * 0.5', variables)
      expect(result.isValid).toBe(true)
      expect(result.result).toBe(500)
    })

    it('should evaluate formulas with scientific notation', () => {
      const variables = createScalingVariables({ pop: 10000, area: 50, employment: 2000 })
      
      // Test simple scientific notation
      const result1 = CustomScalingFormula.evaluateFormula('1e-3 * pop', variables)
      expect(result1.isValid).toBe(true)
      expect(result1.result).toBe(10) // 0.001 * 10000 = 10
      
      // Test with exponent
      const result2 = CustomScalingFormula.evaluateFormula('1.5e-4 * pop', variables)
      expect(result2.isValid).toBe(true)
      expect(result2.result).toBeCloseTo(1.5) // 0.00015 * 10000 = 1.5
      
      // Test positive exponent
      const result3 = CustomScalingFormula.evaluateFormula('2e+2 * area', variables)
      expect(result3.isValid).toBe(true)
      expect(result3.result).toBe(10000) // 200 * 50 = 10000
      
      // Test complex formula with multiple scientific notation values
      const result4 = CustomScalingFormula.evaluateFormula('1e-3 * pop + 5e-4 * employment', variables)
      expect(result4.isValid).toBe(true)
      expect(result4.result).toBe(11) // 0.001 * 10000 + 0.0005 * 2000 = 10 + 1 = 11
    })

    it('should detect division by zero', () => {
      const variables = createScalingVariables({ pop: 1000 })
      const result = CustomScalingFormula.evaluateFormula('pop / 0', variables)
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('Division by zero')
    })

    it('should handle missing scaling variables', () => {
      const variables = createScalingVariables({ pop: 1000 })
      const result = CustomScalingFormula.evaluateFormula('pop + area', variables)
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('Unknown scaling variables: area')
    })

    it('should preserve variable names that are substrings of others', () => {
      // Create a scenario where one variable ID is a substring of another
      const extendedStats = [
        ...mockAvailableStats,
        {
          id: 'pop_density',
          name: {
            de: 'Bevölkerungsdichte',
            en: 'Population Density',
            fr: 'Densité de population',
            it: 'Densità di popolazione',
          },
          unit: { de: 'Personen/km²', en: 'Persons/km²', fr: 'Personnes/km²', it: 'Persone/km²' },
          type: 'scaling' as const,
          description: {
            de: 'Einwohner pro km²',
            en: 'Inhabitants per km²',
            fr: 'Habitants par km²',
            it: 'Abitanti per km²',
          },
          availableKtnYears: [2023],
          availableGdnYears: [2023],
          source: 'Test Source',
          lastUpdate: '2024-01-01',
        },
      ]

      const variables = new Map<string, ScalingVariable>()
      variables.set('pop', {
        id: 'pop',
        name: mockAvailableStats[0].name,
        value: 1000,
        unit: mockAvailableStats[0].unit,
      })
      variables.set('pop_density', {
        id: 'pop_density',
        name: extendedStats[3].name,
        value: 100,
        unit: extendedStats[3].unit,
      })

      const validation = CustomScalingFormula.validateFormula('pop + pop_density', extendedStats)
      expect(validation.isValid).toBe(true)

      const result = CustomScalingFormula.evaluateFormula('pop + pop_density', variables)
      expect(result.isValid).toBe(true)
      expect(result.result).toBe(1100)
    })
  })

  describe('getFormulaDisplayName', () => {
    it('should create human-readable display name', () => {
      const displayName = CustomScalingFormula.getFormulaDisplayName(
        '1.5*pop+30*area',
        mockAvailableStats,
        'en',
      )
      expect(displayName).toBe('Custom: 1.5*Population+30*Area')
    })

    it('should handle different locales', () => {
      const displayName = CustomScalingFormula.getFormulaDisplayName(
        'pop/area',
        mockAvailableStats,
        'de',
      )
      expect(displayName).toBe('Custom: Bevölkerung/Fläche')
    })

    it('should fallback to original formula for invalid expressions', () => {
      const displayName = CustomScalingFormula.getFormulaDisplayName(
        'invalid + unknown_var',
        mockAvailableStats,
        'en',
      )
      expect(displayName).toBe('Custom: invalid + unknown_var')
    })

    it('should preserve constants and operators in display', () => {
      const displayName = CustomScalingFormula.getFormulaDisplayName(
        '(pop + employment) * 0.5',
        mockAvailableStats,
        'en',
      )
      expect(displayName).toBe('Custom: (Population + Employment) * 0.5')
    })
  })

  describe('complex real-world scenarios', () => {
    it('should handle per capita calculation', () => {
      const variables = createScalingVariables({ pop: 50000 })
      const result = CustomScalingFormula.evaluateFormula('pop / 1000', variables)
      expect(result.isValid).toBe(true)
      expect(result.result).toBe(50) // 50,000 / 1000 = 50 (scaling factor)
    })

    it('should handle density-based scaling', () => {
      const variables = createScalingVariables({ pop: 50000, area: 100 })
      const result = CustomScalingFormula.evaluateFormula('pop / area', variables)
      expect(result.isValid).toBe(true)
      expect(result.result).toBe(500) // 50,000 / 100 = 500 persons per km²
    })

    it('should handle weighted combination formula', () => {
      const variables = createScalingVariables({ pop: 10000, employment: 5000, area: 50 })
      const result = CustomScalingFormula.evaluateFormula(
        '0.6 * pop + 0.3 * employment + 0.1 * area',
        variables,
      )
      expect(result.isValid).toBe(true)
      expect(result.result).toBe(7505) // 0.6*10000 + 0.3*5000 + 0.1*50 = 6000 + 1500 + 5
    })

    it('should handle economic indicator formula', () => {
      const variables = createScalingVariables({ pop: 10000, employment: 5000 })
      const result = CustomScalingFormula.evaluateFormula('employment / pop * 100', variables)
      expect(result.isValid).toBe(true)
      expect(result.result).toBe(50) // 5000 / 10000 * 100 = 50% employment rate
    })
  })
})
