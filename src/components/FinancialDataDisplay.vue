<template>
  <div class="financial-data-display">
    <!-- Header with title and controls -->
    <div class="header">
      <h2 class="title">{{ $t('financialDataDisplay.title') }}</h2>
    </div>

    <!-- Error state -->
    <div v-if="error" class="error-message" role="alert">
      <i class="pi pi-exclamation-triangle"></i>
      <span>{{ error }}</span>
    </div>

    <!-- Loading state -->
    <div
      v-else-if="loading"
      class="loading-message"
      role="status"
      :aria-label="$t('financialDataDisplay.loading')"
    >
      <i class="pi pi-spin pi-spinner"></i>
      <span>{{ $t('financialDataDisplay.loading') }}</span>
    </div>

    <!-- No data state -->
    <div v-else-if="!hasValidData" class="no-data-message">
      <i class="pi pi-info-circle"></i>
      <span>{{ $t('financialDataDisplay.noData') }}</span>
    </div>

    <!-- Main content -->
    <div v-else class="content">
      <!-- Comparison Controls -->
      <ComparisonControls
        v-if="props.enableComparison"
        :is-selecting="comparison.isSelecting.value"
        :has-base-selection="comparison.hasBaseSelection.value"
        :active-comparisons="comparison.state.activeComparisons"
        @cancel-selection="comparison.resetSelection"
        @clear-all-comparisons="comparison.clearAllComparisons"
        @remove-comparison="comparison.removeComparison"
        class="mb-4"
      />

      <!-- Combined Financial Data Section -->
      <div v-if="combinedFinancialData.length > 0" class="section">
        <TreeTable
          :value="combinedFinancialData"
          :expandedKeys="expandedKeys"
          @node-expand="onNodeExpand"
          @node-collapse="onNodeCollapse"
          class="financial-tree-table"
          :resizableColumns="true"
          columnResizeMode="expand"
          showGridlines
          scrollable
        >
          <template #header>
            <div class="flex flex-wrap justify-end gap-2">
              <Button text icon="pi pi-plus" :label="$t('financialDataDisplay.expandAll')" @click="expandAll" />
              <Button text icon="pi pi-minus" :label="$t('financialDataDisplay.collapseAll')" @click="collapseAll" />
            </div>
          </template>
          <template #footer>
            <div class="flex justify-between items-center flex-wrap gap-4">
              <!-- Left side: Toggle buttons -->
              <div class="flex gap-2">
                <ToggleButton
                  v-model="freezeFirstColumn"
                  :aria-label="
                    freezeFirstColumn
                      ? $t('financialDataDisplay.firstColumnFreezed')
                      : $t('financialDataDisplay.freezeFirstColumn')
                  "
                  :onLabel="$t('financialDataDisplay.firstColumnFreezed')"
                  :offLabel="$t('financialDataDisplay.freezeFirstColumn')"
                />
                <ToggleButton
                  v-model="showCodes"
                  :aria-label="
                    showCodes
                      ? $t('financialDataDisplay.codesShown')
                      : $t('financialDataDisplay.showCodes')
                  "
                  :onLabel="$t('financialDataDisplay.codesShown')"
                  :offLabel="$t('financialDataDisplay.showCodes')"
                />
              </div>

              <!-- Right side: Action buttons -->
              <div class="flex gap-2">
                <Button text icon="pi pi-plus" :label="$t('financialDataDisplay.expandAll')" @click="expandAll" />
                <Button text icon="pi pi-minus" :label="$t('financialDataDisplay.collapseAll')" @click="collapseAll" />
              </div>
            </div>
          </template>
          <!-- Account column -->
          <Column
            field="label"
            :header="$t('financialDataDisplay.columns.account')"
            :expander="true"
            class="account-column"
            :frozen="freezeFirstColumn"
          >
            <template #body="{ node }">
              <div class="account-cell">
                <span class="account-label">{{ getNodeLabel(node.data || node) }}</span>
                <span v-if="showCodes && (node.data?.code || node.code)" class="account-code"
                  >({{ node.data?.code || node.code }})</span
                >
              </div>
            </template>
          </Column>

          <!-- Entity value columns -->
          <Column
            v-for="[entityCode, entity] in entityColumns"
            :key="entityCode"
            :field="`values.${entityCode}`"
            class="value-column"
          >
            <template #header>
              <div
                class="entity-header"
                :class="getColumnHeaderClasses(entityCode as string)"
                @click="handleColumnHeaderClick(entityCode as string, entity)"
                @mouseenter="handleColumnHeaderHover(entityCode as string)"
                @mouseleave="handleColumnHeaderLeave"
              >
                <div class="entity-name">{{ getEntityDisplayName(entity) }}</div>
                <div class="entity-year">{{ entity.year }}</div>
                <div v-if="props.enableComparison && comparison.isSelecting.value" class="selection-indicator">
                  <i class="pi pi-hand-pointer"></i>
                </div>
              </div>
            </template>
            <template #body="{ node }">
              <div
                class="value-cell"
                :class="getCellClasses((node.data || node).code, entityCode as string)"
                @click="handleCellClick((node.data || node), entityCode as string, entity)"
                @mouseenter="handleCellHover((node.data || node).code, entityCode as string, $event)"
                @mouseleave="handleCellLeave"
              >
                <span
                  v-if="hasValue(node.data || node, entityCode as string)"
                  class="financial-value"
                  :class="{ 'pnl-value': (node.data?.code || node.code) === 'pnl' }"
                  :aria-label="
                    $t('financialDataDisplay.accessibility.financialValue', {
                      entity: getEntityDisplayName(entity),
                    })
                  "
                >
                  {{ formatCurrency(getValue(node.data || node, entityCode as string)) }}
                </span>
                <span
                  v-else
                  class="no-value"
                  :aria-label="$t('financialDataDisplay.accessibility.noValue')"
                >
                  -
                </span>

                <!-- Comparison indicator -->
                <div
                  v-if="props.enableComparison && getCellComparison((node.data || node).code, entityCode as string)"
                  class="comparison-indicator"
                >
                  <span class="comparison-badge">
                    {{ formatComparisonChange(getCellComparison((node.data || node).code, entityCode as string)) }}
                  </span>
                </div>
              </div>
            </template>
          </Column>
        </TreeTable>
      </div>
    </div>

    <!-- Comparison Tooltip -->
    <ComparisonTooltip
      v-if="hoveredTooltip && props.enableComparison"
      :comparison="hoveredTooltip.comparison"
      :show-tooltip="true"
      :show-absolute-change="comparison.displayOptions.showAbsoluteChange"
      :style="{
        position: 'fixed',
        left: hoveredTooltip.position.x + 'px',
        top: hoveredTooltip.position.y + 'px',
        zIndex: 1000
      }"
      @remove="handleRemoveComparison"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import TreeTable from 'primevue/treetable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import ToggleButton from 'primevue/togglebutton'
