<template>
  <div class="w-full max-w-full">
    <!-- Loading state -->
    <Message v-if="loading" severity="info" :closable="false" class="mb-4">
      <template #icon>
        <i class="pi pi-spin pi-spinner"></i>
      </template>
      {{ $t('financialDataComparison.loading') }}
    </Message>

    <!-- Error state -->
    <Message v-else-if="error" severity="error" :closable="false" class="mb-4">
      {{ error }}
    </Message>

    <!-- No data state -->
    <Message v-else-if="!hasValidData" severity="warn" :closable="false" class="mb-4">
      {{ $t('financialDataComparison.noData') }}
    </Message>

    <!-- Main comparison content -->
    <div v-else class="w-full">
      <!-- Single FinancialDataDisplay for combined data -->
      <div class="w-full">
        <FinancialDataDisplay
          :financial-data="combinedFinancialData!"
          :loading="false"
          :error="null"
          :initial-expanded-all="expandedAll"
          :initial-show-codes="showCodes"
          :initial-show-zero-values="!hideZeroValues"
          @error="handleDatasetError"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import Message from 'primevue/message';
import FinancialDataDisplay from './FinancialDataDisplay.vue';
import { DataLoader } from '@/utils/DataLoader';
import { createEmptyFinancialDataStructure } from '@/data/emptyFinancialDataStructure';
import type { FinancialData } from '@/types/FinancialDataStructure';

// Props
interface Props {
  datasets: string[];
}

const props = defineProps<Props>();

// Emits
interface Emits {
  error: [error: string];
  dataLoaded: [count: number];
}

const emit = defineEmits<Emits>();

// Vue i18n
const { t } = useI18n();

// Reactive state
const loading = ref(false);
const error = ref<string | null>(null);
const combinedFinancialData = ref<FinancialData | null>(null);
const loadedDatasetCount = ref(0);
const expandedAll = ref(false);
const showCodes = ref(false);
const hideZeroValues = ref(true);

// Computed properties
const hasValidData = computed(() => {
  return combinedFinancialData.value !== null && loadedDatasetCount.value > 0;
});

// Methods
const loadDatasets = async () => {
  if (props.datasets.length === 0) return;

  loading.value = true;
  error.value = null;
  loadedDatasetCount.value = 0;

  try {
    // Start with empty financial data structure
    combinedFinancialData.value = createEmptyFinancialDataStructure();
    const dataLoader = new DataLoader();

    // Load each dataset into the combined structure
    for (const dataset of props.datasets) {
      try {
        // Parse dataset identifier (e.g., 'gdn/fs/010002:2016')
        const parts = dataset.split('/');
        if (parts.length !== 3) {
          throw new Error(`Invalid dataset identifier format: ${dataset}`);
        }

        const source = parts[0] as 'gdn' | 'std';
        const model = parts[1];
        const entityAndYear = parts[2];
        const [entity, year] = entityAndYear.split(':');

        if (!entity || !year) {
          throw new Error(`Invalid entity:year format in dataset: ${dataset}`);
        }

        // Load and integrate data into the combined structure
        await dataLoader.loadAndIntegrateFinancialData(
          entity,
          model,
          year,
          combinedFinancialData.value,
          source
        );

        loadedDatasetCount.value++;

      } catch (error) {
        console.error(`Error loading dataset ${dataset}:`, error);
        emit('error', t('financialDataComparison.datasetError', {
          dataset,
          error: error instanceof Error ? error.message : 'Unknown error'
        }));
      }
    }

    if (loadedDatasetCount.value === 0) {
      error.value = t('financialDataComparison.noValidData');
      combinedFinancialData.value = null;
    } else {
      emit('dataLoaded', loadedDatasetCount.value);
    }
  } catch {
    error.value = t('financialDataComparison.error');
    emit('error', error.value);
  } finally {
    loading.value = false;
  }
};



// Event handlers
const handleDatasetError = (errorMessage: string) => {
  console.error('Dataset error:', errorMessage);
  emit('error', errorMessage);
};



// Watch for dataset changes
watch(() => props.datasets, () => {
  loadDatasets();
}, { immediate: true });
</script>


