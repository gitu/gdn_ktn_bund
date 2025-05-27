# Balance Calculator for Swiss Financial Data

This module provides comprehensive functions to calculate financial balances (income - expenses) for Swiss governmental entities including municipalities (GDN = Gemeinden) and cantons/federal entities (STD = Kantone/Bund).

## Features

- ✅ Calculate balances for individual entities and aggregated totals
- ✅ Support for both GDN (municipalities) and STD (cantons/federal) entity types
- ✅ Multi-language support (German, French, Italian, English)
- ✅ Detailed category breakdowns for income and expenses
- ✅ Entity comparison functionality
- ✅ Comprehensive error handling and data validation
- ✅ Year-based filtering
- ✅ Entity type filtering

## Data Structure

The calculator works with enriched financial data that includes:

```typescript
interface EnrichedFinancialRecord {
  arten: string;           // Account/category code
  funk: string;            // Function code
  jahr: string;            // Year
  value: number;           // Amount
  dim: string;             // Dimension (einnahmen, ausgaben, ertrag, aufwand, etc.)
  hh: string;              // Entity identifier (e.g., "gdn_zh", "ktn_be")
  unit: string;            // Currency unit (e.g., "CHF")
  model: string;           // Model type (e.g., "fs")
  // Enriched description fields
  description_de?: string; // German description
  description_fr?: string; // French description
  description_it?: string; // Italian description
  description_en?: string; // English description
}
```

## Income vs Expense Classification

The calculator automatically classifies financial records based on their `dim` field:

### Income Dimensions
- `einnahmen` - General receipts
- `ertrag` - Revenue
- `ord_einnahmen_funk` - Ordinary receipts by function
- `einnahmen_funk` - Receipts by function

### Expense Dimensions
- `ausgaben` - General expenditure
- `aufwand` - Expenses
- `ord_ausgaben_funk` - Ordinary expenditure by function
- `ausgaben_funk` - Expenditure by function

## Entity Types

- **GDN (Gemeinden)**: Municipalities - identified by `hh` field starting with "gdn_"
- **STD (Standard)**: Cantons and Federal entities - all other `hh` values

## Usage Examples

### 1. Calculate All Balances

```typescript
import { calculateBalance } from './utils/BalanceCalculator';

const result = calculateBalance(enrichedData, {
  year: "2022",
  language: 'de',
  includeBreakdown: true
});

console.log(`GDN Total Balance: ${result.aggregateTotals.gdnTotals.balance} CHF`);
console.log(`STD Total Balance: ${result.aggregateTotals.stdTotals.balance} CHF`);
```

### 2. Calculate Balance for Specific Entity

```typescript
import { calculateEntityBalance } from './utils/BalanceCalculator';

const entityBalance = calculateEntityBalance(enrichedData, "gdn_zh", {
  year: "2022",
  language: 'en'
});

if (entityBalance) {
  console.log(`Balance: ${entityBalance.balance} ${entityBalance.currency}`);
}
```

### 3. Compare Two Entities

```typescript
import { compareEntityBalances } from './utils/BalanceCalculator';

const comparison = compareEntityBalances(enrichedData, "gdn_zh", "gdn_be", {
  year: "2022"
});

if (comparison.comparison) {
  console.log(`Balance difference: ${comparison.comparison.balanceDifference} CHF`);
  console.log(`Income ratio: ${comparison.comparison.incomeRatio}`);
}
```

### 4. Filter by Entity Type

```typescript
// Calculate only for municipalities
const gdnResult = calculateBalance(enrichedData, {
  year: "2022",
  entityTypes: ['GDN']
});

// Calculate only for cantons/federal
const stdResult = calculateBalance(enrichedData, {
  year: "2022",
  entityTypes: ['STD']
});
```

## Configuration Options

### calculateBalance Options

```typescript
{
  year?: string;                    // Filter by specific year
  entityTypes?: ('GDN' | 'STD')[];  // Filter by entity types
  language?: 'de' | 'fr' | 'it' | 'en'; // Language for descriptions
  includeBreakdown?: boolean;       // Include category breakdowns
}
```

### Language Support

- `de` - German (default)
- `fr` - French
- `it` - Italian
- `en` - English

## Return Types

### BalanceCalculationResult

```typescript
{
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
```

### EntityBalance

```typescript
{
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
```

## Error Handling

The calculator includes comprehensive error handling:

- **Empty data**: Throws error if input array is empty
- **Invalid data structure**: Validates required fields
- **Invalid numeric values**: Checks for NaN or non-numeric values
- **Missing year data**: Throws error if specified year has no data
- **Non-existent entities**: Returns null for entity-specific functions

## Testing

Run the test suite to verify functionality:

```bash
npm test
```

The tests include:
- ✅ Basic balance calculations
- ✅ Aggregate totals verification
- ✅ Entity type filtering
- ✅ Year filtering
- ✅ Category breakdowns
- ✅ Multi-language support
- ✅ Error handling scenarios
- ✅ Edge cases (missing data, mixed currencies, etc.)

## Performance Considerations

- Data is processed in-memory for fast calculations
- Category breakdowns are sorted by amount (descending)
- Efficient grouping and aggregation algorithms
- Minimal memory footprint for large datasets

## Integration with Existing Codebase

This calculator is designed to work with:
- Existing `CodelistMapper` for enriching data with descriptions
- Current data structure from `src/data/` directory
- TypeScript type definitions in `src/types/`
- Vite build system and testing framework

## Future Enhancements

Potential improvements could include:
- Time series analysis (multi-year comparisons)
- Budget vs actual comparisons
- Percentage-based analysis
- Export functionality (CSV, JSON)
- Visualization helpers
- Caching for large datasets
