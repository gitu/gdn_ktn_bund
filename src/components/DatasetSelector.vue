<template>
  <div class="dataset-selector">
    <!-- Header -->
    <div class="selector-header">
      <h3>{{ $t('datasetSelector.title') }}</h3>
      <p class="subtitle">{{ $t('datasetSelector.subtitle') }}</p>
    </div>

    <!-- Search and Filters -->
    <div class="flex flex-wrap items-center justify-between gap-4 p-4 bg-white rounded shadow">
      <!-- Search Section -->
      <div class="flex-1 min-w-[250px] max-w-xl">
        <div class="flex items-center gap-2">
          <IconField class="max-w-600 w-full">
            <InputText
              v-model="searchQuery"
              :placeholder="$t('datasetSelector.searchPlaceholder')"
              class="w-full"
            />
            <InputIcon class="pi pi-search" />
          </IconField>
          <Button
            v-if="searchQuery"
            icon="pi pi-times"
            severity="secondary"
            @click="clearSearch"
            class="px-4 py-2"
          />
        </div>
      </div>

      <!-- Filter Section -->
      <div class="flex flex-wrap items-center gap-4">
        <Select
          v-model="selectedYear"
          :options="yearOptions"
          option-label="label"
          option-value="value"
          :placeholder="$t('datasetSelector.filters.year')"
          class="min-w-[150px]"
        />
      </div>
    </div>

    <!-- Available Datasets -->
    <div class="available-datasets gap-5">
      <div class="section-header">
        <span class="results-count">
          {{
            $t('datasetSelector.resultsCount', {
              count: filteredDatasets.length,
              total: totalDatasets,
            })
          }}
        </span>
      </div>

      <div v-if="loading" class="loading-state">
        <ProgressSpinner size="small" />
        <span>{{ $t('datasetSelector.loading') }}</span>
      </div>

      <DataTable
        :value="filteredDatasets"
        :paginator="true"
        :rows="5"
        :rows-per-page-options="[5, 10, 20, 50]"
        paginator-template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        :current-page-report-template="$t('datasetSelector.pageReportTemplate')"
        class="datasets-table"
        scrollable
      >
        <Column
          field="displayName"
          :header="$t('datasetSelector.columns.name')"
          class="name-column"
          :frozen="true"
          min-width="200"
        >
          <template #body="{ data }">
            <div class="dataset-name">
              <strong>{{ getDisplayName(data) }}</strong>
            </div>
          </template>
        </Column>

        <Column
          field="description"
          :header="$t('datasetSelector.columns.description')"
          class="description-column"
        >
          <template #body="{ data }">
            <div class="dataset-description">
              {{ getDescription(data) }}
            </div>
          </template>
        </Column>

        <Column
          field="availableYears"
          :header="$t('datasetSelector.columns.years')"
          class="years-column"
        >
          <template #body="{ data }">
            <div class="available-years">
              <span class="year-range">
                {{ data.availableYears[0] }} -
                {{ data.availableYears[data.availableYears.length - 1] }}
              </span>
              <small class="year-count">
                ({{ $t('datasetSelector.yearCount', { count: data.availableYears.length }) }})
              </small>
            </div>
          </template>
        </Column>

        <Column
          :header="$t('datasetSelector.columns.year')"
          class="year-column"
          :frozen="true"
          align-frozen="right"
        >
          <template #body="{ data }">
            <Select
              v-model="selectedYears[data.id]"
              :options="getYearOptions(data)"
              option-label="label"
              option-value="value"
              :placeholder="$t('datasetSelector.selectYear')"
              class="year-selector"
            />
          </template>
        </Column>

        <Column
          :header="$t('datasetSelector.columns.actions')"
          class="actions-column"
          :frozen="true"
          align-frozen="right"
        >
          <template #body="{ data }">
            <Button
              :label="getAddButtonLabel(data)"
              icon="pi pi-plus"
              size="small"
              :disabled="isAddButtonDisabled(data.id)"
              @click="addDatasetWithDefaultYear(data)"
            />
          </template>
        </Column>
      </DataTable>
    </div>

    <!-- Selected Datasets -->
    <div v-if="selectedDatasets.length > 0" class="selected-datasets">
      <div class="section-header">
        <h4>{{ $t('datasetSelector.selectedDatasets') }}</h4>
        <span class="selected-count">
          {{ $t('datasetSelector.selectedCount', { count: selectedDatasets.length }) }}
        </span>
      </div>

      <div class="selected-actions flex justify-end gap-2 mt-4">
        <Button
          :label="$t('datasetSelector.clearAll')"
          icon="pi pi-trash"
          severity="danger"
          outlined
          @click="clearAllDatasets"
        />
        <Button
          :label="$t('datasetSelector.compareDatasets')"
          icon="pi pi-chart-line"
          @click="emitSelectedDatasets"
          :disabled="selectedDatasets.length === 0"
        />
      </div>

      <div class="selected-list">
        <DataTable
          :value="selectedDatasets"
          dataKey="id"
          class="w-full"
          size="small"
          @rowReorder="onRowReorder"
          scroll-direction="horizontal"
          scrollable
        >
          <Column rowReorder headerStyle="width: 3rem" :reorderableColumn="false" frozen />
          <Column field="name" :header="$t('datasetSelector.columns.name')" :frozen="true">
            <template #body="sp">
              {{ getDisplayName(sp.data.entry) }}
            </template>
          </Column>
          <Column field="description" :header="$t('datasetSelector.columns.description')">
            <template #body="sp">
              <span class="text-sm">{{ getDescription(sp.data.entry) }}</span>
            </template>
          </Column>
          <Column field="year" :header="$t('datasetSelector.columns.year')"></Column>
          <Column field="actions" :frozen="true" align-frozen="right">
            <template #body="sp">
              <Button
                icon="pi pi-trash"
                severity="danger"
                outlined
                size="small"
                @click="removeDataset(sp.data)"
              />
            </template>
          </Column>
        </DataTable>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import DataTable, { type DataTableRowReorderEvent } from 'primevue/datatable'
