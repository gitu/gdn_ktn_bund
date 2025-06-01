<template>
  <main class="tree-table-view">
    <div class="header">
      <h1>Hierarchical Tree Table Demo</h1>
      <p>Explore financial data in a hierarchical table format with collapsible tree structure</p>
    </div>

    <div class="demo-controls">
      <div class="control-group">
        <label for="data-path-input">Data Path:</label>
        <input
          id="data-path-input"
          v-model="dataPath"
          type="text"
          placeholder="e.g., gdn/ag/2019 or std/fs/ag/2019"
          class="data-path-input"
        />
        <button @click="loadData" class="load-button" :disabled="loading">
          {{ loading ? 'Loading...' : 'Load Data' }}
        </button>
      </div>

      <div class="control-group">
        <label for="dimension-select">Dimension:</label>
        <select id="dimension-select" v-model="selectedDimension">
          <option v-for="dim in dimensions" :key="dim.value" :value="dim.value">
            {{ dim.label }}
          </option>
        </select>
      </div>

      <div class="control-group">
        <label for="title-input">Table Title:</label>
        <input
          id="title-input"
          v-model="tableTitle"
          type="text"
          placeholder="Enter table title"
          class="title-input"
        />
      </div>
    </div>

    <div class="examples-section">
      <h3>Quick Examples</h3>
      <div class="example-buttons">
        <button
          v-for="example in examples"
          :key="example.path"
          @click="loadExample(example)"
          class="example-button"
        >
          {{ example.label }}
        </button>
      </div>
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
    </div>

    <div v-if="lastLoadedData" class="metadata-section">
      <h3>Data Information</h3>
      <div class="metadata-grid">
        <div class="metadata-item">
          <strong>Dimension:</strong>
          {{ lastLoadedData.metadata.dimension }}
        </div>
        <div class="metadata-item" v-if="lastLoadedData.metadata.model">
          <strong>Model:</strong>
          {{ lastLoadedData.metadata.model }}
        </div>
        <div class="metadata-item">
          <strong>Total Records:</strong>
          {{ lastLoadedData.metadata.totalRecords }}
        </div>
        <div class="metadata-item">
          <strong>Tree Nodes:</strong>
          {{ lastLoadedData.metadata.treeStructure?.metadata.totalNodes || 'N/A' }}
        </div>
        <div class="metadata-item">
          <strong>Max Depth:</strong>
          {{ lastLoadedData.metadata.treeStructure?.metadata.maxDepth || 'N/A' }}
        </div>
        <div class="metadata-item">
          <strong>Processed At:</strong>
          {{ formatDate(lastLoadedData.metadata.processedAt) }}
        </div>
      </div>
    </div>

    <div v-if="errorMessage" class="error-section">
      <h3>Error</h3>
      <div class="error-message">
        {{ errorMessage }}
      </div>
    </div>

    <div class="documentation-section">
      <h3>Usage Documentation</h3>
      <div class="doc-content">
        <h4>Data Path Format</h4>
        <ul>
          <li><strong>GDN Data:</strong> <code>gdn/{entityId}/{year}</code> (e.g., <code>gdn/ag/2019</code>)</li>
          <li><strong>STD Data:</strong> <code>std/{model}/{entityId}/{year}</code> (e.g., <code>std/fs/ag/2019</code>)</li>
        </ul>

        <h4>Available Dimensions</h4>
        <ul>
          <li><strong>aufwand:</strong> Expenditure/Expenses</li>
          <li><strong>ertrag:</strong> Revenue</li>
          <li><strong>einnahmen:</strong> Income</li>
          <li><strong>ausgaben:</strong> Expenses</li>
          <li><strong>bilanz:</strong> Balance Sheet</li>
        </ul>

        <h4>Features</h4>
        <ul>
          <li>Hierarchical tree structure with collapsible nodes</li>
          <li>Multi-language support (German, French, Italian, English)</li>
          <li>Configurable display options (show/hide codes and values)</li>
          <li>Responsive design for mobile and desktop</li>
          <li>Real-time data aggregation using TreeAggregator</li>
        </ul>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import HierarchicalTreeTable from '../components/HierarchicalTreeTable.vue';