import ComparisonControls from './ComparisonControls.vue'
import ComparisonTooltip from './ComparisonTooltip.vue'
import { useFinancialComparison } from '@/composables/useFinancialComparison'
import type {
  FinancialData,
  FinancialDataEntity,
  FinancialDataNode,
} from '@/types/FinancialDataStructure'
import type { MultiLanguageLabels } from '@/types/DataStructures'
import type { ActiveComparison } from '@/types/FinancialComparison'

// Props
interface Props {
  financialData?: FinancialData | null
  loading?: boolean
  error?: string | null
  initialExpandedAll?: boolean
  initialShowCodes?: boolean
  initialFreezeFirstColumn?: boolean
  initialShowZeroValues?: boolean
  enableComparison?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  financialData: null,
  loading: false,
  error: null,
  initialExpandedAll: false,
  initialFreezeFirstColumn: false,
  initialShowCodes: false,
  initialShowZeroValues: false,
  enableComparison: true,
})

// Emits
interface Emits {
  nodeSelected: [nodeCode: string, nodeData: FinancialDataNode]
  error: [error: string]
}

const emit = defineEmits<Emits>()

// Vue i18n
const { locale, t } = useI18n()

// Comparison functionality
const comparison = useFinancialComparison()

// Reactive state
const expandedKeys = ref<Record<string, boolean>>({})
const expandedAll = ref(props.initialExpandedAll)
const showCodes = ref(props.initialShowCodes)
const freezeFirstColumn = ref(props.initialFreezeFirstColumn)
const showZeroValues = ref(props.initialShowZeroValues)
const scalingEnabled = ref(true)
const hoveredTooltip = ref<{ comparison: ActiveComparison; position: { x: number; y: number } } | null>(null)

// Computed properties
const hasValidData = computed(() => {
  return (
    props.financialData &&
    (props.financialData.balanceSheet || props.financialData.incomeStatement) &&
    props.financialData.entities &&
    props.financialData.entities.size > 0
  )
})

