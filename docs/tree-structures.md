# Tree Structure Implementation

This document describes the implementation of hierarchical tree structures for Swiss financial data navigation and organization.

## Overview

The tree structure system provides a standardized way to represent and navigate hierarchical financial data from Swiss municipalities and cantons. It supports multiple languages, search functionality, and interactive navigation.

## Architecture

### Core Components

1. **Tree Generation Script** (`scripts/generateTreeStructures.js`)
   - Processes fixture CSV files and code definitions
   - Generates hierarchical JSON tree structures
   - Supports multiple data dimensions and models

2. **TypeScript Interfaces** (`src/types/DataStructures.ts`)
   - Defines type-safe interfaces for tree nodes and metadata
   - Supports multi-language labels and data loading options

3. **Data Loader Utility** (`src/utils/DataLoader.ts`)
   - Handles CSV and JSON data loading with caching
   - Provides search and navigation utilities
   - Implements retry logic and error handling

4. **Vue Components**
   - `TreeNavigator.vue`: Main tree navigation component
   - `TreeNode.vue`: Individual tree node component

### Data Structure

#### Tree Node Format
```typescript
interface TreeNode {
  code: string;                    // Account code (e.g., "4000")
  labels: MultiLanguageLabels;     // Labels in DE, FR, IT, EN
  children: TreeNode[];            // Child nodes
  level: number;                   // Hierarchy level
  hasValue: boolean;               // Whether node has data value
  value?: string | number | null;  // Actual data value
  funk?: string;                   // Function code (optional)
}
```

#### Multi-Language Support
```typescript
interface MultiLanguageLabels {
  de: string;  // German
  fr: string;  // French
  it: string;  // Italian
  en: string;  // English
}
```

## Generated Tree Files

The system generates tree structure files in `public/data/trees/`:

### From Fixture Data
- `ertrag-tree.json` - Revenue hierarchy from fixture data
- `aufwand-tree.json` - Expenditure hierarchy from fixture data
- `bilanz-tree.json` - Balance sheet hierarchy from fixture data

### From Code Definitions
- `{dimension}-{model}-tree.json` - Complete hierarchies from code definitions
- Examples: `bilanz-fs-tree.json`, `ertrag-gfs-tree.json`

## Usage

### Generating Tree Structures
```bash
node scripts/generateTreeStructures.js
```

### Using in Vue Components
```vue
<template>
  <TreeNavigator
    dimension="ertrag"
    model="fs"
    title="Revenue Structure"
    @node-selected="handleNodeSelection"
    @search-results="handleSearchResults"
  />
</template>

<script setup>
import TreeNavigator from '@/components/TreeNavigator.vue';

const handleNodeSelection = (nodeCode, nodeData) => {
  console.log('Selected:', nodeCode, nodeData);
};
</script>
```

### Data Loading
```typescript
import { DataLoader } from '@/utils/DataLoader';

const dataLoader = new DataLoader();

// Load tree structure
const treeStructure = await dataLoader.loadTreeStructure('ertrag', 'fs');

// Search tree nodes
const results = dataLoader.searchTreeNodes(
  treeStructure.tree, 
  'steuer', 
  'de'
);

// Get node path
const path = dataLoader.getNodePath(treeStructure.tree, '4000');
```

## Features

### Interactive Navigation
- Expandable/collapsible tree nodes
- Multi-level hierarchy support
- Visual indicators for nodes with values
- Responsive design for mobile devices

### Search Functionality
- Real-time search across node codes and labels
- Multi-language search support
- Automatic expansion of matching nodes
- Search result highlighting

### Multi-Language Support
- Dynamic language switching
- Fallback to German if translation missing
- Consistent labeling across all components

### Data Integration
- Seamless integration with existing CSV data structure
- Support for both GDN and STD data models
- Caching for improved performance
- Error handling and retry logic

## Data Sources

### Input Files
1. **Fixture Files** (`fixtures/`)
   - `gdn_ag-2019-ertrag-de.csv`
   - `gdn_ag-2019-aufwand-de.csv`
   - `gdn_ag-2019-bilanz-de.csv`

2. **Code Definition Files** (`public/data/codes/`)
   - `{dimension}/{model}.csv`
   - Contains multilingual labels and metadata

### Output Structure
```
public/data/trees/
├── ertrag-tree.json              # From fixture data
├── aufwand-tree.json             # From fixture data
├── bilanz-tree.json              # From fixture data
├── ertrag-fs-tree.json           # From code definitions
├── ertrag-gfs-tree.json          # From code definitions
├── bilanz-fs-tree.json           # From code definitions
└── ...                           # Additional combinations
```

## Hierarchical Organization

The tree structures follow Swiss financial accounting standards:

### Account Code Hierarchy
- **Level 1**: Main categories (e.g., "4" = Ertrag)
- **Level 2**: Sub-categories (e.g., "40" = Fiskalertrag)
- **Level 3**: Detailed categories (e.g., "400" = Direkte Steuern natürliche Personen)
- **Level 4+**: Specific accounts (e.g., "4000" = Einkommenssteuern natürliche Personen)

### Data Dimensions
- **ertrag**: Revenue and income categories
- **aufwand**: Expenditure and cost categories
- **bilanz**: Balance sheet items (assets and liabilities)
- **einnahmen**: Receipt categories
- **ausgaben**: Expense categories

## Performance Considerations

### Caching Strategy
- In-memory caching with configurable TTL
- LRU eviction policy
- Separate cache keys for different data types

### Optimization Features
- Lazy loading of tree nodes
- Virtual scrolling for large trees (future enhancement)
- Debounced search input
- Efficient tree traversal algorithms

## Future Enhancements

1. **Virtual Scrolling**: For very large tree structures
2. **Export Functionality**: Export selected tree branches
3. **Comparison Mode**: Side-by-side tree comparison
4. **Data Visualization**: Integration with charts and graphs
5. **Advanced Filtering**: Filter by value ranges, dates, etc.

## Testing

The tree structure system includes:
- Unit tests for data loading utilities
- Component tests for Vue components
- Integration tests for tree generation
- Performance tests for large datasets

## Contributing

When adding new dimensions or models:
1. Add code definition files to `public/data/codes/{dimension}/`
2. Update the tree generation script if needed
3. Add TypeScript interfaces for new data types
4. Update documentation and tests
