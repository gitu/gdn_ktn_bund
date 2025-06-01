<template>
  <div class="tree-node">
    <div
      class="node-content"
      :class="{
        'has-children': hasChildren,
        'expanded': isExpanded,
        'selected': isSelected,
        'has-value': node.hasValue,
        'highlighted': isHighlighted
      }"
      @click="handleClick"
    >
      <div class="node-toggle" v-if="hasChildren" @click.stop="toggleExpand">
        <span class="toggle-icon">{{ isExpanded ? '▼' : '▶' }}</span>
      </div>

      <div class="node-info">
        <div class="node-header">
          <span class="node-code">{{ node.code }}</span>
          <span class="node-label">{{ getLabel(node, language) }}</span>
          <span v-if="node.hasValue && node.value" class="node-value">
            {{ formatValue(node.value) }}
          </span>
        </div>

        <div v-if="showDetails && node.funk" class="node-details">
          <small class="node-function">Function: {{ node.funk }}</small>
        </div>
      </div>
    </div>

    <div v-if="hasChildren && isExpanded" class="node-children">
      <TreeNode
        v-for="child in node.children"
        :key="child.code"
        :node="child"
        :language="language"
        :search-query="searchQuery"
        :expanded-nodes="expandedNodes"
        :selected-nodes="selectedNodes"
        :level="level + 1"
        @toggle-expand="$emit('toggleExpand', $event)"
        @select-node="$emit('selectNode', $event, child)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { TreeNode as TreeNodeType, MultiLanguageLabels } from '../types/DataStructures';

interface Props {
  node: TreeNodeType;
  language: keyof MultiLanguageLabels;
  searchQuery?: string;
  expandedNodes: Set<string>;
  selectedNodes: Set<string>;
  level?: number;
  showDetails?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  level: 0,
  showDetails: false
});

const emit = defineEmits<{
  toggleExpand: [nodeCode: string];
  selectNode: [nodeCode: string, nodeData: TreeNodeType];
}>();

// Computed properties
const hasChildren = computed(() => {
  return props.node.children && props.node.children.length > 0;
});

const isExpanded = computed(() => {
  return props.expandedNodes.has(props.node.code);
});

const isSelected = computed(() => {
  return props.selectedNodes.has(props.node.code);
});

const isHighlighted = computed(() => {
  if (!props.searchQuery) return false;

  const query = props.searchQuery.toLowerCase();
  const label = getLabel(props.node, props.language).toLowerCase();
  const code = props.node.code.toLowerCase();

  return label.includes(query) || code.includes(query);
});

// Methods
const getLabel = (node: TreeNodeType, language: keyof MultiLanguageLabels): string => {
  return node.labels[language] || node.labels.de || node.code;
};

const formatValue = (value: string | number | null): string => {
  if (value === null || value === undefined) return '';

  const numValue = typeof value === 'string' ? parseFloat(value.replace(/,/g, '')) : value;

  if (isNaN(numValue)) return String(value);

  // Format large numbers with thousand separators
  return new Intl.NumberFormat('de-CH', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(numValue);
};

const toggleExpand = () => {
  if (hasChildren.value) {
    emit('toggleExpand', props.node.code);
  }
};

const handleClick = () => {
  emit('selectNode', props.node.code, props.node);
};
</script>

<style scoped>
.tree-node {
  user-select: none;
}

.node-content {
  display: flex;
  align-items: flex-start;
  padding: 0.25rem 0;
  cursor: pointer;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.node-content:hover {
  background-color: #f5f5f5;
}

.node-content.selected {
  background-color: #e3f2fd;
  border-left: 3px solid #2196f3;
}

.node-content.highlighted {
  background-color: #fff3e0;
  border-left: 3px solid #ff9800;
}

.node-content.has-value {
  font-weight: 500;
}

.node-toggle {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 0.25rem;
  cursor: pointer;
  border-radius: 2px;
}

.node-toggle:hover {
  background-color: #e0e0e0;
}

.toggle-icon {
  font-size: 0.75rem;
  color: #666;
}

.node-info {
  flex: 1;
  min-width: 0;
}

.node-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.node-code {
  font-family: 'Courier New', monospace;
  font-size: 0.85rem;
  color: #666;
  background: #f0f0f0;
  padding: 0.1rem 0.3rem;
  border-radius: 3px;
  min-width: fit-content;
}

.node-label {
  flex: 1;
  color: #333;
  font-size: 0.9rem;
  line-height: 1.3;
}

.node-value {
  font-family: 'Courier New', monospace;
  font-size: 0.85rem;
  color: #2e7d32;
  font-weight: 600;
  background: #e8f5e8;
  padding: 0.1rem 0.3rem;
  border-radius: 3px;
  white-space: nowrap;
}

.node-details {
  margin-top: 0.25rem;
  padding-left: 0.5rem;
}

.node-function {
  color: #666;
  font-style: italic;
}

.node-children {
  margin-left: 1rem;
  border-left: 1px solid #e0e0e0;
  padding-left: 0.5rem;
}

/* Level-based indentation */
.tree-node {
  --level: v-bind(level);
}

.node-content {
  padding-left: calc(var(--level) * 0.5rem);
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .node-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;
  }

  .node-value {
    align-self: flex-end;
  }

  .node-children {
    margin-left: 0.5rem;
  }
}
</style>
