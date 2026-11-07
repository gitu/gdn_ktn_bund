<template>
  <div class="financial-data-display">
    <!-- Header with title -->
    <div class="header">
      <h2 class="title">{{ $t('financialDataDisplay.title') }}</h2>
    </div>

    <!-- Error state -->
    <div v-if="error" class="error-message" role="alert">
      <i class="pi pi-exclamation-triangle"></i>
      <span>{{ error }}</span>
    </div>

    <!-- Loading state: skeleton rows that mimic the table -->
    <div
      v-else-if="loading"
      class="loading-message"
      role="status"
      :aria-label="$t('financialDataDisplay.loading')"
    >
      <span class="sr-only">{{ $t('financialDataDisplay.loading') }}</span>
      <div class="skeleton-table" aria-hidden="true">
        <div class="skeleton-row skeleton-head">
          <Skeleton height="0.875rem" width="3.5rem" />
          <Skeleton
            v-for="n in 3"
            :key="`h${n}`"
            class="skeleton-end"
            width="70%"
            height="0.875rem"
          />
        </div>
        <div v-for="(labelWidth, row) in skeletonLabelWidths" :key="row" class="skeleton-row">
          <Skeleton height="1rem" :width="labelWidth" />
          <Skeleton v-for="n in 3" :key="`v${n}`" class="skeleton-end" width="80%" height="1rem" />
        </div>
      </div>
    </div>

    <!-- No data state -->
    <div v-else-if="!hasValidData" class="no-data-message">
      <i class="pi pi-info-circle"></i>
      <span>{{ $t('financialDataDisplay.noData') }}</span>
    </div>

    <!-- Main content -->
    <div v-else class="content">
      <!-- Combined Financial Data Section -->
      <div v-if="combinedFinancialData.length > 0" class="section table-frame">
        <!-- One compact toolbar: icon buttons on phones, icons + text from md up -->
        <div
          class="table-toolbar"
          role="toolbar"
          :aria-label="$t('financialDataDisplay.controls.title')"
        >
          <div class="toolbar-group">
            <ToggleButton
              :modelValue="freezeFirstColumn"
              @update:modelValue="onFreezeFirstColumnToggle"
              class="toolbar-btn"
              size="small"
              onIcon="pi pi-lock"
              offIcon="pi pi-lock-open"
              :aria-label="
                freezeFirstColumn
                  ? $t('financialDataDisplay.firstColumnFreezed')
                  : $t('financialDataDisplay.freezeFirstColumn')
              "
              :title="
                freezeFirstColumn
                  ? $t('financialDataDisplay.firstColumnFreezed')
                  : $t('financialDataDisplay.freezeFirstColumn')
              "
              :onLabel="$t('financialDataDisplay.firstColumnFreezed')"
              :offLabel="$t('financialDataDisplay.freezeFirstColumn')"
            />
            <ToggleButton
              v-model="showCodes"
              class="toolbar-btn"
              size="small"
              onIcon="pi pi-hashtag"
              offIcon="pi pi-hashtag"
              :aria-label="
                showCodes
                  ? $t('financialDataDisplay.codesShown')
                  : $t('financialDataDisplay.showCodes')
              "
              :title="
                showCodes
                  ? $t('financialDataDisplay.codesShown')
                  : $t('financialDataDisplay.showCodes')
              "
              :onLabel="$t('financialDataDisplay.codesShown')"
              :offLabel="$t('financialDataDisplay.showCodes')"
            />
          </div>
          <div class="toolbar-group toolbar-group-end">
            <Button
              text
              severity="secondary"
              size="small"
              class="toolbar-btn"
              icon="pi pi-plus"
              :label="$t('financialDataDisplay.expandAll')"
              :aria-label="$t('financialDataDisplay.expandAll')"
              :title="$t('financialDataDisplay.expandAll')"
              @click="expandAll"
            />
            <Button
              text
              severity="secondary"
              size="small"
              class="toolbar-btn"
              icon="pi pi-minus"
              :label="$t('financialDataDisplay.collapseAll')"
              :aria-label="$t('financialDataDisplay.collapseAll')"
              :title="$t('financialDataDisplay.collapseAll')"
              @click="collapseAll"
            />
          </div>
        </div>

        <!-- Visible hint for the column comparison (no hover-only affordance on touch devices) -->
        <div
          class="compare-hint"
          :class="{ 'is-active': selectedColumn !== null }"
          role="status"
          aria-live="polite"
          data-testid="compare-hint"
        >
          <i
            :class="selectedColumn ? 'pi pi-arrow-right-arrow-left' : 'pi pi-info-circle'"
            aria-hidden="true"
          ></i>
          <template v-if="selectedColumn">
            <span class="hint-chip">{{ selectedColumnLabel }}</span>
            <span class="hint-text">{{ $t('financialDataDisplay.clickToCompareWith') }}</span>
            <Button
              text
              rounded
              severity="secondary"
              size="small"
              class="hint-clear"
              icon="pi pi-times"
              :aria-label="$t('common.clear')"
              :title="$t('common.clear')"
              @click="clearSelectedColumn"
            />
          </template>
          <span v-else class="hint-text">{{ $t('financialDataDisplay.clickToSelectBase') }}</span>
        </div>

        <TreeTable
          :value="combinedFinancialData"
          :expandedKeys="expandedKeys"
          @node-expand="onNodeExpand"
          @node-collapse="onNodeCollapse"
          class="financial-tree-table"
          :class="{ 'is-frozen': freezeFirstColumn }"
          :resizableColumns="!isPhone"
          columnResizeMode="expand"
          :indentation="isPhone ? 0.5 : 1"
          scrollable
          data-testid="tree-table"
        >
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
                role="button"
                tabindex="0"
                :aria-pressed="selectedColumn === entityCode"
                @click="handleColumnClick(entityCode as string)"
                @keydown.enter.prevent="handleColumnClick(entityCode as string)"
                @keydown.space.prevent="handleColumnClick(entityCode as string)"
                :title="
                  selectedColumn
                    ? $t('financialDataDisplay.clickToCompareWith')
                    : $t('financialDataDisplay.clickToSelectBase')
                "
              >
                <div class="entity-name">
                  <i
                    v-if="selectedColumn === entityCode"
                    class="selection-indicator pi pi-check-circle"
                    aria-hidden="true"
                  ></i>
                  {{ getEntityDisplayName(entity) }}
                </div>
                <div class="entity-year">{{ entity.year }}</div>
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
import { computed, onBeforeUnmount, onMounted, ref, watch, withDefaults } from 'vue'
import { useI18n } from 'vue-i18n'
import TreeTable from 'primevue/treetable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import ToggleButton from 'primevue/togglebutton'
import Popover from 'primevue/popover'
import Skeleton from 'primevue/skeleton'

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

