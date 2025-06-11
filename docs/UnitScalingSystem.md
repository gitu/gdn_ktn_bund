# Unit Scaling Translation System

## Overview

The Unit Scaling Translation System provides a centralized, configurable solution for formatting large numbers with appropriate unit abbreviations (K, M, B, T) across multiple languages. This system eliminates hardcoded unit translations and provides a consistent, maintainable approach to number formatting throughout the application.

## Features

- **Multi-language support** - German, English, French, and Italian
- **Configurable scaling thresholds** - Customize when scaling is applied
- **Flexible unit formats** - Choose between abbreviated (K, M, B) or full names (Thousand, Million, Billion)
- **Currency integration** - Built-in support for currency formatting with scaling
- **Vue.js integration** - Reactive composables for seamless Vue component integration
- **TypeScript support** - Full type safety and IntelliSense support
- **Extensible design** - Easy to add new units or languages

## Architecture

### Core Components

1. **UnitScalingFormatter** (`src/utils/UnitScalingFormatter.ts`)
   - Core formatting logic
   - Configuration management
   - Locale-aware number formatting

2. **Vue Composables** (`src/composables/useUnitScaling.ts`)
   - `useUnitScaling()` - Basic reactive formatting
   - `useSimpleUnitScaling()` - Simplified interface
   - `useConfigurableUnitScaling()` - Full user preference management

3. **Translation Files** (`src/i18n/locales/*.json`)
   - Centralized unit translations
   - Consistent terminology across languages

## Usage Examples

### Basic Usage

```typescript
import { formatWithUnits } from '@/utils/UnitScalingFormatter'

// Simple number formatting
const result = formatWithUnits(1500, 'en')
console.log(result.formatted) // "1.5K"

// Currency formatting
const currencyResult = formatCurrencyWithUnits(2500000, 'en', 'CHF')
console.log(currencyResult.formatted) // "CHF2.5M"
```

### Vue Component Integration

```vue
<template>
  <div>
    <p>{{ formatNumber(1500) }}</p>
    <p>{{ formatCurrency(2500000) }}</p>
    
    <!-- User controls -->
    <button @click="toggleScaling">
      {{ userPreferences.enableScaling ? 'Disable' : 'Enable' }} Scaling
    </button>
    <button @click="toggleAbbreviation">
      Use {{ userPreferences.preferAbbreviated ? 'Full' : 'Abbreviated' }} Units
    </button>
  </div>
</template>

<script setup>
import { useConfigurableUnitScaling } from '@/composables/useUnitScaling'

const {
  formatNumber,
  formatCurrency,
  userPreferences,
  toggleScaling,
  toggleAbbreviation,
} = useConfigurableUnitScaling()
</script>
```

### Advanced Configuration

```typescript
import { UnitScalingFormatter } from '@/utils/UnitScalingFormatter'

const formatter = new UnitScalingFormatter({
  threshold: 500,        // Scale numbers >= 500
  precision: 2,          // Show 2 decimal places
  useAbbreviated: false, // Use full unit names
})

const result = formatter.format(1567, 'en')
console.log(result.formatted) // "1.57Thousand"
```

## Configuration Options

### UnitScalingConfig

```typescript
interface UnitScalingConfig {
  threshold: number      // Minimum value to apply scaling (default: 1000)
  precision: number      // Maximum decimal places (default: 1)
  useAbbreviated: boolean // Use abbreviated units (default: true)
  forceLocale?: string   // Override locale detection
}
```

### Scaling Units

The system supports the following scaling units by default:

| Factor | English | German | French | Italian |
|--------|---------|--------|--------|---------|
| 1,000 | K | T | k | k |
| 1,000,000 | M | Mio | M | Mln |
| 1,000,000,000 | B | Mrd | Md | Mrd |
| 1,000,000,000,000 | T | T | T | T |

## Localization

### Adding New Languages

1. Add translations to locale files:

