# GeographicalDataLoader Utility

A comprehensive TypeScript utility for loading and working with Swiss geographical data (cantons and municipalities).

## Overview

The `GeographicalDataLoader` utility provides a type-safe, efficient way to work with Swiss geographical data. It loads data from CSV files, creates indexes for fast lookups, and provides a rich API for searching and filtering.

## Features

- **Type-safe interfaces** for cantons and municipalities
- **Multilingual support** with automatic display name generation
- **Fast lookups** using indexed data structures
- **Search functionality** with flexible filtering options
- **GDN ID utilities** for validation and manipulation
- **Statistics** and aggregation functions
- **Singleton pattern** with caching for performance
- **Comprehensive error handling**

## Data Sources

The utility loads data from:
- `/public/data/cantons.csv` - Swiss canton information
- `/public/data/municipalities.csv` - Swiss municipality information

## Basic Usage

### Loading All Data

```typescript
import { getAllCantons, getAllMunicipalities } from '../utils/GeographicalDataLoader';

// Get all Swiss cantons
const cantons = await getAllCantons();
console.log(`Total cantons: ${cantons.length}`);

// Get all Swiss municipalities  
const municipalities = await getAllMunicipalities();
console.log(`Total municipalities: ${municipalities.length}`);
```

### Looking Up Specific Data

```typescript
import { 
  getCantonById, 
  getCantonByAbbreviation, 
  getMunicipalityByGdnId,
  getMunicipalitiesByCantonAbbreviation 
} from '../utils/GeographicalDataLoader';

// Get canton by ID
const zurich = await getCantonById('1');
console.log(zurich?.cantonLongName); // "Zürich"

// Get canton by abbreviation
const bern = await getCantonByAbbreviation('BE');
console.log(bern?.displayNames?.fr); // "Berne"

// Get municipality by GDN ID
const winterthur = await getMunicipalityByGdnId('0100230');
console.log(winterthur?.municipalityLongName); // "Winterthur"

// Get all municipalities in a canton
const zurichMunicipalities = await getMunicipalitiesByCantonAbbreviation('ZH');
console.log(`Zurich has ${zurichMunicipalities.length} municipalities`);
```

### Search Functionality

```typescript
import { searchGeographicalData } from '../utils/GeographicalDataLoader';

// Search by name
const results = await searchGeographicalData({ 
  searchQuery: 'Basel' 
});

// Search with filters
const filteredResults = await searchGeographicalData({
  searchQuery: 'Bern',
  cantonAbbreviations: ['BE', 'SO']
});

// Search with configuration
const configuredResults = await searchGeographicalData(
  { searchQuery: 'zürich' },
  { 
    language: 'de',
    caseSensitiveSearch: false,
    includeMultilingualLabels: true 
  }
);
```

## Advanced Usage

### Working with GDN IDs

```typescript
import { GeographicalDataLoader } from '../utils/GeographicalDataLoader';

// Validate GDN ID format
const isValid = GeographicalDataLoader.validateGdnId('0100230'); // true

// Extract canton ID from GDN ID
const cantonId = GeographicalDataLoader.extractCantonIdFromGdnId('0100230'); // "01"

// Extract municipality ID from GDN ID
const municipalityId = GeographicalDataLoader.extractMunicipalityIdFromGdnId('0100230'); // "00230"

// Format GDN ID from components
const gdnId = GeographicalDataLoader.formatGdnId('1', '230'); // "0100230"
```

### Statistics and Aggregation

```typescript
import { GeographicalDataLoader } from '../utils/GeographicalDataLoader';

const loader = GeographicalDataLoader.getInstance();

// Get canton statistics
const stats = await loader.getCantonStatistics();
for (const [cantonId, stat] of stats.entries()) {
  console.log(`${stat.cantonName}: ${stat.municipalityCount} municipalities`);
}
```

### Direct Catalog Access

```typescript
import { loadGeographicalDataCatalog } from '../utils/GeographicalDataLoader';

// Load the complete catalog with indexes
const catalog = await loadGeographicalDataCatalog();

// Use indexes for fast lookups
const canton = catalog.indexes.cantonById.get('1');
const municipality = catalog.indexes.municipalityByGdnId.get('0100230');
const municipalitiesInZurich = catalog.indexes.municipalitiesByCantonAbbreviation.get('ZH');
```

