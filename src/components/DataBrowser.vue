<template>
  <div class="data-browser">
    <div class="browser-header">
      <h3>{{ title || t('dataBrowser.title') }}</h3>
    </div>

    <div class="search-section">
      <div class="search-input-group">
        <input
          v-model="filters.searchQuery"
          type="text"
          :placeholder="t('dataBrowser.searchPlaceholder')"
          class="search-input"
          @input="handleSearch"
        />
        <button @click="clearSearch" class="clear-button" v-if="filters.searchQuery">
          ×
        </button>
      </div>

      <div class="filter-controls">
        <div class="filter-group">
          <label>{{ t('dataBrowser.filters.dataType') }}:</label>
          <select v-model="filters.dataType" @change="handleFilterChange">
            <option value="all">{{ t('dataBrowser.filterOptions.all') }}</option>
            <option value="std">{{ t('dataBrowser.filterOptions.std') }}</option>
            <option value="gdn">{{ t('dataBrowser.filterOptions.gdn') }}</option>
          </select>
        </div>

        <div class="filter-group">
          <label>{{ t('dataBrowser.filters.yearRange') }}:</label>
          <div class="year-range">
            <input
              v-model="filters.yearRange.start"
              type="number"
              :placeholder="t('dataBrowser.filters.yearFrom')"
              min="2015"
              max="2023"
              class="year-input"
              @input="handleFilterChange"
            />
            <span>-</span>
            <input
              v-model="filters.yearRange.end"
              type="number"
              :placeholder="t('dataBrowser.filters.yearTo')"
              min="2015"
              max="2023"
              class="year-input"
              @input="handleFilterChange"
            />
          </div>
        </div>
      </div>
    </div>

    <div class="results-section">
      <div class="results-header">
        <span class="results-count">
          {{ t('dataBrowser.resultsCount', { count: filteredResults.length, total: searchResults.length }) }}
        </span>
        <div class="view-options">
          <label class="checkbox-label">
            <input type="checkbox" v-model="config.showDescriptions" />
            {{ t('dataBrowser.viewOptions.showDescriptions') }}
          </label>
          <label class="checkbox-label">
            <input type="checkbox" v-model="config.showYearRange" />
            {{ t('dataBrowser.viewOptions.showYearRange') }}
          </label>
        </div>
      </div>

      <div v-if="loading" class="loading">
        {{ t('dataBrowser.loading') }}
      </div>

      <div v-else-if="error" class="error">
        {{ error }}
      </div>

      <div v-else-if="filteredResults.length === 0" class="no-results">
        {{ t('dataBrowser.noResults') }}
      </div>

      <div v-else class="results-list">
        <div
          v-for="result in paginatedResults"
          :key="result.id"
          class="result-item"
          :class="{ 'std-item': result.type === 'std', 'gdn-item': result.type === 'gdn' }"
          @click="selectResult(result)"
        >
          <div class="result-header">
            <h4 class="result-title">
              {{ result.displayName[locale as keyof MultiLanguageLabels] }}
            </h4>
            <span class="result-type">{{ result.type.toUpperCase() }}</span>
          </div>

          <div v-if="config.showDescriptions" class="result-description">
            {{ result.description[locale as keyof MultiLanguageLabels] }}
          </div>

          <div class="result-metadata">
            <span v-if="config.showYearRange" class="year-range">
              {{ getYearRangeText(result.availableYears) }}
            </span>
            <span v-if="result.municipalityNumber" class="municipality-number">
              Nr. {{ result.municipalityNumber }}
            </span>
          </div>
        </div>
      </div>

      <div v-if="totalPages > 1" class="pagination">
        <button
          @click="currentPage = Math.max(1, currentPage - 1)"
          :disabled="currentPage === 1"
          class="pagination-button"
        >
          ‹
        </button>
        <span class="page-info">
          {{ currentPage }} / {{ totalPages }}
        </span>
        <button
          @click="currentPage = Math.min(totalPages, currentPage + 1)"
          :disabled="currentPage === totalPages"
          class="pagination-button"
        >
          ›
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import type {
  StdDataInfo,
  GdnDataInfo,
  AvailableDataEntry,
  DataBrowserFilters,
  DataBrowserConfig,
  MultiLanguageLabels
} from '../types/DataStructures';
import { EntitySemanticMapper } from '../utils/EntitySemanticMapper';

interface Props {
  title?: string;
  initialConfig?: Partial<DataBrowserConfig>;
  maxResultsPerPage?: number;
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Data Browser',
  maxResultsPerPage: 20
});

const emit = defineEmits<{
  resultSelected: [result: AvailableDataEntry];
  error: [error: string];
}>();

// Use Vue i18n
const { locale, t } = useI18n();