// Phone layout (< md, 768px): compact table, icon-only toolbar and a frozen account column by default
const PHONE_MEDIA_QUERY = '(max-width: 767.98px)'
const phoneQuery =
  typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia(PHONE_MEDIA_QUERY)
    : null
const isPhone = ref(phoneQuery?.matches ?? false)
const onPhoneQueryChange = (event: MediaQueryListEvent) => {
  isPhone.value = event.matches
}

// Reactive state
const expandedKeys = ref<Record<string, boolean>>({})
const expandedAll = ref(props.initialExpandedAll)
const showCodes = ref(props.initialShowCodes)
// Desktop default is unchanged (not frozen); on phones the account column is frozen by default
const freezeFirstColumn = ref(props.initialFreezeFirstColumn || isPhone.value)
let freezeChosenByUser = false
const showZeroValues = ref(props.initialShowZeroValues)
const scalingEnabled = ref(true)

// Follow the viewport (rotation, resize) as long as the user has not chosen explicitly
watch(isPhone, (phone) => {
  if (!freezeChosenByUser) {
    freezeFirstColumn.value = props.initialFreezeFirstColumn || phone
  }
})

const onFreezeFirstColumnToggle = (value: boolean) => {
  freezeChosenByUser = true
  freezeFirstColumn.value = value
}

