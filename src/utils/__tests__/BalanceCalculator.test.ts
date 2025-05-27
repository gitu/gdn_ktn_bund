/**
 * Tests for BalanceCalculator
 *
 * These tests verify the balance calculation functionality for Swiss financial data.
 * Note: Some tests might initially fail due to incorrect test data - this is expected
 * and the correct data will be provided from another source.
 */

import { describe, it, expect } from 'vitest';
import {
  calculateBalance,
  calculateEntityBalance,
  compareEntityBalances,
} from '../BalanceCalculator';
import type {
  EnrichedFinancialRecord
} from '../BalanceCalculator';

// Mock data for testing
const mockEnrichedData: EnrichedFinancialRecord[] = [
  // GDN Zurich - Income records
  {
    arten: "4000",
    funk: "",
    jahr: "2022",
    value: 1500000,
    dim: "einnahmen",
    hh: "gdn_zh",
    unit: "CHF",
    model: "fs",
    description_de: "Einkommenssteuern natürliche Personen",
    description_fr: "Impôts sur le revenu, personnes physiques",
    description_en: "Income tax, natural persons"
  },
  {
    arten: "4001",
    funk: "",
    jahr: "2022",
    value: 800000,
    dim: "einnahmen",
    hh: "gdn_zh",
    unit: "CHF",
    model: "fs",
    description_de: "Vermögenssteuern natürliche Personen",
    description_fr: "Impôts sur la fortune, personnes physiques",
    description_en: "Wealth tax, natural persons"
  },
  // GDN Zurich - Expense records
  {
    arten: "3000",
    funk: "",
    jahr: "2022",
    value: 900000,
    dim: "ausgaben",
    hh: "gdn_zh",
    unit: "CHF",
    model: "fs",
    description_de: "Personalausgaben",
    description_fr: "Dépenses de personnel",
    description_en: "Personnel expenditure"
  },
  {
    arten: "3100",
    funk: "",
    jahr: "2022",
    value: 600000,
    dim: "ausgaben",
    hh: "gdn_zh",
    unit: "CHF",
    model: "fs",
    description_de: "Sachausgaben",
    description_fr: "Dépenses de biens et services",
    description_en: "Goods and services expenditure"
  },
  // GDN Bern - Income records
  {
    arten: "4000",
    funk: "",
    jahr: "2022",
    value: 1200000,
    dim: "einnahmen",
    hh: "gdn_be",
    unit: "CHF",
    model: "fs",
    description_de: "Einkommenssteuern natürliche Personen",
    description_fr: "Impôts sur le revenu, personnes physiques",
    description_en: "Income tax, natural persons"
  },
  // GDN Bern - Expense records
  {
    arten: "3000",
    funk: "",
    jahr: "2022",
    value: 800000,
    dim: "ausgaben",
    hh: "gdn_be",
    unit: "CHF",
    model: "fs",
    description_de: "Personalausgaben",
    description_fr: "Dépenses de personnel",
    description_en: "Personnel expenditure"
  },
  // Canton Zurich (STD) - Income records
  {
    arten: "4000",
    funk: "",
    jahr: "2022",
    value: 5000000,
    dim: "ertrag",
    hh: "ktn_zh",
    unit: "CHF",
    model: "fs",
    description_de: "Steuerertrag",
    description_fr: "Revenus fiscaux",
    description_en: "Tax revenue"
  },
  // Canton Zurich (STD) - Expense records
  {
    arten: "3000",
    funk: "",
    jahr: "2022",
    value: 4500000,
    dim: "aufwand",
    hh: "ktn_zh",
    unit: "CHF",
    model: "fs",
    description_de: "Personalaufwand",
    description_fr: "Charges de personnel",
    description_en: "Personnel expenses"
  },
  // Different year data for testing year filtering
  {
    arten: "4000",
    funk: "",
    jahr: "2021",
    value: 1000000,
    dim: "einnahmen",
    hh: "gdn_zh",
    unit: "CHF",
    model: "fs",
    description_de: "Einkommenssteuern natürliche Personen"
  }
];

