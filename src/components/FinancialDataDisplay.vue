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
              <Button
                text
                icon="pi pi-plus"
                :label="$t('financialDataDisplay.expandAll')"
                @click="expandAll"
              />
              <Button
                text
                icon="pi pi-minus"
                :label="$t('financialDataDisplay.collapseAll')"
                @click="collapseAll"
              />
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
                <Button
                  text
                  icon="pi pi-plus"
                  :label="$t('financialDataDisplay.expandAll')"
                  @click="expandAll"
                />
                <Button
                  text
                  icon="pi pi-minus"
                  :label="$t('financialDataDisplay.collapseAll')"
                  @click="collapseAll"
                />
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
            :class="{
              'column-selected': selectedColumn === entityCode,
              'column-has-comparisons': internalComparisonPairs[entityCode as string]?.length > 0,
              'column-clickable': true,
            }"
          >
            <template #header>
              <div
                class="entity-header"
                @click="handleColumnClick(entityCode as string)"
                :title="
                  selectedColumn
                    ? $t('financialDataDisplay.clickToCompareWith')
                    : $t('financialDataDisplay.clickToSelectBase')
                "
              >
                <div class="entity-name">{{ getEntityDisplayName(entity) }}</div>
                <div class="entity-year">{{ entity.year }}</div>
                <div v-if="selectedColumn === entityCode" class="selection-indicator">
                  <i class="pi pi-arrow-right"></i>
                </div>
                <div
                  v-if="getColumnComparisons(entityCode as string).length > 0"
                  class="comparison-indicators"
                >
                  <div class="comparison-list">
                    <span
                      v-for="comparison in getColumnComparisons(entityCode as string)"
                      :key="comparison.code"
                      class="comparison-entity"
                    >
                      vs {{ comparison.name }}
                    </span>
                  </div>
                </div>
              </div>
            </template>
            <template #body="{ node }">
              <div class="value-cell">
                <div class="value-content">
                  <span
                    v-if="hasValue(node.data || node, entityCode as string)"
                    class="financial-value"
                    :class="{
                      'pnl-value': (node.data?.code || node.code) === 'pnl',
                      'comparison-mode': internalComparisonPairs[entityCode as string]?.length > 0,
                      'comparison-positive':
                        internalComparisonPairs[entityCode as string]?.length > 0 &&
                        getComparisonDiff(
                          node.data || node,
                          entityCode as string,
                          internalComparisonPairs[entityCode as string][0],
                        ) > 0,
                      'comparison-negative':
                        internalComparisonPairs[entityCode as string]?.length > 0 &&
                        getComparisonDiff(
                          node.data || node,
                          entityCode as string,
                          internalComparisonPairs[entityCode as string][0],
                        ) < 0,
                      clickable:
                        internalComparisonPairs[entityCode as string]?.length === 0 ||
                        !internalComparisonPairs[entityCode as string],
                    }"
                    :aria-label="
                      $t('financialDataDisplay.accessibility.financialValue', {
                        entity: getEntityDisplayName(entity),
                      })
                    "
                    @click="handleValueClick($event, node.data || node, entityCode as string)"
                  >
                    <template v-if="internalComparisonPairs[entityCode as string]?.length > 0">
                      {{
                        formatMainCellComparison(
                          node.data || node,
                          entityCode as string,
                          internalComparisonPairs[entityCode as string][0],
                        )
                      }}
                    </template>
                    <template v-else>
                      {{ formatCurrency(getValue(node.data || node, entityCode as string)) }}
                    </template>
                  </span>
                  <span
                    v-else
                    class="no-value"
                    :aria-label="$t('financialDataDisplay.accessibility.noValue')"
                  >
                    -
                  </span>
                </div>
                <div
                  v-if="
                    internalComparisonPairs[entityCode as string]?.length > 0 &&
                    hasValue(node.data || node, entityCode as string)
                  "
                  class="comparison-tags"
                >
                  <span
                    v-for="baseColumn in internalComparisonPairs[entityCode as string]"
                    :key="baseColumn"
                    @click="
                      handleComparisonClick(
                        $event,
                        node.data || node,
                        entityCode as string,
                        baseColumn,
                      )
                    "
                    class="comparison-tag clickable"
                    :class="`tag-${getComparisonSeverity(node.data || node, entityCode as string, baseColumn)}`"
                  >
                    {{ formatCurrency(getValue(node.data || node, entityCode as string)) }}
                  </span>
                </div>
              </div>
            </template>
          </Column>
        </TreeTable>
      </div>

      <!-- Comparison Popover -->
      <Popover ref="popoverRef" class="comparison-popover">
        <template v-if="getPopoverComparisonData()">
          <div class="popover-content">
            <div class="popover-header">
              <h4>{{ getPopoverComparisonData()?.accountLabel }}</h4>
              <p class="comparison-subtitle" v-if="getPopoverComparisonData()?.baseName">
                {{ getPopoverComparisonData()?.columnName }} vs
                {{ getPopoverComparisonData()?.baseName }}
              </p>
            </div>

            <div class="comparison-section" v-if="getPopoverComparisonData()?.baseName">
              <h5>{{ $t('financialDataDisplay.comparison.directComparison') }}</h5>
              <div class="comparison-table">
                <table>
                  <thead>
                    <tr>
                      <th>{{ $t('financialDataDisplay.comparison.entity') }}</th>
                      <th>{{ $t('financialDataDisplay.comparison.value') }}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td class="entity-name">{{ getPopoverComparisonData()?.columnName }}</td>
                      <td class="value">
                        {{ formatCurrency(getPopoverComparisonData()?.columnValue || 0) }}
                      </td>
                    </tr>
                    <tr>
                      <td class="entity-name">{{ getPopoverComparisonData()?.baseName }}</td>
                      <td class="value">
                        {{ formatCurrency(getPopoverComparisonData()?.baseValue || 0) }}
                      </td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr class="difference-row">
                      <td class="label">
                        {{ $t('financialDataDisplay.comparison.absoluteDiff') }}
                      </td>
                      <td
                        class="value"
                        :class="{
                          positive: (getPopoverComparisonData()?.absoluteDiff || 0) >= 0,
                          negative: (getPopoverComparisonData()?.absoluteDiff || 0) < 0,
                        }"
                      >
                        {{ formatCurrency(getPopoverComparisonData()?.absoluteDiff || 0) }}
                      </td>
                    </tr>
                    <tr class="difference-row">
                      <td class="label">
                        {{ $t('financialDataDisplay.comparison.percentageDiff') }}
                      </td>
                      <td
                        class="value"
                        :class="{
                          positive: (getPopoverComparisonData()?.diff ?? 0) >= 0,
                          negative: (getPopoverComparisonData()?.diff ?? 0) < 0,
                        }"
                      >
                        {{ formatPercentage(getPopoverComparisonData()?.diff ?? null) }}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            <div
              class="all-values-section"
              v-if="(getPopoverComparisonData()?.allRowValues?.length ?? 0) > 0"
            >
              <h5 v-if="!getPopoverComparisonData()?.baseName">
                {{ getPopoverComparisonData()?.accountLabel }}
              </h5>
              <h5 v-else>{{ $t('financialDataDisplay.comparison.allValuesInRow') }}</h5>
              <div class="all-values-table">
                <table>
                  <thead>
                    <tr>
                      <th>{{ $t('financialDataDisplay.comparison.entity') }}</th>
                      <th>{{ $t('financialDataDisplay.comparison.value') }}</th>
                      <th>{{ $t('financialDataDisplay.comparison.difference') }}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="rowValue in getPopoverComparisonData()?.allRowValues ?? []"
                      :key="rowValue.entityCode"
                      :class="{
                        highlighted:
                          rowValue.entityCode === getPopoverComparisonData()?.columnCode ||
                          rowValue.entityCode === getPopoverComparisonData()?.baseColumnCode,
                      }"
                    >
                      <td class="entity-name">{{ rowValue.name }}</td>
                      <td class="value">{{ rowValue.formattedValue }}</td>
                      <td
                        class="value"
                        :class="{
                          positive:
                            (calculatePercentageDiff(
                              rowValue.value,
                              getPopoverComparisonData()?.columnValue ?? 0,
                            ) ?? 0) >= 0,
                          negative:
                            (calculatePercentageDiff(
                              rowValue.value,
                              getPopoverComparisonData()?.columnValue ?? 0,
                            ) ?? 0) < 0,
                        }"
                      >
                        {{
                          formatPercentage(
                            calculatePercentageDiff(
                              rowValue.value,
                              getPopoverComparisonData()?.columnValue ?? 0,
                            ),
                          )
                        }}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </template>
      </Popover>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch, withDefaults } from 'vue'