// Widths of the account placeholders in the loading skeleton
const skeletonLabelWidths = ['46%', '38%', '52%', '34%', '44%', '40%']

// Column comparison state
const selectedColumn = ref<string | null>(null)
const internalComparisonPairs = ref<Record<string, string[]>>(props.comparisonPairs || {})
const isInternalUpdate = ref(false)

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
    if (newComparisonPairs && !isInternalUpdate.value) {
      internalComparisonPairs.value = { ...newComparisonPairs }
    }
  },
  { deep: true, immediate: true },
)

// Watch internal comparison pairs and emit changes
watch(
  internalComparisonPairs,
  (newComparisonPairs) => {
    isInternalUpdate.value = true
    emit('comparisonChanged', { ...newComparisonPairs })
    // Reset the flag after a microtask to allow the parent to update
    Promise.resolve().then(() => {
      isInternalUpdate.value = false
    })
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

// Memoization cache for tree transformations
const treeTransformCache = new Map<string, TreeTableNode[]>()
const nonZeroValueCache = new Map<string, boolean>()

const transformNodeToTreeTableData = (node: FinancialDataNode): TreeTableNode[] => {
  // Create cache key based on node properties and current settings
  const cacheKey = `${node.code}-${showZeroValues.value}-${scalingEnabled.value}-${locale.value}`

  // Check cache first
  if (treeTransformCache.has(cacheKey)) {
    return treeTransformCache.get(cacheKey)!
  }

  const transformNode = (n: FinancialDataNode, parentKey = ''): TreeTableNode | null => {
    const key = parentKey ? `${parentKey}-${n.code}` : n.code
    const hasVisibleValues = showZeroValues.value ? true : hasAnyNonZeroValueMemoized(n)

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
  const result = rootNode ? [rootNode] : []

  // Cache the result
  treeTransformCache.set(cacheKey, result)

  return result
}

const hasAnyNonZeroValueMemoized = (node: FinancialDataNode): boolean => {
  const cacheKey = node.code

  // Check cache first
  if (nonZeroValueCache.has(cacheKey)) {
    return nonZeroValueCache.get(cacheKey)!
  }

  // Check if this node has any non-zero values
  for (const [, value] of node.values) {
    if (value.value !== 0) {
      nonZeroValueCache.set(cacheKey, true)
      return true
    }
  }

  // Check children recursively
  const hasNonZeroChildren = node.children.some((child) => hasAnyNonZeroValueMemoized(child))

  // Cache the result
  nonZeroValueCache.set(cacheKey, hasNonZeroChildren)

  return hasNonZeroChildren
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

    // Create a new object to avoid direct mutation issues
    const newComparisonPairs = { ...internalComparisonPairs.value }

    // Initialize array if it doesn't exist
    if (!newComparisonPairs[compareColumn]) {
      newComparisonPairs[compareColumn] = []
    }

    const comparisons = [...newComparisonPairs[compareColumn]]
    const existingIndex = comparisons.indexOf(baseColumn)

    // Toggle the comparison
    if (existingIndex > -1) {
      comparisons.splice(existingIndex, 1)
      if (comparisons.length === 0) {
        delete newComparisonPairs[compareColumn]
      } else {
        newComparisonPairs[compareColumn] = comparisons
      }
    } else {
      comparisons.push(baseColumn)
      newComparisonPairs[compareColumn] = comparisons
    }

    // Update the reactive reference with the new object
    internalComparisonPairs.value = newComparisonPairs

    // Reset selection
    selectedColumn.value = null
  }
}

const clearSelectedColumn = () => {
  selectedColumn.value = null
}

// Label of the selected base column for the hint line ("Zürich 2022")
const selectedColumnLabel = computed(() => {
  if (!selectedColumn.value) return ''
  const entity = props.financialData?.entities?.get(selectedColumn.value)
  return entity ? `${getEntityDisplayName(entity)} ${entity.year}` : selectedColumn.value
})

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
    // Clear caches when financial data changes
    treeTransformCache.clear()
    nonZeroValueCache.clear()

    if (newData) {
      validateFinancialData(newData)
    }
  },
  { immediate: true },
)

