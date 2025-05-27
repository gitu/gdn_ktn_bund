<template>
  <v-card class="enriched-data-display">
    <!-- Loading State -->
    <div v-if="state.isLoading" class="d-flex justify-center align-center pa-8">
      <v-progress-circular
        indeterminate
        color="primary"
        size="64"
      ></v-progress-circular>
      <span class="ml-4 text-h6">Loading financial data...</span>
    </div>

    <!-- Error State -->
    <v-alert
      v-else-if="state.error"
      type="error"
      variant="tonal"
      class="ma-4"
    >
      <v-alert-title>Error loading financial data</v-alert-title>
      {{ state.error }}
    </v-alert>

    <!-- Empty State -->
    <div v-else-if="state.data.length === 0" class="text-center pa-8">
      <v-icon size="64" color="grey-lighten-1" class="mb-4">mdi-database-off</v-icon>
      <h3 class="text-h5 mb-2">No Financial Data Found</h3>
      <p class="text-body-1 text-grey">
        No financial records were found for {{ getEntityDisplayName(entityId) }} in {{ year }}.
      </p>
    </div>

    <!-- Main Content -->
    <div v-else>
      <!-- Header with Summary -->
      <v-card-title class="d-flex justify-space-between align-center">
        <div>
          <h2 class="text-h5">Financial Data: {{ getEntityDisplayName(entityId) }} ({{ year }})</h2>
        </div>
        <div class="d-flex gap-4">
          <div class="text-center">
            <div class="text-caption text-grey">Income</div>
            <div class="text-h6 text-success">{{ formatCurrency(summary.totalIncome, summary.currency) }}</div>
          </div>
          <div class="text-center">
            <div class="text-caption text-grey">Expenses</div>
            <div class="text-h6 text-error">{{ formatCurrency(summary.totalExpenses, summary.currency) }}</div>
          </div>
          <div class="text-center">
            <div class="text-caption text-grey">Balance</div>
            <div class="text-h6 text-primary">{{ formatCurrency(summary.balance, summary.currency) }}</div>
          </div>
        </div>
      </v-card-title>

      <!-- Controls -->
      <v-card-text>
        <v-row class="mb-4">
          <v-col cols="12" md="4">
            <v-select
              v-model="filterDimension"
              :items="availableDimensionOptions"
              item-title="name"
              item-value="value"
              label="Filter by Dimension"
              variant="outlined"
              density="compact"
            ></v-select>
          </v-col>
          <v-col cols="12" md="4">
            <v-select
              v-model="sortBy"
              :items="sortOptions"
              item-title="name"
              item-value="value"
              label="Sort by"
              variant="outlined"
              density="compact"
            ></v-select>
          </v-col>
          <v-col cols="12" md="4">
            <v-btn-toggle
              v-model="sortOrder"
              mandatory
              variant="outlined"
              density="compact"
            >
              <v-btn value="desc">
                <v-icon>mdi-sort-descending</v-icon>
                Descending
              </v-btn>
              <v-btn value="asc">
                <v-icon>mdi-sort-ascending</v-icon>
                Ascending
              </v-btn>
            </v-btn-toggle>
          </v-col>
        </v-row>

        <!-- Data Table -->
        <v-data-table
          :headers="tableHeaders"
          :items="processedData"
          :items-per-page="itemsPerPage"
          :sort-by="[{ key: sortBy, order: sortOrder }]"
          class="elevation-1"
          item-value="id"
        >
          <!-- Type Column -->
          <template v-slot:item.type="{ item }">
            <v-chip
              :color="getTypeColor(getDimensionType(item.dim))"
              size="small"
              variant="tonal"
            >
              {{ getTypeLabel(getDimensionType(item.dim)) }}
            </v-chip>
          </template>

          <!-- Code Column -->
          <template v-slot:item.arten="{ item }">
            <code class="text-body-2 font-weight-bold">{{ item.arten }}</code>
          </template>

          <!-- Description Column -->
          <template v-slot:item.description="{ item }">
            <div class="text-wrap" style="max-width: 300px;">
              {{ getDescription(item) }}
            </div>
          </template>

          <!-- Value Column -->
          <template v-slot:item.value="{ item }">
            <div
              class="text-right font-weight-bold"
              :class="getValueClass(getDimensionType(item.dim))"
            >
              {{ formatCurrency(item.value, item.unit) }}
            </div>
          </template>

          <!-- Function Column -->
          <template v-slot:item.funk="{ item }">
            <code v-if="item.funk" class="text-caption">{{ item.funk }}</code>
            <span v-else class="text-grey">-</span>
          </template>

          <!-- Dimension Column -->
          <template v-slot:item.dim="{ item }">
            <v-chip size="x-small" variant="outlined">{{ item.dim }}</v-chip>
          </template>
        </v-data-table>

        <!-- Footer Info -->
        <div class="d-flex justify-space-between align-center mt-4 pa-2 bg-grey-lighten-4 rounded">
          <span class="text-body-2 text-grey">
            Showing {{ processedData.length }} of {{ state.data.length }} records
            <span v-if="filterDimension !== 'all'">(filtered by {{ filterDimension }})</span>
          </span>
          <v-chip size="small" variant="outlined">
            {{ summary.currency }}
          </v-chip>
        </div>

        <!-- CSV File Information -->
        <v-card v-if="getCsvFileInfo" class="mt-4" variant="outlined">
          <v-card-title class="d-flex justify-space-between align-center">
            <span class="text-h6">Source CSV File</span>
            <v-btn
              @click="downloadOriginalCsv"
              color="primary"
              variant="outlined"
              size="small"
              prepend-icon="mdi-download"
            >
              Download Original CSV
            </v-btn>
          </v-card-title>
          <v-card-text>
            <v-row>
              <v-col cols="12" md="3">
                <div class="text-caption text-grey">File Name</div>
                <div class="text-body-2 font-weight-bold">{{ getCsvFileInfo.fileName }}</div>
              </v-col>
              <v-col cols="12" md="3">
                <div class="text-caption text-grey">Records</div>
                <div class="text-body-2 font-weight-bold">{{ getCsvFileInfo.recordCount.toLocaleString() }}</div>
              </v-col>
              <v-col cols="12" md="3">
                <div class="text-caption text-grey">File Size</div>
                <div class="text-body-2 font-weight-bold">{{ formatFileSize(getCsvFileInfo.fileSize) }}</div>
              </v-col>
              <v-col cols="12" md="3">
                <div class="text-caption text-grey">Status</div>
                <v-chip
                  :color="getCsvFileInfo.hasErrors ? 'warning' : 'success'"
                  size="small"
                  variant="tonal"
                >
                  <v-icon start>{{ getCsvFileInfo.hasErrors ? 'mdi-alert' : 'mdi-check' }}</v-icon>
                  {{ getCsvFileInfo.hasErrors ? `${getCsvFileInfo.errorCount} errors` : 'Valid' }}
                </v-chip>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-card-text>
    </div>
  </v-card>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { enrichFinancialData, validateEnrichedData } from '../utils/DataEnricher'