import Column from 'primevue/column'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import Select from 'primevue/select'
import ProgressSpinner from 'primevue/progressspinner'
import type { AvailableDataCatalog, AvailableDataEntry } from '@/types/DataStructures'
import {
  filterByType,
  filterByYear,
  getAllAvailableYears,
  loadAvailableDataCatalog,
  searchByName,
} from '@/utils/AvailableDataLoader'
import { useToast } from 'primevue/usetoast'

const datasets = defineModel<string[]>({ required: true })

// Vue i18n
const { locale, t } = useI18n()

// Reactive state
const loading = ref(true)
const catalog = ref<AvailableDataCatalog>([])
const searchQuery = ref('')
const selectedType = ref<'all' | 'gdn' | 'std'>('all')
const selectedYear = ref<string | null>(null)
const selectedYears = ref<Record<string, string>>({})

// Selected datasets structure
interface SelectedDataset {
  id: string
  entry: AvailableDataEntry
  year: string
  datasetIdentifier: string // Format: 'gdn/fs/010002:2016'
}

const selectedDatasets = ref<SelectedDataset[]>([])

// Computed properties
const totalDatasets = computed(() => catalog.value.length)

const yearOptions = computed(() => {
  const years = getAllAvailableYears(catalog.value)
  // Sort years in reverse order (newest first)
  const sortedYears = [...years].sort((a, b) => b.localeCompare(a))
  return [
    { label: t('datasetSelector.filters.allYears'), value: null },
    ...sortedYears.map((year) => ({ label: year, value: year })),
  ]
})

const filteredDatasets = computed(() => {
  let filtered = catalog.value

  // Apply type filter
  if (selectedType.value !== 'all') {
    filtered = filterByType(filtered, selectedType.value)
  }

  // Apply year filter
  if (selectedYear.value) {
    filtered = filterByYear(filtered, selectedYear.value)
  }

  // Apply search filter
  if (searchQuery.value.trim()) {
    filtered = searchByName(
      filtered,
      searchQuery.value.trim(),
      locale.value as 'de' | 'fr' | 'it' | 'en',
    )
  }

  return filtered
})

// Methods
const getDisplayName = (entry: AvailableDataEntry): string => {
  return entry.displayName[locale.value as keyof typeof entry.displayName] || entry.displayName.de
}

const getDescription = (entry: AvailableDataEntry): string => {
  return entry.description[locale.value as keyof typeof entry.description] || entry.description.de
}

const getYearOptions = (entry: AvailableDataEntry) => {
  // Sort years in reverse order (newest first)
  const sortedYears = [...entry.availableYears].sort((a, b) => b.localeCompare(a))
  return sortedYears.map((year) => ({
    label: year,
    value: year,
  }))
}

const setDefaultYear = (entry: AvailableDataEntry) => {
  // Only set default if no year is currently selected for this entry
  if (!selectedYears.value[entry.id] && entry.availableYears.length > 0) {
    // Sort years in reverse order and select the first (latest) one
    const sortedYears = [...entry.availableYears].sort((a, b) => b.localeCompare(a))
    selectedYears.value[entry.id] = sortedYears[0]
  }
}

