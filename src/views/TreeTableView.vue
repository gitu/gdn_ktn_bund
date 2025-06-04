<template>
  <main class="tree-table-view">
    <div class="header">
      <h1>{{ t('treeTableView.title') }}</h1>
      <p>{{ t('treeTableView.description') }}</p>
    </div>

    <div class="demo-controls">
      <div class="control-group">
        <label for="dimension-select">{{ t('treeTableView.dimension') }}:</label>
        <select id="dimension-select" v-model="selectedDimension">
          <option v-for="dim in dimensions" :key="dim.value" :value="dim.value">
            {{ dim.label }}
          </option>
        </select>
      </div>

      <div class="control-group">
        <label for="title-input">{{ t('treeTableView.tableTitle') }}:</label>
        <input
          id="title-input"
          v-model="tableTitle"
          type="text"
          :placeholder="t('treeTableView.titlePlaceholder')"
          class="title-input"
        />
      </div>
    </div>

    <div class="data-browser-section">
      <h3>{{ t('treeTableView.dataBrowser') }}</h3>
      <p>{{ t('treeTableView.dataBrowserDescription') }}</p>
      <DataBrowser
        :title="t('treeTableView.availableEntities')"
        @result-selected="onDataBrowserSelection"
        @error="onDataBrowserError"
      />
    </div>

    <div class="table-section">
      <HierarchicalTreeTable
        v-if="currentDataPath"
        :data-path="currentDataPath"
        :title="tableTitle"
        :dimension="selectedDimension"
        :initial-config="tableConfig"
        @data-loaded="onDataLoaded"
        @row-toggled="onRowToggled"
        @error="onError"
      />
      <div v-else class="no-selection">
        <p>{{ t('treeTableView.noDataSelected') }}</p>
      </div>
    </div>

    <div v-if="lastLoadedData" class="metadata-section">
      <h3>{{ t('treeTableView.dataInformation') }}</h3>
      <div class="metadata-grid">
        <div class="metadata-item">
          <strong>{{ t('treeTableView.dimension') }}:</strong>
          {{ lastLoadedData.metadata.dimension }}
        </div>
        <div class="metadata-item" v-if="lastLoadedData.metadata.model">
          <strong>{{ t('treeTableView.model') }}:</strong>
          {{ lastLoadedData.metadata.model }}
        </div>
        <div class="metadata-item">
          <strong>{{ t('treeTableView.totalRecords') }}:</strong>
          {{ lastLoadedData.metadata.totalRecords }}
        </div>
        <div class="metadata-item">
          <strong>{{ t('treeTableView.treeNodes') }}:</strong>
          {{ lastLoadedData.metadata.treeStructure?.metadata.totalNodes || 'N/A' }}
        </div>
        <div class="metadata-item">
          <strong>{{ t('treeTableView.maxDepth') }}:</strong>
          {{ lastLoadedData.metadata.treeStructure?.metadata.maxDepth || 'N/A' }}
        </div>
        <div class="metadata-item">
          <strong>{{ t('treeTableView.processedAt') }}:</strong>
          {{ formatDate(lastLoadedData.metadata.processedAt) }}
        </div>
      </div>
    </div>

    <div v-if="errorMessage" class="error-section">
      <h3>{{ t('treeTableView.error') }}</h3>
      <div class="error-message">
        {{ errorMessage }}
      </div>
    </div>

    <div class="documentation-section">
      <h3>{{ t('treeTableView.usageDocumentation') }}</h3>
      <div class="doc-content">
        <h4>{{ t('treeTableView.dataPathFormat') }}</h4>
        <ul>
          <li><strong>{{ t('treeTableView.gdnData') }}:</strong> <code>gdn/{entityId}/{year}</code> ({{ t('treeTableView.example') }}, <code>gdn/ag/2019</code>)</li>
          <li><strong>{{ t('treeTableView.stdData') }}:</strong> <code>std/{model}/{entityId}/{year}</code> ({{ t('treeTableView.example') }}, <code>std/fs/ag/2019</code>)</li>
        </ul>

        <h4>{{ t('treeTableView.availableDimensions') }}</h4>
        <ul>
          <li><strong>aufwand:</strong> {{ t('treeTableView.expenditure') }}</li>
          <li><strong>ertrag:</strong> {{ t('treeTableView.revenue') }}</li>
          <li><strong>einnahmen:</strong> {{ t('treeTableView.income') }}</li>
          <li><strong>ausgaben:</strong> {{ t('treeTableView.expenses') }}</li>
          <li><strong>bilanz:</strong> {{ t('treeTableView.balanceSheet') }}</li>
        </ul>

        <h4>{{ t('treeTableView.features') }}</h4>
        <ul>
          <li>{{ t('treeTableView.hierarchicalStructure') }}</li>
          <li>{{ t('treeTableView.multiLanguageSupport') }}</li>
          <li>{{ t('treeTableView.configurableDisplay') }}</li>
          <li>{{ t('treeTableView.responsiveDesign') }}</li>
          <li>{{ t('treeTableView.realTimeAggregation') }}</li>
        </ul>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useI18n } from 'vue-i18n';
