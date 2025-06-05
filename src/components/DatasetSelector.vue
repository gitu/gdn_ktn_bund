<template>
  <div class="dataset-selector">
    <!-- Header -->
    <div class="selector-header">
      <h3>{{ $t('datasetSelector.title') }}</h3>
      <p class="subtitle">{{ $t('datasetSelector.subtitle') }}</p>
    </div>

    <!-- Search and Filters -->
    <div class="search-filters">
      <div class="search-section">
        <div class="p-inputgroup">
          <InputText
            v-model="searchQuery"
            :placeholder="$t('datasetSelector.searchPlaceholder')"
            class="search-input"
          />
          <Button
            icon="pi pi-search"
            severity="secondary"
            :disabled="!searchQuery"
            @click="performSearch"
          />
          <Button
            v-if="searchQuery"
            icon="pi pi-times"
            severity="secondary"
            @click="clearSearch"
          />
        </div>
      </div>

      <div class="filter-section">
        <Dropdown
          v-model="selectedType"
          :options="typeOptions"
          option-label="label"
          option-value="value"
          :placeholder="$t('datasetSelector.filters.dataType')"
          class="type-filter"
        />
        
        <Dropdown
          v-model="selectedYear"
          :options="yearOptions"
          option-label="label"
          option-value="value"
          :placeholder="$t('datasetSelector.filters.year')"
          class="year-filter"
        />
      </div>
    </div>

    <!-- Available Datasets -->
    <div class="available-datasets">
      <div class="section-header">
        <h4>{{ $t('datasetSelector.availableDatasets') }}</h4>
        <span class="results-count">
          {{ $t('datasetSelector.resultsCount', { count: filteredDatasets.length, total: totalDatasets }) }}
        </span>
      </div>

      <div v-if="loading" class="loading-state">
        <ProgressSpinner size="small" />
        <span>{{ $t('datasetSelector.loading') }}</span>
      </div>

      <div v-else-if="error" class="error-state">
        <Message severity="error" :closable="false">
          {{ error }}
        </Message>
      </div>

      <DataTable
        v-else
        :value="filteredDatasets"
        :paginator="true"
        :rows="10"
        :rows-per-page-options="[5, 10, 20, 50]"
        paginator-template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        :current-page-report-template="$t('datasetSelector.pageReportTemplate')"
        class="datasets-table"
        :scroll-height="'400px'"
        scroll-direction="vertical"
      >
        <Column field="displayName" :header="$t('datasetSelector.columns.name')" class="name-column">
          <template #body="{ data }">
            <div class="dataset-name">
              <strong>{{ getDisplayName(data) }}</strong>
              <div class="dataset-type">
                <Tag
                  :value="$t(`datasetSelector.types.${data.type}`)"
                  :severity="data.type === 'gdn' ? 'info' : 'success'"
                  class="type-tag"
                />
              </div>
            </div>
          </template>
        </Column>

        <Column field="description" :header="$t('datasetSelector.columns.description')" class="description-column">
          <template #body="{ data }">
            <div class="dataset-description">
              {{ getDescription(data) }}
            </div>
          </template>
        </Column>

        <Column field="availableYears" :header="$t('datasetSelector.columns.years')" class="years-column">
          <template #body="{ data }">
            <div class="available-years">
              <span class="year-range">
                {{ data.availableYears[0] }} - {{ data.availableYears[data.availableYears.length - 1] }}
              </span>
              <small class="year-count">
                ({{ $t('datasetSelector.yearCount', { count: data.availableYears.length }) }})
              </small>
              <div class="latest-year-indicator">
                <i class="pi pi-star-fill"></i>
                <span>{{ $t('datasetSelector.latestYear') }}: {{ getLatestYear(data) }}</span>
              </div>
            </div>
          </template>
        </Column>

        <Column :header="$t('datasetSelector.columns.actions')" class="actions-column">
          <template #body="{ data }">
            <div class="dataset-actions">
              <Dropdown
                v-model="selectedYears[data.id]"
                :options="getYearOptions(data)"
                option-label="label"
                option-value="value"
                :placeholder="$t('datasetSelector.selectYear')"
                class="year-selector"
                :disabled="isDatasetSelected(data.id)"
                @focus="setDefaultYear(data)"
              />
              <Button
                :label="getAddButtonLabel(data)"
                icon="pi pi-plus"
                size="small"
                :disabled="isDatasetSelected(data.id)"
                @click="addDatasetWithDefaultYear(data)"
                @mouseenter="setDefaultYear(data)"
              />
            </div>
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

      <div class="selected-list">
        <div
          v-for="dataset in selectedDatasets"
          :key="dataset.id"
          class="selected-item"
        >
          <div class="item-info">
            <div class="item-name">
              <strong>{{ getDisplayName(dataset.entry) }}</strong>
              <Tag
                :value="$t(`datasetSelector.types.${dataset.entry.type}`)"
                :severity="dataset.entry.type === 'gdn' ? 'info' : 'success'"
                size="small"
              />
            </div>
            <div class="item-details">
              <span class="year-badge">{{ dataset.year }}</span>
              <span class="entity-code">{{ dataset.entry.entityCode }}</span>
            </div>
          </div>
          <Button
            icon="pi pi-times"
            severity="danger"
            size="small"
            text
            @click="removeDataset(dataset.id)"
            :aria-label="$t('datasetSelector.removeDataset', { name: getDisplayName(dataset.entry) })"
          />
        </div>
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
          @click="emitSelectedDatasets"
          :disabled="selectedDatasets.length === 0"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';
