<template>
  <div class="financial-data-comparison">
    <div class="comparison-header">
      <h2>{{ $t('financialDataComparison.title') }}</h2>
      <div class="controls">
        <button
          type="button"
          class="p-button p-button-sm p-button-outlined"
          @click="toggleExpandAll"
          :disabled="loading || !hasData"
        >
          {{ allExpanded ? $t('financialDataComparison.collapseAll') : $t('financialDataComparison.expandAll') }}
        </button>
        <button
          type="button"
          class="p-button p-button-sm p-button-outlined"
          @click="showCodes = !showCodes"
          :disabled="loading || !hasData"
        >
          {{ $t('financialDataComparison.showCodes') }}
        </button>
        <button
          type="button"
          class="p-button p-button-sm p-button-outlined"
          @click="hideZeroValues = !hideZeroValues"
          :disabled="loading || !hasData"
        >
          {{ $t('financialDataComparison.hideValues') }}
        </button>
      </div>
    </div>

    <div v-if="loading" class="loading-state">
      <i class="pi pi-spinner pi-spin"></i>
      <span>{{ $t('financialDataComparison.loading') }}</span>
    </div>

    <div v-else-if="error" class="error-state">
      <i class="pi pi-exclamation-triangle"></i>
      <span>{{ error }}</span>
    </div>

    <div v-else-if="!hasData" class="no-data-state">
      <i class="pi pi-info-circle"></i>
      <span>{{ $t('financialDataComparison.noData') }}</span>
    </div>

    <div v-else class="comparison-content">
      <div class="info-bar">
        <span>{{ $t('financialDataComparison.filteredCategories') }}</span>
        <span>{{ $t('financialDataComparison.totalRows', { count: filteredNodes.length }) }}</span>
      </div>

      <TreeTable
        :value="filteredNodes"
        :expandedKeys="expandedKeys"
        @node-expand="onNodeExpand"
        @node-collapse="onNodeCollapse"
        tableStyle="min-width: 50rem"
        class="comparison-tree-table"
      >
        <Column
          field="label"
          :header="$t('financialDataComparison.columns.category')"
          :expander="true"
          headerStyle="width: 300px"
        >
          <template #body="{ node }">
            <div class="category-cell">
              <span class="category-label">{{ node.data.label }}</span>
              <span v-if="showCodes && node.data.code" class="category-code">({{ node.data.code }})</span>
            </div>
          </template>
        </Column>

        <Column
          v-for="column in dataColumns"
          :key="column.field"
          :field="column.field"
          :header="column.header"
          headerStyle="width: 150px; text-align: right"
          bodyStyle="text-align: right"
        >
          <template #body="{ node }">
            <span v-if="node.data[column.field] !== null && node.data[column.field] !== undefined"
                  class="value-cell">
              {{ formatCurrency(node.data[column.field]) }}
            </span>
            <span v-else class="empty-cell">-</span>
          </template>
        </Column>
      </TreeTable>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import TreeTable from 'primevue/treetable';
import Column from 'primevue/column';
import { DataLoader } from '../utils/DataLoader';
import { TreeAggregator } from '../utils/TreeAggregator';
import { EntitySemanticMapper } from '../utils/EntitySemanticMapper';
import type {
  AggregatedDataPoint,
  MultiLanguageLabels,
  GdnDataRecord,
  StdDataRecord
} from '../types/DataStructures';

// Tree node interface for PrimeVue TreeTable
interface TreeTableNode {
  key: string;
  data: TreeTableNodeData;
  children: TreeTableNode[];
}

interface TreeTableNodeData {
  code: string;
  label: string;
  level: number;
  [key: string]: string | number | null; // For dataset values
}

// Props interface
interface Props {
  datasets: string[]; // Format: "{source}/{model}/{entity}:{year}"
}

const props = withDefaults(defineProps<Props>(), {
  datasets: () => []
});

// Emits
const emit = defineEmits<{
  error: [error: string];
  dataLoaded: [dataCount: number];
}>();

// Vue i18n
const { locale, t } = useI18n();

// Reactive state
const loading = ref(false);
const error = ref<string | null>(null);
const balanceSheetData = ref<Map<string, AggregatedDataPoint[]>>(new Map());
const incomeStatementData = ref<Map<string, AggregatedDataPoint[]>>(new Map());
const expandedKeys = ref<Record<string, boolean>>({});
const allExpanded = ref(false);
const showCodes = ref(false);
const hideZeroValues = ref(true);

// Data loader and aggregator instances
const dataLoader = new DataLoader();
const treeAggregator = new TreeAggregator();