// Reactive state
const loading = ref(false);
const error = ref<string | null>(null);
const stdData = ref<StdDataInfo[]>([]);
const gdnData = ref<GdnDataInfo[]>([]);
const searchResults = ref<AvailableDataEntry[]>([]);
const currentPage = ref(1);

// Configuration (removed language since it's now handled by i18n)
const config = ref<Omit<DataBrowserConfig, 'language'>>({
  showDescriptions: true,
  showYearRange: true,
  maxResults: 100,
  ...props.initialConfig
});

// Filters
const filters = ref<DataBrowserFilters>({
  searchQuery: '',
  dataType: 'all',
  yearRange: {}
});

// Computed properties
const filteredResults = computed(() => {
  let results = searchResults.value;

  // Apply data type filter
  if (filters.value.dataType !== 'all') {
    results = results.filter((result: AvailableDataEntry) => result.type === filters.value.dataType);
  }

  // Apply year range filter
  if (filters.value.yearRange.start || filters.value.yearRange.end) {
    results = results.filter((result: AvailableDataEntry) => {
      const years = result.availableYears.map((y: string) => parseInt(y));
      const minYear = Math.min(...years);
      const maxYear = Math.max(...years);

      if (filters.value.yearRange.start && maxYear < parseInt(filters.value.yearRange.start)) {
        return false;
      }
      if (filters.value.yearRange.end && minYear > parseInt(filters.value.yearRange.end)) {
        return false;
      }
      return true;
    });
  }

  return results.slice(0, config.value.maxResults);
});

const totalPages = computed(() => {
  return Math.ceil(filteredResults.value.length / props.maxResultsPerPage);
});

const paginatedResults = computed(() => {
  const start = (currentPage.value - 1) * props.maxResultsPerPage;
  const end = start + props.maxResultsPerPage;
  return filteredResults.value.slice(start, end);
});

// Methods
const loadData = async () => {
  loading.value = true;
  error.value = null;

  try {
    // Load STD data info
    const stdResponse = await fetch('/data/std-info.json');
    if (!stdResponse.ok) throw new Error('Failed to load STD data info');
    stdData.value = await stdResponse.json();

    // Load GDN data info
    const gdnResponse = await fetch('/data/gdn-info.json');
    if (!gdnResponse.ok) throw new Error('Failed to load GDN data info');
    gdnData.value = await gdnResponse.json();

    // Process data into search results
    processDataIntoResults();
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error loading data';
    error.value = errorMessage;
    emit('error', errorMessage);
  } finally {
    loading.value = false;
  }
};

const processDataIntoResults = () => {
  const results: AvailableDataEntry[] = [];

  // Process STD data - only include 'fs' model data
  stdData.value.forEach(entry => {
    if (!entry.models || !Array.isArray(entry.models)) return; // Skip entries without models array

    const fsModel = entry.models.find(model => model.model === 'fs');
    if (!fsModel) return; // Skip entries without 'fs' model

    const displayName = EntitySemanticMapper.getEntityDisplayName(entry.hh);
    const description = EntitySemanticMapper.getEntityDescription(entry.hh);
    const availableYears = fsModel.jahre ? fsModel.jahre.sort() : [];

    results.push({
      id: `std-${entry.hh}`,
      type: 'std',
      entityCode: entry.hh,
      displayName,
      description,
      availableYears
    });
  });

  // Process GDN data - only include 'fs' model data
  gdnData.value.forEach(entry => {
    if (!entry.models || !Array.isArray(entry.models)) return; // Skip entries without models array

    const fsModel = entry.models.find(m => m.model === 'fs');
    if (!fsModel) return; // Skip entries without 'fs' model

    const displayName: MultiLanguageLabels = {
      de: entry.gemeinde,
      fr: entry.gemeinde,
      it: entry.gemeinde,
      en: entry.gemeinde
    };
    const description: MultiLanguageLabels = {
      de: t('dataBrowser.municipalityData', { name: entry.gemeinde }),
      fr: t('dataBrowser.municipalityData', { name: entry.gemeinde }),
      it: t('dataBrowser.municipalityData', { name: entry.gemeinde }),
      en: t('dataBrowser.municipalityData', { name: entry.gemeinde })
    };

    results.push({
      id: `gdn-${entry.nr}`,
      type: 'gdn',
      entityCode: entry.nr,
      displayName,
      description,
      availableYears: fsModel.jahre ? fsModel.jahre.sort() : [],
      municipalityNumber: entry.nr
    });
  });

  searchResults.value = results;
};

const handleSearch = () => {
  currentPage.value = 1;
  performSearch();
};