// Watch for settings changes that affect cached data
watch([showZeroValues, scalingEnabled, locale], () => {
  // Clear caches when display settings change
  treeTransformCache.clear()
  nonZeroValueCache.clear()
})

// Initialize component
onMounted(() => {
  phoneQuery?.addEventListener('change', onPhoneQueryChange)
  if (props.financialData) {
    validateFinancialData(props.financialData)
  }
})

onBeforeUnmount(() => {
  phoneQuery?.removeEventListener('change', onPhoneQueryChange)
})
</script>

<style scoped>
.financial-data-display {
  --edge-shadow: rgb(15 23 42 / 0.16);
  --row-hover: color-mix(in srgb, var(--gk-accent) 7%, var(--gk-surface));
  --selected-tint: color-mix(in srgb, var(--gk-accent) 12%, var(--gk-surface));
  --cell-pad-x: 0.875rem;
  --cell-pad-y: 0.625rem;
  --value-col-width: 9.5rem;
  --value-col-min: 7.5rem;
  --account-col-min: 15rem;
  min-width: 0;
  max-width: 100%;
}

:global(:root[class*='app-dark']) .financial-data-display {
  --edge-shadow: rgb(0 0 0 / 0.6);
}

@media (max-width: 767.98px) {
  .financial-data-display {
    --cell-pad-x: 0.5rem;
    --cell-pad-y: 0.5rem;
    --value-col-width: 7rem;
    --value-col-min: 6.5rem;
    --account-col-min: clamp(10rem, 42vw, 13rem);
  }
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* Title */
.header {
  margin-bottom: 0.75rem;
}

.title {
  margin: 0;
  font-size: clamp(1.125rem, 1rem + 0.6vw, 1.5rem);
  font-weight: 650;
  letter-spacing: -0.01em;
  color: var(--gk-ink);
}

/* Frame around toolbar, hint and table: one rounded container with a hairline border */
.table-frame,
.loading-message {
  border: 1px solid var(--gk-border);
  border-radius: var(--radius-lg);
  background: var(--gk-surface);
  box-shadow: var(--gk-shadow-1);
  overflow: hidden;
}

.error-message,
.no-data-message {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 1rem;
  border: 1px solid var(--gk-border);
  border-radius: var(--radius-md);
  background: var(--gk-surface);
  color: var(--gk-ink);
}

.error-message {
  border-color: color-mix(in srgb, var(--gk-negative) 40%, transparent);
  color: var(--gk-negative);
}

/* Loading skeleton */
.loading-message {
  padding: 0.25rem var(--cell-pad-x) 0.5rem;
}

.skeleton-row {
  display: grid;
  grid-template-columns: minmax(6rem, 1.8fr) repeat(3, minmax(3.5rem, 1fr));
  align-items: center;
  gap: 0.75rem;
  padding: 0.9rem 0;
  border-bottom: 1px solid var(--gk-border);
}

.skeleton-row:last-child {
  border-bottom: 0;
}

.skeleton-head {
  padding-block: 0.75rem;
  border-bottom-color: var(--gk-border-strong);
}

.skeleton-end {
  margin-inline-start: auto;
}

/* Toolbar: icon buttons on phones, icons + text from md up */
.table-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: var(--gk-surface-2);
  border-bottom: 1px solid var(--gk-border);
}

.toolbar-group {
  display: flex;
  align-items: center;
  gap: 0.375rem;
}

.toolbar-group-end {
  margin-inline-start: auto;
}

