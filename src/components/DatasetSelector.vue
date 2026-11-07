<template>
  <div class="dataset-selector">
    <!-- Header -->
    <div class="selector-header">
      <h3>{{ $t('datasetSelector.title') }}</h3>
      <p class="subtitle">{{ $t('datasetSelector.subtitle') }}</p>
    </div>

    <!-- Search and Filters -->
    <div class="selector-toolbar">
      <div class="search-row">
        <IconField class="search-field">
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
          text
          rounded
          :aria-label="$t('datasetSelector.clearSearch')"
          @click="clearSearch"
        />
      </div>

      <Select
        v-model="selectedYear"
        :options="yearOptions"
        option-label="label"
        option-value="value"
        :placeholder="$t('datasetSelector.filters.year')"
        class="year-filter"
      />
    </div>

    <!-- Available Datasets -->
    <div class="available-datasets">
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

      <!-- Phones: one tappable card per entity instead of a five-column table -->
      <template v-if="isPhone">
        <ul v-if="visibleDatasets.length > 0" class="dataset-cards" data-testid="dataset-cards">
          <li v-for="entry in visibleDatasets" :key="entry.id" class="dataset-card">
            <div class="card-head">
              <strong class="card-name">{{ getDisplayName(entry) }}</strong>
              <span class="card-type">{{ $t(`datasetSelector.types.${entry.type}`) }}</span>
            </div>
            <p class="card-years">
              {{ entry.availableYears[0] }}–{{
                entry.availableYears[entry.availableYears.length - 1]
              }}
              <span class="card-years-count">
                ({{ $t('datasetSelector.yearCount', { count: entry.availableYears.length }) }})
              </span>
            </p>
            <div class="card-actions">
              <Select
                v-model="selectedYears[entry.id]"
                :options="getYearOptions(entry)"
                option-label="label"
                option-value="value"
                :placeholder="$t('datasetSelector.selectYear')"
                class="card-year"
              />
              <Button
                :label="getAddButtonLabel(entry)"
                icon="pi pi-plus"
                class="card-add"
                :disabled="isAddButtonDisabled(entry.id)"
                @click="addDatasetWithDefaultYear(entry)"
              />
            </div>
          </li>
        </ul>
        <p v-else-if="!loading" class="no-results">{{ $t('datasetSelector.noResults') }}</p>

        <Button
          v-if="remainingCount > 0"
          :label="$t('datasetSelector.showMore', { count: remainingCount })"
          severity="secondary"
          outlined
          class="show-more"
          @click="showMore"
        />
      </template>

      <DataTable
        v-else
        :value="filteredDatasets"
        :paginator="true"
        :rows="5"
        :rows-per-page-options="[5, 10, 20, 50]"
        paginator-template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        :current-page-report-template="pageReportTemplate"
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

      <div class="selected-actions">
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
          @click="openFullView"
          :disabled="selectedDatasets.length === 0"
        />
      </div>

      <ul v-if="isPhone" class="selected-chips" data-testid="selected-chips">
        <li v-for="dataset in selectedDatasets" :key="dataset.id" class="selected-chip">
          <span class="chip-name">{{ getDisplayName(dataset.entry) }}</span>
          <span class="chip-year">{{ dataset.year }}</span>
          <button
            type="button"
            class="chip-remove"
            :aria-label="
              $t('datasetSelector.removeDataset', { name: getDisplayName(dataset.entry) })
            "
            @click="removeDataset(dataset.id)"
          >
            <i class="pi pi-times" aria-hidden="true"></i>
          </button>
        </li>
      </ul>

      <div v-else class="selected-list">
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
                :aria-label="
                  $t('datasetSelector.removeDataset', { name: getDisplayName(sp.data.entry) })
                "
                @click="removeDataset(sp.data.id)"
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
import { useRouter } from 'vue-router'
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
import { PHONE_QUERY, useMediaQuery } from '@/composables/useMediaQuery'

const datasets = defineModel<string[]>({ required: true })

// Vue i18n and router
const { locale, t } = useI18n()
const router = useRouter()

// Reactive state
const loading = ref(true)
const catalog = ref<AvailableDataCatalog>([])
const searchQuery = ref('')
const selectedType = ref<'all' | 'gdn' | 'std'>('all')
const selectedYear = ref<string | null>(null)
const selectedYears = ref<Record<string, string>>({})

const isPhone = useMediaQuery(PHONE_QUERY)

// Phones show a card list that grows on demand instead of a paginated table.
const PAGE_SIZE = 10
const visibleCount = ref(PAGE_SIZE)

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

const visibleDatasets = computed(() => filteredDatasets.value.slice(0, visibleCount.value))
const remainingCount = computed(() =>
  Math.max(0, filteredDatasets.value.length - visibleCount.value),
)