const entityColumns = computed(() => {
  if (!props.financialData?.entities) return new Map()
  return props.financialData.entities
})

// Get unique years from entities
const entityYears = computed(() => {
  if (!props.financialData?.entities) return new Set<string>()
  const years = new Set<string>()
  for (const [, entity] of props.financialData.entities) {
    years.add(entity.year)
  }
  return years
})

// Suppress unused variable warning - entityYears is computed for potential future use
void entityYears.value

// TreeTable node interface
interface TreeTableNode {
  key: string
  data: FinancialDataNode
  label: string
  children: TreeTableNode[]
}

// Transform financial data nodes to TreeTable format - Combined view
const combinedFinancialData = computed(() => {
  if (!props.financialData?.balanceSheet || !props.financialData?.incomeStatement) return []

  const combinedNodes: TreeTableNode[] = []

  // Extract Assets from balance sheet (code "1")
  const assetsNode = props.financialData.balanceSheet.children.find((child) => child.code === '1')
  if (assetsNode) {
    const transformedAssets = transformNodeToTreeTableData(assetsNode)
    combinedNodes.push(...transformedAssets)
  }

  // Extract Liabilities from balance sheet (code "2")
  const liabilitiesNode = props.financialData.balanceSheet.children.find(
    (child) => child.code === '2',
  )
  if (liabilitiesNode) {
    const transformedLiabilities = transformNodeToTreeTableData(liabilitiesNode)
    combinedNodes.push(...transformedLiabilities)
  }

  // Extract Revenue from income statement (code "4")
  const revenueNode = props.financialData.incomeStatement.children.find(
    (child) => child.code === '4',
  )
  if (revenueNode) {
    const transformedRevenue = transformNodeToTreeTableData(revenueNode)
    combinedNodes.push(...transformedRevenue)
  }

  // Extract Expenses from income statement (code "3")
  const expensesNode = props.financialData.incomeStatement.children.find(
    (child) => child.code === '3',
  )
  if (expensesNode) {
    const transformedExpenses = transformNodeToTreeTableData(expensesNode)
    combinedNodes.push(...transformedExpenses)
  }

  // Calculate and add P&L section
  const pnlNode = calculateProfitLossNode(props.financialData.incomeStatement)
  if (pnlNode) {
    const transformedPnl = transformNodeToTreeTableData(pnlNode)
    combinedNodes.push(...transformedPnl)
  }

  return combinedNodes
})

// Methods
const calculateProfitLossNode = (node: FinancialDataNode): FinancialDataNode | null => {
  // Create a P&L node with calculated values
  return {
    code: 'pnl',
    labels: {
      de: 'Gewinn/Verlust',
      fr: 'Bénéfice/Perte',
      it: 'Utile/Perdita',
      en: 'Profit/Loss',
    },
    values: node.values,
    children: [],
  }
}

const transformNodeToTreeTableData = (node: FinancialDataNode): TreeTableNode[] => {
  const transformNode = (n: FinancialDataNode, parentKey = ''): TreeTableNode | null => {
    const key = parentKey ? `${parentKey}-${n.code}` : n.code
    const hasVisibleValues = showZeroValues.value ? true : hasAnyNonZeroValue(n)

    if (!hasVisibleValues && n.children.length === 0) {
      return null
    }

    const treeNode = {
      key,
      data: n,
      label: getNodeLabel(n),
      children: n.children
        .map((child) => transformNode(child, key))
        .filter((child) => child !== null),
    }

    return treeNode
  }

  const rootNode = transformNode(node)
  return rootNode ? [rootNode] : []
}

const hasAnyNonZeroValue = (node: FinancialDataNode): boolean => {
  // Check if this node has any non-zero values
  for (const [, value] of node.values) {
    if (value.value !== 0) return true
  }

  // Check children recursively
  return node.children.some((child) => hasAnyNonZeroValue(child))
}

const getNodeLabel = (node: FinancialDataNode): string => {
  if (!node || !node.labels) return node?.code || 'Unknown Node'
  const currentLocale = locale.value as keyof MultiLanguageLabels
  return node.labels[currentLocale] || node.labels.de || node.code
}

const getEntityDisplayName = (entity: FinancialDataEntity): string => {
  if (!entity || !entity.name) return entity?.code || 'Unknown Entity'
  const currentLocale = locale.value as keyof MultiLanguageLabels
  return entity.name[currentLocale] || entity.name.de || entity.code
}

const hasValue = (node: FinancialDataNode, entityCode: string): boolean => {
  return node.values.has(entityCode) && node.values.get(entityCode)?.value !== undefined
}

