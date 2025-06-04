<template>
  <div class="hierarchical-tree-table">
    <div class="table-header">
      <h3>{{ title }}</h3>
      <div class="controls">
        <button @click="toggleExpandAll" class="expand-button">
          {{ config.expandAll ? t('treeTable.collapseAll') : t('treeTable.expandAll') }}
        </button>
        <label class="checkbox-label">
          <input type="checkbox" v-model="config.showCodes" />
          {{ t('treeTable.showCodes') }}
        </label>
        <label class="checkbox-label">
          <input type="checkbox" v-model="config.showValues" />
          {{ t('treeTable.showValues') }}
        </label>
      </div>
    </div>

    <div v-if="loading" class="loading">
      {{ t('treeTable.loading') }}
    </div>

    <div v-else-if="error" class="error">
      {{ t('treeTable.error') }}: {{ error }}
    </div>

    <div v-else-if="tableRows.length > 0" class="table-container">
      <table class="tree-table">
        <thead>
          <tr>
            <th class="label-column">{{ getHeaderLabel('label') }}</th>
            <th v-if="config.showCodes" class="code-column">{{ getHeaderLabel('code') }}</th>
            <th v-if="config.showValues" class="value-column">{{ getHeaderLabel('value') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="row in visibleRows"
            :key="row.id"
            :class="[
              'tree-row',
              { 'has-children': row.hasChildren },
              { 'expanded': row.isExpanded },
              `level-${row.level}`
            ]"
          >
            <td class="label-cell">
              <div class="label-content" :style="{ paddingLeft: (row.level * 20) + 'px' }">
                <button
                  v-if="row.hasChildren"
                  @click="toggleRow(row.id)"
                  class="expand-toggle"
                  :aria-label="row.isExpanded ? t('treeTable.collapse') : t('treeTable.expand')"
                >
                  {{ row.isExpanded ? '▼' : '▶' }}
                </button>
                <span v-else class="expand-spacer"></span>
                <span class="label-text">{{ row.label }}</span>
              </div>
            </td>
            <td v-if="config.showCodes" class="code-cell">
              {{ row.code }}
            </td>
            <td v-if="config.showValues" class="value-cell">
              {{ formatValue(row.value, row.unit) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-else class="no-data">
      {{ t('treeTable.noData') }}
    </div>

    <div v-if="metadata" class="table-metadata">
      <small>
        {{ t('treeTable.recordsProcessed', { count: metadata.totalRecords }) }},
        {{ t('treeTable.rowsDisplayed', { count: visibleRows.length }) }}
        <span v-if="metadata.processedAt">
          ({{ t('treeTable.loadedAt', { date: formatDate(metadata.processedAt) }) }})
        </span>
      </small>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { DataLoader } from '../utils/DataLoader';
import { TreeAggregator } from '../utils/TreeAggregator';
import type {
  TreeTableRow,
  TreeTableConfig,
  DataPath,
  AggregatedDataPoint,
  TreeNode,
  TreeAggregationResult,
  MultiLanguageLabels
} from '../types/DataStructures';

interface Props {
  dataPath: string; // Format: "type/entityId/year" or "type/model/entityId/year"
  title?: string;
  dimension?: string;
  initialConfig?: Partial<TreeTableConfig>;
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Hierarchical Data Table',
  dimension: 'aufwand'
});

const emit = defineEmits<{
  dataLoaded: [data: TreeAggregationResult];
  rowToggled: [rowId: string, isExpanded: boolean];
  error: [error: string];
}>();

// Use Vue i18n
const { locale, t } = useI18n();

// Reactive state
const loading = ref(false);
const error = ref<string | null>(null);
const tableRows = ref<TreeTableRow[]>([]);
const metadata = ref<TreeAggregationResult['metadata'] | null>(null);

// Configuration (removed language since it's now handled by i18n)
const config = ref<Omit<TreeTableConfig, 'language'>>({
  showValues: true,
  showCodes: false,
  expandAll: false,
  numberFormat: 'de-CH',
  maxDepth: 10,
  ...props.initialConfig
});

// Instances
const dataLoader = new DataLoader();
const treeAggregator = ref(new TreeAggregator({
  language: locale.value as keyof MultiLanguageLabels
}));

// Computed properties
const visibleRows = computed(() => {
  return tableRows.value.filter(row => row.isVisible);
});

const parsedDataPath = computed((): DataPath => {
  const parts = props.dataPath.split('/');
  if (parts.length === 3) {
    // Format: "type/entityId/year" - default to 'fs' model
    return {
      type: parts[0] as 'gdn' | 'std',
      model: 'fs',
      entityId: parts[1],
      year: parts[2]
    };
  } else if (parts.length === 4) {
    // Format: "type/model/entityId/year" - use provided model (should always be 'fs')
    return {
      type: parts[0] as 'gdn' | 'std',
      model: parts[1],
      entityId: parts[2],
      year: parts[3]
    };
  }
  throw new Error(`Invalid data path format: ${props.dataPath}`);
});

// Methods
const loadData = async () => {
  loading.value = true;
  error.value = null;

  try {
    const path = parsedDataPath.value;
    let aggregationResult: TreeAggregationResult;

    if (path.type === 'gdn') {
      // Load GDN data - model is now required for GDN data too
      if (!path.model) {
        throw new Error('Model is required for GDN data');
      }
      const dataResult = await dataLoader.loadGdnData(path.entityId, path.year);
      aggregationResult = await treeAggregator.value.aggregateGdnData(
        dataResult.data,
        props.dimension,
        path.entityId,
        path.year
      );
    } else {
      // Load STD data
      if (!path.model) {
        throw new Error('Model is required for STD data');
      }
      const dataResult = await dataLoader.loadStdData(path.model, path.entityId, path.year);
      aggregationResult = await treeAggregator.value.aggregateStdData(
        dataResult.data,
        props.dimension,
        path.entityId,
        path.year
      );
    }

    // Convert aggregated data to table rows
    tableRows.value = convertToTableRows(aggregationResult);
    metadata.value = aggregationResult.metadata;

    emit('dataLoaded', aggregationResult);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    error.value = errorMessage;
    emit('error', errorMessage);
    console.error('Failed to load data:', err);
  } finally {
    loading.value = false;
  }
};

const convertToTableRows = (result: TreeAggregationResult): TreeTableRow[] => {
  const rows: TreeTableRow[] = [];
  const processNode = (
    node: TreeNode,
    level: number = 0,
    parentId?: string
  ): void => {
    const aggregatedData = result.aggregatedData.find((d: AggregatedDataPoint) => d.code === node.code);
    const row: TreeTableRow = {
      id: node.code,
      code: node.code,
      label: node.labels[locale.value as keyof MultiLanguageLabels] || node.labels.de,
      value: aggregatedData?.value || null,
      level,
      hasChildren: node.children.length > 0,
      isExpanded: level === 0 || config.value.expandAll,
      isVisible: level === 0, // Initially, only show root level
      parentId,
      unit: aggregatedData?.unit
    };

    rows.push(row);

    // Process children
    node.children.forEach(child => {
      processNode(child, level + 1, node.code);
    });
  };

  if (result.metadata.treeStructure?.tree) {
    processNode(result.metadata.treeStructure.tree);
  }

  // After all rows are created, update visibility based on expansion state
  updateRowsVisibility(rows);

  return rows;
};



const updateRowsVisibility = (rows: TreeTableRow[]) => {
  const isRowVisibleInArray = (rowId: string, rowsArray: TreeTableRow[]): boolean => {
    const row = rowsArray.find(r => r.id === rowId);
    if (!row) return false;

    if (row.level === 0) return true;
    if (!row.parentId) return true;

    const parent = rowsArray.find(r => r.id === row.parentId);
    return parent ? parent.isExpanded && isRowVisibleInArray(parent.id, rowsArray) : false;
  };

  rows.forEach(row => {
    if (row.level === 0) {
      row.isVisible = true;
    } else if (row.parentId) {
      row.isVisible = isRowVisibleInArray(row.parentId, rows);
    }
  });
};

const updateVisibility = () => {
  updateRowsVisibility(tableRows.value);
};



const toggleRow = (rowId: string) => {
  const row = tableRows.value.find(r => r.id === rowId);
  if (row && row.hasChildren) {
    row.isExpanded = !row.isExpanded;
    updateVisibility();
    emit('rowToggled', rowId, row.isExpanded);
  }
};

const toggleExpandAll = () => {
  config.value.expandAll = !config.value.expandAll;
  tableRows.value.forEach(row => {
    if (row.hasChildren) {
      row.isExpanded = config.value.expandAll;
    }
  });
  updateVisibility();
};

const updateLanguage = () => {
  // Update labels when language changes
  tableRows.value.forEach(row => {
    const aggregatedData = metadata.value?.treeStructure?.tree;
    if (aggregatedData) {
      const findNode = (node: TreeNode): TreeNode | null => {
        if (node.code === row.code) return node;
        for (const child of node.children) {
          const found = findNode(child);
          if (found) return found;
        }
        return null;
      };

      const node = findNode(aggregatedData);
      if (node) {
        row.label = node.labels[locale.value as keyof MultiLanguageLabels] || node.labels.de;
      }
    }
  });
};

const formatValue = (value: number | null, unit?: string): string => {
  if (value === null || value === undefined) return '';

  const formatter = new Intl.NumberFormat(config.value.numberFormat, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });

  const formattedValue = formatter.format(value);
  return unit ? `${formattedValue} ${unit}` : formattedValue;
};

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleString(locale.value || 'de-CH');
};