## TypeScript Interfaces

### Canton

```typescript
interface Canton {
  cantonId: string;              // "1", "2", etc.
  cantonAbbreviation: string;    // "ZH", "BE", etc.
  cantonLongName: string;        // "Zürich", "Bern / Berne", etc.
  displayNames?: MultiLanguageLabels;
}
```

### Municipality

```typescript
interface Municipality {
  cantonId: string;              // "1", "2", etc.
  cantonAbbreviation: string;    // "ZH", "BE", etc.
  municipalityId: string;        // "230", "4001", etc.
  municipalityLongName: string;  // "Winterthur", "Aarau", etc.
  gdnId: string;                 // "0100230", "1904001", etc.
  displayNames?: MultiLanguageLabels;
}
```

### GeographicalDataCatalog

```typescript
interface GeographicalDataCatalog {
  cantons: Canton[];
  municipalities: Municipality[];
  indexes: {
    cantonById: Map<string, Canton>;
    cantonByAbbreviation: Map<string, Canton>;
    municipalityByGdnId: Map<string, Municipality>;
    municipalitiesByCantonId: Map<string, Municipality[]>;
    municipalitiesByCantonAbbreviation: Map<string, Municipality[]>;
  };
}
```

## Integration with Existing Code

### With EntitySemanticMapper

```typescript
import { getMunicipalityByGdnId } from '../utils/GeographicalDataLoader';
import { EntitySemanticMapper } from '../utils/EntitySemanticMapper';

// Get municipality data
const municipality = await getMunicipalityByGdnId('0100230');

// Use with EntitySemanticMapper for semantic interpretation
const entityCode = `gdn_${municipality?.cantonAbbreviation.toLowerCase()}`;
const semanticName = EntitySemanticMapper.getEntityDisplayName(entityCode);
```

### With AvailableDataLoader

```typescript
import { getAllMunicipalities } from '../utils/GeographicalDataLoader';
import { loadAvailableDataCatalog } from '../utils/AvailableDataLoader';

// Get geographical data
const municipalities = await getAllMunicipalities();

// Get available financial data
const availableData = await loadAvailableDataCatalog();

// Find municipalities with financial data
const municipalitiesWithData = municipalities.filter(municipality =>
  availableData.some(entry => 
    entry.type === 'gdn' && entry.municipalityNumber === municipality.gdnId
  )
);
```

## Performance Considerations

- **Caching**: Data is cached after first load using singleton pattern
- **Indexes**: Fast O(1) lookups using Map-based indexes
- **Lazy Loading**: Data is only loaded when first accessed
- **Memory Efficient**: Shared instance across application

## Error Handling

The utility includes comprehensive error handling:

```typescript
try {
  const cantons = await getAllCantons();
} catch (error) {
  console.error('Failed to load geographical data:', error);
  // Handle error appropriately
}
```

## Testing

Comprehensive unit tests are available in `src/utils/__tests__/GeographicalDataLoader.test.ts`.

Run tests with:
```bash
npm run test GeographicalDataLoader
```

## Examples

See `src/examples/GeographicalDataExample.ts` for comprehensive usage examples.

## API Reference

### Convenience Functions

- `loadGeographicalDataCatalog()` - Load complete catalog
- `getAllCantons()` - Get all cantons
- `getAllMunicipalities()` - Get all municipalities
- `getCantonById(id)` - Get canton by ID
- `getCantonByAbbreviation(abbr)` - Get canton by abbreviation
- `getMunicipalityByGdnId(gdnId)` - Get municipality by GDN ID
- `getMunicipalitiesByCantonAbbreviation(abbr)` - Get municipalities by canton
- `searchGeographicalData(filters, config)` - Search with filters

### Static Utilities

- `GeographicalDataLoader.validateGdnId(gdnId)` - Validate GDN ID format
- `GeographicalDataLoader.extractCantonIdFromGdnId(gdnId)` - Extract canton ID
- `GeographicalDataLoader.extractMunicipalityIdFromGdnId(gdnId)` - Extract municipality ID
- `GeographicalDataLoader.formatGdnId(cantonId, municipalityId)` - Format GDN ID