import HierarchicalTreeTable from '../components/HierarchicalTreeTable.vue';
import DataBrowser from '../components/DataBrowser.vue';
import type { TreeAggregationResult, TreeTableConfig, DataBrowserSearchResult, MultiLanguageLabels } from '../types/DataStructures';

// Use Vue i18n
const { locale, t } = useI18n();

// Reactive state
const currentDataPath = ref('');
const selectedDimension = ref('aufwand');
const tableTitle = ref('');
const lastLoadedData = ref<TreeAggregationResult | null>(null);
const errorMessage = ref<string | null>(null);

// Configuration (removed language since it's now handled by i18n)
const tableConfig = reactive<Omit<Partial<TreeTableConfig>, 'language'>>({
  showValues: true,
  showCodes: false,
  expandAll: false,
  numberFormat: 'de-CH'
});



// Available dimensions
const dimensions = [
  { value: 'aufwand', label: 'Aufwand (Expenditure)' },
  { value: 'ertrag', label: 'Ertrag (Revenue)' },
  { value: 'einnahmen', label: 'Einnahmen (Income)' },
  { value: 'ausgaben', label: 'Ausgaben (Expenses)' },
  { value: 'bilanz', label: 'Bilanz (Balance Sheet)' }
];

// Methods
const loadDataFromSelection = (dataPath: string, title: string) => {
  errorMessage.value = null;
  lastLoadedData.value = null;
  currentDataPath.value = dataPath;
  tableTitle.value = title;
};

const onDataLoaded = (data: TreeAggregationResult) => {
  lastLoadedData.value = data;
  errorMessage.value = null;
  console.log('Data loaded successfully:', data);
};

const onRowToggled = (rowId: string, isExpanded: boolean) => {
  console.log(`Row ${rowId} ${isExpanded ? 'expanded' : 'collapsed'}`);
};

const onError = (error: string) => {
  errorMessage.value = error;
  lastLoadedData.value = null;
  console.error('Error loading data:', error);
};

const onDataBrowserSelection = (result: DataBrowserSearchResult) => {
  console.log('Data browser selection:', result);

  // Convert the selected result to a data path format and load data
  const currentLang = locale.value as keyof MultiLanguageLabels;

  if (result.type === 'std') {
    // For STD data: std/fs/entityCode/year (always use 'fs' model)
    const latestYear = result.availableYears[result.availableYears.length - 1];
    const dataPath = `std/fs/${result.entityCode}/${latestYear}`;
    const title = `${result.displayName[currentLang] || result.displayName.de} ${latestYear} (FS)`;
    loadDataFromSelection(dataPath, title);
  } else if (result.type === 'gdn') {
    // For GDN data: gdn/fs/entityCode/year (always use 'fs' model)
    const latestYear = result.availableYears[result.availableYears.length - 1];
    const dataPath = `gdn/fs/${result.entityCode}/${latestYear}`;
    const title = `${result.displayName[currentLang] || result.displayName.de} ${latestYear}`;
    loadDataFromSelection(dataPath, title);
  }
};