import Dropdown from 'primevue/dropdown';
import Tag from 'primevue/tag';
import Message from 'primevue/message';
import ProgressSpinner from 'primevue/progressspinner';
import type { AvailableDataEntry, AvailableDataCatalog } from '@/types/DataStructures';
import {
  loadAvailableDataCatalog,
  filterByType,
  filterByYear,
  searchByName,
  getAllAvailableYears
} from '@/utils/AvailableDataLoader';

// Props
interface Props {
  initialDatasets?: string[];
}

const props = withDefaults(defineProps<Props>(), {
  initialDatasets: () => []
});

// Emits
interface Emits {
  datasetsChanged: [datasets: string[]];
  error: [error: string];
}

const emit = defineEmits<Emits>();

// Vue i18n
const { locale, t } = useI18n();

// Reactive state
const loading = ref(true);
const error = ref<string | null>(null);
const catalog = ref<AvailableDataCatalog>([]);
const searchQuery = ref('');
const selectedType = ref<'all' | 'gdn' | 'std'>('all');
const selectedYear = ref<string | null>(null);
const selectedYears = ref<Record<string, string>>({});

// Selected datasets structure
interface SelectedDataset {
  id: string;
  entry: AvailableDataEntry;
  year: string;
  datasetIdentifier: string; // Format: 'gdn/fs/010002:2016'
}

const selectedDatasets = ref<SelectedDataset[]>([]);

// Computed properties
const totalDatasets = computed(() => catalog.value.length);

const typeOptions = computed(() => [
  { label: t('datasetSelector.filters.all'), value: 'all' },
  { label: t('datasetSelector.filters.gdn'), value: 'gdn' },
  { label: t('datasetSelector.filters.std'), value: 'std' }
]);

const yearOptions = computed(() => {
  const years = getAllAvailableYears(catalog.value);
  return [
    { label: t('datasetSelector.filters.allYears'), value: null },
    ...years.map(year => ({ label: year, value: year }))
  ];
});

const filteredDatasets = computed(() => {
  let filtered = catalog.value;

  // Apply type filter
  if (selectedType.value !== 'all') {
    filtered = filterByType(filtered, selectedType.value);
  }

  // Apply year filter
  if (selectedYear.value) {
    filtered = filterByYear(filtered, selectedYear.value);
  }

  // Apply search filter
  if (searchQuery.value.trim()) {
    filtered = searchByName(filtered, searchQuery.value.trim(), locale.value as 'de' | 'fr' | 'it' | 'en');
  }

  return filtered;
});

// Methods
const getDisplayName = (entry: AvailableDataEntry): string => {
  return entry.displayName[locale.value as keyof typeof entry.displayName] || entry.displayName.de;
};