import type { EnrichedFinancialRecord } from '../utils/BalanceCalculator'
import {
  loadFinancialCsv,
  loadGdnCsv,
  convertGdnToFinancialFormat,
  downloadCsvFile,
  getAvailableCsvFiles,
  type CsvLoadResult,
  type FinancialCsvRecord,
  type GdnCsvRecord
} from '../utils/CsvLoader'

// Props interface
interface Props {
  entityId: string
  year: string
  dimension?: string
  language?: 'de' | 'fr' | 'it' | 'en'
  className?: string
}

// Define props with defaults
const props = withDefaults(defineProps<Props>(), {
  language: 'de',
  dimension: undefined,
  className: undefined
})

// Internal state interface
interface LoadingState {
  isLoading: boolean
  error: string | null
  data: EnrichedFinancialRecord[]
  csvMetadata: CsvLoadResult<any> | null
  availableCsvFiles: string[]
}

// Reactive state
const state = ref<LoadingState>({
  isLoading: true,
  error: null,
  data: [],
  csvMetadata: null,
  availableCsvFiles: []
})

const filterDimension = ref<string>('all')
const sortBy = ref<string>('value')
const sortOrder = ref<'asc' | 'desc'>('desc')
const itemsPerPage = ref(25)

// Table headers
const tableHeaders = [
  { title: 'Type', key: 'type', sortable: false, width: '100px' },
  { title: 'Code', key: 'arten', sortable: true, width: '100px' },
  { title: 'Description', key: 'description', sortable: true },
  { title: 'Value', key: 'value', sortable: true, align: 'end' as const, width: '150px' },
  { title: 'Function', key: 'funk', sortable: true, width: '100px' },
  { title: 'Dimension', key: 'dim', sortable: true, width: '120px' },
]

// Sort options
const sortOptions = [
  { name: 'Value', value: 'value' },
  { name: 'Code', value: 'arten' },
  { name: 'Description', value: 'description' },
  { name: 'Dimension', value: 'dim' },
]