import { useI18n } from 'vue-i18n'
import TreeTable from 'primevue/treetable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import ToggleButton from 'primevue/togglebutton'
import Popover from 'primevue/popover'

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
  comparisonPairs?: Record<string, string[]>
}

const props = withDefaults(defineProps<Props>(), {
  financialData: null,
  loading: false,
  error: null,
  initialExpandedAll: false,
  initialFreezeFirstColumn: false,
  initialShowCodes: false,
  initialShowZeroValues: false,
  comparisonPairs: () => ({}),
})

// Emits
interface Emits {
  nodeSelected: [nodeCode: string, nodeData: FinancialDataNode]
  error: [error: string]
  comparisonChanged: [comparisonPairs: Record<string, string[]>]
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

// Column comparison state
const selectedColumn = ref<string | null>(null)
const internalComparisonPairs = ref<Record<string, string[]>>(props.comparisonPairs || {})

// Popover state
const popoverRef = ref<InstanceType<typeof Popover> | null>(null)
const selectedComparisonData = ref<{
  node: FinancialDataNode
  columnCode: string
  baseColumnCode: string
} | null>(null)

// Watch for prop changes and emit comparison changes
watch(
  () => props.comparisonPairs,
  (newComparisonPairs) => {
    if (newComparisonPairs) {
      internalComparisonPairs.value = { ...newComparisonPairs }
    }
  },
  { deep: true, immediate: true },
)

// Watch internal comparison pairs and emit changes
watch(
  internalComparisonPairs,
  (newComparisonPairs) => {
    emit('comparisonChanged', { ...newComparisonPairs })
  },
  { deep: true },
)

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

// Get comparison info for headers
const getColumnComparisons = (entityCode: string) => {
  const comparisons = internalComparisonPairs.value[entityCode]
  if (!comparisons?.length || !props.financialData?.entities) return []

  return comparisons.map((baseCode) => {
    const baseEntity = props.financialData!.entities.get(baseCode)
    return {
      code: baseCode,
      entity: baseEntity,
      name: baseEntity ? getEntityDisplayName(baseEntity) : baseCode,
    }
  })
}

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

const formatPercentage = (value: number | null): string => {
  if (value === null || isNaN(value)) return '-'
  const sign = value > 0 ? '+' : ''
  return `${sign}${value.toFixed(1)}%`
}

// Format comparison tag
// Get comparison difference for styling
const getComparisonDiff = (
  node: FinancialDataNode,
  columnCode: string,
  baseColumnCode: string,
): number => {
  try {
    if (!hasValue(node, columnCode) || !hasValue(node, baseColumnCode)) {
      return 0
    }

    const columnValue = getValue(node, columnCode)
    const baseValue = getValue(node, baseColumnCode)
    const diff = calculatePercentageDiff(columnValue, baseValue)

    return diff ?? 0
  } catch (error) {
    console.error('Error in getComparisonDiff:', error)
    return 0
  }
}

// Format percentage for main cell when in comparison mode
const formatMainCellComparison = (
  node: FinancialDataNode,
  columnCode: string,
  baseColumnCode: string,
): string => {
  try {
    if (!hasValue(node, columnCode) || !hasValue(node, baseColumnCode)) {
      return '-'
    }

    const columnValue = getValue(node, columnCode)
    const baseValue = getValue(node, baseColumnCode)
    const diff = calculatePercentageDiff(columnValue, baseValue)

    return formatPercentage(diff)
  } catch (error) {
    console.error('Error in formatMainCellComparison:', error)
    return '-'
  }
}

// Get comparison severity for tag color
const getComparisonSeverity = (
  node: FinancialDataNode,
  columnCode: string,
  baseColumnCode: string,
): 'success' | 'danger' | 'secondary' => {
  try {
    if (!hasValue(node, columnCode) || !hasValue(node, baseColumnCode)) return 'secondary'

    const columnValue = getValue(node, columnCode)
    const baseValue = getValue(node, baseColumnCode)
    const diff = calculatePercentageDiff(columnValue, baseValue)

    if (diff === null || diff === 0) return 'secondary'

    // For negative values (expenses), interpret differently:
    // If both values are negative (expenses), a more negative value is worse (red)
    // If both values are positive (revenue), a higher value is better (green)
    if (baseValue < 0 && columnValue < 0) {
      // Both are expenses/negative values
      // Less negative (closer to 0) is better
      return columnValue > baseValue ? 'success' : 'danger'
    } else {
      // Normal case: higher is better
      return diff > 0 ? 'success' : 'danger'
    }
  } catch (error) {
    console.error('Error in getComparisonSeverity:', error)
    return 'secondary'
  }
}

// Handle comparison tag click to show popover
const handleComparisonClick = (
  event: Event,
  node: FinancialDataNode,
  columnCode: string,
  baseColumnCode: string,
) => {
  event.stopPropagation()
  selectedComparisonData.value = { node, columnCode, baseColumnCode }
  if (popoverRef.value) {
    popoverRef.value.toggle(event)
  }
}

// Handle value click to show all values popover
const handleValueClick = (event: Event, node: FinancialDataNode, columnCode: string) => {
  event.stopPropagation()
  // Only show popover if no comparison is active for this column
  if (
    !internalComparisonPairs.value[columnCode] ||
    internalComparisonPairs.value[columnCode].length === 0
  ) {
    selectedComparisonData.value = { node, columnCode, baseColumnCode: '' }
    if (popoverRef.value) {
      popoverRef.value.toggle(event)
    }
  }
}

// Get all column values for the same row
const getAllRowValues = (node: FinancialDataNode) => {
  if (!props.financialData?.entities) return []

  const values = []
  for (const [entityCode, entity] of props.financialData.entities) {
    if (hasValue(node, entityCode)) {
      values.push({
        entityCode,
        entity,
        name: getEntityDisplayName(entity),
        value: getValue(node, entityCode),
        formattedValue: formatCurrency(getValue(node, entityCode)),
      })
    }
  }

  return values
}

// Get comparison data for popover
const getPopoverComparisonData = () => {
  if (!selectedComparisonData.value) return null

  const { node, columnCode, baseColumnCode } = selectedComparisonData.value

  if (!hasValue(node, columnCode) || !props.financialData?.entities) {
    return null
  }

  const columnEntity = props.financialData.entities.get(columnCode)
  if (!columnEntity) return null

  // Handle case with no comparison (just showing all values)
  if (!baseColumnCode) {
    return {
      columnName: getEntityDisplayName(columnEntity),
      columnValue: getValue(node, columnCode),
      columnCode,
      baseName: null,
      baseValue: null,
      baseColumnCode: null,
      diff: null,
      absoluteDiff: null,
      accountLabel: getNodeLabel(node),
      allRowValues: getAllRowValues(node),
    }
  }

  // Handle comparison case
  if (!hasValue(node, baseColumnCode)) return null

  const baseEntity = props.financialData.entities.get(baseColumnCode)
  if (!baseEntity) return null

  const columnValue = getValue(node, columnCode)
  const baseValue = getValue(node, baseColumnCode)
  const diff = calculatePercentageDiff(columnValue, baseValue)
  const absoluteDiff = columnValue - baseValue

  return {
    columnName: getEntityDisplayName(columnEntity),
    columnValue,
    columnCode,
    baseName: getEntityDisplayName(baseEntity),
    baseValue,
    baseColumnCode,
    diff,
    absoluteDiff,
    accountLabel: getNodeLabel(node),
    allRowValues: getAllRowValues(node),
  }
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

// Column selection handler
const handleColumnClick = (entityCode: string) => {
  if (selectedColumn.value === null) {
    // First click - select base column
    selectedColumn.value = entityCode
  } else if (selectedColumn.value === entityCode) {
    // Clicking the same column - deselect
    selectedColumn.value = null
  } else {
    // Second click - create comparison pair
    const baseColumn = selectedColumn.value
    const compareColumn = entityCode

    // Add comparison to the compare column
    if (!internalComparisonPairs.value[compareColumn]) {
      internalComparisonPairs.value[compareColumn] = []
    }

    const comparisons = internalComparisonPairs.value[compareColumn]
    const existingIndex = comparisons.indexOf(baseColumn)

    // Toggle the comparison
    if (existingIndex > -1) {
      comparisons.splice(existingIndex, 1)
      if (comparisons.length === 0) {
        delete internalComparisonPairs.value[compareColumn]
      }
    } else {
      comparisons.push(baseColumn)
    }

    // Reset selection
    selectedColumn.value = null
  }
}

// Calculate percentage difference
const calculatePercentageDiff = (value1: number, value2: number): number | null => {
  if (value2 === 0) return null
  return ((value1 - value2) / value2) * 100
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
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.value-content {
  display: flex;
  justify-content: flex-end;
}

.comparison-tags {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 0.25rem;
}

.comparison-tag {
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
  border-radius: 0.375rem;
  font-weight: 600;
  background-color: var(--color-surface-200);
  color: var(--text-color);
  transition: all 0.2s ease;
}

.comparison-tag.clickable {
  cursor: pointer;
}

.comparison-tag.clickable:hover {
  transform: scale(1.05);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.comparison-tag.tag-secondary {
  background-color: var(--color-surface-100);
  color: var(--text-color-secondary);
  border: 1px solid var(--color-surface-300);
}

.financial-value {
  font-weight: 500;
  color: var(--text-color);
  font-family: monospace;
}

.financial-value.pnl-value {
  font-weight: 700;
}

.financial-value.comparison-mode {
  font-weight: 600;
  font-size: 0.95em;
}

.financial-value.comparison-positive {
  color: var(--color-green-700);
}

.financial-value.comparison-negative {
  color: var(--color-red-700);
}

.financial-value.clickable {
  cursor: pointer;
  transition: opacity 0.2s;
}

.financial-value.clickable:hover {
  opacity: 0.8;
  text-decoration: underline;
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
  white-space: break-spaces;
}

.entity-year {
  font-size: 0.75rem;
  color: var(--text-color-secondary);
  font-weight: 400;
}

.comparison-indicators {
  margin-top: 0.25rem;
  padding-top: 0.25rem;
  border-top: 1px solid var(--color-surface-300);
}

.comparison-info {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.625rem;
  color: var(--color-primary-600);
  margin-bottom: 0.125rem;
}

.comparison-count {
  font-weight: 600;
}

.comparison-list {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.comparison-entity {
  font-size: 0.625rem;
  color: var(--text-color-secondary);
  font-weight: 500;
  white-space: wrap;
}

/* Popover styling */
.comparison-popover {
  max-width: 600px;
  min-width: 400px;
}

.popover-content {
  padding: 1rem;
}

.popover-header h4 {
  margin: 0 0 0.25rem 0;
  color: var(--text-color);
  font-size: 1rem;
  font-weight: 600;
}

.comparison-subtitle {
  margin: 0 0 1rem 0;
  color: var(--text-color-secondary);
  font-size: 0.875rem;
}

.comparison-section,
.all-values-section {
  margin-bottom: 1.5rem;
}

.comparison-section:last-child,
.all-values-section:last-child {
  margin-bottom: 0;
}

.comparison-section h5,
.all-values-section h5 {
  margin: 0 0 0.75rem 0;
  color: var(--text-color);
  font-size: 0.875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.comparison-table table,
.all-values-table table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
  background: white;
  border-radius: 0.375rem;
  overflow: hidden;
  border: 1px solid var(--color-surface-200);
}

.comparison-table th,
.comparison-table td,
.all-values-table th,
.all-values-table td {
  padding: 0.5rem 0.75rem;
  text-align: left;
  border-bottom: 1px solid var(--color-surface-200);
}

.comparison-table th,
.all-values-table th {
  background-color: var(--color-surface-50);
  font-weight: 600;
  color: var(--text-color);
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.comparison-table .entity-name,
.all-values-table .entity-name {
  font-weight: 500;
  color: var(--text-color);
}

.comparison-table .value,
.all-values-table .value {
  font-family: monospace;
  font-weight: 600;
  text-align: right;
}

.comparison-table .difference-row {
  background-color: var(--color-surface-50);
}

.comparison-table .difference-row .label {
  font-weight: 600;
  color: var(--text-color-secondary);
}

.comparison-table .value.positive,
.all-values-table .value.positive {
  color: var(--color-green-700);
}

.comparison-table .value.negative,
.all-values-table .value.negative {
  color: var(--color-red-700);
}

.comparison-table tfoot tr:last-child td,
.all-values-table tbody tr:last-child td {
  border-bottom: none;
}

.all-values-table .highlighted {
  background-color: var(--color-primary-50);
  font-weight: 600;
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

/* Column selection styles */
.column-clickable .entity-header {
  cursor: pointer;
  transition: background-color 0.2s;
}

.column-clickable .entity-header:hover {
  background-color: var(--surface-hover);
}

.column-selected {
  background-color: var(--color-primary-100) !important;
  border: 2px solid var(--color-primary-500);
}

.column-has-comparisons {
  background-color: var(--color-surface-50);
}

.column-selected .entity-header {
  position: relative;
}

.selection-indicator {
  color: var(--color-primary-500);
  font-size: 0.875rem;
  margin-top: 0.25rem;
}

/* Comparison display styles */
.comparison-display {
  background-color: var(--color-surface-50);
  border: 1px solid var(--surface-border);
  border-radius: var(--content-border-radius);
  padding: 1rem;
  margin-bottom: 1rem;
}

.comparison-header h3 {
  margin: 0 0 0.5rem 0;
  color: var(--text-color);
  font-size: 1.125rem;
}

.comparison-subtitle {
  color: var(--text-color-secondary);
  font-size: 0.875rem;
  margin: 0;
}

/* Comparison column styles */
.comparison-column {
  min-width: 100px;
  text-align: right;
}

.comparison-cell {
  text-align: right;
  width: 100%;
}

.comparison-value {
  font-weight: 600;
  font-family: monospace;
}

.positive {
  color: var(--color-success-fg);
}

.negative {
  color: var(--color-danger-fg);
}
</style>