describe('BalanceCalculator', () => {
  describe('calculateBalance', () => {
    it('should calculate correct balances for all entities', () => {
      const result = calculateBalance(mockEnrichedData, { year: "2022" });

      expect(result).toBeDefined();
      expect(result.year).toBe("2022");
      expect(result.currency).toBe("CHF");
      expect(result.entityBalances).toHaveLength(3); // gdn_zh, gdn_be, ktn_zh

      // Find specific entity balances
      const gdnZh = result.entityBalances.find(e => e.entityId === "gdn_zh");
      const gdnBe = result.entityBalances.find(e => e.entityId === "gdn_be");
      const ktnZh = result.entityBalances.find(e => e.entityId === "ktn_zh");

      // GDN Zurich: Income 2,300,000 - Expenses 1,500,000 = Balance 800,000
      expect(gdnZh).toBeDefined();
      expect(gdnZh!.totalIncome).toBe(2300000);
      expect(gdnZh!.totalExpenses).toBe(1500000);
      expect(gdnZh!.balance).toBe(800000);
      expect(gdnZh!.entityType).toBe('GDN');

      // GDN Bern: Income 1,200,000 - Expenses 800,000 = Balance 400,000
      expect(gdnBe).toBeDefined();
      expect(gdnBe!.totalIncome).toBe(1200000);
      expect(gdnBe!.totalExpenses).toBe(800000);
      expect(gdnBe!.balance).toBe(400000);
      expect(gdnBe!.entityType).toBe('GDN');

      // Canton Zurich: Income 5,000,000 - Expenses 4,500,000 = Balance 500,000
      expect(ktnZh).toBeDefined();
      expect(ktnZh!.totalIncome).toBe(5000000);
      expect(ktnZh!.totalExpenses).toBe(4500000);
      expect(ktnZh!.balance).toBe(500000);
      expect(ktnZh!.entityType).toBe('STD');
    });

    it('should calculate correct aggregate totals', () => {
      const result = calculateBalance(mockEnrichedData, { year: "2022" });

      // GDN totals: 2 entities
      expect(result.aggregateTotals.gdnTotals.entityCount).toBe(2);
      expect(result.aggregateTotals.gdnTotals.totalIncome).toBe(3500000); // 2,300,000 + 1,200,000
      expect(result.aggregateTotals.gdnTotals.totalExpenses).toBe(2300000); // 1,500,000 + 800,000
      expect(result.aggregateTotals.gdnTotals.balance).toBe(1200000); // 800,000 + 400,000

      // STD totals: 1 entity
      expect(result.aggregateTotals.stdTotals.entityCount).toBe(1);
      expect(result.aggregateTotals.stdTotals.totalIncome).toBe(5000000);
      expect(result.aggregateTotals.stdTotals.totalExpenses).toBe(4500000);
      expect(result.aggregateTotals.stdTotals.balance).toBe(500000);
    });

    it('should filter by entity types', () => {
      const gdnOnlyResult = calculateBalance(mockEnrichedData, {
        year: "2022",
        entityTypes: ['GDN']
      });

      expect(gdnOnlyResult.entityBalances).toHaveLength(2);
      expect(gdnOnlyResult.entityBalances.every(e => e.entityType === 'GDN')).toBe(true);
      expect(gdnOnlyResult.aggregateTotals.stdTotals.entityCount).toBe(0);

      const stdOnlyResult = calculateBalance(mockEnrichedData, {
        year: "2022",
        entityTypes: ['STD']
      });

      expect(stdOnlyResult.entityBalances).toHaveLength(1);
      expect(stdOnlyResult.entityBalances.every(e => e.entityType === 'STD')).toBe(true);
      expect(stdOnlyResult.aggregateTotals.gdnTotals.entityCount).toBe(0);
    });

    it('should filter by year', () => {
      const result2021 = calculateBalance(mockEnrichedData, { year: "2021" });

      expect(result2021.year).toBe("2021");
      expect(result2021.entityBalances).toHaveLength(1);
      expect(result2021.entityBalances[0].entityId).toBe("gdn_zh");
    });

    it('should include category breakdowns when requested', () => {
      const result = calculateBalance(mockEnrichedData, {
        year: "2022",
        includeBreakdown: true
      });

      const gdnZh = result.entityBalances.find(e => e.entityId === "gdn_zh");
      expect(gdnZh!.incomeBreakdown).toHaveLength(2); // 2 income categories
      expect(gdnZh!.expenseBreakdown).toHaveLength(2); // 2 expense categories

      // Check breakdown structure
      expect(gdnZh!.incomeBreakdown[0]).toHaveProperty('category');
      expect(gdnZh!.incomeBreakdown[0]).toHaveProperty('description');
      expect(gdnZh!.incomeBreakdown[0]).toHaveProperty('amount');
    });

    it('should exclude category breakdowns when not requested', () => {
      const result = calculateBalance(mockEnrichedData, {
        year: "2022",
        includeBreakdown: false
      });

      const gdnZh = result.entityBalances.find(e => e.entityId === "gdn_zh");
      expect(gdnZh!.incomeBreakdown).toHaveLength(0);
      expect(gdnZh!.expenseBreakdown).toHaveLength(0);
    });

    it('should handle different languages for descriptions', () => {
      const resultDe = calculateBalance(mockEnrichedData, {
        year: "2022",
        language: 'de',
        includeBreakdown: true
      });
      const resultFr = calculateBalance(mockEnrichedData, {
        year: "2022",
        language: 'fr',
        includeBreakdown: true
      });

      const gdnZhDe = resultDe.entityBalances.find(e => e.entityId === "gdn_zh");
      const gdnZhFr = resultFr.entityBalances.find(e => e.entityId === "gdn_zh");

      expect(gdnZhDe!.incomeBreakdown[0].description).toContain('Einkommenssteuern');
      expect(gdnZhFr!.incomeBreakdown[0].description).toContain('Impôts sur le revenu');
    });

    it('should throw error for empty data', () => {
      expect(() => calculateBalance([])).toThrow('Input data cannot be empty');
    });

    it('should throw error for invalid data structure', () => {
      expect(() => calculateBalance(null as any)).toThrow('Input data must be an array');
    });

    it('should throw error for missing required fields', () => {
      const invalidData = [{ arten: "4000" }] as any;
      expect(() => calculateBalance(invalidData)).toThrow('Missing required fields');
    });

    it('should throw error for invalid numeric values', () => {
      const invalidData = [{
        ...mockEnrichedData[0],
        value: "invalid" as any
      }];
      expect(() => calculateBalance(invalidData)).toThrow('invalid numeric values');
    });

    it('should throw error when no data found for specified year', () => {
      expect(() => calculateBalance(mockEnrichedData, { year: "2025" }))
        .toThrow('No data found for year 2025');
    });
  });

  describe('calculateEntityBalance', () => {
    it('should calculate balance for a specific entity', () => {
      const result = calculateEntityBalance(mockEnrichedData, "gdn_zh", { year: "2022" });

      expect(result).toBeDefined();
      expect(result!.entityId).toBe("gdn_zh");
      expect(result!.totalIncome).toBe(2300000);
      expect(result!.totalExpenses).toBe(1500000);
      expect(result!.balance).toBe(800000);
      expect(result!.entityType).toBe('GDN');
    });

    it('should return null for non-existent entity', () => {
      const result = calculateEntityBalance(mockEnrichedData, "non_existent", { year: "2022" });
      expect(result).toBeNull();
    });
  });

  describe('compareEntityBalances', () => {
    it('should compare balances between two entities', () => {
      const result = compareEntityBalances(mockEnrichedData, "gdn_zh", "gdn_be", { year: "2022" });

      expect(result.entity1).toBeDefined();
      expect(result.entity2).toBeDefined();
      expect(result.comparison).toBeDefined();

      expect(result.entity1!.entityId).toBe("gdn_zh");
      expect(result.entity2!.entityId).toBe("gdn_be");

      // GDN Zurich vs GDN Bern comparison
      expect(result.comparison!.incomeDifference).toBe(1100000); // 2,300,000 - 1,200,000
      expect(result.comparison!.expenseDifference).toBe(700000); // 1,500,000 - 800,000
      expect(result.comparison!.balanceDifference).toBe(400000); // 800,000 - 400,000
      expect(result.comparison!.incomeRatio).toBeCloseTo(1.917, 2); // 2,300,000 / 1,200,000
      expect(result.comparison!.expenseRatio).toBe(1.875); // 1,500,000 / 800,000
    });

    it('should handle comparison with non-existent entity', () => {
      const result = compareEntityBalances(mockEnrichedData, "gdn_zh", "non_existent", { year: "2022" });

      expect(result.entity1).toBeDefined();
      expect(result.entity2).toBeNull();
      expect(result.comparison).toBeNull();
    });

    it('should handle division by zero in ratios', () => {
      // Create mock data with zero expenses for one entity
      const mockDataWithZero = [
        ...mockEnrichedData.filter(r => r.hh !== "gdn_be" || r.dim !== "ausgaben"),
        {
          ...mockEnrichedData.find(r => r.hh === "gdn_be" && r.dim === "ausgaben")!,
          value: 0
        }
      ];

      const result = compareEntityBalances(mockDataWithZero, "gdn_zh", "gdn_be", { year: "2022" });

      expect(result.comparison!.expenseRatio).toBe(0); // Should handle division by zero
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle records with missing description fields', () => {
      const dataWithoutDescriptions = mockEnrichedData.map(record => ({
        arten: record.arten,
        funk: record.funk,
        jahr: record.jahr,
        value: record.value,
        dim: record.dim,
        hh: record.hh,
        unit: record.unit,
        model: record.model
        // No description fields
      }));

      const result = calculateBalance(dataWithoutDescriptions, {
        year: "2022",
        includeBreakdown: true
      });

      expect(result).toBeDefined();
      const gdnZh = result.entityBalances.find(e => e.entityId === "gdn_zh");
      expect(gdnZh!.incomeBreakdown[0].description).toBe(gdnZh!.incomeBreakdown[0].category);
    });

    it('should handle mixed currencies gracefully', () => {
      const mixedCurrencyData = [
        ...mockEnrichedData.slice(0, 2),
        {
          ...mockEnrichedData[2],
          unit: "EUR"
        }
      ];

      const result = calculateBalance(mixedCurrencyData, { year: "2022" });

      // Should use the currency from the first record
      expect(result.currency).toBe("CHF");
    });

    it('should handle records with unknown dimensions', () => {
      const dataWithUnknownDim = [
        ...mockEnrichedData.slice(0, 2),
        {
          ...mockEnrichedData[2],
          dim: "unknown_dimension"
        }
      ];

      const result = calculateBalance(dataWithUnknownDim, { year: "2022" });

      // Should still calculate correctly, ignoring unknown dimensions
      expect(result).toBeDefined();
      expect(result.entityBalances.length).toBeGreaterThan(0);
    });

    it('should sort category breakdowns by amount (descending)', () => {
      const result = calculateBalance(mockEnrichedData, {
        year: "2022",
        includeBreakdown: true
      });

      const gdnZh = result.entityBalances.find(e => e.entityId === "gdn_zh");
      const incomeBreakdown = gdnZh!.incomeBreakdown;

      // Should be sorted by amount descending
      for (let i = 0; i < incomeBreakdown.length - 1; i++) {
        expect(Math.abs(incomeBreakdown[i].amount))
          .toBeGreaterThanOrEqual(Math.abs(incomeBreakdown[i + 1].amount));
      }
    });
  });
});
