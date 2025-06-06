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
        <h3 class="section-title">{{ $t('financialDataDisplay.financialData') }}</h3>
        <TreeTable
          :value="combinedFinancialData"
          :expandedKeys="expandedKeys"
          @node-expand="onNodeExpand"
          @node-collapse="onNodeCollapse"
          class="financial-tree-table"
          :scrollable="false"
          :resizableColumns="true"
          columnResizeMode="expand"
          showGridlines
        >
          <!-- Account column -->
          <Column
            field="label"
            :header="$t('financialDataDisplay.columns.account')"
            :expander="true"
            class="account-column"
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

      <!-- Controls -->
      <div class="controls mb-6">
        <div class="card flex flex-col gap-4 w-full">
          <div class="font-semibold text-lg">{{ $t('financialDataDisplay.controls.title') }}</div>
          <div class="flex flex-col gap-4">
            <!-- Expand All toggle -->
            <div class="flex flex-wrap gap-2 w-full">
              <div class="control-item flex items-center gap-3 w-full">
                <ToggleSwitch
                  v-model="expandedAll"
                  @change="toggleExpandAll"
                  :aria-label="
                    expandedAll
                      ? $t('financialDataDisplay.collapseAll')
                      : $t('financialDataDisplay.expandAll')
                  "
                />
                <label class="control-label text-sm font-medium flex items-center">
                  <i class="pi pi-sitemap mr-2"></i>
                  {{
                    expandedAll
                      ? $t('financialDataDisplay.collapseAll')
                      : $t('financialDataDisplay.expandAll')
                  }}
                </label>
              </div>
            </div>

            <!-- Show Codes toggle -->
            <div class="flex flex-wrap gap-2 w-full">
              <div class="control-item flex items-center gap-3 w-full">
                <ToggleSwitch
                  v-model="showCodes"
                  @change="toggleShowCodes"
                  :aria-label="
                    showCodes
                      ? $t('financialDataDisplay.hideCodes')
                      : $t('financialDataDisplay.showCodes')
                  "
                />
                <label class="control-label text-sm font-medium flex items-center">
                  <i class="pi pi-code mr-2"></i>
                  {{
                    showCodes
                      ? $t('financialDataDisplay.hideCodes')
                      : $t('financialDataDisplay.showCodes')
                  }}
                </label>
              </div>
            </div>

            <!-- Show Zero Values toggle -->
            <div class="flex flex-wrap gap-2 w-full">
              <div class="control-item flex items-center gap-3 w-full">
                <ToggleSwitch
                  v-model="showZeroValues"
                  @change="toggleShowZeroValues"
                  :aria-label="
                    showZeroValues
                      ? $t('financialDataDisplay.hideZeroValues')
                      : $t('financialDataDisplay.showZeroValues')
                  "
                />
                <label class="control-label text-sm font-medium flex items-center">
                  <i class="pi pi-eye mr-2"></i>
                  {{
                    showZeroValues
                      ? $t('financialDataDisplay.hideZeroValues')
                      : $t('financialDataDisplay.showZeroValues')
                  }}
                </label>
              </div>
            </div>

            <!-- Scaling toggle - only visible when scaling factors exist -->
            <div v-if="hasScalingFactors" class="flex flex-wrap gap-2 w-full">
              <div class="control-item flex items-center gap-3 w-full">
                <ToggleSwitch
                  v-model="scalingEnabled"
                  @change="toggleScaling"
                  :aria-label="$t('financialDataDisplay.accessibility.scalingToggle')"
                />
                <label class="control-label text-sm font-medium flex items-center">
                  <i class="pi pi-calculator mr-2"></i>
                  {{
                    scalingEnabled
                      ? $t('financialDataDisplay.scalingEnabled')
                      : $t('financialDataDisplay.scalingDisabled')
                  }}
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Scaling Information Section -->
      <div v-if="hasScalingFactors" class="scaling-info-section mt-6">
        <Button
          @click="toggleScalingInfo"
          :aria-expanded="scalingInfoExpanded"
          :aria-controls="'scaling-info-content'"
          class="scaling-info-toggle w-full justify-between"
          severity="secondary"
          outlined
        >
          <span>{{ $t('financialDataDisplay.scalingInfo.title') }}</span>
          <i :class="scalingInfoExpanded ? 'pi pi-chevron-up' : 'pi pi-chevron-down'"></i>
        </Button>

        <div
          v-if="scalingInfoExpanded"
          id="scaling-info-content"
          class="scaling-info-content mt-4 p-4 bg-surface-50 dark:bg-surface-800 rounded-lg"
        >
          <div class="card flex flex-col gap-4 w-full">
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div
                v-for="[entityCode, entity] in entityColumns"
                :key="entityCode"
                class="entity-scaling-info"
              >
                <div class="entity-name font-medium mb-1">{{ getEntityDisplayName(entity) }}</div>
                <div class="entity-year text-sm text-surface-600 dark:text-surface-300 mb-1">
                  {{ $t('financialDataDisplay.yearInfo', { year: entity.year }) }}
                </div>
                <div
                  v-if="entity.scalingFactor !== undefined"
                  class="entity-scaling text-sm text-surface-600 dark:text-surface-300"
                >
                  {{
                    $t('financialDataDisplay.scalingFactor', {
                      factor: entity.scalingFactor.toLocaleString(),
                    })
                  }}
                </div>
                <div v-else class="no-scaling text-sm text-surface-500 dark:text-surface-400">
                  {{ $t('financialDataDisplay.noScalingFactor') }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import TreeTable from 'primevue/treetable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import ToggleSwitch from 'primevue/toggleswitch'
import type {
  FinancialData,
  FinancialDataNode,
  FinancialDataEntity,
} from '@/types/FinancialDataStructure'
import type { MultiLanguageLabels } from '@/types/DataStructures'

// Props
interface Props {
  financialData?: FinancialData | null
  loading?: boolean
  error?: string | null
  initialExpandedAll?: boolean
  initialShowCodes?: boolean
  initialShowZeroValues?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  financialData: null,
  loading: false,
  error: null,
  initialExpandedAll: false,
  initialShowCodes: true,
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
const showZeroValues = ref(props.initialShowZeroValues)
const scalingEnabled = ref(true)
const scalingInfoExpanded = ref(false)

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

// Check if any entity has a scaling factor
const hasScalingFactors = computed(() => {
  if (!props.financialData?.entities) return false
  for (const [, entity] of props.financialData.entities) {
    if (entity.scalingFactor !== undefined) {
      return true
    }
  }
  return false
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
  const pnlNode: FinancialDataNode = {
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

  return pnlNode
}

const transformNodeToTreeTableData = (node: FinancialDataNode): TreeTableNode[] => {
  const transformNode = (n: FinancialDataNode, parentKey = ''): TreeTableNode | null => {
    const key = parentKey ? `${parentKey}-${n.code}` : n.code
    const hasVisibleValues = showZeroValues.value || hasAnyNonZeroValue(n)

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

const toggleExpandAll = () => {
  expandedAll.value = !expandedAll.value

  if (expandedAll.value) {
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
  } else {
    // Collapse all nodes
    expandedKeys.value = {}
  }
}

const toggleShowCodes = () => {
  showCodes.value = !showCodes.value
}

const toggleShowZeroValues = () => {
  showZeroValues.value = !showZeroValues.value
}

const toggleScaling = () => {
  scalingEnabled.value = !scalingEnabled.value
}

const toggleScalingInfo = () => {
  scalingInfoExpanded.value = !scalingInfoExpanded.value
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