const onDataBrowserError = (error: string) => {
  console.error('Data browser error:', error);
  errorMessage.value = `${t('treeTableView.dataBrowserError')}: ${error}`;
};

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleString(locale.value || 'de-CH');
};
</script>

<style scoped>
.tree-table-view {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.header {
  text-align: center;
  margin-bottom: 2rem;
}

.header h1 {
  color: var(--color-heading, #2c3e50);
  margin-bottom: 0.5rem;
}

.header p {
  color: var(--color-text-soft, #6c757d);
  font-size: 1.1rem;
}

.demo-controls {
  background-color: var(--color-background-soft, #f8f9fa);
  padding: 1.5rem;
  border-radius: 8px;
  margin-bottom: 2rem;
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
}

.control-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.control-group label {
  font-weight: 600;
  color: var(--color-heading, #2c3e50);
}

.title-input,
select {
  padding: 0.75rem;
  border: 1px solid var(--color-border, #ddd);
  border-radius: 4px;
  font-size: 1rem;
}

.loading-section {
  margin-bottom: 2rem;
  padding: 2rem;
  text-align: center;
  background-color: var(--color-background-soft, #f8f9fa);
  border-radius: 8px;
  border: 1px solid var(--color-border, #ddd);
}

.loading-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid var(--color-background-mute, #f1f3f4);
  border-top: 4px solid var(--color-primary, #007bff);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-spinner p {
  margin: 0;
  color: var(--color-text-soft, #6c757d);
  font-size: 1rem;
}

.data-browser-section {
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: var(--color-background-soft, #f8f9fa);
  border-radius: 8px;
  border: 1px solid var(--color-border, #ddd);
}

.data-browser-section h3 {
  margin: 0 0 0.5rem 0;
  color: var(--color-heading, #2c3e50);
  font-size: 1.25rem;
}

.data-browser-section p {
  margin: 0 0 1rem 0;
  color: var(--color-text-soft, #6c757d);
  font-size: 0.875rem;
}

.table-section {
  margin-bottom: 2rem;
}

.no-selection {
  text-align: center;
  padding: 3rem 2rem;
  background-color: var(--color-background-soft, #f8f9fa);
  border-radius: 8px;
  border: 1px solid var(--color-border, #ddd);
}

.no-selection p {
  margin: 0;
  color: var(--color-text-soft, #6c757d);
  font-size: 1.1rem;
}

.metadata-section,
.error-section,
.documentation-section {
  margin-bottom: 2rem;
}

.metadata-section h3,
.error-section h3,
.documentation-section h3 {
  margin-bottom: 1rem;
  color: var(--color-heading, #2c3e50);
}

.metadata-grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  background-color: var(--color-background-soft, #f8f9fa);
  padding: 1rem;
  border-radius: 8px;
}

.metadata-item {
  padding: 0.5rem;
}

.error-message {
  background-color: var(--color-danger-soft, #f8d7da);
  color: var(--color-danger, #dc3545);
  padding: 1rem;
  border-radius: 4px;
  border: 1px solid var(--color-danger-border, #f5c6cb);
}

.doc-content {
  background-color: var(--color-background-soft, #f8f9fa);
  padding: 1.5rem;
  border-radius: 8px;
}

.doc-content h4 {
  margin-top: 1.5rem;
  margin-bottom: 0.5rem;
  color: var(--color-heading, #2c3e50);
}

.doc-content h4:first-child {
  margin-top: 0;
}

.doc-content ul {
  margin-bottom: 1rem;
}

.doc-content code {
  background-color: var(--color-background-mute, #f1f3f4);
  padding: 0.2rem 0.4rem;
  border-radius: 3px;
  font-family: 'Courier New', monospace;
  font-size: 0.9rem;
}

/* Responsive design */
@media (max-width: 768px) {
  .tree-table-view {
    padding: 1rem;
  }

  .demo-controls {
    grid-template-columns: 1fr;
  }

  .example-buttons {
    flex-direction: column;
  }

  .metadata-grid {
    grid-template-columns: 1fr;
  }
}
</style>
