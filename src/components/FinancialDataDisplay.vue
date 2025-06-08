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
              <Button text icon="pi pi-plus" label="Expand All" @click="expandAll" />
              <Button text icon="pi pi-minus" label="Collapse All" @click="collapseAll" />
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
                <Button text icon="pi pi-plus" label="Expand All" @click="expandAll" />
                <Button text icon="pi pi-minus" label="Collapse All" @click="collapseAll" />
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
              <div class="entity-header">
                <div class="entity-name">{{ getEntityDisplayName(entity) }}</div>
                <div class="entity-year">{{ entity.year }}</div>
              </div>
            </template>
            <template #body="{ node }">
              <div class="value-cell">
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
              </div>
            </template>
          </Column>
        </TreeTable>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import TreeTable from 'primevue/treetable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import ToggleButton from 'primevue/togglebutton'
import type {
  FinancialData,
  FinancialDataEntity,
  FinancialDataNode,
} from '@/types/FinancialDataStructure'
import type { MultiLanguageLabels } from '@/types/DataStructures'

// Props
interface Props {
  financialData?: FinancialData | null
  loading?: boolean
  error?: string | null
  initialExpandedAll?: boolean
  initialShowCodes?: boolean
  initialFreezeFirstColumn?: boolean
  initialShowZeroValues?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  financialData: null,
  loading: false,
  error: null,
  initialExpandedAll: false,
  initialFreezeFirstColumn: false,
  initialShowCodes: false,
  initialShowZeroValues: false,
})

// Emits
interface Emits {
  nodeSelected: [nodeCode: string, nodeData: FinancialDataNode]
  error: [error: string]
}

const emit = defineEmits<Emits>()

// Vue i18n
const { locale, t } = useI18n()

// Reactive state
const expandedKeys = ref<Record<string, boolean>>({})
const expandedAll = ref(props.initialExpandedAll)
const showCodes = ref(props.initialShowCodes)
const freezeFirstColumn = ref(props.initialFreezeFirstColumn)
const showZeroValues = ref(props.initialShowZeroValues)
const scalingEnabled = ref(true)
// Computed property to reactively track scaling changes
const scalingState = computed(() => ({
  enabled: scalingEnabled.value,
}))

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
  // Access the trigger to ensure reactivity when scaling changes
  scalingUpdateTrigger.value // eslint-disable-line @typescript-eslint/no-unused-expressions

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

// Watch for scaling factor changes in entities and trigger reactivity
watch(
  () => props.financialData?.entities,
  (newEntities, oldEntities) => {
    if (newEntities !== oldEntities) {
      // Increment trigger to force re-computation of all getValue calls
      scalingUpdateTrigger.value++
    }
  },
  () => {
    // Increment trigger to force re-computation of all getValue calls
    scalingUpdateTrigger.value++
  },
  { deep: true },
)

// Initialize component
onMounted(() => {
  if (props.financialData) {
    validateFinancialData(props.financialData)
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
</style>
