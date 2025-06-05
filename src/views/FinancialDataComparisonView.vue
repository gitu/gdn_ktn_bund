<template>
  <div class="financial-data-comparison-view">
    <div class="header">
      <h1>{{ $t('financialDataComparison.title') }}</h1>
      <p class="subtitle">
        {{ $t('financialDataComparison.subtitle') }}
      </p>
    </div>

    <!-- Dataset Selection Section -->
    <div class="dataset-selection-section">
      <DatasetSelector
        :initial-datasets="selectedDatasets"
        @datasets-changed="handleDatasetsChanged"
        @error="handleSelectorError"
      />
    </div>

    <!-- Comparison Results Section -->
    <div v-if="selectedDatasets.length > 0" class="comparison-section">
      <div class="section-header">
        <h2>{{ $t('financialDataComparison.comparisonResults') }}</h2>
        <p class="section-description">
          {{ $t('financialDataComparison.comparisonDescription', { count: selectedDatasets.length }) }}
        </p>
      </div>

      <div class="comparison-container">
        <FinancialDataComparison
          :datasets="selectedDatasets"
          @error="handleError"
          @dataLoaded="handleDataLoaded"
        />
      </div>
    </div>

    <!-- Demo Section (shown when no datasets selected) -->
    <div v-else class="demo-section">
      <h2>{{ $t('financialDataComparison.demoTitle') }}</h2>
      <p>
        {{ $t('financialDataComparison.demoDescription') }}
      </p>
      <ul>
        <li><strong>{{ $t('financialDataComparison.demoDataset1') }}:</strong> {{ $t('financialDataComparison.demoDataset1Description') }}</li>
        <li><strong>{{ $t('financialDataComparison.demoDataset2') }}:</strong> {{ $t('financialDataComparison.demoDataset2Description') }}</li>
        <li><strong>{{ $t('financialDataComparison.demoDataset3') }}:</strong> {{ $t('financialDataComparison.demoDataset3Description') }}</li>
      </ul>

      <div class="demo-actions">
        <Button
          :label="$t('financialDataComparison.loadDemoData')"
          icon="pi pi-play"
          @click="loadDemoData"
        />
      </div>

      <div v-if="showDemoComparison" class="comparison-container">
        <FinancialDataComparison
          :datasets="sampleDatasets"
          @error="handleError"
          @dataLoaded="handleDataLoaded"
        />
      </div>
    </div>

    <div v-if="errorMessage" class="error-message">
      <i class="pi pi-exclamation-triangle"></i>
      <span>{{ errorMessage }}</span>
    </div>

    <div v-if="dataLoadedCount > 0" class="success-message">
      <i class="pi pi-check-circle"></i>
      <span>Successfully loaded {{ dataLoadedCount }} datasets</span>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import Button from 'primevue/button';
import FinancialDataComparison from '../components/FinancialDataComparison.vue';
import DatasetSelector from '../components/DatasetSelector.vue';

// Vue i18n (used in template)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const { t } = useI18n();

// Reactive state
const errorMessage = ref<string | null>(null);
const dataLoadedCount = ref(0);
const selectedDatasets = ref<string[]>([]);
const showDemoComparison = ref(false);

// Sample datasets for demonstration
const sampleDatasets = [
  'gdn/fs/010002:2016', // Municipality 010002 in 2016
  'gdn/fs/010009:2016', // Municipality 010009 in 2016
  'std/fs/gdn_zh:2016'  // All municipalities in Canton Zurich in 2016
];

// Event handlers
const handleError = (error: string) => {
  errorMessage.value = error;
  console.error('FinancialDataComparison error:', error);
};

const handleDataLoaded = (count: number) => {
  dataLoadedCount.value = count;
  errorMessage.value = null; // Clear any previous errors
};

const handleDatasetsChanged = (datasets: string[]) => {
  selectedDatasets.value = datasets;
  showDemoComparison.value = false; // Hide demo when user selects datasets
  console.log('Selected datasets changed:', datasets);
};

const handleSelectorError = (error: string) => {
  errorMessage.value = error;
  console.error('Dataset selector error:', error);
};

const loadDemoData = () => {
  showDemoComparison.value = true;
  selectedDatasets.value = []; // Clear user selections when showing demo
};
</script>

<style scoped>
.financial-data-comparison-view {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
}

.header {
  text-align: center;
  margin-bottom: 2rem;
}

.header h1 {
  color: var(--text-color);
  margin-bottom: 0.5rem;
}

.subtitle {
  color: var(--text-color-secondary);
  font-size: 1.1rem;
  margin: 0;
}

.dataset-selection-section {
  margin-bottom: 3rem;
  background: var(--surface-card);
  border: 1px solid var(--surface-border);
  border-radius: var(--border-radius);
  padding: 1.5rem;
}

.comparison-section {
  margin-bottom: 3rem;
}

.section-header {
  margin-bottom: 1.5rem;
}

.section-header h2 {
  color: var(--text-color);
  margin-bottom: 0.5rem;
}

.section-description {
  color: var(--text-color-secondary);
  margin: 0;
}

.demo-section {
  margin-bottom: 3rem;
  text-align: center;
  padding: 2rem;
  background: var(--surface-50);
  border: 1px solid var(--surface-border);
  border-radius: var(--border-radius);
}

.demo-section h2 {
  color: var(--text-color);
  margin-bottom: 1rem;
}

.demo-section p {
  color: var(--text-color-secondary);
  margin-bottom: 1rem;
}

.demo-section ul {
  color: var(--text-color-secondary);
  margin-bottom: 2rem;
  text-align: left;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}

.demo-actions {
  margin-bottom: 2rem;
}

.comparison-container {
  background: var(--surface-card);
  border: 1px solid var(--surface-border);
  border-radius: var(--border-radius);
  padding: 1.5rem;
}

.error-message,
.success-message {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  border-radius: var(--border-radius);
  margin: 1rem 0;
}

.error-message {
  background: var(--red-50);
  color: var(--red-700);
  border: 1px solid var(--red-200);
}

.success-message {
  background: var(--green-50);
  color: var(--green-700);
  border: 1px solid var(--green-200);
}

.documentation {
  margin-top: 3rem;
  padding-top: 2rem;
  border-top: 1px solid var(--surface-border);
}

.documentation h2,
.documentation h3 {
  color: var(--text-color);
  margin-bottom: 1rem;
}

.documentation p,
.documentation li {
  color: var(--text-color-secondary);
  line-height: 1.6;
}

.code-example {
  margin: 1.5rem 0;
}

.code-example pre {
  background: var(--surface-100);
  border: 1px solid var(--surface-border);
  border-radius: var(--border-radius);
  padding: 1rem;
  overflow-x: auto;
  font-family: 'Courier New', monospace;
  font-size: 0.875rem;
  color: var(--text-color);
}

.format-explanation,
.features,
.data-sources {
  margin: 2rem 0;
}

.format-explanation ul,
.features ul,
.data-sources ul {
  margin-left: 1rem;
}

.format-explanation li,
.features li,
.data-sources li {
  margin-bottom: 0.5rem;
}

code {
  background: var(--surface-100);
  padding: 0.2rem 0.4rem;
  border-radius: 3px;
  font-family: 'Courier New', monospace;
  font-size: 0.875rem;
  color: var(--text-color);
}

@media (max-width: 768px) {
  .financial-data-comparison-view {
    padding: 1rem;
  }

  .comparison-container {
    padding: 1rem;
  }

  .code-example pre {
    font-size: 0.75rem;
    padding: 0.75rem;
  }
}
</style>
