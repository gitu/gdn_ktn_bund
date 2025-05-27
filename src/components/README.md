# EnrichedDataDisplay Component

A comprehensive Vue.js 3 component for displaying enriched Swiss financial data with interactive features, multi-language support, and detailed breakdowns using Vuetify UI framework.

## Features

- 📊 **Interactive Data Display**: Table-based layout with sorting and filtering
- 🌍 **Multi-language Support**: German, French, Italian, and English descriptions
- 💰 **Financial Classification**: Automatic income/expense categorization with visual indicators
- 📈 **Summary Statistics**: Real-time totals and balance calculations
- 🎨 **Responsive Design**: Works on desktop, tablet, and mobile devices
- ⚡ **Performance Optimized**: Efficient data processing and rendering
- 🔍 **Advanced Filtering**: Filter by dimension, sort by multiple criteria
- 🛡️ **Error Handling**: Comprehensive error states and loading indicators
- 🇨🇭 **Swiss Formatting**: Proper currency formatting for Swiss locale

## Usage

### Basic Usage

```vue
<template>
  <EnrichedDataDisplay
    entity-id="gdn_zh"
    year="2022"
    language="de"
  />
</template>

<script setup lang="ts">
import EnrichedDataDisplay from './components/EnrichedDataDisplay.vue'
</script>
```

### Advanced Usage with Filtering

```vue
<template>
  <EnrichedDataDisplay
    entity-id="ktn_zh"
    year="2022"
    dimension="einnahmen"  <!-- Filter to show only income records -->
    language="fr"          <!-- Show descriptions in French -->
    class-name="custom-styling"
  />
</template>

<script setup lang="ts">
import EnrichedDataDisplay from './components/EnrichedDataDisplay.vue'
</script>
```

### Entity Comparison

```vue
<template>
  <v-row>
    <v-col cols="12" md="6">
      <EnrichedDataDisplay
        entity-id="gdn_zh"
        year="2022"
        language="de"
      />
    </v-col>
    <v-col cols="12" md="6">
      <EnrichedDataDisplay
        entity-id="gdn_be"
        year="2022"
        language="de"
      />
    </v-col>
  </v-row>
</template>

<script setup lang="ts">
import EnrichedDataDisplay from './components/EnrichedDataDisplay.vue'
</script>
```

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `entityId` | `string` | ✅ | - | Entity identifier (e.g., "gdn_zh", "ktn_be") |
| `year` | `string` | ✅ | - | Year to display data for |
| `dimension` | `string` | ❌ | `undefined` | Filter by specific dimension (e.g., "einnahmen", "ausgaben") |
| `language` | `'de' \| 'fr' \| 'it' \| 'en'` | ❌ | `'de'` | Language for descriptions |
| `className` | `string` | ❌ | `undefined` | Additional CSS class for styling |

## Entity Types

The component automatically detects entity types based on the `entityId`:

- **GDN (Gemeinden/Municipalities)**: IDs starting with "gdn_" (e.g., "gdn_zh", "gdn_be")
- **STD (Kantone/Cantons & Bund/Federal)**: All other IDs (e.g., "ktn_zh", "bund")

## Financial Dimensions

The component automatically classifies financial records:

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

## Visual Indicators

- 🟢 **Green**: Income records and positive balances
- 🔴 **Red**: Expense records and negative balances
- ⚫ **Gray**: Other/unclassified records

## Data Structure

The component expects enriched financial data with the following structure:

```typescript
interface EnrichedFinancialRecord {
  arten: string;           // Account/category code
  funk: string;            // Function code
  jahr: string;            // Year
  value: number;           // Amount
  dim: string;             // Dimension
  hh: string;              // Entity identifier
  unit: string;            // Currency unit
  model: string;           // Model type
  description_de?: string; // German description
  description_fr?: string; // French description
  description_it?: string; // Italian description
  description_en?: string; // English description
}
```

## Styling

The component uses styled-components and follows the existing application design patterns. Key styling features:

- **Responsive Grid Layout**: Adapts to different screen sizes
- **Hover Effects**: Interactive table rows and buttons
- **Color Coding**: Visual distinction between income and expenses
- **Typography**: Consistent font usage with monospace for codes and numbers
- **Spacing**: Proper padding and margins for readability

### Custom Styling

You can override styles by passing a `className` prop:

```tsx
<EnrichedDataDisplay
  entityId="gdn_zh"
  year="2022"
  className="my-custom-class"
/>
```

```css
.my-custom-class {
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.my-custom-class table {
  font-size: 0.8rem;
}
```

## Error Handling

The component includes comprehensive error handling:

- **Loading States**: Spinner animation while data loads
- **Error Messages**: Clear error display with retry suggestions
- **Empty States**: Helpful messages when no data is found
- **Data Validation**: Warnings for data quality issues

## Performance Considerations

- **Memoized Calculations**: Summary statistics and filtering are optimized
- **Efficient Sorting**: In-memory sorting with minimal re-renders
- **Lazy Loading**: Data is loaded only when needed
- **Memory Management**: Proper cleanup of resources

## Integration with Balance Calculator

The component integrates seamlessly with the `BalanceCalculator` utilities:

```tsx
import { calculateBalance } from '../utils/BalanceCalculator';
import EnrichedDataDisplay from './EnrichedDataDisplay';

function IntegratedView() {
  const [balanceData, setBalanceData] = useState(null);

  useEffect(() => {
    // Calculate balances using the same data
    calculateBalance(enrichedData, { year: "2022" })
      .then(setBalanceData);
  }, []);

  return (
    <div>
      {balanceData && (
        <div>Balance: {balanceData.aggregateTotals.gdnTotals.balance}</div>
      )}
      <EnrichedDataDisplay entityId="gdn_zh" year="2022" />
    </div>
  );
}
```

## Testing

The component includes comprehensive tests covering:

- ✅ Data loading and enrichment
- ✅ Language switching
- ✅ Sorting and filtering
- ✅ Error handling
- ✅ Currency formatting
- ✅ Responsive behavior

Run tests with:

```bash
npm test EnrichedDataDisplay
```

## Examples

See the `src/examples/EnrichedDataDisplayExample.tsx` file for comprehensive usage examples including:

- Interactive data exploration
- Entity comparison
- Multi-language demonstrations
- Integration patterns

## Browser Support

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

## Accessibility

The component follows accessibility best practices:

- **Keyboard Navigation**: Full keyboard support for interactive elements
- **Screen Readers**: Proper ARIA labels and semantic HTML
- **Color Contrast**: WCAG AA compliant color combinations
- **Focus Management**: Clear focus indicators

## Future Enhancements

Potential improvements could include:

- 📊 Chart/graph visualization options
- 📤 Export functionality (CSV, PDF)
- 🔍 Advanced search and filtering
- 📱 Mobile-optimized layouts
- 🎨 Theme customization
- 📈 Trend analysis features
