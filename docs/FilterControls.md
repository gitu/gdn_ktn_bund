# FilterControls Component

A comprehensive Vue.js component for configuring and applying account code filtering in the financial data processing system.

## Overview

The FilterControls component provides a user-friendly interface for:
- Enabling/disabling account code filtering
- Creating custom filter rules with multiple pattern types
- Using predefined filter presets
- Previewing filter results and statistics
- Applying filters to the financial data

## Features

### 🎯 **Core Functionality**
- **Toggle-based activation**: Enable/disable filtering with a simple toggle
- **Multiple pattern types**: Support for `startsWith`, `endsWith`, `contains`, `exact`, and `regex` patterns
- **Include/exclude rules**: Flexible rule actions for including or excluding account codes
- **Rule combination**: AND/OR logic for combining multiple filter rules

### 🔧 **User Experience**
- **Predefined presets**: Quick access to common filtering scenarios
- **Real-time validation**: Immediate feedback for invalid patterns (especially regex)
- **Filter preview**: Statistics showing active rules and filtering impact
- **Debug logging**: Optional logging for troubleshooting filtered data

### 📊 **Integration**
- **Store integration**: Seamlessly connects to the financial data store
- **Automatic reloading**: Applies filters and reloads data automatically
- **Event emission**: Notifies parent components of configuration changes

## Usage

### Basic Integration

```vue
<template>
  <FilterControls
    @filters-applied="handleFiltersApplied"
    @filters-reset="handleFiltersReset"
    @config-changed="handleFilterConfigChanged"
  />
</template>

<script setup>
import FilterControls from '@/components/FilterControls.vue'

const handleFiltersApplied = (config) => {
  console.log('Filters applied:', config)
}

const handleFiltersReset = () => {
  console.log('Filters reset')
}

const handleFilterConfigChanged = (config) => {
  console.log('Filter config changed:', config)
}
</script>
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `showAdvanced` | `boolean` | `true` | Show advanced configuration options |
| `compact` | `boolean` | `false` | Compact mode for smaller spaces |

### Events

| Event | Payload | Description |
|-------|---------|-------------|
| `filters-applied` | `AccountCodeFilterConfig` | Emitted when filters are applied |
| `filters-reset` | - | Emitted when filters are reset |
| `config-changed` | `AccountCodeFilterConfig` | Emitted when configuration changes |

## Filter Configuration

### Pattern Types

1. **Starts With**: Matches account codes that start with the specified pattern
   - Example: Pattern `"36"` matches `"3600"`, `"3650"`, etc.

2. **Ends With**: Matches account codes that end with the specified pattern
   - Example: Pattern `"00"` matches `"3600"`, `"4100"`, etc.

3. **Contains**: Matches account codes that contain the specified pattern
   - Example: Pattern `"99"` matches `"3990"`, `"4199"`, etc.

4. **Exact Match**: Matches account codes that exactly equal the pattern
   - Example: Pattern `"3600"` matches only `"3600"`

5. **Regular Expression**: Matches account codes using regex patterns
   - Example: Pattern `"^[34]\\d{3}$"` matches 4-digit codes starting with 3 or 4

### Rule Actions

- **Include**: Only account codes matching this rule will be included
- **Exclude**: Account codes matching this rule will be excluded

### Combination Modes

- **AND**: All rules must be satisfied (more restrictive)
- **OR**: Any rule can be satisfied (less restrictive)

## Predefined Presets

The component includes several predefined filter presets:

### 1. Exclude Transfer Expenses
- **Purpose**: Remove transfer expenses (account codes starting with "36")
- **Use case**: Avoid double-counting in financial analysis
- **Pattern**: `startsWith "36"`

### 2. Exclude Internal Transfers
- **Purpose**: Remove both transfer expenses (36xx) and internal transfers (39xx)
- **Use case**: Broader exclusion of internal transfer accounts
- **Patterns**: `startsWith "36"` AND `startsWith "39"`

### 3. Operational Accounts Only
- **Purpose**: Include only operational revenue (4xxx) and expense (3xxx) accounts
- **Use case**: Focus analysis on operational activities
- **Pattern**: `regex "^[34]"`

### 4. Revenue Analysis
- **Purpose**: Include only revenue accounts (4xxx)
- **Use case**: Revenue-focused analysis
- **Pattern**: `startsWith "4"`

### 5. Expense Analysis (No Transfers)
- **Purpose**: Include expense accounts (3xxx) but exclude transfer expenses (36xx)
- **Use case**: Expense analysis without transfer noise
- **Patterns**: `startsWith "3"` AND NOT `startsWith "36"`

## Programmatic Usage

### Using FilterPresets Utility

```typescript
import { FilterPresets } from '@/utils/FilterPresets'