const getValue = (node: FinancialDataNode, entityCode: string): number => {
  const baseValue = node.values.get(entityCode)?.value || 0

  // Apply scaling if enabled and scaling factor exists
  if (scalingEnabled.value && props.financialData?.entities) {
    const entity = props.financialData.entities.get(entityCode)
    if (entity?.scalingFactor !== undefined) {
      if (entity.scalingMode === 'divide') {
        if (entity.scalingFactor === 0) return NaN
        return baseValue / entity.scalingFactor
      }
      return baseValue * entity.scalingFactor
    }
  }

  return baseValue
}

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat(locale.value, {
    style: 'currency',
    currency: 'CHF',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

// Event handlers
const onNodeExpand = (node: TreeTableNode | { key: string }) => {
  expandedKeys.value[node.key] = true
}

const onNodeCollapse = (node: TreeTableNode | { key: string }) => {
  delete expandedKeys.value[node.key]
}

const expandAll = () => {
  expandedAll.value = !expandedAll.value

  // Expand all nodes
  const expandAllNodes = (nodes: TreeTableNode[]) => {
    nodes.forEach((node) => {
      expandedKeys.value[node.key] = true
      if (node.children && node.children.length > 0) {
        expandAllNodes(node.children)
      }
    })
  }

  expandAllNodes(combinedFinancialData.value)
}

const collapseAll = () => {
  expandedKeys.value = {}
}

// Comparison event handlers
const handleCellClick = (node: FinancialDataNode, entityCode: string, entity: FinancialDataEntity) => {
  if (!props.enableComparison || !hasValue(node, entityCode)) return

  const value = getValue(node, entityCode)
  const displayName = `${getNodeLabel(node)} - ${getEntityDisplayName(entity)}`

  comparison.selectCell(node.code, entityCode, value, displayName, 'cell-to-cell')
}

const handleColumnHeaderClick = (entityCode: string, entity: FinancialDataEntity) => {
  if (!props.enableComparison) return

  // For column comparisons, we could implement this to compare entire columns
  // For now, we'll focus on cell-to-cell comparisons
  // TODO: Implement column-to-column comparison
  void entityCode
  void entity
}

const handleCellHover = (rowCode: string, entityCode: string, event: MouseEvent) => {
  if (!props.enableComparison) return

  comparison.handleCellHover(rowCode, entityCode)

  // Show tooltip if there's an active comparison for this cell
  const cellComparison = comparison.getComparisonForCell(rowCode, entityCode)
  if (cellComparison) {
    hoveredTooltip.value = {
      comparison: cellComparison,
      position: {
        x: event.clientX + 10,
        y: event.clientY - 10
      }
    }
  }
}

const handleCellLeave = () => {
  if (!props.enableComparison) return

  comparison.handleCellLeave()
  hoveredTooltip.value = null
}

const handleColumnHeaderHover = (entityCode: string) => {
  if (!props.enableComparison) return
  // Could implement column hover logic here
  void entityCode
}

const handleColumnHeaderLeave = () => {
  if (!props.enableComparison) return
  // Could implement column hover leave logic here
}

const handleRemoveComparison = () => {
  if (hoveredTooltip.value?.comparison) {
    comparison.removeComparison(hoveredTooltip.value.comparison.id)
    hoveredTooltip.value = null
  }
}

// Comparison helper methods
const getCellClasses = (rowCode: string, entityCode: string) => {
  if (!props.enableComparison) return {}

  const cellState = comparison.getCellState(rowCode, entityCode)
  return {
    'cell-base-selected': cellState.isBaseSelected,
    'cell-has-comparison': cellState.hasComparison,
    'cell-selectable': cellState.isSelectable,
    'cell-hovered': cellState.isHovered
  }
}

const getColumnHeaderClasses = (entityCode: string) => {
  if (!props.enableComparison) return {}

  void entityCode // TODO: Use entityCode for column-specific styling
  return {
    'column-selectable': comparison.isSelecting.value,
    'column-clickable': true
  }
}

const getCellComparison = (rowCode: string, entityCode: string) => {
  if (!props.enableComparison) return null
  return comparison.getComparisonForCell(rowCode, entityCode)
}

const formatComparisonChange = (comparisonData: ActiveComparison | null) => {
  if (!comparisonData || !comparisonData.isValid) return ''
  return comparison.formatPercentageChange(comparisonData.percentageChange)
}

// Validation function
const validateFinancialData = (data: FinancialData) => {
  try {
    if (!data.balanceSheet && !data.incomeStatement) {
      emit('error', t('financialDataDisplay.errors.invalidData'))
      return
    }

    if (!data.entities || data.entities.size === 0) {
      emit('error', t('financialDataDisplay.errors.noEntities'))
      return
    }
  } catch {
    emit('error', t('financialDataDisplay.errors.processingError'))
  }
}

// Watch for data changes and validate
watch(
  () => props.financialData,
  (newData) => {
    if (newData) {
      validateFinancialData(newData)
    }
  },
  { immediate: true },
)

// Keyboard event handling
const handleKeyboardEvents = (event: KeyboardEvent) => {
  if (props.enableComparison) {
    comparison.handleKeyboardShortcut(event)
  }
}

// Initialize component
onMounted(() => {
  if (props.financialData) {
    validateFinancialData(props.financialData)
  }

  // Add keyboard event listeners
  if (props.enableComparison) {
    document.addEventListener('keydown', handleKeyboardEvents)
  }
})

onUnmounted(() => {
  // Clean up keyboard event listeners
  if (props.enableComparison) {
    document.removeEventListener('keydown', handleKeyboardEvents)
  }
})
</script>

<style scoped>
.account-label {
  font-weight: 500;
  color: var(--text-color);
}

.account-code {
  font-size: 0.75rem;
  color: var(--text-color-secondary);
  font-family: monospace;
}

.value-cell {
  text-align: right;
  width: 100%;
  position: relative;
  cursor: pointer;
  transition: all 0.2s ease;
  border-radius: 4px;
  padding: 4px 8px;
  margin: -4px -8px;
}

.value-cell:hover {
  background: var(--surface-hover);
}

.value-cell.cell-base-selected {
  background: var(--blue-100);
  border: 2px solid var(--blue-500);
  box-shadow: 0 0 0 2px var(--blue-200);
}

.value-cell.cell-has-comparison {
  background: var(--green-50);
  border-left: 3px solid var(--green-500);
}

.value-cell.cell-selectable {
  background: var(--yellow-50);
  border: 1px dashed var(--yellow-400);
}

.value-cell.cell-selectable:hover {
  background: var(--yellow-100);
  border-color: var(--yellow-500);
}

.value-cell.cell-hovered {
  background: var(--surface-hover);
  transform: scale(1.02);
}

.financial-value {
  font-weight: 500;
  color: var(--text-color);
  font-family: monospace;
}

.financial-value.pnl-value {
  font-weight: 700;
}

.value-column {
  min-width: 120px;
  text-align: right;
}

.entity-header {
  text-align: center;
  width: 100%;
  position: relative;
  transition: all 0.2s ease;
  border-radius: 4px;
  padding: 8px;
  margin: -8px;
}

.entity-header.column-clickable {
  cursor: pointer;
}

.entity-header.column-clickable:hover {
  background: var(--surface-hover);
  transform: translateY(-1px);
}

.entity-header.column-selectable {
  background: var(--blue-50);
  border: 1px dashed var(--blue-400);
}

.entity-header.column-selectable:hover {
  background: var(--blue-100);
  border-color: var(--blue-500);
}

.entity-name {
  font-weight: 600;
  font-size: 0.875rem;
}

.entity-year {
  font-size: 0.75rem;
  color: var(--text-color-secondary);
  font-weight: 400;
}

.controls {
  padding: 1rem 0;
  border-bottom: 1px solid var(--surface-border);
}

.control-item {
  white-space: nowrap;
}

.control-label {
  cursor: pointer;
  user-select: none;
}

/* Comparison-specific styles */
.comparison-indicator {
  position: absolute;
  top: -8px;
  right: -8px;
  z-index: 10;
}

.comparison-badge {
  background: var(--green-600);
  color: white;
  font-size: 0.7rem;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 12px;
  white-space: nowrap;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.comparison-badge.negative {
  background: var(--red-600);
}

.comparison-badge.neutral {
  background: var(--gray-600);
}

.selection-indicator {
  position: absolute;
  top: -4px;
  right: -4px;
  color: var(--blue-600);
  font-size: 0.8rem;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.7;
    transform: scale(1.1);
  }
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .value-cell {
    padding: 2px 4px;
    margin: -2px -4px;
  }

  .entity-header {
    padding: 4px;
    margin: -4px;
  }

  .comparison-badge {
    font-size: 0.6rem;
    padding: 1px 4px;
  }
}
</style>