```json
// src/i18n/locales/es.json
{
  "unitScaling": {
    "units": {
      "thousand": {
        "abbreviated": "k",
        "full": "Mil"
      },
      "million": {
        "abbreviated": "M",
        "full": "Millón"
      }
    }
  }
}
```

2. Update the scaling units configuration:

```typescript
const spanishUnits: ScalingUnit[] = [
  {
    factor: 1000,
    abbreviated: { es: 'k', en: 'K', de: 'T', fr: 'k', it: 'k' },
    full: { es: 'Mil', en: 'Thousand', de: 'Tausend', fr: 'Millier', it: 'Migliaio' },
  },
  // ... other units
]
```

### Customizing Unit Names

```typescript
const customFormatter = new UnitScalingFormatter({}, customUnits)

// Or update existing formatter
formatter.updateScalingUnits(customUnits)
```

## Integration with Existing Components

### FinancialDataDisplay Component

The `FinancialDataDisplay` component has been enhanced with unit scaling support:

```vue
<!-- Toggle button for unit scaling -->
<ToggleButton
  v-model="unitScalingEnabled"
  :onLabel="$t('unitScaling.units.thousand.abbreviated') + '/' + $t('unitScaling.units.million.abbreviated')"
  :offLabel="$t('unitScaling.settings.enableScaling')"
/>
```

The `formatCurrency` function automatically uses unit scaling when enabled:

```typescript
const formatCurrency = (value: number): string => {
  if (unitScalingEnabled.value) {
    const result = unitScaling.formatCurrency(value, 'CHF')
    return result.formatted
  }
  // ... fallback to standard formatting
}
```

## Testing

### Unit Tests

Comprehensive test suites are provided:

- `src/utils/__tests__/UnitScalingFormatter.spec.ts` - Core formatter tests
- `src/composables/__tests__/useUnitScaling.spec.ts` - Vue composable tests

### Running Tests

```bash
npm run test:unit
```

### Test Coverage

The test suite covers:
- ✅ Number formatting with various scales
- ✅ Currency formatting
- ✅ Locale-specific formatting
- ✅ Configuration updates
- ✅ Edge cases (zero, negative, very large numbers)
- ✅ Vue composable reactivity
- ✅ User preference management

## Performance Considerations

- **Singleton Pattern**: Default formatter instance is reused
- **Lazy Evaluation**: Scaling units are sorted once during initialization
- **Minimal Dependencies**: Uses native `Intl.NumberFormat` for locale-aware formatting
- **Memory Efficient**: Reactive refs are used sparingly in composables

## Migration Guide

### From Hardcoded Formatting

**Before:**
```typescript
const formatLargeNumber = (value: number): string => {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`
  }
  return value.toString()
}
```

**After:**
```typescript
import { useSimpleUnitScaling } from '@/composables/useUnitScaling'

const { formatNumber } = useSimpleUnitScaling()
const formatted = formatNumber(value)
```

### Updating Existing Components

1. Import the composable:
```typescript
import { useConfigurableUnitScaling } from '@/composables/useUnitScaling'
```

2. Replace hardcoded formatting:
```typescript
// Replace this
const formatted = `${value.toLocaleString()} CHF`

// With this
const { formatCurrency } = useConfigurableUnitScaling()
const formatted = formatCurrency(value, 'CHF')
```

## Future Enhancements

- **Additional Units**: Support for smaller units (hundreds, tens)
- **Scientific Notation**: Option for very large numbers
- **Custom Separators**: Configurable thousand/decimal separators
- **Percentage Scaling**: Built-in percentage formatting
- **Regional Variants**: Support for regional number formatting differences

## Contributing

When adding new features or units:

1. Update the core `UnitScalingFormatter` class
2. Add corresponding translations to all locale files
3. Write comprehensive tests
4. Update this documentation
5. Consider backward compatibility

## API Reference

See the TypeScript definitions in the source files for complete API documentation:
- `src/utils/UnitScalingFormatter.ts`
- `src/composables/useUnitScaling.ts`