.toolbar-btn.p-togglebutton {
  --p-togglebutton-background: var(--gk-surface);
  --p-togglebutton-border-color: var(--gk-border-strong);
  --p-togglebutton-color: var(--gk-ink);
  --p-togglebutton-hover-background: var(--row-hover);
  --p-togglebutton-hover-color: var(--gk-ink);
  --p-togglebutton-icon-color: var(--gk-muted);
  --p-togglebutton-icon-hover-color: var(--gk-ink);
  --p-togglebutton-checked-background: var(--selected-tint);
  --p-togglebutton-checked-border-color: color-mix(in srgb, var(--gk-accent) 55%, transparent);
  --p-togglebutton-checked-color: var(--gk-ink);
  --p-togglebutton-icon-checked-color: var(--gk-accent-strong);
  --p-togglebutton-content-checked-background: transparent;
  --p-togglebutton-content-checked-shadow: none;
}

.toolbar-btn.p-button {
  --p-button-text-secondary-color: var(--gk-ink);
}

@media (max-width: 767.98px) {
  .toolbar-btn {
    width: 2.75rem;
    height: 2.75rem;
    padding: 0;
    justify-content: center;
  }

  /* The text stays available to assistive tech (aria-label) but is not shown on phones */
  .toolbar-btn :deep(.p-button-label),
  .toolbar-btn :deep(.p-togglebutton-label) {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
  }
}

/* Comparison hint (one line, always visible) */
.compare-hint {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-height: 2.75rem;
  padding: 0.25rem 0.75rem;
  font-size: 0.8125rem;
  line-height: 1.3;
  color: var(--gk-muted);
  border-bottom: 1px solid var(--gk-border);
  text-wrap: balance;
}

.compare-hint > i {
  flex: none;
  color: var(--gk-accent-strong);
}

.compare-hint.is-active {
  color: var(--gk-ink);
  background: var(--selected-tint);
}

.hint-text {
  min-width: 0;
}

