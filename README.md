# Swiss Financial Data Comparison Tool

A Vue.js 3 web application with Vuetify UI framework for comparing financial data between Swiss municipalities (Gemeinden), cantons, and federal entities. The application provides interactive visualizations, detailed analysis, and enriched data display with multi-language support.

## Live Demo

The application is deployed and can be visited at: **https://gdn.gitu.cc/**

## Features

- Compare financial data between different municipalities
- View data for different years
- Scale data to match totals for better comparison
- Visual representation of financial data
- **NEW**: Calculate financial balances (income - expenses) for GDN and STD entities
- **NEW**: Multi-language support for financial descriptions (German, French, Italian, English)
- **NEW**: Detailed category breakdowns for income and expenses
- **NEW**: Entity comparison and year-over-year analysis
- **NEW**: Comprehensive data enrichment with code descriptions

## Data Loading

The application loads data at compile time rather than through the GUI. This approach has several advantages:

1. **Faster startup**: Data is bundled with the application, eliminating the need for users to upload files
2. **Consistent data**: All users see the same data, ensuring consistent comparisons
3. **Version control**: Data is versioned along with the code
4. **Simplified user experience**: Users don't need to know which files to upload

### Data Preparation

The data is split into smaller files based on municipality and year to make it easier to manage and load. A Node.js script is provided to automate this process:

```bash
# Run the data splitting script
node scripts/split-csv.js
```

This script:
1. Reads the source CSV files from `src/data/`
2. Splits them by municipality and year
3. Saves the resulting files in `src/data/split/`

The application then loads these split files at compile time using Vite's import mechanism.

### Adding New Data

To add new data to the application:

1. Place the new CSV files in the `src/data/` directory
2. Run the data splitting script to process the new files
3. Update the `availableMunicipalities` and `availableYears` arrays in `src/utils/DataLoader.ts` if necessary
4. Rebuild the application

The application will automatically use the latest year's data by default, with the option to switch to older data.

## Implementation Details

### Data Loading Mechanism

The application uses a compile-time data loading mechanism implemented in `src/utils/DataLoader.ts`. This module:

1. Provides functions to access data for different municipalities and years
2. Automatically determines the latest available year
3. Loads data from pre-split CSV files

In a production environment, you would use Vite's `import.meta.glob` feature to dynamically import all CSV files:

```typescript
// Example of how to dynamically import all municipality files
const municipalityFiles = import.meta.glob('../data/split/gemeinde/*.csv', { eager: true });

// Example of how to dynamically import all year-municipality files
const yearMunicipalityFiles = import.meta.glob('../data/split/jahr_gemeinde/**/*.csv', { eager: true });
```

### Project Structure

- `src/components/`: React components
- `src/utils/`: Utility functions, including:
  - `DataLoader.ts`: Data loading utilities
  - `BalanceCalculator.ts`: **NEW** - Financial balance calculation functions
  - `DataEnricher.ts`: **NEW** - Data enrichment with code descriptions
  - `CodelistMapper.ts`: Code mapping and description utilities
- `src/types/`: TypeScript type definitions
- `src/data/`: Source data files
  - `src/data/codes/`: Financial code descriptions in multiple languages
  - `src/data/std/`: Standard financial data (GDN and STD entities)
  - `src/data/gdn/`: Municipality-specific data
- `src/examples/`: **NEW** - Usage examples and integration demos
- `scripts/`: Utility scripts, including the data processing script

## Balance Calculator

The application now includes a comprehensive balance calculation system for Swiss financial data:

### Key Features

- **Automatic Classification**: Distinguishes between income and expense dimensions
- **Entity Type Support**: Handles both GDN (municipalities) and STD (cantons/federal) entities
- **Multi-language Descriptions**: Supports German, French, Italian, and English
- **Category Breakdowns**: Detailed analysis of income and expense categories
- **Comparison Tools**: Compare entities and analyze year-over-year changes
- **Data Validation**: Comprehensive error handling and data validation

### Quick Start

```typescript
import { calculateBalance, enrichFinancialData } from './utils/BalanceCalculator';

// 1. Enrich raw data with descriptions
const enrichedData = await enrichFinancialData(rawData, 'de');

// 2. Calculate balances
const result = calculateBalance(enrichedData, {
  year: "2022",
  language: 'de',
  includeBreakdown: true
});

// 3. Access results
console.log(`GDN Total Balance: ${result.aggregateTotals.gdnTotals.balance} CHF`);
console.log(`STD Total Balance: ${result.aggregateTotals.stdTotals.balance} CHF`);
```

### Testing

Run the comprehensive test suite:

```bash
npm test                 # Run all tests
npm run test:watch      # Run tests in watch mode
npm run test:ui         # Run tests with UI
npm run test:coverage   # Run tests with coverage report
```

### Examples

See `src/examples/` for detailed usage examples:
- `BalanceCalculatorExample.ts` - Basic usage examples
- `FullIntegrationExample.ts` - Complete workflow demonstration

For detailed documentation, see `src/utils/README.md`.

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config({
  extends: [
    // Remove ...tseslint.configs.recommended and replace with this
    ...tseslint.configs.recommendedTypeChecked,
    // Alternatively, use this for stricter rules
    ...tseslint.configs.strictTypeChecked,
    // Optionally, add this for stylistic rules
    ...tseslint.configs.stylisticTypeChecked,
  ],
  languageOptions: {
    // other options...
    parserOptions: {
      project: ['./tsconfig.node.json', './tsconfig.app.json'],
      tsconfigRootDir: import.meta.dirname,
    },
  },
})
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config({
  plugins: {
    // Add the react-x and react-dom plugins
    'react-x': reactX,
    'react-dom': reactDom,
  },
  rules: {
    // other rules...
    // Enable its recommended typescript rules
    ...reactX.configs['recommended-typescript'].rules,
    ...reactDom.configs.recommended.rules,
  },
})
```

## Development Notes

**AI-Generated Codebase**: This entire repository was generated using multiple AI agents with only slight modifications done by hand. The project demonstrates the capabilities of AI-assisted development for creating complete, functional web applications.