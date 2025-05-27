/**
 * Balance Calculator for Swiss Financial Data
 *
 * This module provides functions to calculate financial balances (income - expenses)
 * for Swiss governmental entities (GDN = Gemeinden/Municipalities, STD = Kantone/Cantons and Bund/Federal).
 *
 * The functions work with enriched financial data that has already been joined with
 * code descriptions from the codes directory.
 */



// Define the structure for enriched financial data
export interface EnrichedFinancialRecord {
  arten: string;
  funk: string;
  jahr: string;
  value: number;
  dim: string;
  hh: string;
  unit: string;
  model: string;
  // Enriched fields from codes
  description_de?: string;
  description_fr?: string;
  description_it?: string;
  description_en?: string;
}

// Define the structure for balance calculation results
export interface EntityBalance {
  entityId: string;
  entityName: string;
  entityType: 'GDN' | 'STD';
  year: string;
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  currency: string;
  incomeBreakdown: CategoryBreakdown[];
  expenseBreakdown: CategoryBreakdown[];
}

export interface CategoryBreakdown {
  category: string;
  description: string;
  amount: number;
  subcategories?: CategoryBreakdown[];
}

export interface BalanceCalculationResult {
  year: string;
  entityBalances: EntityBalance[];
  aggregateTotals: {
    gdnTotals: {
      totalIncome: number;
      totalExpenses: number;
      balance: number;
      entityCount: number;
    };
    stdTotals: {
      totalIncome: number;
      totalExpenses: number;
      balance: number;
      entityCount: number;
    };
  };
  currency: string;
  calculationDate: string;
}

// Define income and expense dimension mappings
const INCOME_DIMENSIONS = [
  'einnahmen',
  'ertrag',
  'ord_einnahmen_funk',
  'einnahmen_funk'
];

const EXPENSE_DIMENSIONS = [
  'ausgaben',
  'aufwand',
  'ord_ausgaben_funk',
  'ausgaben_funk'
];

/**
 * Determines if an entity is GDN (municipality) or STD (canton/federal) based on the hh field
 */
function getEntityType(hh: string): 'GDN' | 'STD' {
  if (hh.startsWith('gdn_')) {
    return 'GDN';
  }
  return 'STD';
}

/**
 * Determines if a dimension represents income or expenses
 */
function getDimensionType(dim: string): 'income' | 'expense' | 'other' {
  if (INCOME_DIMENSIONS.includes(dim)) {
    return 'income';
  }
  if (EXPENSE_DIMENSIONS.includes(dim)) {
    return 'expense';
  }
  return 'other';
}

/**
 * Creates a category breakdown from financial records
 */
function createCategoryBreakdown(
  records: EnrichedFinancialRecord[],
  language: 'de' | 'fr' | 'it' | 'en' = 'de'
): CategoryBreakdown[] {
  const categoryMap = new Map<string, CategoryBreakdown>();

  records.forEach(record => {
    const categoryKey = record.arten || 'unknown';
    const description = getDescription(record, language);

    if (!categoryMap.has(categoryKey)) {
      categoryMap.set(categoryKey, {
        category: categoryKey,
        description: description,
        amount: 0,
        subcategories: []
      });
    }

    const category = categoryMap.get(categoryKey)!;
    category.amount += record.value;
  });

  return Array.from(categoryMap.values()).sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));
}

/**
 * Gets the description in the specified language from an enriched record
 */
function getDescription(record: EnrichedFinancialRecord, language: 'de' | 'fr' | 'it' | 'en'): string {
  switch (language) {
    case 'fr':
      return record.description_fr || record.description_de || record.arten;
    case 'it':
      return record.description_it || record.description_de || record.arten;
    case 'en':
      return record.description_en || record.description_de || record.arten;
    default:
      return record.description_de || record.arten;
  }
}

/**
 * Validates input data for balance calculation
 */
function validateInputData(data: EnrichedFinancialRecord[]): void {
  if (!Array.isArray(data)) {
    throw new Error('Input data must be an array');
  }

  if (data.length === 0) {
    throw new Error('Input data cannot be empty');
  }

  // Check for required fields
  const requiredFields = ['arten', 'jahr', 'value', 'dim', 'hh', 'unit', 'model'];
  const missingFields = requiredFields.filter(field =>
    !data.every(record => record.hasOwnProperty(field))
  );

  if (missingFields.length > 0) {
    throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
  }

  // Check for invalid values
  const invalidRecords = data.filter(record =>
    typeof record.value !== 'number' || isNaN(record.value)
  );

  if (invalidRecords.length > 0) {
    throw new Error(`Found ${invalidRecords.length} records with invalid numeric values`);
  }
}

/**
 * Calculates financial balances for GDN and STD entities
 *
 * @param enrichedData - Array of enriched financial records that include code descriptions
 * @param options - Configuration options for the calculation
 * @returns Structured balance calculation results
 *
 * @example
 * ```typescript
 * const enrichedData = [
 *   {
 *     arten: "4000",
 *     funk: "",
 *     jahr: "2022",
 *     value: 1000000,
 *     dim: "einnahmen",
 *     hh: "gdn_zh",
 *     unit: "CHF",
 *     model: "fs",
 *     description_de: "Einkommenssteuern natürliche Personen"
 *   },
 *   // ... more records
 * ];
 *
 * const result = calculateBalance(enrichedData);
 * console.log(`Total GDN balance: ${result.aggregateTotals.gdnTotals.balance} CHF`);
 * ```
 */
