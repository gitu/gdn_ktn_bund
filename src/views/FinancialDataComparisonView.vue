<template>
  <div class="max-w-7xl mx-auto p-8">
    <!-- Header -->
    <div class="text-center mb-8">
      <h1 class="text-4xl font-bold text-surface-900 dark:text-surface-50 mb-2">
        {{ $t('financialDataComparison.title') }}
      </h1>
      <p class="text-lg text-surface-600 dark:text-surface-300">
        {{ $t('financialDataComparison.subtitle') }}
      </p>
    </div>

    <!-- Dataset Selection Section -->
    <Card class="mb-12">
      <template #content>
        <DatasetSelector
          :initial-datasets="selectedDatasets"
          @datasets-changed="handleDatasetsChanged"
          @error="handleSelectorError"
        />
      </template>
    </Card>

    <!-- Comparison Results Section -->
    <div v-if="selectedDatasets.length > 0" class="mb-12">
      <div class="mb-6">
        <h2 class="text-2xl font-semibold text-surface-900 dark:text-surface-50 mb-2">
          {{ $t('financialDataComparison.comparisonResults') }}
        </h2>
        <p class="text-surface-600 dark:text-surface-300">
          {{ $t('financialDataComparison.comparisonDescription', { count: selectedDatasets.length }) }}
        </p>
      </div>

      <Card>
        <template #content>
          <FinancialDataComparison
            :datasets="selectedDatasets"
            @error="handleError"
            @dataLoaded="handleDataLoaded"
          />
        </template>
      </Card>
    </div>

    <!-- Demo Section (shown when no datasets selected) -->
    <Card v-else class="mb-12">
      <template #content>
        <div class="text-center">
          <h2 class="text-2xl font-semibold text-surface-900 dark:text-surface-50 mb-4">
            {{ $t('financialDataComparison.demoTitle') }}
          </h2>
          <p class="text-surface-600 dark:text-surface-300 mb-4">
            {{ $t('financialDataComparison.demoDescription') }}
          </p>
          <div class="max-w-2xl mx-auto text-left mb-8">
            <ul class="space-y-2 text-surface-600 dark:text-surface-300">
              <li><strong>{{ $t('financialDataComparison.demoDataset1') }}:</strong> {{ $t('financialDataComparison.demoDataset1Description') }}</li>
              <li><strong>{{ $t('financialDataComparison.demoDataset2') }}:</strong> {{ $t('financialDataComparison.demoDataset2Description') }}</li>
              <li><strong>{{ $t('financialDataComparison.demoDataset3') }}:</strong> {{ $t('financialDataComparison.demoDataset3Description') }}</li>
            </ul>
          </div>

          <div class="mb-8">
            <Button
              :label="$t('financialDataComparison.loadDemoData')"
              icon="pi pi-play"
              @click="loadDemoData"
            />
          </div>

          <div v-if="showDemoComparison">
            <Card>
              <template #content>
                <FinancialDataComparison
                  :datasets="sampleDatasets"
                  @error="handleError"
                  @dataLoaded="handleDataLoaded"
                />
              </template>
            </Card>
          </div>
        </div>
      </template>
    </Card>

    <!-- Error Message -->
    <Message v-if="errorMessage" severity="error" :closable="false" class="mb-4">
      {{ errorMessage }}
    </Message>

    <!-- Success Message -->
    <Message v-if="dataLoadedCount > 0" severity="success" :closable="false" class="mb-4">
      Successfully loaded {{ dataLoadedCount }} datasets
    </Message>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import Button from 'primevue/button';
import Card from 'primevue/card';
import Message from 'primevue/message';
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