// Computed properties
const hasData = computed(() => balanceSheetData.value.size > 0 || incomeStatementData.value.size > 0);

const dataColumns = computed(() => {
  const columns: Array<{ field: string; header: string }> = [];

  for (const dataset of props.datasets) {
    try {
      const { entity } = parseDatasetIdentifier(dataset);
      const displayName = EntitySemanticMapper.getEntityDisplayName(entity);
      const header = displayName[locale.value as keyof MultiLanguageLabels] || entity;

      columns.push({
        field: `dataset_${dataset}`,
        header
      });
    } catch {
      console.warn(`Invalid dataset format: ${dataset}`);
    }
  }

  return columns;
});

const filteredNodes = computed(() => {
  if (!hasData.value) return [];

  // Get all unique codes from all datasets
  const allCodes = new Set<string>();
  const codeToLabel = new Map<string, string>();
  const codeToLevel = new Map<string, number>();

  // Process balance sheet data
  for (const [, dataPoints] of balanceSheetData.value) {
    for (const point of dataPoints) {
      allCodes.add(point.code);
      codeToLabel.set(point.code, point.label);
      // Estimate level based on code length (simple heuristic)
      codeToLevel.set(point.code, point.code === 'root' ? 0 : point.code.length);
    }
  }

  // Process income statement data
  for (const [, dataPoints] of incomeStatementData.value) {
    for (const point of dataPoints) {
      allCodes.add(point.code);
      codeToLabel.set(point.code, point.label);
      // Special handling for profit/loss and income statement structure
      if (point.code === 'profit_loss') {
        codeToLevel.set(point.code, 0);
      } else if (point.code === 'income_statement') {
        codeToLevel.set(point.code, 0);
      } else {
        codeToLevel.set(point.code, point.code === 'root' ? 1 : point.code.length + 1);
      }
    }
  }

  // Build tree nodes
  const nodes: TreeTableNode[] = [];
  const nodeMap = new Map<string, TreeTableNode>();

  // Sort codes by level and code value
  const sortedCodes = Array.from(allCodes).sort((a, b) => {
    const levelA = codeToLevel.get(a) || 0;
    const levelB = codeToLevel.get(b) || 0;
    if (levelA !== levelB) return levelA - levelB;
    return a.localeCompare(b);
  });

  for (const code of sortedCodes) {
    const nodeData: TreeTableNodeData = {
      code,
      label: codeToLabel.get(code) || code,
      level: codeToLevel.get(code) || 0
    };

    // Add data from each dataset
    for (const dataset of props.datasets) {
      // Check balance sheet data first
      const balanceSheetPoints = balanceSheetData.value.get(dataset);
      const balanceSheetPoint = balanceSheetPoints?.find(p => p.code === code);

      // Check income statement data
      const incomeStatementPoints = incomeStatementData.value.get(dataset);
      const incomeStatementPoint = incomeStatementPoints?.find(p => p.code === code);

      // Use whichever data point exists
      const point = balanceSheetPoint || incomeStatementPoint;
      nodeData[`dataset_${dataset}`] = point?.value || null;
    }

    // Filter out zero values if requested
    if (hideZeroValues.value) {
      const hasNonZeroValue = props.datasets.some(dataset => {
        const value = nodeData[`dataset_${dataset}`];
        return value !== null && value !== 0;
      });
      if (!hasNonZeroValue && !['root', 'profit_loss', 'income_statement'].includes(code)) continue;
    }

    const node = {
      key: code,
      data: nodeData,
      children: []
    };

    nodeMap.set(code, node);

    // Find parent and add to tree
    if (code === 'root') {
      nodes.push(node);
    } else {
      // Find parent by trying shorter codes
      let parentFound = false;
      for (let i = code.length - 1; i > 0; i--) {
        const parentCode = code.substring(0, i);
        const parent = nodeMap.get(parentCode);
        if (parent) {
          parent.children.push(node);
          parentFound = true;
          break;
        }
      }

      // If no parent found, add to root
      if (!parentFound) {
        const rootNode = nodeMap.get('root');
        if (rootNode) {
          rootNode.children.push(node);
        } else {
          nodes.push(node);
        }
      }
    }
  }

  return nodes;
});

// Methods
const parseDatasetIdentifier = (dataset: string) => {
  const match = dataset.match(/^(gdn|std)\/(fs)\/([^:]+):(\d{4})$/);
  if (!match) {
    throw new Error(`Invalid dataset format: ${dataset}`);
  }

  const [, source, model, entity, year] = match;
  return { source, model, entity, year };
};