const getDescription = (entry: AvailableDataEntry): string => {
  return entry.description[locale.value as keyof typeof entry.description] || entry.description.de;
};

const getYearOptions = (entry: AvailableDataEntry) => {
  return entry.availableYears.map(year => ({
    label: year,
    value: year
  }));
};

const setDefaultYear = (entry: AvailableDataEntry) => {
  // Only set default if no year is currently selected for this entry
  if (!selectedYears.value[entry.id] && entry.availableYears.length > 0) {
    // Sort years and select the latest (last) one
    const sortedYears = [...entry.availableYears].sort();
    const latestYear = sortedYears[sortedYears.length - 1];
    selectedYears.value[entry.id] = latestYear;
  }
};

const getLatestYear = (entry: AvailableDataEntry): string => {
  if (entry.availableYears.length === 0) return '';
  const sortedYears = [...entry.availableYears].sort();
  return sortedYears[sortedYears.length - 1];
};

const getAddButtonLabel = (entry: AvailableDataEntry): string => {
  const selectedYear = selectedYears.value[entry.id];
  if (selectedYear) {
    return t('datasetSelector.addDatasetWithYear', { year: selectedYear });
  }

  const latestYear = getLatestYear(entry);
  if (latestYear) {
    return t('datasetSelector.addLatestYear', { year: latestYear });
  }

  return t('datasetSelector.addDataset');
};

const addDatasetWithDefaultYear = (entry: AvailableDataEntry) => {
  // Ensure we have a year selected (set default if needed)
  setDefaultYear(entry);

  // Now add the dataset
  addDataset(entry);
};

const isDatasetSelected = (entryId: string): boolean => {
  return selectedDatasets.value.some(dataset =>
    dataset.entry.id === entryId && dataset.year === selectedYears.value[entryId]
  );
};

const generateDatasetIdentifier = (entry: AvailableDataEntry, year: string): string => {
  // Format: 'source/model/entity:year'
  // For now, we'll use 'fs' as the default model (financial statements)
  return `${entry.type}/fs/${entry.entityCode}:${year}`;
};

const addDataset = (entry: AvailableDataEntry) => {
  const year = selectedYears.value[entry.id];
  if (!year) return;

  const datasetIdentifier = generateDatasetIdentifier(entry, year);

  // Check for duplicates
  const exists = selectedDatasets.value.some(dataset =>
    dataset.datasetIdentifier === datasetIdentifier
  );

  if (exists) {
    error.value = t('datasetSelector.errors.duplicateDataset');
    return;
  }

  const newDataset: SelectedDataset = {
    id: `${entry.id}_${year}`,
    entry,
    year,
    datasetIdentifier
  };

  selectedDatasets.value.push(newDataset);

  // Clear the year selection for this entry
  delete selectedYears.value[entry.id];

  // Emit the change
  emitSelectedDatasets();
};

const removeDataset = (datasetId: string) => {
  const index = selectedDatasets.value.findIndex(dataset => dataset.id === datasetId);
  if (index !== -1) {
    selectedDatasets.value.splice(index, 1);
    emitSelectedDatasets();
  }
};

const clearAllDatasets = () => {
  selectedDatasets.value = [];
  selectedYears.value = {};
  emitSelectedDatasets();
};

const emitSelectedDatasets = () => {
  const datasetIdentifiers = selectedDatasets.value.map(dataset => dataset.datasetIdentifier);
  emit('datasetsChanged', datasetIdentifiers);
};

const performSearch = () => {
  // Search is reactive, so this is mainly for the search button click
  // Could add analytics or other side effects here
};

const clearSearch = () => {
  searchQuery.value = '';
};

// Load data on mount
const loadData = async () => {
  try {
    loading.value = true;
    error.value = null;

    catalog.value = await loadAvailableDataCatalog();

    // Initialize with any provided initial datasets
    if (props.initialDatasets.length > 0) {
      initializeFromDatasets(props.initialDatasets);
    }
  } catch (err) {
    error.value = t('datasetSelector.errors.loadingFailed');
    emit('error', error.value);
    console.error('Failed to load available data catalog:', err);
  } finally {
    loading.value = false;
  }
};