// Helper functions
const getDimensionType = (dim: string): 'income' | 'expense' | 'other' => {
  const incomeDimensions = ['einnahmen', 'ertrag', 'ord_einnahmen_funk', 'einnahmen_funk']
  const expenseDimensions = ['ausgaben', 'aufwand', 'ord_ausgaben_funk', 'ausgaben_funk']

  if (incomeDimensions.includes(dim)) return 'income'
  if (expenseDimensions.includes(dim)) return 'expense'
  return 'other'
}

const getTypeColor = (type: 'income' | 'expense' | 'other'): string => {
  switch (type) {
    case 'income': return 'success'
    case 'expense': return 'error'
    default: return 'grey'
  }
}

const getTypeLabel = (type: 'income' | 'expense' | 'other'): string => {
  switch (type) {
    case 'income': return 'Income'
    case 'expense': return 'Expense'
    default: return 'Other'
  }
}

const getValueClass = (type: 'income' | 'expense' | 'other'): string => {
  switch (type) {
    case 'income': return 'text-success'
    case 'expense': return 'text-error'
    default: return 'text-grey'
  }
}

const formatCurrency = (value: number, currency: string = 'CHF'): string => {
  return new Intl.NumberFormat('de-CH', {
    style: 'currency',
    currency: currency === 'CHF' ? 'CHF' : 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const getEntityDisplayName = (entityId: string): string => {
  const parts = entityId.split('_')
  if (parts.length >= 2) {
    const type = parts[0].toUpperCase()
    const region = parts[1].toUpperCase()
    return `${type} ${region}`
  }
  return entityId.toUpperCase()
}

const getDescription = (record: EnrichedFinancialRecord): string => {
  switch (props.language) {
    case 'fr':
      return record.description_fr || record.description_de || record.arten
    case 'it':
      return record.description_it || record.description_de || record.arten
    case 'en':
      return record.description_en || record.description_de || record.arten
    default:
      return record.description_de || record.arten
  }
}

// Mock description function for demo purposes
const getDescriptionForCode = (arten: string, lang: string): string => {
  const descriptions: Record<string, Record<string, string>> = {
    '4000': {
      de: 'Einkommenssteuern natürliche Personen',
      fr: 'Impôts sur le revenu, personnes physiques',
      it: 'Imposte sul reddito di persone fisiche',
      en: 'Income tax, natural persons'
    },
    '4001': {
      de: 'Vermögenssteuern natürliche Personen',
      fr: 'Impôts sur la fortune, personnes physiques',
      it: 'Imposte sulla sostanza di persone fisiche',
      en: 'Wealth tax, natural persons'
    },
    '3000': {
      de: 'Personalausgaben',
      fr: 'Dépenses de personnel',
      it: 'Spese per il personale',
      en: 'Personnel expenditure'
    },
    '3100': {
      de: 'Sachausgaben',
      fr: 'Dépenses de biens et services',
      it: 'Spese per beni e servizi',
      en: 'Goods and services expenditure'
    },
    '4200': {
      de: 'Gebühren',
      fr: 'Émoluments',
      it: 'Tasse',
      en: 'Fees'
    }
  }

  return descriptions[arten]?.[lang] || arten
}

// Computed properties
const availableDimensions = computed(() => {
  const dimensions = [...new Set(state.value.data.map(r => r.dim))]
  return dimensions.sort()
})

const availableDimensionOptions = computed(() => [
  { name: 'All Dimensions', value: 'all' },
  ...availableDimensions.value.map(dim => ({ name: dim, value: dim }))
])

const processedData = computed(() => {
  let filtered = state.value.data

  // Apply dimension filter
  if (filterDimension.value !== 'all') {
    filtered = filtered.filter(record => record.dim === filterDimension.value)
  }

  // Add computed properties for table
  return filtered.map((record, index) => ({
    ...record,
    id: `${record.arten}-${record.funk}-${index}`,
    type: getDimensionType(record.dim),
    description: getDescription(record)
  }))
})

const summary = computed(() => {
  const income = processedData.value.filter(r => getDimensionType(r.dim) === 'income')
  const expenses = processedData.value.filter(r => getDimensionType(r.dim) === 'expense')

  const totalIncome = income.reduce((sum, r) => sum + r.value, 0)
  const totalExpenses = expenses.reduce((sum, r) => sum + r.value, 0)
  const balance = totalIncome - totalExpenses

  return {
    totalIncome,
    totalExpenses,
    balance,
    recordCount: processedData.value.length,
    currency: processedData.value[0]?.unit || 'CHF'
  }
})

// Data loading function using the new DataLoader
const loadData = async () => {
  state.value.isLoading = true
  state.value.error = null

  try {
    console.log(`Loading data for entity: ${props.entityId}, year: ${props.year}`)

    // Use the new DataLoader to load entity data
    const { loadAndEnrichEntityData } = await import('../utils/DataEnricher')

    // Load and enrich the data directly
    const enrichedData = await loadAndEnrichEntityData(
      props.entityId,
      props.year,
      'fs', // Default model
      props.language
    )

    if (enrichedData.length === 0) {
      throw new Error(`No data found for entity ${props.entityId} in year ${props.year}`)
    }

    // Add mock descriptions for demo purposes (in a real app, these would come from a codelist)
    const enrichedWithDescriptions = enrichedData.map(record => ({
      ...record,
      description_de: getDescriptionForCode(record.arten, 'de'),
      description_fr: getDescriptionForCode(record.arten, 'fr'),
      description_it: getDescriptionForCode(record.arten, 'it'),
      description_en: getDescriptionForCode(record.arten, 'en'),
    }))

    // Validate the data
    const validation = validateEnrichedData(enrichedWithDescriptions)
    if (!validation.isValid) {
      console.warn('Data validation issues:', validation.issues)
    }

    state.value.data = enrichedWithDescriptions
    state.value.isLoading = false

    console.log(`✅ Successfully loaded ${enrichedWithDescriptions.length} records`)

  } catch (error) {
    console.error('Error loading data:', error)
    state.value.error = error instanceof Error ? error.message : 'Failed to load data'
    state.value.isLoading = false

    // Fallback to mock data for demonstration
    console.log('Falling back to mock data for demonstration...')
    await loadMockData()
  }
}

// Fallback mock data function
const loadMockData = async () => {
  try {
    const mockRawData = [
      {
        arten: "4200",
        funk: "01",
        jahr: props.year,
        value: "450000.00",
        dim: "einnahmen_funk",
        hh: props.entityId,
        unit: "CHF",
        model: "fs"
      },
      {
        arten: "3000",
        funk: "01",
        jahr: props.year,
        value: "320000.00",
        dim: "aufwand_funk",
        hh: props.entityId,
        unit: "CHF",
        model: "fs"
      }
    ]

    // Enrich the mock data
    const enrichedData = await enrichFinancialData(mockRawData, props.language)

    // Add mock descriptions
    const enrichedWithDescriptions = enrichedData.map(record => ({
      ...record,
      description_de: getDescriptionForCode(record.arten, 'de'),
      description_fr: getDescriptionForCode(record.arten, 'fr'),
      description_it: getDescriptionForCode(record.arten, 'it'),
      description_en: getDescriptionForCode(record.arten, 'en'),
    }))

    state.value.data = enrichedWithDescriptions
    state.value.isLoading = false

    console.log('✅ Loaded mock data successfully')

  } catch (error) {
    console.error('Even mock data failed:', error)
    state.value.error = 'Failed to load any data'
    state.value.isLoading = false
  }
}

// CSV file handling functions
const downloadOriginalCsv = async () => {
  if (!state.value.csvMetadata) {
    console.warn('No CSV metadata available for download')
    return
  }

  try {
    const downloadName = `${props.entityId}_${props.year}_original.csv`
    await downloadCsvFile(state.value.csvMetadata.fileName, downloadName)
  } catch (error) {
    console.error('Error downloading CSV file:', error)
    state.value.error = error instanceof Error ? error.message : 'Failed to download CSV file'
  }
}

const getCsvFileInfo = computed(() => {
  if (!state.value.csvMetadata) return null

  return {
    fileName: state.value.csvMetadata.fileName,
    recordCount: state.value.csvMetadata.data.length,
    fileSize: new Blob([state.value.csvMetadata.originalCsvText]).size,
    hasErrors: state.value.csvMetadata.errors.length > 0,
    errorCount: state.value.csvMetadata.errors.length
  }
})

// Watch for prop changes
watch([() => props.entityId, () => props.year, () => props.language], () => {
  loadData()
}, { immediate: true })

// Initialize component
onMounted(() => {
  loadData()
})
</script>

<style scoped>
.enriched-data-display {
  margin-bottom: 1rem;
}

.text-wrap {
  word-wrap: break-word;
  line-height: 1.4;
}

code {
  background-color: rgba(0, 0, 0, 0.05);
  padding: 2px 4px;
  border-radius: 3px;
  font-family: 'Courier New', monospace;
}

.v-data-table {
  font-size: 0.9rem;
}

.v-chip {
  font-size: 0.75rem;
}

.gap-4 > * + * {
  margin-left: 1rem;
}
</style>