const performSearch = () => {
  if (!filters.value.searchQuery.trim()) {
    return; // All results are already shown
  }

  const query = filters.value.searchQuery.toLowerCase();
  searchResults.value = searchResults.value.filter((result: AvailableDataEntry) => {
    // Search in display name
    const displayName = result.displayName[locale.value as keyof MultiLanguageLabels].toLowerCase();
    if (displayName.includes(query)) return true;

    // Search in description
    const description = result.description[locale.value as keyof MultiLanguageLabels].toLowerCase();
    if (description.includes(query)) return true;

    // Search in entity code
    if (result.entityCode.toLowerCase().includes(query)) return true;

    // Search in municipality number for GDN entries
    if (result.municipalityNumber && result.municipalityNumber.includes(query)) return true;

    return false;
  });
};

const clearSearch = () => {
  filters.value.searchQuery = '';
  processDataIntoResults(); // Reset to all results
  currentPage.value = 1;
};

const handleFilterChange = () => {
  currentPage.value = 1;
};

const selectResult = (result: AvailableDataEntry) => {
  emit('resultSelected', result);
};

const getYearRangeText = (years: string[]): string => {
  if (years.length === 0) return '';
  const sortedYears = years.sort();
  const first = sortedYears[0];
  const last = sortedYears[sortedYears.length - 1];
  return first === last ? first : `${first}-${last}`;
};



// Watchers
watch(() => filters.value.searchQuery, () => {
  if (filters.value.searchQuery.trim()) {
    performSearch();
  } else {
    processDataIntoResults();
  }
});

watch(locale, () => {
  // Re-process results when language changes to update display names
  processDataIntoResults();
});

// Lifecycle
onMounted(() => {
  loadData();
});

// Expose methods for parent components
defineExpose({
  loadData,
  clearSearch,
  selectResult: (id: string) => {
    const result = searchResults.value.find((r: AvailableDataEntry) => r.id === id);
    if (result) selectResult(result);
  }
});
</script>

<style scoped>
.data-browser {
  width: 100%;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.browser-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
  border-radius: 8px 8px 0 0;
}

.browser-header h3 {
  margin: 0;
  color: #1f2937;
  font-size: 1.25rem;
  font-weight: 600;
}

.controls select {
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  background: white;
  font-size: 0.875rem;
}

.search-section {
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.search-input-group {
  position: relative;
  margin-bottom: 1rem;
}

.search-input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 2px solid #d1d5db;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.2s;
}

.search-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.clear-button {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  background: #6b7280;
  color: white;
  border: none;
  border-radius: 50%;
  width: 1.5rem;
  height: 1.5rem;
  cursor: pointer;
  font-size: 1rem;
  line-height: 1;
}

.clear-button:hover {
  background: #4b5563;
}

.filter-controls {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.filter-group label {
  font-weight: 500;
  color: #374151;
  font-size: 0.875rem;
}

.filter-group select {
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  background: white;
}

.checkbox-group {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  cursor: pointer;
}

.checkbox-label input[type="checkbox"] {
  margin: 0;
}

.year-range {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.year-input {
  width: 80px;
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  text-align: center;
}

.results-section {
  padding: 1.5rem;
}

.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.results-count {
  font-weight: 500;
  color: #6b7280;
}

.view-options {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.loading, .error, .no-results {
  text-align: center;
  padding: 2rem;
  color: #6b7280;
}

.error {
  color: #dc2626;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 4px;
}

.results-list {
  display: grid;
  gap: 0.75rem;
}

.result-item {
  padding: 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  background: white;
}

.result-item:hover {
  border-color: #3b82f6;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.1);
}

.std-item {
  border-left: 4px solid #10b981;
}

.gdn-item {
  border-left: 4px solid #f59e0b;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.5rem;
}

.result-title {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
  flex: 1;
}

.result-type {
  background: #f3f4f6;
  color: #6b7280;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
  margin-left: 1rem;
}

.result-description {
  color: #6b7280;
  font-size: 0.875rem;
  margin-bottom: 0.5rem;
  line-height: 1.4;
}

.result-metadata {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  font-size: 0.75rem;
  color: #9ca3af;
}

.result-metadata span {
  background: #f9fafb;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
}

.pagination-button {
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.2s;
}

.pagination-button:hover:not(:disabled) {
  background: #f3f4f6;
  border-color: #9ca3af;
}

.pagination-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  font-weight: 500;
  color: #6b7280;
}

@media (max-width: 768px) {
  .filter-controls {
    grid-template-columns: 1fr;
  }

  .results-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .view-options {
    width: 100%;
  }

  .result-header {
    flex-direction: column;
    gap: 0.5rem;
  }

  .result-type {
    margin-left: 0;
    align-self: flex-start;
  }
}
</style>