import type { TreeAggregationResult, TreeTableConfig } from '../types/DataStructures';

// Reactive state
const dataPath = ref('gdn/ag/2019');
const currentDataPath = ref('');
const selectedDimension = ref('aufwand');
const tableTitle = ref('Swiss Financial Data - Hierarchical View');
const loading = ref(false);
const lastLoadedData = ref<TreeAggregationResult | null>(null);
const errorMessage = ref<string | null>(null);

// Configuration
const tableConfig = reactive<Partial<TreeTableConfig>>({
  showValues: true,
  showCodes: false,
  expandAll: false,
  language: 'de',
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

// Example data paths
const examples = [
  {
    path: 'gdn/ag/2019',
    label: 'Aargau 2019 (GDN)',
    dimension: 'aufwand',
    title: 'Aargau 2019 - Expenditure'
  },
  {
    path: 'gdn/ag/2019',
    label: 'Aargau 2019 Revenue (GDN)',
    dimension: 'ertrag',
    title: 'Aargau 2019 - Revenue'
  },
  {
    path: 'std/fs/ag/2019',
    label: 'Aargau 2019 (STD-FS)',
    dimension: 'aufwand',
    title: 'Aargau 2019 - STD Financial Statistics'
  },
  {
    path: 'gdn/zh/2020',
    label: 'Zurich 2020 (GDN)',
    dimension: 'aufwand',
    title: 'Zurich 2020 - Expenditure'
  }
];

// Methods
const loadData = () => {
  if (!dataPath.value.trim()) {
    errorMessage.value = 'Please enter a valid data path';
    return;
  }

  loading.value = true;
  errorMessage.value = null;
  currentDataPath.value = dataPath.value.trim();
};

const loadExample = (example: typeof examples[0]) => {
  dataPath.value = example.path;
  selectedDimension.value = example.dimension;
  tableTitle.value = example.title;
  loadData();
};

const onDataLoaded = (data: TreeAggregationResult) => {
  loading.value = false;
  lastLoadedData.value = data;
  errorMessage.value = null;
  console.log('Data loaded successfully:', data);
};

const onRowToggled = (rowId: string, isExpanded: boolean) => {
  console.log(`Row ${rowId} ${isExpanded ? 'expanded' : 'collapsed'}`);
};

const onError = (error: string) => {
  loading.value = false;
  errorMessage.value = error;
  lastLoadedData.value = null;
  console.error('Error loading data:', error);
};

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleString('de-CH');
};

// Load initial example
loadExample(examples[0]);
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
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
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

.data-path-input,
.title-input,
select {
  padding: 0.75rem;
  border: 1px solid var(--color-border, #ddd);
  border-radius: 4px;
  font-size: 1rem;
}

.load-button {
  padding: 0.75rem 1.5rem;
  background-color: var(--color-primary, #007bff);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  transition: background-color 0.2s;
}

.load-button:hover:not(:disabled) {
  background-color: var(--color-primary-dark, #0056b3);
}

.load-button:disabled {
  background-color: var(--color-text-soft, #6c757d);
  cursor: not-allowed;
}

.examples-section {
  margin-bottom: 2rem;
}

.examples-section h3 {
  margin-bottom: 1rem;
  color: var(--color-heading, #2c3e50);
}

.example-buttons {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.example-button {
  padding: 0.5rem 1rem;
  background-color: var(--color-background-mute, #f1f3f4);
  border: 1px solid var(--color-border, #ddd);
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.example-button:hover {
  background-color: var(--color-background-soft, #e9ecef);
}

.table-section {
  margin-bottom: 2rem;
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
