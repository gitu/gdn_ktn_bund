<template>
  <div class="financial-data-comparison-view">
    <div class="header">
      <h1>{{ $t('financialDataComparison.title') }}</h1>
      <p class="subtitle">
        {{ $t('financialDataComparison.subtitle') }}
      </p>
    </div>

    <div class="demo-section">
      <h2>Sample Comparison</h2>
      <p>
        This example compares three datasets from 2015:
      </p>
      <ul>
        <li><strong>Municipality 010002:</strong> Specific municipality data</li>
        <li><strong>Municipality 010009:</strong> Another specific municipality data</li>
        <li><strong>Canton Zurich (gdn_zh):</strong> All municipalities in Canton Zurich</li>
      </ul>

      <div class="comparison-container">
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

    <div class="documentation">
      <h2>Usage</h2>
      <p>
        The <code>FinancialDataComparison</code> component accepts an array of dataset identifiers
        in the format <code>{source}/{model}/{entity}:{year}</code>:
      </p>

      <div class="code-example">
        <h3>Example Usage:</h3>
        <pre><code>&lt;FinancialDataComparison
  :datasets="[
    'gdn/fs/010002:2016',
    'gdn/fs/010009:2016',
    'std/fs/gdn_zh:2016'
  ]"
  @error="handleError"
  @dataLoaded="handleDataLoaded"
/&gt;</code></pre>
      </div>

      <div class="format-explanation">
        <h3>Dataset Format:</h3>
        <ul>
          <li><strong>Source:</strong> <code>gdn</code> (municipality data) or <code>std</code> (standardized data)</li>
          <li><strong>Model:</strong> <code>fs</code> (Financial Statistics)</li>
          <li><strong>Entity:</strong> Municipality number (e.g., <code>010002</code>) or entity code (e.g., <code>gdn_zh</code>)</li>
          <li><strong>Year:</strong> 4-digit year (e.g., <code>2016</code>)</li>
        </ul>
      </div>

      <div class="features">
        <h3>Features:</h3>
        <ul>
          <li>Side-by-side comparison of multiple financial datasets</li>
          <li>Hierarchical tree structure with expandable/collapsible nodes</li>
          <li>Semantic entity name interpretation (e.g., "gdn_zh" → "All municipalities of Canton Zurich")</li>
          <li>Filtered to show only Balance Sheet, Revenue, and Expenditure categories</li>
          <li>Multilingual support via Vue i18n</li>
          <li>Currency formatting (CHF)</li>
          <li>Loading states and error handling</li>
          <li>Option to show/hide account codes</li>
          <li>Option to hide zero values</li>
          <li>Expand/collapse all functionality</li>
        </ul>
      </div>

      <div class="data-sources">
        <h3>Data Sources:</h3>
        <p>
          Data is loaded from the <code>public/data/</code> directory with the following structure:
        </p>
        <ul>
          <li><strong>GDN data:</strong> <code>public/data/gdn/fs/{entity_id}/{year}.csv</code></li>
          <li><strong>STD data:</strong> <code>public/data/std/fs/{entity_id}/{year}.csv</code></li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import FinancialDataComparison from '../components/FinancialDataComparison.vue';

// Vue i18n (used in template)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const { t } = useI18n();

// Reactive state
const errorMessage = ref<string | null>(null);
const dataLoadedCount = ref(0);

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

.demo-section {
  margin-bottom: 3rem;
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
