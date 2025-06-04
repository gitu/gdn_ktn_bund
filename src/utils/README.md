# TreeAggregator Utility

The TreeAggregator utility provides functionality to calculate aggregated data using hierarchical tree structures. It's designed to work with Swiss financial data from municipalities (GDN) and standardized data (STD), using tree structures to properly aggregate values according to their hierarchical relationships.

## Features

- **Hierarchical Data Aggregation**: Automatically calculates parent node values by summing child node values
- **Multiple Data Formats**: Supports both GDN (municipality) and STD (standardized) data formats
- **Tree Structure Loading**: Dynamically loads tree structures from JSON files
- **Flexible Configuration**: Customizable language, base URL, and aggregation options
- **Error Handling**: Robust error handling with detailed error reporting
- **Caching**: Built-in caching for improved performance
- **Type Safety**: Full TypeScript support with comprehensive type definitions

## Installation

The TreeAggregator is part of the project's utilities. Import it directly:

```typescript
import { TreeAggregator, aggregateGdnData, aggregateStdData } from './utils/TreeAggregator';
```

## Quick Start

### Basic GDN Data Aggregation

```typescript
import { aggregateGdnData } from './utils/TreeAggregator';
import type { GdnDataRecord } from './types/DataStructures';

const gdnData: GdnDataRecord[] = [
  {
    jahr: '2023',
    nr: '001',
    gemeinde: 'Example Municipality',
    konto: '300',
    betrag: '150000'
  },
  // ... more records
];

const result = await aggregateGdnData(
  gdnData,
  'aufwand', // dimension
  '001',     // entity ID
  '2023'     // year
);

console.log('Aggregated data:', result.aggregatedData);
```

### Basic STD Data Aggregation

```typescript
import { aggregateStdData } from './utils/TreeAggregator';
import type { StdDataRecord } from './types/DataStructures';

const stdData: StdDataRecord[] = [
  {
    arten: '300',
    funk: '',
    jahr: '2023',
    value: '150000',
    dim: 'aufwand',
    hh: 'ktn_example',
    unit: 'CHF',
    model: 'fs'
  },
  // ... more records
];

const result = await aggregateStdData(
  stdData,
  'aufwand', // dimension
  'fs',      // model
  'ktn_example', // entity ID
  '2023'     // year
);

console.log('Aggregated data:', result.aggregatedData);
```

## Advanced Usage

### Custom Configuration

```typescript
import { TreeAggregator } from './utils/TreeAggregator';

const aggregator = new TreeAggregator({
  baseUrl: '/custom/data/path',
  language: 'fr',
  includeZeroValues: true,
  maxDepth: 5
});

const result = await aggregator.aggregateGdnData(data, 'aufwand', '001', '2023');
```

### Error Handling

```typescript
try {
  const result = await aggregateGdnData(data, 'aufwand', '001', '2023');
  
  if (result.errors && result.errors.length > 0) {
    console.warn('Aggregation completed with errors:', result.errors);
  }
  
  console.log('Successfully processed:', result.metadata.totalRecords, 'records');
} catch (error) {
  console.error('Aggregation failed:', error);
}
```

## API Reference

### TreeAggregator Class

#### Constructor

```typescript
new TreeAggregator(config?: TreeAggregationConfig)
```

**Parameters:**
- `config` (optional): Configuration object

**Configuration Options:**
- `baseUrl`: Base URL for loading tree structure files (default: '/data')
- `language`: Language for labels ('de', 'fr', 'it', 'en') (default: 'de')
- `includeZeroValues`: Include nodes with zero values in results (default: false)
- `maxDepth`: Maximum tree depth to process (default: 10)

#### Methods

##### `aggregateGdnData(data, dimension, entityId, year)`

Aggregates GDN (municipality) data using tree structures.

**Parameters:**
- `data`: Array of GdnDataRecord objects
- `dimension`: Data dimension (e.g., 'aufwand', 'ertrag', 'bilanz')
- `entityId`: Municipality identifier
- `year`: Data year

**Returns:** Promise<TreeAggregationResult>

##### `aggregateStdData(data, dimension, model, entityId, year)`

Aggregates STD (standardized) data using tree structures.

**Parameters:**
- `data`: Array of StdDataRecord objects
- `dimension`: Data dimension
- `model`: Data model (e.g., 'fs', 'gfs')
- `entityId`: Entity identifier
- `year`: Data year

**Returns:** Promise<TreeAggregationResult>

##### `loadTreeStructure(dimension, model?)`

Loads a tree structure from file.

**Parameters:**
- `dimension`: Tree dimension
- `model` (optional): Tree model

**Returns:** Promise<TreeStructure>

##### `clearCache()`

Clears the internal tree structure cache.

##### `getAvailableTreeStructures()`

Gets a list of available tree structure files.

**Returns:** Promise<string[]>

### Convenience Functions

#### `aggregateGdnData(data, dimension, entityId, year, config?)`

Convenience function for GDN data aggregation using default aggregator.

#### `aggregateStdData(data, dimension, model, entityId, year, config?)`

Convenience function for STD data aggregation using default aggregator.

## Data Structures

### TreeAggregationResult

```typescript
interface TreeAggregationResult {
  aggregatedData: AggregatedDataPoint[];
  metadata: {
    treeStructure: TreeStructure;
    totalRecords: number;
    processedAt: string;
    dimension: string;
    model?: string;
  };
  errors?: string[];
}
```

### AggregatedDataPoint

```typescript
interface AggregatedDataPoint {
  entityId: string;
  entityName: string;
  year: string;
  code: string;
  label: string;
  value: number;
  dimension: string;
  unit?: string;
}
```

## Tree Structure Files

Tree structure files should be placed in the `public/data/trees/` directory with the following naming convention:

- For dimension-only trees: `{dimension}-tree.json`
- For dimension-model trees: `{dimension}-{model}-tree.json`

Example: `aufwand-fs-tree.json`, `ertrag-gfs-tree.json`

## Testing

The TreeAggregator includes comprehensive unit tests. Run them with:

```bash
npm run test:unit
```

Test files are located in `src/utils/__tests__/TreeAggregator.spec.ts`.

## Performance Considerations

- Tree structures are cached after first load
- Use `clearCache()` when tree structures change
- Consider using `includeZeroValues: false` for better performance with large datasets
- The utility handles malformed data gracefully by skipping invalid records

## Error Handling

The TreeAggregator provides detailed error information:

- Invalid tree structure files
- Network errors when loading trees
- Malformed data records
- Missing or invalid numeric values

Errors are collected and returned in the result object, allowing the aggregation to continue processing valid data.