const getAddButtonLabel = (entry: AvailableDataEntry): string => {
  const selectedYear = selectedYears.value[entry.id]
  if (selectedYear) {
    return t('datasetSelector.addDatasetWithYear', { year: selectedYear })
  }
  return t('datasetSelector.addDataset')
}

const addDatasetWithDefaultYear = (entry: AvailableDataEntry) => {
  // Now add the dataset
  addDataset(entry)
}

const onRowReorder = (event: DataTableRowReorderEvent) => {
  selectedDatasets.value = event.value
  emitSelectedDatasets()
}

const isAddButtonDisabled = (entryId: string): boolean => {
  // Disable if no year is selected for this entry
  if (!selectedYears.value[entryId]) {
    return true
  }

  // Disable if this dataset with the selected year is already added
  return selectedDatasets.value.some(
    (dataset) => dataset.entry.id === entryId && dataset.year === selectedYears.value[entryId],
  )
}

const generateDatasetIdentifier = (entry: AvailableDataEntry, year: string): string => {
  // Format: 'source/model/entity:year'
  // For now, we'll use 'fs' as the default model (financial statements)
  return `${entry.type}/fs/${entry.entityCode}:${year}`
}

const addDataset = (entry: AvailableDataEntry) => {
  const year = selectedYears.value[entry.id]
  if (!year) return

  const datasetIdentifier = generateDatasetIdentifier(entry, year)

  // Check for duplicates
  const exists = selectedDatasets.value.some(
    (dataset) => dataset.datasetIdentifier === datasetIdentifier,
  )

  if (exists) {
    useToast().add({
      severity: 'warn',
      summary: t('datasetSelector.errors.duplicateDataset'),
      life: 3000,
    })
    return
  }

  const newDataset: SelectedDataset = {
    id: `${entry.id}_${year}`,
    entry,
    year,
    datasetIdentifier,
  }

  selectedDatasets.value.push(newDataset)

  // Clear the year selection for this entry
  delete selectedYears.value[entry.id]

  // Emit the change
  emitSelectedDatasets()
}

const removeDataset = (datasetId: string) => {
  const index = selectedDatasets.value.findIndex((dataset) => dataset.id === datasetId)
  if (index !== -1) {
    selectedDatasets.value.splice(index, 1)
    emitSelectedDatasets()
  }
}

const clearAllDatasets = () => {
  selectedDatasets.value = []
  for (const entry of catalog.value) {
    setDefaultYear(entry)
  }
  emitSelectedDatasets()
}

const emitSelectedDatasets = () => {
  datasets.value = selectedDatasets.value.map((dataset) => dataset.datasetIdentifier)
}

const clearSearch = () => {
  searchQuery.value = ''
}

// Load data on mount
const loadData = async () => {
  try {
    loading.value = true

    catalog.value = await loadAvailableDataCatalog()

    // Set default years for all entries
    catalog.value.forEach((entry) => {
      setDefaultYear(entry)
    })

    // Initialize with any provided datasets
    if (datasets.value?.length > 0) {
      initializeFromDatasets(datasets.value)
    }
  } catch (err) {
    useToast().add({
      severity: 'error',
      summary: t('datasetSelector.errors.loadingFailed'),
      life: 10000,
    })
    console.error('Failed to load available data catalog:', err)
  } finally {
    loading.value = false
  }
}

const initializeFromDatasets = (datasets: string[]) => {
  // Parse initial datasets and populate selectedDatasets
  datasets.forEach((datasetIdentifier) => {
    try {
      const parts = datasetIdentifier.split('/')
      if (parts.length !== 3) return

      const [source, , entityAndYear] = parts
      const [entityCode, year] = entityAndYear.split(':')

      const entry = catalog.value.find((e) => e.type === source && e.entityCode === entityCode)

      if (entry && entry.availableYears.includes(year)) {
        const dataset: SelectedDataset = {
          id: `${entry.id}_${year}`,
          entry,
          year,
          datasetIdentifier,
        }
        selectedDatasets.value.push(dataset)
      }
    } catch (err) {
      console.warn('Failed to parse initial dataset:', datasetIdentifier, err)
    }
  })
}

// Watch for locale changes to update display
watch(locale, () => {
  // Force reactivity update for display names
})

// Watch for datasets prop changes to update selected datasets
watch(
  datasets,
  (newDatasets) => {
    if (catalog.value.length > 0) {
      // Clear current selection
      selectedDatasets.value = []

      // Initialize with new datasets
      if (newDatasets.length > 0) {
        initializeFromDatasets(newDatasets)
      }
    }
  },
  { deep: true },
)

// Initialize component
onMounted(() => {
  loadData()
})
</script>