const getHeaderLabel = (type: 'label' | 'code' | 'value'): string => {
  return t(`treeTable.${type}Column`);
};

// Watchers
watch(() => props.dataPath, () => {
  loadData();
}, { immediate: false });

watch(() => config.value.expandAll, () => {
  updateVisibility();
});

watch(locale, () => {
  // Create new TreeAggregator with updated language and refresh labels
  treeAggregator.value = new TreeAggregator({
    language: locale.value as keyof MultiLanguageLabels
  });
  updateLanguage();
});

// Lifecycle
onMounted(() => {
  loadData();
});
</script>

<style scoped>
.hierarchical-tree-table {
  width: 100%;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding: 1rem;
  background-color: var(--color-background-soft, #f8f9fa);
  border-radius: 8px;
}

.table-header h3 {
  margin: 0;
  color: var(--color-heading, #2c3e50);
}

.controls {
  display: flex;
  gap: 1rem;
  align-items: center;
  flex-wrap: wrap;
}



.expand-button {
  padding: 0.5rem 1rem;
  background-color: var(--color-background-mute, #f1f3f4);
  border: 1px solid var(--color-border, #ddd);
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.expand-button:hover {
  background-color: var(--color-background-soft, #e9ecef);
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  cursor: pointer;
}

.checkbox-label input[type="checkbox"] {
  margin: 0;
}

.loading, .error, .no-data {
  text-align: center;
  padding: 2rem;
  color: var(--color-text-soft, #6c757d);
}

.error {
  color: var(--color-danger, #dc3545);
  background-color: var(--color-danger-soft, #f8d7da);
  border: 1px solid var(--color-danger-border, #f5c6cb);
  border-radius: 4px;
}

.table-container {
  overflow-x: auto;
  border: 1px solid var(--color-border, #ddd);
  border-radius: 8px;
}

.tree-table {
  width: 100%;
  border-collapse: collapse;
  background-color: white;
}

.tree-table th {
  background-color: var(--color-background-soft, #f8f9fa);
  padding: 0.75rem;
  text-align: left;
  font-weight: 600;
  border-bottom: 2px solid var(--color-border, #ddd);
  color: var(--color-heading, #2c3e50);
}

.tree-table td {
  padding: 0.5rem 0.75rem;
  border-bottom: 1px solid var(--color-border-soft, #e9ecef);
  vertical-align: middle;
}

.tree-row:hover {
  background-color: var(--color-background-soft, #f8f9fa);
}

.tree-row.level-0 {
  font-weight: 600;
}

.tree-row.level-1 {
  background-color: var(--color-background-mute, #fafbfc);
}

.tree-row.level-2 {
  background-color: var(--color-background-soft, #f8f9fa);
}

.label-content {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.expand-toggle {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.25rem;
  font-size: 0.8rem;
  color: var(--color-text-soft, #6c757d);
  transition: color 0.2s;
  min-width: 1.5rem;
  text-align: center;
}

.expand-toggle:hover {
  color: var(--color-text, #212529);
}

.expand-spacer {
  min-width: 1.5rem;
  display: inline-block;
}

.label-text {
  flex: 1;
}

.code-cell {
  font-family: 'Courier New', monospace;
  font-size: 0.9rem;
  color: var(--color-text-soft, #6c757d);
}

.value-cell {
  text-align: right;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
}

.label-column {
  min-width: 300px;
}

.code-column {
  width: 120px;
}

.value-column {
  width: 150px;
  text-align: right;
}

.table-metadata {
  margin-top: 0.5rem;
  padding: 0.5rem;
  text-align: center;
  color: var(--color-text-soft, #6c757d);
  font-size: 0.85rem;
}

/* Responsive design */
@media (max-width: 768px) {
  .table-header {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }

  .controls {
    justify-content: center;
  }

  .tree-table th,
  .tree-table td {
    padding: 0.5rem;
  }

  .label-column {
    min-width: 200px;
  }

  .code-column {
    width: 80px;
  }

  .value-column {
    width: 100px;
  }
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .tree-table {
    background-color: var(--color-background, #1a1a1a);
  }

  .tree-table th {
    background-color: var(--color-background-mute, #2d2d2d);
  }

  .tree-row:hover {
    background-color: var(--color-background-mute, #2d2d2d);
  }
}
</style>