// Get all available presets
const presets = FilterPresets.getAllPresets()

// Apply a specific preset
const transferExclusionConfig = FilterPresets.excludeTransferExpenses()

// Create custom exclusion patterns
const customConfig = FilterPresets.excludePatterns(['36', '39'])

// Create custom inclusion patterns
const operationalConfig = FilterPresets.includePatterns(['3', '4'])
```

### Direct Store Integration

```typescript
import { useFinancialDataStore } from '@/stores/financialData'

const store = useFinancialDataStore()

// Update filter configuration
store.updateFilterConfig({
  enabled: true,
  rules: [
    {
      id: 'exclude-transfers',
      name: 'Exclude Transfer Expenses',
      type: 'startsWith',
      pattern: '36',
      enabled: true,
      action: 'exclude'
    }
  ],
  combineMode: 'AND',
  logFiltered: false
})

// Reset filters
store.resetFilterConfig()
```

## Styling and Theming

The component uses PrimeVue components and follows the existing design system:

- **Cards**: Organized sections with clear visual hierarchy
- **Responsive design**: Adapts to different screen sizes
- **Dark mode support**: Automatically adapts to theme changes
- **Consistent spacing**: Follows the application's design tokens

## Accessibility

The component includes proper accessibility features:

- **ARIA labels**: All interactive elements have descriptive labels
- **Keyboard navigation**: Full keyboard support for all interactions
- **Screen reader support**: Proper semantic markup and announcements
- **Focus management**: Clear focus indicators and logical tab order

## Performance Considerations

- **Efficient filtering**: Minimal overhead when filtering is disabled
- **Debounced validation**: Regex validation is optimized to prevent excessive computation
- **Lazy loading**: Complex UI elements are only rendered when needed
- **Memory management**: Proper cleanup of event listeners and watchers

## Integration Location

The FilterControls component is integrated into the main financial comparison view:

**File**: `src/views/FinancialDataComparisonView.vue`

**Location**: Between the dataset selection and comparison results sections

This placement ensures users can configure filtering after selecting datasets but before viewing results, providing a logical workflow for data analysis.

## Future Enhancements

Potential improvements for the FilterControls component:

1. **Saved filter profiles**: Allow users to save and load custom filter configurations
2. **Advanced pattern builder**: Visual interface for building complex regex patterns
3. **Filter impact preview**: Show estimated impact before applying filters
4. **Bulk operations**: Import/export filter configurations
5. **Performance metrics**: Display filtering performance statistics
6. **Conditional rules**: Rules that depend on other data attributes beyond account codes

## Troubleshooting

### Common Issues

1. **Regex validation errors**: Ensure regex patterns are valid JavaScript regular expressions
2. **No data after filtering**: Check if filter rules are too restrictive
3. **Performance issues**: Disable debug logging in production environments
4. **Store synchronization**: Ensure the financial data store is properly initialized

### Debug Mode

Enable debug logging to troubleshoot filtering issues:

```typescript
// Enable debug logging
store.updateFilterConfig({
  logFiltered: true
})
```

This will log detailed information about filtered account codes to the browser console.
