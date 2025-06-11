<template>
  <div class="comparison-controls">
    <!-- Selection Status -->
    <div v-if="isSelecting" class="selection-status">
      <div class="status-content">
        <i class="pi pi-hand-pointer status-icon"></i>
        <span class="status-text">
          {{ selectionStatusText }}
        </span>
        <Button
          icon="pi pi-times"
          size="small"
          text
          severity="secondary"
          @click="cancelSelection"
          :title="$t('comparison.cancelSelection')"
          class="cancel-button"
        />
      </div>
    </div>

    <!-- Active Comparisons Summary -->
    <div v-if="hasActiveComparisons" class="active-comparisons">
      <div class="comparisons-header">
        <div class="header-content">
          <i class="pi pi-chart-line"></i>
          <span class="comparisons-count">
            {{ $t('comparison.activeComparisons', { count: activeComparisons.length }) }}
          </span>
        </div>
        
        <div class="header-actions">
          <Button
            :label="$t('comparison.clearAll')"
            icon="pi pi-trash"
            size="small"
            severity="danger"
            outlined
            @click="clearAllComparisons"
            :title="$t('comparison.clearAllTooltip')"
          />
        </div>
      </div>

      <!-- Comparisons List -->
      <div v-if="showComparisonsList" class="comparisons-list">
        <div
          v-for="comparison in activeComparisons"
          :key="comparison.id"
          class="comparison-item"
          :class="{ 'invalid': !comparison.isValid }"
        >
          <div class="comparison-info">
            <div class="comparison-summary">
              <span class="base-info">{{ comparison.base.displayName }}</span>
              <i class="pi pi-arrow-right comparison-arrow"></i>
              <span class="target-info">{{ comparison.target.displayName }}</span>
            </div>
            
            <div class="comparison-result">
              <span 
                class="percentage-change"
                :class="getChangeClass(comparison.percentageChange)"
              >
                {{ formatPercentageChange(comparison.percentageChange) }}
              </span>
            </div>
          </div>

          <Button
            icon="pi pi-times"
            size="small"
            text
            severity="secondary"
            @click="removeComparison(comparison.id)"
            :title="$t('comparison.removeComparison')"
            class="remove-comparison"
          />
        </div>
      </div>
    </div>

    <!-- Help Text -->
    <div v-if="!isSelecting && !hasActiveComparisons" class="help-text">
      <div class="help-content">
        <i class="pi pi-info-circle help-icon"></i>
        <div class="help-instructions">
          <p class="help-title">{{ $t('comparison.helpTitle') }}</p>
          <ul class="help-list">
            <li>{{ $t('comparison.helpCellToCell') }}</li>
            <li>{{ $t('comparison.helpColumnToColumn') }}</li>
            <li>{{ $t('comparison.helpKeyboardShortcuts') }}</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Keyboard Shortcuts Info -->
    <div v-if="showKeyboardShortcuts" class="keyboard-shortcuts">
      <div class="shortcuts-header">
        <span>{{ $t('comparison.keyboardShortcuts') }}</span>
      </div>
      <div class="shortcuts-list">
        <div class="shortcut-item">
          <kbd>Esc</kbd>
          <span>{{ $t('comparison.shortcutCancel') }}</span>
        </div>
        <div class="shortcut-item">
          <kbd>Ctrl</kbd> + <kbd>Del</kbd>
          <span>{{ $t('comparison.shortcutClearAll') }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import Button from 'primevue/button'
import type { ActiveComparison } from '@/types/FinancialComparison'

interface Props {
  isSelecting: boolean
  hasBaseSelection: boolean
  activeComparisons: ActiveComparison[]
  showComparisonsList?: boolean
  showKeyboardShortcuts?: boolean
}

interface Emits {
  cancelSelection: []
  clearAllComparisons: []
  removeComparison: [id: string]
}

const props = withDefaults(defineProps<Props>(), {
  showComparisonsList: true,
  showKeyboardShortcuts: false
})

const emit = defineEmits<Emits>()
const { t } = useI18n()

const hasActiveComparisons = computed(() => props.activeComparisons.length > 0)

const selectionStatusText = computed(() => {
  if (props.hasBaseSelection) {
    return t('comparison.selectTarget')
  }
  return t('comparison.selectBase')
})

const cancelSelection = () => {
  emit('cancelSelection')
}

const clearAllComparisons = () => {
  emit('clearAllComparisons')
}

const removeComparison = (id: string) => {
  emit('removeComparison', id)
}

const formatPercentageChange = (percentageChange: number): string => {
  if (!isFinite(percentageChange)) return 'N/A'
  
  const sign = percentageChange >= 0 ? '+' : ''
  return `${sign}${percentageChange.toFixed(1)}%`
}

const getChangeClass = (percentageChange: number): string => {
  if (!isFinite(percentageChange)) return 'neutral'
  if (percentageChange > 0) return 'positive'
  if (percentageChange < 0) return 'negative'
  return 'neutral'
}
</script>

<style scoped>
.comparison-controls {
  background: var(--surface-card);
  border: 1px solid var(--surface-border);
  border-radius: 6px;
  padding: 16px;
  margin-bottom: 16px;
}

.selection-status {
  background: var(--blue-50);
  border: 1px solid var(--blue-200);
  border-radius: 4px;
  padding: 12px;
  margin-bottom: 12px;
}

.status-content {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-icon {
  color: var(--blue-600);
  font-size: 1.1rem;
}

.status-text {
  flex: 1;
  color: var(--blue-800);
  font-weight: 500;
}

.cancel-button {
  margin-left: auto;
}

.active-comparisons {
  border: 1px solid var(--surface-border);
  border-radius: 4px;
  overflow: hidden;
}

.comparisons-header {
  background: var(--surface-ground);
  padding: 12px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--surface-border);
}

.header-content {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-content i {
  color: var(--primary-color);
}

.comparisons-count {
  font-weight: 600;
  color: var(--text-color);
}

.comparisons-list {
  max-height: 300px;
  overflow-y: auto;
}

.comparison-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid var(--surface-border);
  transition: background-color 0.2s;
}

.comparison-item:hover {
  background: var(--surface-hover);
}

.comparison-item:last-child {
  border-bottom: none;
}

.comparison-item.invalid {
  background: var(--red-50);
  border-left: 3px solid var(--red-500);
}

.comparison-info {
  flex: 1;
}

.comparison-summary {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.base-info,
.target-info {
  font-size: 0.875rem;
  color: var(--text-color);
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.comparison-arrow {
  color: var(--text-color-secondary);
  font-size: 0.75rem;
}

.comparison-result {
  font-family: monospace;
  font-weight: 600;
}

.percentage-change.positive {
  color: var(--green-600);
}

.percentage-change.negative {
  color: var(--red-600);
}

.percentage-change.neutral {
  color: var(--text-color-secondary);
}

.remove-comparison {
  margin-left: 8px;
}

.help-text {
  background: var(--surface-ground);
  border-radius: 4px;
  padding: 16px;
}

.help-content {
  display: flex;
  gap: 12px;
}

.help-icon {
  color: var(--primary-color);
  font-size: 1.2rem;
  margin-top: 2px;
  flex-shrink: 0;
}

.help-instructions {
  flex: 1;
}

.help-title {
  font-weight: 600;
  color: var(--text-color);
  margin-bottom: 8px;
}

.help-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.help-list li {
  color: var(--text-color-secondary);
  font-size: 0.875rem;
  margin-bottom: 4px;
  padding-left: 16px;
  position: relative;
}

.help-list li::before {
  content: '•';
  color: var(--primary-color);
  position: absolute;
  left: 0;
}

.keyboard-shortcuts {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--surface-border);
}

.shortcuts-header {
  font-weight: 600;
  color: var(--text-color);
  margin-bottom: 8px;
  font-size: 0.875rem;
}

.shortcuts-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.shortcut-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.75rem;
  color: var(--text-color-secondary);
}

kbd {
  background: var(--surface-ground);
  border: 1px solid var(--surface-border);
  border-radius: 3px;
  padding: 2px 6px;
  font-family: monospace;
  font-size: 0.7rem;
  color: var(--text-color);
}
</style>