export function calculateBalance(
  enrichedData: EnrichedFinancialRecord[],
  options: {
    year?: string;
    entityTypes?: ('GDN' | 'STD')[];
    language?: 'de' | 'fr' | 'it' | 'en';
    includeBreakdown?: boolean;
  } = {}
): BalanceCalculationResult {
  const {
    year,
    entityTypes = ['GDN', 'STD'],
    language = 'de',
    includeBreakdown = true
  } = options;

  // Validate input data
  validateInputData(enrichedData);

  // Filter data by year if specified
  let filteredData = enrichedData;
  if (year) {
    filteredData = enrichedData.filter(record => record.jahr === year);
    if (filteredData.length === 0) {
      throw new Error(`No data found for year ${year}`);
    }
  }

  // Get the year from data if not specified
  const calculationYear = year || filteredData[0]?.jahr || 'unknown';

  // Group data by entity (hh field)
  const entityGroups = new Map<string, EnrichedFinancialRecord[]>();

  filteredData.forEach(record => {
    const entityType = getEntityType(record.hh);

    // Skip if entity type not requested
    if (!entityTypes.includes(entityType)) {
      return;
    }

    if (!entityGroups.has(record.hh)) {
      entityGroups.set(record.hh, []);
    }
    entityGroups.get(record.hh)!.push(record);
  });

  // Calculate balance for each entity
  const entityBalances: EntityBalance[] = [];

  entityGroups.forEach((records, entityId) => {
    const entityType = getEntityType(entityId);

    // Separate income and expense records
    const incomeRecords = records.filter(r => getDimensionType(r.dim) === 'income');
    const expenseRecords = records.filter(r => getDimensionType(r.dim) === 'expense');

    // Calculate totals
    const totalIncome = incomeRecords.reduce((sum, record) => sum + record.value, 0);
    const totalExpenses = expenseRecords.reduce((sum, record) => sum + record.value, 0);
    const balance = totalIncome - totalExpenses;

    // Get currency (assume all records have the same currency)
    const currency = records[0]?.unit || 'CHF';

    // Create breakdown if requested
    const incomeBreakdown = includeBreakdown ? createCategoryBreakdown(incomeRecords, language) : [];
    const expenseBreakdown = includeBreakdown ? createCategoryBreakdown(expenseRecords, language) : [];

    entityBalances.push({
      entityId,
      entityName: entityId, // Could be enhanced with actual entity names
      entityType,
      year: calculationYear,
      totalIncome,
      totalExpenses,
      balance,
      currency,
      incomeBreakdown,
      expenseBreakdown
    });
  });

  // Calculate aggregate totals
  const gdnBalances = entityBalances.filter(e => e.entityType === 'GDN');
  const stdBalances = entityBalances.filter(e => e.entityType === 'STD');

  const gdnTotals = {
    totalIncome: gdnBalances.reduce((sum, e) => sum + e.totalIncome, 0),
    totalExpenses: gdnBalances.reduce((sum, e) => sum + e.totalExpenses, 0),
    balance: gdnBalances.reduce((sum, e) => sum + e.balance, 0),
    entityCount: gdnBalances.length
  };

  const stdTotals = {
    totalIncome: stdBalances.reduce((sum, e) => sum + e.totalIncome, 0),
    totalExpenses: stdBalances.reduce((sum, e) => sum + e.totalExpenses, 0),
    balance: stdBalances.reduce((sum, e) => sum + e.balance, 0),
    entityCount: stdBalances.length
  };

  return {
    year: calculationYear,
    entityBalances,
    aggregateTotals: {
      gdnTotals,
      stdTotals
    },
    currency: entityBalances[0]?.currency || 'CHF',
    calculationDate: new Date().toISOString()
  };
}

/**
 * Calculates balance for a specific entity
 *
 * @param enrichedData - Array of enriched financial records
 * @param entityId - The entity identifier (hh field)
 * @param options - Configuration options
 * @returns Balance information for the specific entity
 */
export function calculateEntityBalance(
  enrichedData: EnrichedFinancialRecord[],
  entityId: string,
  options: {
    year?: string;
    language?: 'de' | 'fr' | 'it' | 'en';
    includeBreakdown?: boolean;
  } = {}
): EntityBalance | null {
  const entityData = enrichedData.filter(record => record.hh === entityId);

  if (entityData.length === 0) {
    return null;
  }

  const result = calculateBalance(entityData, {
    ...options,
    entityTypes: [getEntityType(entityId)]
  });

  return result.entityBalances[0] || null;
}

/**
 * Compares balances between two entities
 *
 * @param enrichedData - Array of enriched financial records
 * @param entityId1 - First entity identifier
 * @param entityId2 - Second entity identifier
 * @param options - Configuration options
 * @returns Comparison result with both entity balances and differences
 */
export function compareEntityBalances(
  enrichedData: EnrichedFinancialRecord[],
  entityId1: string,
  entityId2: string,
  options: {
    year?: string;
    language?: 'de' | 'fr' | 'it' | 'en';
  } = {}
): {
  entity1: EntityBalance | null;
  entity2: EntityBalance | null;
  comparison: {
    incomeDifference: number;
    expenseDifference: number;
    balanceDifference: number;
    incomeRatio: number;
    expenseRatio: number;
  } | null;
} {
  const entity1 = calculateEntityBalance(enrichedData, entityId1, options);
  const entity2 = calculateEntityBalance(enrichedData, entityId2, options);

  let comparison = null;
  if (entity1 && entity2) {
    comparison = {
      incomeDifference: entity1.totalIncome - entity2.totalIncome,
      expenseDifference: entity1.totalExpenses - entity2.totalExpenses,
      balanceDifference: entity1.balance - entity2.balance,
      incomeRatio: entity2.totalIncome !== 0 ? entity1.totalIncome / entity2.totalIncome : 0,
      expenseRatio: entity2.totalExpenses !== 0 ? entity1.totalExpenses / entity2.totalExpenses : 0
    };
  }

  return {
    entity1,
    entity2,
    comparison
  };
}
