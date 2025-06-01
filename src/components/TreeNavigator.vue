<template>
  <div class="tree-navigator">
    <div class="tree-header">
      <h3>{{ title }}</h3>
      <div class="controls">
        <select v-model="selectedLanguage" @change="updateLanguage">
          <option value="de">Deutsch</option>
          <option value="fr">Français</option>
          <option value="it">Italiano</option>
          <option value="en">English</option>
        </select>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search..."
          class="search-input"
          @input="handleSearch"
        />
      </div>
    </div>

    <div class="tree-content" v-if="treeData">
      <div class="tree-metadata">
        <small>
          {{ treeData.metadata.totalNodes }} nodes,
          max depth: {{ treeData.metadata.maxDepth }},
          source: {{ treeData.metadata.source }}
        </small>
      </div>

      <div class="tree-nodes">
        <TreeNode
          :node="treeData.tree"
          :language="selectedLanguage"
          :search-query="searchQuery"
          :expanded-nodes="expandedNodes"
          :selected-nodes="selectedNodes"
          @toggle-expand="toggleExpand"
          @select-node="selectNode"
        />
      </div>
    </div>

    <div v-else-if="loading" class="loading">
      Loading tree structure...
    </div>

    <div v-else-if="error" class="error">
      Error loading tree: {{ error }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { DataLoader } from '../utils/DataLoader';
import type { TreeStructure, MultiLanguageLabels } from '../types/DataStructures';
import TreeNode from './TreeNode.vue';

interface Props {
  dimension: string;
  model?: string;
  title?: string;
}

const props = withDefaults(defineProps<Props>(), {
  model: 'fs',
  title: 'Data Tree'
});

const emit = defineEmits<{
  nodeSelected: [nodeCode: string, nodeData: any];
  searchResults: [results: any[]];
}>();

// Reactive state
const treeData = ref<TreeStructure | null>(null);
const loading = ref(false);
const error = ref<string | null>(null);
const selectedLanguage = ref<keyof MultiLanguageLabels>('de');
const searchQuery = ref('');
const expandedNodes = ref<Set<string>>(new Set(['root']));
const selectedNodes = ref<Set<string>>(new Set());

// Data loader instance
const dataLoader = new DataLoader();

// Computed properties
const filteredTreeData = computed(() => {
  if (!treeData.value || !searchQuery.value) {
    return treeData.value;
  }

  // Implement search filtering logic here
  return treeData.value;
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
    const data = await dataLoader.loadTreeStructure(props.dimension, props.model);
    treeData.value = data;
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Unknown error';
    console.error('Failed to load tree data:', err);
  } finally {
    loading.value = false;
  }
};

const updateLanguage = () => {
  // Language change is handled reactively through the selectedLanguage ref
};

const handleSearch = () => {
  if (!treeData.value || !searchQuery.value) {
    return;
  }

  const results = dataLoader.searchTreeNodes(
    treeData.value.tree,
    searchQuery.value,
    selectedLanguage.value
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

const selectNode = (nodeCode: string, nodeData: any) => {
  if (selectedNodes.value.has(nodeCode)) {
    selectedNodes.value.delete(nodeCode);
  } else {
    selectedNodes.value.add(nodeCode);
  }

  emit('nodeSelected', nodeCode, nodeData);
};

const expandAll = () => {
  if (!treeData.value) return;

  const addAllNodes = (node: any) => {
    expandedNodes.value.add(node.code);
    node.children?.forEach(addAllNodes);
  };

  addAllNodes(treeData.value.tree);
};

const collapseAll = () => {
  expandedNodes.value.clear();
  expandedNodes.value.add('root');
};

// Watchers
watch([() => props.dimension, () => props.model], () => {
  loadTreeData();
}, { immediate: false });

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

.controls select {
  padding: 0.25rem 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  background: white;
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