const initializeFromDatasets = (datasets: string[]) => {
  // Parse initial datasets and populate selectedDatasets
  datasets.forEach(datasetIdentifier => {
    try {
      const parts = datasetIdentifier.split('/');
      if (parts.length !== 3) return;

      const [source, , entityAndYear] = parts;
      const [entityCode, year] = entityAndYear.split(':');

      const entry = catalog.value.find(e =>
        e.type === source && e.entityCode === entityCode
      );

      if (entry && entry.availableYears.includes(year)) {
        const dataset: SelectedDataset = {
          id: `${entry.id}_${year}`,
          entry,
          year,
          datasetIdentifier
        };
        selectedDatasets.value.push(dataset);
      }
    } catch (err) {
      console.warn('Failed to parse initial dataset:', datasetIdentifier, err);
    }
  });
};

// Watch for locale changes to update display
watch(locale, () => {
  // Force reactivity update for display names
});

// Initialize component
onMounted(() => {
  loadData();
});
</script>

<style scoped>
.dataset-selector {
  width: 100%;
  max-width: 100%;
}

.selector-header {
  margin-bottom: 1.5rem;
}

.selector-header h3 {
  margin: 0 0 0.5rem 0;
  color: var(--text-color);
}

.subtitle {
  margin: 0;
  color: var(--text-color-secondary);
  font-size: 0.9rem;
}

.search-filters {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: var(--surface-card);
  border-radius: var(--border-radius);
  border: 1px solid var(--surface-border);
}

.search-section .p-inputgroup {
  width: 100%;
}

.search-input {
  flex: 1;
}

.filter-section {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.type-filter,
.year-filter {
  min-width: 150px;
  flex: 1;
}

.available-datasets {
  margin-bottom: 2rem;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.section-header h4 {
  margin: 0;
  color: var(--text-color);
}

.results-count,
.selected-count {
  font-size: 0.9rem;
  color: var(--text-color-secondary);
}

.loading-state,
.error-state {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  justify-content: center;
}

.datasets-table {
  border: 1px solid var(--surface-border);
  border-radius: var(--border-radius);
}

.name-column {
  min-width: 200px;
}

.description-column {
  min-width: 250px;
}

.years-column {
  min-width: 120px;
}

.actions-column {
  min-width: 200px;
}

.dataset-name {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.dataset-type {
  display: flex;
  align-items: center;
}

.type-tag {
  font-size: 0.75rem;
}

.dataset-description {
  font-size: 0.9rem;
  color: var(--text-color-secondary);
  line-height: 1.3;
}

.available-years {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.year-range {
  font-weight: 500;
}

.year-count {
  color: var(--text-color-secondary);
  font-size: 0.8rem;
}

.latest-year-indicator {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  margin-top: 0.25rem;
  font-size: 0.75rem;
  color: var(--primary-color);
  font-weight: 500;
}

.latest-year-indicator i {
  font-size: 0.7rem;
}

.dataset-actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.year-selector {
  min-width: 80px;
}

.selected-datasets {
  background: var(--surface-card);
  border: 1px solid var(--surface-border);
  border-radius: var(--border-radius);
  padding: 1rem;
}

.selected-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.selected-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: var(--surface-ground);
  border: 1px solid var(--surface-border);
  border-radius: var(--border-radius);
}

.item-info {
  flex: 1;
}

.item-name {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
}

.item-details {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.year-badge {
  background: var(--primary-color);
  color: var(--primary-color-text);
  padding: 0.25rem 0.5rem;
  border-radius: var(--border-radius);
  font-size: 0.8rem;
  font-weight: 500;
}

.entity-code {
  font-family: monospace;
  font-size: 0.85rem;
  color: var(--text-color-secondary);
  background: var(--surface-100);
  padding: 0.125rem 0.375rem;
  border-radius: var(--border-radius);
}

.selected-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
}

/* Responsive design */
@media (max-width: 768px) {
  .filter-section {
    flex-direction: column;
  }

  .type-filter,
  .year-filter {
    min-width: unset;
  }

  .dataset-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .year-selector {
    min-width: unset;
  }

  .selected-actions {
    flex-direction: column;
  }

  .item-details {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;
  }
}
</style>
