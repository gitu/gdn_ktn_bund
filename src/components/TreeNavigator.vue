<template>
  <div class="tree-navigator">
    <div class="tree-header">
      <h3>{{ componentTitle }}</h3>
      <div class="controls">
        <input
          v-model="searchQuery"
          type="text"
          :placeholder="searchPlaceholder"
          class="search-input"
          @input="handleSearch"
        />
      </div>
    </div>

    <div class="tree-content" v-if="treeData">
      <div class="tree-metadata">
        <small>
          {{ treeData.metadata.totalNodes }} {{ t('treeNavigator.nodesCount') }},
          {{ t('treeNavigator.maxDepth') }}: {{ treeData.metadata.maxDepth }},
          {{ t('treeNavigator.source') }}: {{ treeData.metadata.source }}
        </small>
      </div>

      <div class="tree-nodes">
        <!-- Custom TreeNode implementation -->
        <TreeNode
          v-if="!usePrimeVueTree"
          :node="treeData.tree"
          :language="locale as keyof MultiLanguageLabels"
          :search-query="searchQuery"
          :expanded-nodes="expandedNodes"
          :selected-nodes="selectedNodes"
          :show-icons="showIcons"
          :selection-mode="selectionMode"
          @toggle-expand="toggleExpand"
          @select-node="selectNode"
          @node-click="handleNodeClick"
        />

        <!-- PrimeVue Tree implementation -->
        <Tree
          v-else
          :value="primeVueTreeData"
          :selection-mode="selectionMode || undefined"
          v-model:selection-keys="primeVueSelection"
          @node-select="handlePrimeVueNodeSelect"
          @node-unselect="handlePrimeVueNodeUnselect"
          @node-expand="handlePrimeVueNodeExpand"
          @node-collapse="handlePrimeVueNodeCollapse"
        />
      </div>
    </div>

    <div v-else-if="loading" class="loading">
      {{ loadingText }}
    </div>

    <div v-else-if="error" class="error">
      {{ errorText }}: {{ error }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { DataLoader } from '../utils/DataLoader';
import { TreeNodeAdapter } from '../utils/TreeNodeAdapter';
import type { PrimeVueTreeNode } from '../utils/TreeNodeAdapter';
import TreeNode from './TreeNode.vue';
import type { TreeNode as TreeNodeType, TreeStructure, MultiLanguageLabels } from '../types/DataStructures';
import Tree from 'primevue/tree';

// Props and emits
const props = withDefaults(defineProps<{
  dimension: string;
  componentTitle?: string;
  showIcons?: boolean;
  usePrimeVueTree?: boolean;
  selectionMode?: 'single' | 'multiple' | 'checkbox' | null;
}>(), {
  componentTitle: undefined,
  showIcons: true,
  usePrimeVueTree: false,
  selectionMode: null
});

const emit = defineEmits<{
  (e: 'nodeSelected', nodeCode: string, nodeData: TreeNodeType | unknown): void;
  (e: 'searchResults', results: TreeNodeType[]): void;
}>();

// State
const { t, locale } = useI18n();
const treeData = ref<TreeStructure | null>(null);
const loading = ref(false);
const error = ref<string | null>(null);
const expandedNodes = ref<Set<string>>(new Set(['root']));
const selectedNodes = ref<Set<string>>(new Set());
const searchQuery = ref('');
const dataLoader = new DataLoader();
const treeAdapter = new TreeNodeAdapter({
  language: locale.value as keyof MultiLanguageLabels,
  showIcons: props.showIcons
});

// For PrimeVue integration
const primeVueTreeData = ref<PrimeVueTreeNode[]>([]);
const primeVueSelection = ref<Record<string, boolean>>({});

// Computed properties
const componentTitle = computed(() => {
  return props.componentTitle || t('treeNavigator.title', { dimension: props.dimension });
});

const searchPlaceholder = computed(() => {
  return t('treeNavigator.searchPlaceholder');
});

const loadingText = computed(() => {
  return t('treeNavigator.loading');
});

const errorText = computed(() => {
  return t('treeNavigator.errorLoadingTree');
});

// Methods
const loadTreeData = async () => {
  loading.value = true;
  error.value = null;

  // Reset tree state when loading new data
  expandedNodes.value.clear();
  expandedNodes.value.add('root');
  selectedNodes.value.clear();
  searchQuery.value = '';

  try {
    const data = await dataLoader.loadTreeStructure(props.dimension, 'fs');
    treeData.value = data;

    // Convert to PrimeVue format if needed
    if (props.usePrimeVueTree && data) {
      treeAdapter.updateConfig({
        language: locale.value as keyof MultiLanguageLabels,
        showIcons: props.showIcons
      });
      primeVueTreeData.value = treeAdapter.convertTreeStructure(data as unknown as { tree: TreeNodeType; metadata?: Record<string, unknown> });
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Unknown error';
    console.error('Failed to load tree data:', err);
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
  if (!treeData.value || !searchQuery.value) {
    return;
  }

  const results = dataLoader.searchTreeNodes(
    treeData.value.tree,
    searchQuery.value,
    locale.value as keyof MultiLanguageLabels
  );

  emit('searchResults', results);

  // Auto-expand nodes that contain search results
  results.forEach(node => {
    const path = dataLoader.getNodePath(treeData.value!.tree, node.code);
    if (path) {
      path.forEach(pathNode => {
        expandedNodes.value.add(pathNode.code);
      });
    }
  });
};

const toggleExpand = (nodeCode: string) => {
  if (expandedNodes.value.has(nodeCode)) {
    expandedNodes.value.delete(nodeCode);
  } else {
    expandedNodes.value.add(nodeCode);
  }
};

const selectNode = (nodeCode: string, nodeData: TreeNodeType) => {
  if (selectedNodes.value.has(nodeCode)) {
    selectedNodes.value.delete(nodeCode);
  } else {
    selectedNodes.value.add(nodeCode);
  }

  emit('nodeSelected', nodeCode, nodeData);
};

const expandAll = () => {
  if (!treeData.value) return;

  const addAllNodes = (node: TreeNodeType) => {
    expandedNodes.value.add(node.code);
    node.children?.forEach(addAllNodes);
  };

  addAllNodes(treeData.value.tree);
};

const collapseAll = () => {
  expandedNodes.value.clear();
  expandedNodes.value.add('root');
};

// New event handlers
const handleNodeClick = (nodeCode: string, nodeData: TreeNodeType) => {
  emit('nodeSelected', nodeCode, nodeData);
};

// PrimeVue Tree event handlers
// Using type assertion to make TypeScript happy with the event handlers
const handlePrimeVueNodeSelect = (primeVueNode: PrimeVueTreeNode) => {
  const nodeData = primeVueNode.data?.originalNode || primeVueNode.data;
  emit('nodeSelected', primeVueNode.key, nodeData as TreeNodeType);
};

const handlePrimeVueNodeUnselect = (primeVueNode: PrimeVueTreeNode) => {
  console.log('Node unselected:', primeVueNode.key);
};

const handlePrimeVueNodeExpand = (primeVueNode: PrimeVueTreeNode) => {
  expandedNodes.value.add(primeVueNode.key);
};

const handlePrimeVueNodeCollapse = (primeVueNode: PrimeVueTreeNode) => {
  expandedNodes.value.delete(primeVueNode.key);
};

// Watchers
watch(() => props.dimension, () => {
  loadTreeData();
}, { immediate: false });

watch(locale, (newLanguage) => {
  if (props.usePrimeVueTree && treeData.value) {
    treeAdapter.updateConfig({ language: newLanguage as keyof MultiLanguageLabels });
    primeVueTreeData.value = treeAdapter.convertTreeStructure(treeData.value as unknown as { tree: TreeNodeType; metadata?: Record<string, unknown> });
  }
});

watch(() => props.showIcons, (newShowIcons) => {
  if (props.usePrimeVueTree && treeData.value) {
    treeAdapter.updateConfig({ showIcons: newShowIcons });
    primeVueTreeData.value = treeAdapter.convertTreeStructure(treeData.value as unknown as { tree: TreeNodeType; metadata?: Record<string, unknown> });
  }
});

// Lifecycle
onMounted(() => {
  loadTreeData();
});

// Expose methods for parent components
defineExpose({
  loadTreeData,
  expandAll,
  collapseAll,
  clearSelection: () => selectedNodes.value.clear()
});
</script>

<style scoped>
.tree-navigator {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
  background: white;
}

.tree-header {
  background: #f5f5f5;
  padding: 1rem;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.tree-header h3 {
  margin: 0;
  color: #333;
}

.controls {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.search-input {
  padding: 0.25rem 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  min-width: 200px;
}

.tree-content {
  max-height: 600px;
  overflow-y: auto;
}

.tree-metadata {
  padding: 0.5rem 1rem;
  background: #f9f9f9;
  border-bottom: 1px solid #e0e0e0;
  color: #666;
}

.tree-nodes {
  padding: 0.5rem;
}

.loading, .error {
  padding: 2rem;
  text-align: center;
}

.error {
  color: #d32f2f;
  background: #ffebee;
}

.loading {
  color: #666;
}
</style>