.hint-chip {
  flex: 0 0 auto;
  min-width: 0;
  max-width: 45%;
  padding: 0.125rem 0.5rem;
  border-radius: 999px;
  border: 1px solid var(--gk-border-strong);
  background: var(--gk-surface);
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.hint-clear {
  flex: none;
  margin-inline-start: auto;
  width: 2.75rem;
  height: 2.75rem;
  margin-block: -0.25rem;
}

/* Table */
.financial-tree-table :deep(.p-treetable-table-container) {
  max-height: min(75vh, 48rem);
  max-height: min(75dvh, 48rem);
  /* Phones: do not let a horizontal swipe trigger the browser's back gesture */
  overscroll-behavior-x: contain;
  /* Scroll shadows (CSS only): the right/left edge fades in when more columns are out of view.
     The cover layers scroll with the content and hide the shadows at the ends. Needs transparent
     body cells, see below. */
  background-color: var(--gk-surface);
  background-image:
    linear-gradient(to right, var(--gk-surface), var(--gk-surface)),
    linear-gradient(to left, var(--gk-surface), var(--gk-surface)),
    linear-gradient(to right, var(--edge-shadow), transparent),
    linear-gradient(to left, var(--edge-shadow), transparent);
  background-position:
    left center,
    right center,
    left center,
    right center;
  background-size:
    1.5rem 100%,
    1.5rem 100%,
    0.875rem 100%,
    0.875rem 100%;
  background-repeat: no-repeat;
  background-attachment: local, local, scroll, scroll;
}

@media (max-width: 767.98px) {
  .financial-tree-table :deep(.p-treetable-table-container) {
    max-height: 70vh;
    max-height: 70dvh;
  }
}

/* With a frozen account column, scrolling a focused/tapped cell into view must not leave it
   hidden beneath that column */
.financial-tree-table.is-frozen :deep(.p-treetable-table-container) {
  scroll-padding-inline-start: var(--account-col-min);
}

.financial-tree-table :deep(.p-treetable-table) {
  font-size: 0.9375rem;
  font-variant-numeric: tabular-nums;
}

@media (max-width: 767.98px) {
  .financial-tree-table :deep(.p-treetable-table) {
    font-size: 0.875rem;
  }
}

/* Header: sticky (position: sticky is set by PrimeVue), hairline underneath. It has to stay above
   the frozen body cells (z-index 2) while the rows scroll beneath it. */
.financial-tree-table :deep(.p-treetable-thead) {
  z-index: 4;
}

.financial-tree-table :deep(.p-treetable-thead > tr > th) {
  padding: var(--cell-pad-y) var(--cell-pad-x);
  background: var(--gk-surface-2);
  border-width: 0 0 1px 0;
  border-color: var(--gk-border-strong);
  color: var(--gk-ink);
  font-weight: 600;
  vertical-align: bottom;
}

.financial-tree-table :deep(.p-treetable-thead > tr > th.value-column) {
  padding: 0;
  text-align: end;
}

/* Body: hairline row separators, no boxes. Cells stay transparent so that the scroll shadows
   of the container show through. */
.financial-tree-table :deep(.p-treetable-tbody > tr) {
  background: transparent;
}

.financial-tree-table :deep(.p-treetable-tbody > tr > td) {
  padding: var(--cell-pad-y) var(--cell-pad-x);
  border-width: 0 0 1px 0;
  border-color: var(--gk-border);
  color: var(--gk-ink);
  vertical-align: middle;
}

.financial-tree-table :deep(.p-treetable-tbody > tr:last-child > td) {
  border-bottom-color: transparent;
}

@media (max-width: 767.98px) {
  /* 44px rows: the value and the expander are tap targets */
  .financial-tree-table :deep(.p-treetable-tbody > tr > td) {
    height: 2.75rem;
  }
}

@media (hover: hover) {
  .financial-tree-table :deep(.p-treetable-tbody > tr:hover) {
    background: color-mix(in srgb, var(--gk-accent) 7%, transparent);
  }

  .financial-tree-table :deep(.p-treetable-tbody > tr:hover > td.p-treetable-frozen-column) {
    background: var(--row-hover);
  }
}

.financial-tree-table :deep(.p-treetable-tbody > tr > td.value-column) {
  text-align: end;
}

/* Column widths: narrow value columns, the account column takes the rest */
.financial-tree-table :deep(.value-column) {
  width: var(--value-col-width);
  min-width: var(--value-col-min);
}

.financial-tree-table :deep(.account-column) {
  min-width: var(--account-col-min);
}

@media (max-width: 767.98px) {
  .financial-tree-table :deep(.account-column) {
    width: var(--account-col-min);
    max-width: var(--account-col-min);
  }
}

/* Frozen first column: opaque, with an edge so that it is clear that content scrolls beneath */
.financial-tree-table :deep(.p-treetable-tbody > tr > td.p-treetable-frozen-column) {
  z-index: 2;
  background: var(--gk-surface);
}

.financial-tree-table :deep(.p-treetable-thead > tr > th.p-treetable-frozen-column) {
  z-index: 3;
  background: var(--gk-surface-2);
}

.financial-tree-table :deep(.p-treetable-frozen-column) {
  border-right: 1px solid var(--gk-border);
  box-shadow: 6px 0 8px -6px var(--edge-shadow);
}

/* Account column */
.account-cell {
  display: flex;
  flex: 1 1 auto;
  flex-wrap: wrap;
  align-items: baseline;
  column-gap: 0.375rem;
  min-width: 0;
}

.account-label {
  font-weight: 500;
  color: var(--gk-ink);
  overflow-wrap: break-word;
  hyphens: auto;
  min-width: 0;
}

@media (max-width: 767.98px) {
  .account-label {
    font-size: 0.8125rem;
    line-height: 1.25;
  }
}

.account-code {
  font-size: 0.75rem;
  color: var(--gk-muted);
  font-variant-numeric: tabular-nums;
}

/* Expander: keep a small look, but a 44px touch area */
.financial-tree-table :deep(.p-treetable-node-toggle-button) {
  flex: none;
  overflow: visible;
}

@media (max-width: 767.98px) {
  .financial-tree-table :deep(.p-treetable-body-cell-content) {
    gap: 0.25rem;
  }

  .financial-tree-table :deep(.p-treetable-node-toggle-button) {
    width: 1.5rem;
    height: 1.5rem;
  }
}

.financial-tree-table :deep(.p-treetable-node-toggle-button::after) {
  content: '';
  position: absolute;
  inset: -0.5rem -0.375rem;
}

/* Numbers */
.value-cell {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.25rem;
  width: 100%;
  text-align: right;
}

.value-content {
  display: flex;
  justify-content: flex-end;
}

.financial-value {
  font-weight: 500;
  color: var(--gk-ink);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.no-value {
  color: var(--gk-muted);
}

.financial-value.pnl-value {
  font-weight: 700;
}

.financial-value.comparison-mode {
  font-weight: 600;
}

.financial-value.comparison-positive {
  color: var(--gk-positive);
}

.financial-value.comparison-negative {
  color: var(--gk-negative);
}

.financial-value.clickable {
  cursor: pointer;
  /* larger hit area without changing the layout */
  padding: 0.375rem 0.25rem;
  margin: -0.375rem -0.25rem;
}

@media (hover: hover) {
  .financial-value.clickable:hover {
    text-decoration: underline;
    text-decoration-color: var(--gk-border-strong);
    text-underline-offset: 3px;
  }
}

.comparison-tags {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 0.25rem;
}

.comparison-tag {
  display: inline-block;
  padding: 0.3125rem 0.5rem;
  border: 1px solid var(--gk-border);
  border-radius: 999px;
  background: var(--gk-surface-2);
  color: var(--gk-ink);
  font-size: 0.75rem;
  font-weight: 600;
  line-height: 1;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.comparison-tag.clickable {
  cursor: pointer;
}

.comparison-tag.tag-success {
  color: var(--gk-positive);
  background: color-mix(in srgb, var(--gk-positive) 12%, transparent);
  border-color: color-mix(in srgb, var(--gk-positive) 32%, transparent);
}

.comparison-tag.tag-danger {
  color: var(--gk-negative);
  background: color-mix(in srgb, var(--gk-negative) 12%, transparent);
  border-color: color-mix(in srgb, var(--gk-negative) 32%, transparent);
}

.comparison-tag.tag-secondary {
  color: var(--gk-muted);
}

/* Column header: entity name + year as one compact, tappable label */
.entity-header {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: flex-end;
  width: 100%;
  min-height: 2.75rem;
  padding: var(--cell-pad-y) var(--cell-pad-x);
  text-align: right;
  cursor: pointer;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}

.entity-header:focus-visible {
  outline: 2px solid var(--gk-accent);
  outline-offset: -2px;
}

@media (hover: hover) {
  .entity-header:hover {
    background: var(--row-hover);
  }
}

.entity-header .entity-name {
  font-size: 0.8125rem;
  font-weight: 600;
  line-height: 1.2;
  color: var(--gk-ink);
  overflow-wrap: anywhere;
}

@media (max-width: 767.98px) {
  /* keep the sticky header compact: at most three lines for long entity names */
  .entity-header .entity-name {
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 3;
    line-clamp: 3;
    overflow: hidden;
  }
}

.entity-header .entity-year {
  font-size: 0.6875rem;
  font-weight: 500;
  color: var(--gk-muted);
  font-variant-numeric: tabular-nums;
}

.selection-indicator {
  margin-inline-end: 0.25rem;
  font-size: 0.75rem;
  color: var(--gk-accent-strong);
}

.comparison-indicators {
  width: 100%;
  margin-top: 0.25rem;
  padding-top: 0.25rem;
  border-top: 1px solid var(--gk-border);
}

.comparison-list {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.comparison-entity {
  font-size: 0.6875rem;
  font-weight: 500;
  color: var(--gk-muted);
  overflow-wrap: anywhere;
}

/* Column states (classes are set on the PrimeVue header and body cells) */
.financial-tree-table :deep(.column-has-comparisons) {
  background-color: color-mix(in srgb, var(--gk-accent) 4%, transparent);
}

.financial-tree-table :deep(.p-treetable-thead > tr > th.column-has-comparisons) {
  background-color: color-mix(in srgb, var(--gk-accent) 5%, var(--gk-surface-2));
}

.financial-tree-table :deep(.column-selected) {
  box-shadow:
    inset 2px 0 0 var(--gk-accent),
    inset -2px 0 0 var(--gk-accent);
}

.financial-tree-table :deep(.p-treetable-tbody > tr > td.column-selected) {
  background-color: var(--selected-tint);
}

.financial-tree-table :deep(.p-treetable-thead > tr > th.column-selected) {
  background-color: var(--selected-tint);
  box-shadow:
    inset 2px 0 0 var(--gk-accent),
    inset -2px 0 0 var(--gk-accent),
    inset 0 2px 0 var(--gk-accent);
}

/* Comparison popover. The popover is teleported to <body>: the root class is global. */
:global(.comparison-popover) {
  width: min(92vw, 600px);
  max-width: 92vw;
  min-width: 0;
}

@media (max-width: 767.98px) {
  /* Phones: a centred sheet instead of an arrow-anchored bubble */
  :global(.comparison-popover) {
    left: 4vw !important;
  }

  :global(.comparison-popover::before),
  :global(.comparison-popover::after) {
    display: none;
  }
}

.popover-content {
  max-height: min(80vh, 34rem);
  max-height: min(80dvh, 34rem);
  padding: 1rem;
  overflow: auto;
}

@media (max-width: 767.98px) {
  .popover-content {
    padding: 0.75rem;
  }
}

.popover-header h4 {
  margin: 0 0 0.25rem 0;
  color: var(--gk-ink);
  font-size: 1rem;
  font-weight: 600;
  overflow-wrap: anywhere;
}

.comparison-subtitle {
  margin: 0 0 1rem 0;
  color: var(--gk-muted);
  font-size: 0.875rem;
  overflow-wrap: anywhere;
}

.comparison-section,
.all-values-section {
  margin-bottom: 1.25rem;
}

.comparison-section:last-child,
.all-values-section:last-child {
  margin-bottom: 0;
}

.comparison-section h5,
.all-values-section h5 {
  margin: 0 0 0.5rem 0;
  color: var(--gk-muted);
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

/* The tables scroll horizontally inside the popover instead of widening it */
.comparison-table,
.all-values-table {
  overflow-x: auto;
  border: 1px solid var(--gk-border);
  border-radius: var(--radius-md);
}

.comparison-table table,
.all-values-table table {
  width: 100%;
  min-width: 15rem;
  border-collapse: collapse;
  font-size: 0.875rem;
  background: transparent;
}

.comparison-table th,
.comparison-table td,
.all-values-table th,
.all-values-table td {
  padding: 0.5rem 0.75rem;
  text-align: left;
  border-bottom: 1px solid var(--gk-border);
}

.comparison-table th,
.all-values-table th {
  background-color: var(--gk-surface-2);
  font-weight: 600;
  color: var(--gk-muted);
  font-size: 0.6875rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.comparison-table th:last-child,
.all-values-table th:last-child {
  text-align: right;
}

.comparison-table td.entity-name,
.all-values-table td.entity-name {
  font-weight: 500;
  color: var(--gk-ink);
  overflow-wrap: anywhere;
}

.comparison-table .value,
.all-values-table .value {
  font-variant-numeric: tabular-nums;
  font-weight: 600;
  text-align: right;
  white-space: nowrap;
}

.comparison-table .difference-row {
  background-color: var(--gk-surface-2);
}

.comparison-table .difference-row .label {
  font-weight: 600;
  color: var(--gk-muted);
}

.comparison-table .value.positive,
.all-values-table .value.positive {
  color: var(--gk-positive);
}

.comparison-table .value.negative,
.all-values-table .value.negative {
  color: var(--gk-negative);
}

.comparison-table tfoot tr:last-child td,
.all-values-table tbody tr:last-child td {
  border-bottom: none;
}

.all-values-table .highlighted {
  background-color: color-mix(in srgb, var(--gk-accent) 10%, transparent);
  font-weight: 600;
}
</style>