const loadDataset = async (dataset: string) => {
  try {
    const { source, model, entity, year } = parseDatasetIdentifier(dataset);

    if (source === 'gdn') {
      const result = await dataLoader.loadGdnData(entity, year, model);
      console.log('Loaded GDN data:', result);
      return await treeAggregator.aggregateGdnData(
        result.data as GdnDataRecord[],
        entity,
        year,
        model
      );
    } else if (source === 'std') {
      const result = await dataLoader.loadStdData(entity, year, model);
      console.log('Loaded STD data:', result);
      return await treeAggregator.aggregateStdData(
        result.data as StdDataRecord[],
        entity,
        year,
        model
      );
    }

    throw new Error(`Unsupported source: ${source}`);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    throw new Error(t('financialDataComparison.datasetError', { dataset, error: errorMessage }));
  }
};

const loadAllDatasets = async () => {
  if (props.datasets.length === 0) return;

  loading.value = true;
  error.value = null;
  balanceSheetData.value.clear();
  incomeStatementData.value.clear();

  try {
    const loadPromises = props.datasets.map(async (dataset) => {
      try {
        const result = await loadDataset(dataset);
        console.log(`Loaded dataset ${dataset} with ${result.balanceSheet.length} balance sheet and ${result.incomeStatement.length} income statement data points`);
        balanceSheetData.value.set(dataset, result.balanceSheet);
        incomeStatementData.value.set(dataset, result.incomeStatement);
      } catch (err) {
        console.error(`Error loading dataset ${dataset}:`, err);
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        emit('error', errorMessage);
      }
    });

    await Promise.all(loadPromises);

    if (balanceSheetData.value.size === 0 && incomeStatementData.value.size === 0) {
      error.value = t('financialDataComparison.noValidData');
    } else {
      emit('dataLoaded', Math.max(balanceSheetData.value.size, incomeStatementData.value.size));
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    error.value = t('financialDataComparison.error') + ': ' + errorMessage;
    emit('error', errorMessage);
  } finally {
    loading.value = false;
  }
};

const toggleExpandAll = () => {
  allExpanded.value = !allExpanded.value;

  if (allExpanded.value) {
    // Expand all nodes
    const expandAll = (nodes: TreeTableNode[]) => {
      for (const node of nodes) {
        expandedKeys.value[node.key] = true;
        if (node.children) {
          expandAll(node.children);
        }
      }
    };
    expandAll(filteredNodes.value);
  } else {
    // Collapse all nodes
    expandedKeys.value = {};
  }
};

const onNodeExpand = (node: { key: string }) => {
  expandedKeys.value[node.key] = true;
};

const onNodeCollapse = (node: { key: string }) => {
  delete expandedKeys.value[node.key];
};

const formatCurrency = (value: number): string => {
  if (value === null || value === undefined) return '-';

  const formatter = new Intl.NumberFormat(locale.value, {
    style: 'currency',
    currency: 'CHF',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });

  return formatter.format(value);
};

// Watchers
watch(() => props.datasets, loadAllDatasets, { immediate: true });

// Lifecycle
onMounted(() => {
  if (props.datasets.length > 0) {
    loadAllDatasets();
  }
});
</script>

<style scoped>
.financial-data-comparison {
  width: 100%;
}

.comparison-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--surface-border);
}

.comparison-header h2 {
  margin: 0;
  color: var(--text-color);
}

.controls {
  display: flex;
  gap: 0.5rem;
}

.loading-state,
.error-state,
.no-data-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 2rem;
  text-align: center;
  color: var(--text-color-secondary);
}

.error-state {
  color: var(--red-500);
}

.info-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 1rem;
  background: var(--surface-50);
  border: 1px solid var(--surface-border);
  border-radius: var(--border-radius);
  margin-bottom: 1rem;
  font-size: 0.875rem;
  color: var(--text-color-secondary);
}

.comparison-tree-table {
  border: 1px solid var(--surface-border);
  border-radius: var(--border-radius);
}

.category-cell {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.category-label {
  font-weight: 500;
}

.category-code {
  font-size: 0.875rem;
  color: var(--text-color-secondary);
  font-family: monospace;
}

.value-cell {
  font-family: monospace;
  font-weight: 500;
}

.empty-cell {
  color: var(--text-color-secondary);
}

@media (max-width: 768px) {
  .comparison-header {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }

  .controls {
    justify-content: center;
    flex-wrap: wrap;
  }

  .info-bar {
    flex-direction: column;
    gap: 0.25rem;
    text-align: center;
  }
}
</style>