// PrimeVue fills {first}/{last}/{totalRecords} itself; hand them through vue-i18n untouched.
const pageReportTemplate = computed(() =>
  t('datasetSelector.pageReportTemplate', {
    first: '{first}',
    last: '{last}',
    totalRecords: '{totalRecords}',
  }),
)

// Methods
const showMore = () => {
  visibleCount.value += PAGE_SIZE
}

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

const openFullView = () => {
  if (selectedDatasets.value.length === 0) {
    console.warn('Cannot open full view: no selected datasets')
    return
  }

  // Navigate to full view with datasets as query parameters
  const query: Record<string, string> = {
    datasets: selectedDatasets.value.map((dataset) => dataset.datasetIdentifier).join(','),
  }

  router.push({
    name: 'financial-data-full-view',
    query,
  })
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

// A new search or filter starts again at the first page of cards
watch([searchQuery, selectedYear], () => {
  visibleCount.value = PAGE_SIZE
})

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

<style scoped>
.selector-header {
  margin-bottom: 1rem;
}

.selector-header h3 {
  margin: 0 0 0.25rem;
}

.subtitle {
  margin: 0;
  color: var(--gk-muted);
}

.selector-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  border: 1px solid var(--gk-border);
  border-radius: var(--radius-lg);
  background: var(--gk-surface-2);
}

.search-row {
  display: flex;
  flex: 1 1 16rem;
  align-items: center;
  gap: 0.25rem;
  min-width: 0;
}

.search-field {
  flex: 1;
  min-width: 0;
}

.year-filter {
  min-width: 9.5rem;
}

.section-header {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.25rem 0.75rem;
  margin: 1.25rem 0 0.5rem;
}

.section-header h4 {
  margin: 0;
}

.results-count,
.selected-count {
  color: var(--gk-muted);
  font-size: 0.875rem;
}

.loading-state {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 0;
  color: var(--gk-muted);
}

.selected-datasets {
  margin-top: 1.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid var(--gk-border);
}

.selected-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 0.5rem;
  margin: 0.75rem 0;
}

/* Phone card list */
.dataset-cards,
.selected-chips {
  margin: 0;
  padding: 0;
  list-style: none;
}

.dataset-cards {
  display: grid;
  gap: 0.625rem;
}

.dataset-card {
  padding: 0.875rem 1rem;
  border: 1px solid var(--gk-border);
  border-radius: var(--radius-lg);
  background: var(--gk-surface);
}

.card-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.75rem;
}

.card-name {
  font-size: 1.05rem;
  line-height: 1.3;
  overflow-wrap: anywhere;
}

.card-type {
  flex: none;
  padding: 0.1rem 0.5rem;
  border-radius: 999px;
  background: color-mix(in srgb, var(--gk-accent) 12%, transparent);
  color: var(--gk-accent-strong);
  font-size: 0.72rem;
  font-weight: 600;
}

.card-years {
  margin: 0.25rem 0 0.75rem;
  color: var(--gk-muted);
  font-size: 0.85rem;
  font-variant-numeric: tabular-nums;
}

.card-actions {
  display: flex;
  gap: 0.5rem;
}

.card-year {
  flex: 0 0 6.5rem;
  min-height: 2.75rem;
}

.card-add {
  flex: 1;
  min-height: 2.75rem;
}

.show-more {
  width: 100%;
  min-height: 2.75rem;
  margin-top: 0.75rem;
}

.no-results {
  margin: 1rem 0;
  color: var(--gk-muted);
  text-align: center;
}

.selected-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.selected-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  max-width: 100%;
  padding: 0.25rem 0.25rem 0.25rem 0.75rem;
  border: 1px solid color-mix(in srgb, var(--gk-accent) 35%, var(--gk-border));
  border-radius: 999px;
  background: color-mix(in srgb, var(--gk-accent) 9%, transparent);
  font-size: 0.875rem;
}

.chip-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 600;
}

.chip-year {
  color: var(--gk-muted);
  font-variant-numeric: tabular-nums;
}

.chip-remove {
  display: inline-grid;
  place-items: center;
  flex: none;
  width: 2.25rem;
  height: 2.25rem;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: var(--gk-ink);
  cursor: pointer;
}

.chip-remove:hover,
.chip-remove:focus-visible {
  background: color-mix(in srgb, var(--gk-negative) 14%, transparent);
  color: var(--gk-negative);
}

@media (max-width: 767px) {
  .year-filter {
    flex: 1 1 100%;
  }

  .selected-actions > * {
    flex: 1 1 100%;
    min-height: 2.75rem;
  }
}
</style>
