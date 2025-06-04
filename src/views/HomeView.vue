<script setup lang="ts">
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import TreeNavigator from '../components/TreeNavigator.vue';
import type { TreeNode } from '../types/DataStructures';

// Define allowed dimensions type to match TreeNavigator
type AllowedDimension = 'bilanz' | 'aufwand' | 'ertrag';

// Vue i18n
const { t } = useI18n();

const selectedDimension = ref<AllowedDimension>('ertrag');
const selectedNode = ref<string | null>(null);
const searchResults = ref<TreeNode[]>([]);

// Only show the allowed dimensions - using computed for reactive translations
const dimensions = computed(() => [
  { value: 'ertrag' as AllowedDimension, label: t('homeView.dimensions.ertrag') },
  { value: 'aufwand' as AllowedDimension, label: t('homeView.dimensions.aufwand') },
  { value: 'bilanz' as AllowedDimension, label: t('homeView.dimensions.bilanz') }
]);

const handleNodeSelected = (nodeCode: string, nodeData: TreeNode | unknown) => {
  selectedNode.value = nodeCode;
  console.log('Selected node:', nodeCode, nodeData);
};

const handleSearchResults = (results: TreeNode[]) => {
  searchResults.value = results;
  console.log('Search results:', results);
};
</script>

<template>
  <main class="home-view">
    <div class="header">
      <h1>{{ $t('homeView.title') }}</h1>
      <p>{{ $t('homeView.subtitle') }}</p>
    </div>

    <div class="controls">
      <div class="control-group">
        <label for="dimension-select">{{ $t('homeView.dimensionLabel') }}</label>
        <select id="dimension-select" v-model="selectedDimension">
          <option v-for="dim in dimensions" :key="dim.value" :value="dim.value">
            {{ dim.label }}
          </option>
        </select>
      </div>
    </div>

    <div class="content">
      <div class="tree-section">
        <TreeNavigator
          :key="selectedDimension"
          :dimension="selectedDimension"
          :title="`${selectedDimension.toUpperCase()} - FS`"
          @node-selected="handleNodeSelected"
          @search-results="handleSearchResults"
        />
      </div>

      <div class="info-section" v-if="selectedNode || searchResults.length > 0">
        <div v-if="selectedNode" class="selected-info">
          <h3>{{ $t('homeView.selectedNode') }}</h3>
          <p><strong>{{ $t('homeView.code') }}:</strong> {{ selectedNode }}</p>
        </div>

        <div v-if="searchResults.length > 0" class="search-info">
          <h3>{{ $t('homeView.searchResults') }} ({{ searchResults.length }})</h3>
          <ul>
            <li v-for="result in searchResults.slice(0, 10)" :key="result.code">
              <strong>{{ result.code }}</strong>: {{ result.labels.de }}
            </li>
          </ul>
          <p v-if="searchResults.length > 10">
            {{ $t('homeView.moreResults', { count: searchResults.length - 10 }) }}
          </p>
        </div>
      </div>
    </div>

    <div class="info-box">
      <h3>{{ $t('homeView.aboutTitle') }}</h3>
      <p>
        {{ $t('homeView.aboutDescription') }}
      </p>
      <ul>
        <li><strong>{{ $t('treeNavigator.dimensions.ertrag') }}:</strong> {{ $t('homeView.aboutItems.ertrag') }}</li>
        <li><strong>{{ $t('treeNavigator.dimensions.aufwand') }}:</strong> {{ $t('homeView.aboutItems.aufwand') }}</li>
        <li><strong>{{ $t('treeNavigator.dimensions.bilanz') }}:</strong> {{ $t('homeView.aboutItems.bilanz') }}</li>
      </ul>
      <p>
        {{ $t('homeView.aboutFooter') }}
      </p>
    </div>
  </main>
</template>

<style scoped>
.home-view {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.header {
  text-align: center;
  margin-bottom: 2rem;
}

.header h1 {
  color: #2c3e50;
  margin-bottom: 0.5rem;
}

.header p {
  color: #666;
  font-size: 1.1rem;
}

.controls {
  display: flex;
  gap: 2rem;
  margin-bottom: 2rem;
  justify-content: center;
  flex-wrap: wrap;
}

.control-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.control-group label {
  font-weight: 600;
  color: #333;
}

.control-group select {
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  background: white;
  min-width: 200px;
}

.content {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 2rem;
  margin-bottom: 2rem;
}

.tree-section {
  min-height: 400px;
}

.info-section {
  background: #f9f9f9;
  padding: 1.5rem;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
}

.selected-info, .search-info {
  margin-bottom: 1.5rem;
}

.selected-info h3, .search-info h3 {
  margin-bottom: 0.5rem;
  color: #2c3e50;
}

.search-info ul {
  list-style: none;
  padding: 0;
  margin: 0.5rem 0;
}

.search-info li {
  padding: 0.25rem 0;
  border-bottom: 1px solid #e0e0e0;
}

.info-box {
  background: #e3f2fd;
  padding: 1.5rem;
  border-radius: 8px;
  border-left: 4px solid #2196f3;
}

.info-box h3 {
  margin-bottom: 1rem;
  color: #1976d2;
}

.info-box ul {
  margin: 1rem 0;
}

.info-box li {
  margin-bottom: 0.5rem;
}

@media (max-width: 768px) {
  .home-view {
    padding: 1rem;
  }

  .content {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .controls {
    flex-direction: column;
    align-items: center;
  }
}
</style>
