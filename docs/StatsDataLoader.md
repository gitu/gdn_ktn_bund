# StatsDataLoader Utility

The `StatsDataLoader` utility provides a comprehensive interface for loading and working with Swiss statistical data from the `public/data/stats/stats.json` catalog.

## Features

- **Type-safe interfaces** for statistical data structures
- **Multilingual support** with automatic display name generation
- **Fast data access** with caching and singleton pattern
- **Flexible filtering** and search functionality
- **Data aggregation** for federal-level statistics
- **Comparison tools** for year-over-year analysis
- **Statistical analysis** with summary calculations
- **CSV parsing** using Papa Parse with proper error handling

## Data Sources

The utility loads data from:
- `/public/data/stats/stats.json` - Statistical data catalog
- `/public/data/stats/[category]/[type]/[year].csv` - Individual CSV data files

## Basic Usage

### Loading Available Statistics

```typescript
import { getAvailableStatistics } from '../utils/StatsDataLoader';

// Get list of all available statistics
const availableStats = await getAvailableStatistics();
console.log(availableStats);
// Output: [{ id: 'pop', name: {...}, availableKtnYears: [2023], ... }]
```

### Quick Population Access

```typescript
import { 
  getCantonPopulation, 
  getMunicipalityPopulation, 
  getSwissPopulation 
} from '../utils/StatsDataLoader';

// Get population for Canton Zurich (ID: 1)
const zurichPop = await getCantonPopulation('1', 2023);
console.log(`Zurich population: ${zurichPop}`);

// Get population for a specific municipality
const municipalityPop = await getMunicipalityPopulation('261', 2023); // Zurich city
console.log(`Municipality population: ${municipalityPop}`);

// Get total Swiss population
const swissPop = await getSwissPopulation(2023);
console.log(`Swiss population: ${swissPop}`);
```

### Advanced Usage with StatsDataLoader Class

```typescript
import { StatsDataLoader } from '../utils/StatsDataLoader';

const loader = StatsDataLoader.getInstance();

// Load canton-level data with filters
const ktnData = await loader.loadKtnData('pop', 2023, {
  geoIds: ['1', '2'], // Only Zurich and Bern
  minValue: 1000000   // Only cantons with > 1M population
});

// Load municipality data with search
const municipalities = await loader.searchMunicipalities('pop', 2023, 'Zurich');

// Get top 10 most populous cantons
const topCantons = await loader.getTopEntities('pop', 2023, 'ktn', 10);

// Get federal-level aggregated data
const bundData = await loader.getBundData('pop', 2023);
console.log(`Total Swiss population: ${bundData.totalValue}`);
```

## Data Analysis Features

### Year-over-Year Comparison

```typescript
// Compare population changes between 2022 and 2023
const comparison = await loader.compareYears('pop', 2022, 2023, 'ktn');

comparison.changes.forEach(change => {
  console.log(`${change.geoName}: ${change.percentageChange.toFixed(2)}% change`);
});
```

### Statistical Summary

```typescript
// Get statistical summary for canton population data
const summary = await loader.getStatsSummary('pop', 2023, 'ktn');

console.log(`Average canton population: ${summary.average.toFixed(0)}`);
console.log(`Largest canton: ${summary.max.entity} (${summary.max.value})`);
console.log(`Smallest canton: ${summary.min.entity} (${summary.min.value})`);
```

## Data Structures

### StatsDataEntry
```typescript
interface StatsDataEntry {
  id: string;                    // e.g., "pop"
  name: MultiLanguageLabels;     // Multilingual names
  unit: MultiLanguageLabels;     // Multilingual units
  source: string;                // Data source
  lastUpdate: string;            // Last update date
  data: {
    ktn?: StatsDataFile[];       // Canton-level files
    gdn?: StatsDataFile[];       // Municipality-level files
  };
}
```

### ProcessedStatsRecord
```typescript
interface ProcessedStatsRecord {
  geoId: string;        // Geographic ID
  geoName: string;      // Geographic name
  value: number;        // Numerical value
  unit: string;         // Unit of measurement
  year: number;         // Data year
  status: string;       // Status code
  source: string;       // Data source
  lastUpdate: string;   // Last update
}
```

## Configuration Options

```typescript
const config = {
  language: 'en',           // Language for error messages
  includeMetadata: true,    // Include detailed metadata
  validateData: true        // Validate data integrity
};

const loader = StatsDataLoader.getInstance(config);
```

## Error Handling

The utility provides comprehensive error handling:

```typescript
try {
  const data = await loader.loadKtnData('pop', 2023);
} catch (error) {
  if (error.message.includes('not found')) {
    console.error('Statistics entry not found');
  } else if (error.message.includes('not available')) {
    console.error('Data not available for specified year');
  } else {
    console.error('Unexpected error:', error.message);
  }
}
```

## Integration with Other Components

The StatsDataLoader is designed to work seamlessly with other utilities:

```typescript
import { EntitySemanticMapper } from '../utils/EntitySemanticMapper';
import { GeographicalDataLoader } from '../utils/GeographicalDataLoader';

// Combine with geographical data
const geoLoader = GeographicalDataLoader.getInstance();
const cantons = await geoLoader.getAllCantons();

// Get population for each canton
const populationData = await Promise.all(
  cantons.map(async canton => ({
    ...canton,
    population: await getCantonPopulation(canton.cantonId, 2023)
  }))
);
```

## Performance Considerations

- **Singleton pattern**: Only one instance is created per application
- **Catalog caching**: Stats catalog is loaded once and cached
- **Efficient filtering**: Filters are applied after parsing to minimize data processing
- **Promise-based**: All operations are asynchronous for better performance

## Testing

The utility includes comprehensive unit tests covering:
- Catalog loading and caching
- Data loading for both canton and municipality levels
- Filtering and search functionality
- Error handling scenarios
- Statistical calculations

Run tests with:
```bash
npm run test -- StatsDataLoader.spec.ts
```
