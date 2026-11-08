<template>
  <div class="financial-charts" data-testid="financial-charts">
    <p v-if="skippedNames.length > 0" class="charts-note" data-testid="charts-skipped">
      <i class="pi pi-info-circle" aria-hidden="true"></i>
      {{ $t('charts.skippedUnscaled', { names: skippedNames.join(', ') }) }}
    </p>

    <!-- Several years: the development of one figure comes first -->
    <ChartCard
      v-if="years.length > 1"
      :title="$t('charts.trend.title', { measure: measureLabel })"
      :subtitle="
        $t('charts.trend.subtitle', {
          from: years[0],
          to: years[years.length - 1],
          unit: unitLabel,
        })
      "
      :legend="trendSeries"
      legend-shape="line"
      :table="trendTable"
      :empty="trendSeries.length === 0 ? $t('charts.empty') : undefined"
      test-id="chart-trend"
    >
      <template #controls>
        <MeasurePicker v-model="measureCode" :options="accountChoices" />
      </template>
      <LineChart
        :x="years"
        :series="trendSeries"
        :format-value="formatValue"
        :format-tick="formatTick"
        :label="$t('charts.trend.title', { measure: measureLabel })"
      />
      <template v-if="places.length > MAX_LINES || measureNote" #note>
        <span v-if="places.length > MAX_LINES">
          {{ $t('charts.trend.capped', { count: MAX_LINES, total: places.length }) }}
        </span>
        <span v-if="measureNote">{{ measureNote }}</span>
      </template>
    </ChartCard>

    <!-- With several years, the snapshot charts below show one of them -->
    <div v-if="years.length > 1" class="focus-year" data-testid="focus-year">
      <span class="focus-label">{{ $t('charts.focusYear') }}</span>
      <div class="focus-stepper">
        <Button
          icon="pi pi-chevron-left"
          text
          rounded
          severity="secondary"
          :disabled="!previousYear"
          :aria-label="$t('charts.previousYear')"
          @click="previousYear && (focusYear = previousYear)"
        />
        <Select
          v-model="focusYear"
          :options="[...years].reverse()"
          class="focus-select"
          :aria-label="$t('charts.focusYear')"
        />
        <Button
          icon="pi pi-chevron-right"
          text
          rounded
          severity="secondary"
          :disabled="!nextYear"
          :aria-label="$t('charts.nextYear')"
          @click="nextYear && (focusYear = nextYear)"
        />
      </div>
    </div>

    <div class="chart-grid">
      <ChartCard
        :title="$t('charts.revenueExpenses.title')"
        :subtitle="snapshotSubtitle"
        :legend="revenueExpenseSeries"
        :table="revenueExpenseTable"
        :empty="focusPlaces.length === 0 ? $t('charts.empty') : undefined"
        test-id="chart-revenue-expenses"
      >
        <BarChart
          :categories="focusPlaces"
          :series="revenueExpenseSeries"
          :values="revenueExpenseValues"
          :format-label="formatTick"
          :format-value="formatValue"
          :format-tick="formatTick"
        />
      </ChartCard>

      <ChartCard
        :title="$t('charts.result.title')"
        :subtitle="snapshotSubtitle"
        :table="resultTable"
        :empty="focusPlaces.length === 0 ? $t('charts.empty') : undefined"
        test-id="chart-result"
      >
        <BarChart
          :categories="focusPlaces"
          :series="resultSeries"
          :values="resultValues"
          :format-label="formatTick"
          :format-value="formatValue"
          :format-tick="formatTick"
          color-by-sign
          :sign-labels="[$t('charts.result.surplus'), $t('charts.result.deficit')]"
        />
        <template #note>{{ $t('charts.result.note') }}</template>
      </ChartCard>

      <ChartCard
        :title="$t('charts.revenueStructure.title')"
        :subtitle="$t('charts.structureSubtitle', { year: focusYear })"
        :legend="revenueGroups"
        :table="revenueStructureTable"
        :empty="focusPlaces.length === 0 ? $t('charts.empty') : undefined"
        test-id="chart-revenue-structure"
      >
        <ShareBarChart
          :categories="focusPlaces"
          :groups="revenueGroups"
          :shares="revenueShares"
          :format-share="formatPercent"
          :format-value="formatValue"
        />
        <template #note>{{ $t('charts.revenueStructure.note') }}</template>
      </ChartCard>

      <ChartCard
        :title="$t('charts.expenseStructure.title')"
        :subtitle="$t('charts.structureSubtitle', { year: focusYear })"
        :legend="expenseGroups"
        :table="expenseStructureTable"
        :empty="focusPlaces.length === 0 ? $t('charts.empty') : undefined"
        test-id="chart-expense-structure"
      >
        <ShareBarChart
          :categories="focusPlaces"
          :groups="expenseGroups"
          :shares="expenseShares"
          :format-share="formatPercent"
          :format-value="formatValue"
        />
        <template #note>{{ $t('charts.expenseStructure.note') }}</template>
      </ChartCard>
    </div>

    <!-- One year: pick any account and compare it across the places -->
    <ChartCard
      v-if="years.length <= 1"
      :title="$t('charts.measure.title', { measure: measureLabel })"
      :subtitle="snapshotSubtitle"
      :table="measureTable"
      :empty="focusPlaces.length === 0 ? $t('charts.empty') : undefined"
      test-id="chart-measure"
    >
      <template #controls>
        <MeasurePicker v-model="measureCode" :options="accountChoices" />
      </template>
      <BarChart
        :categories="focusPlaces"
        :series="measureSeries"
        :values="measureValues"
        :format-label="formatTick"
        :format-value="formatValue"
        :format-tick="formatTick"
        :color-by-sign="measureCode === RESULT_CODE || measureCode === NET_DEBT_CODE"
        :sign-labels="measureSignLabels"
      />
      <template v-if="measureNote" #note>{{ measureNote }}</template>
    </ChartCard>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import Button from 'primevue/button'
import Select from 'primevue/select'
import ChartCard from './ChartCard.vue'
import BarChart from './BarChart.vue'
import ShareBarChart from './ShareBarChart.vue'
import LineChart, { type LineSeries } from './LineChart.vue'
import MeasurePicker, { type MeasureChoice } from './MeasurePicker.vue'
import { seriesColor, type ChartCategory, type ChartSeries, type ChartTable } from './chartTypes'
import {
  EXPENSE_GROUPS,
  KEY_FIGURES,
  NET_DEBT_CODE,
  RESULT_CODE,
  REVENUE_GROUPS,
  accountOptions,
  accountValue,
  chartColumns,
  findAccount,
  groupShares,
  type AccountGroup,
  type GroupShare,
} from '@/utils/charts/financialFigures'
import { formatAmount, formatCompact, formatShare } from '@/utils/charts/scale'
import { datasetIdOf, sortYears, stepYear } from '@/utils/ComparisonSelection'
import type { FinancialData } from '@/types/FinancialDataStructure'
import type { MultiLanguageLabels } from '@/types/DataStructures'

const props = defineProps<{
  data: FinancialData
  /** What the amounts are in, e.g. "CHF" or "CHF pro Einwohner/in" */
  unitLabel: string
  /** A scaling is active: columns without a divisor are left out instead of mixing units */
  scaled: boolean
}>()

/** More lines than categorical colours would be guesswork: the table has them all. */
const MAX_LINES = 8

const { t, locale } = useI18n()
const lang = computed(() => locale.value as keyof MultiLanguageLabels)

const allColumns = computed(() => chartColumns(props.data))
const columns = computed(() =>
  allColumns.value.filter((column) => !props.scaled || column.entity.scalingFactor !== undefined),
)

const nameOf = (labels: MultiLanguageLabels | undefined, fallback: string) =>
  labels?.[lang.value] || labels?.de || fallback

const skippedNames = computed(() =>
  allColumns.value
    .filter((column) => !columns.value.includes(column))
    .map((column) => `${nameOf(column.entity.name, column.placeKey)} ${column.year}`),
)

// Places in table order, each with its colour slot
const places = computed(() => {
  const seen = new Map<string, { key: string; label: string; slot: number }>()
  for (const column of columns.value) {
    if (!seen.has(column.placeKey)) {
      seen.set(column.placeKey, {
        key: column.placeKey,
        label: nameOf(column.entity.name, column.placeKey),
        slot: seen.size,
      })
    }
  }
  return [...seen.values()]
})

const years = computed(() => sortYears(columns.value.map((column) => column.year)))
const columnIds = computed(() => new Set(columns.value.map((column) => column.id)))

// ---- Year shown by the snapshot charts
const focusYear = ref<string>('')
watch(
  years,
  (list) => {
    if (!list.includes(focusYear.value)) focusYear.value = list[list.length - 1] ?? ''
  },
  { immediate: true },
)
const previousYear = computed(() => stepYear(focusYear.value, -1, years.value))
const nextYear = computed(() => stepYear(focusYear.value, 1, years.value))

const focusPlaces = computed<ChartCategory[]>(() =>
  places.value
    .filter((place) => columnIds.value.has(datasetIdOf(place.key, focusYear.value)))
    .map((place) => ({ key: place.key, label: place.label })),
)

const valueAt = (code: string, placeKey: string, year: string) => {
  const id = datasetIdOf(placeKey, year)
  return columnIds.value.has(id) ? accountValue(props.data, code, id) : undefined
}

// ---- Formats
const formatTick = (value: number) => formatCompact(value, locale.value)
const formatValue = (value: number) =>
  formatAmount(value, locale.value, props.scaled && Math.abs(value) < 100 ? 2 : 0)
const formatPercent = (share: number) => formatShare(share, locale.value)

const snapshotSubtitle = computed(() =>
  t('charts.snapshotSubtitle', { year: focusYear.value, unit: props.unitLabel }),
)

// ---- Revenue and expenses
const revenueExpenseSeries = computed<ChartSeries[]>(() => [
  { key: '4', label: t('charts.figures.revenue'), ...seriesColor(0) },
  { key: '3', label: t('charts.figures.expenses'), ...seriesColor(1) },
])

const valuesFor = (codes: string[]) =>
  Object.fromEntries(
    focusPlaces.value.map((place) => [
      place.key,
      Object.fromEntries(codes.map((code) => [code, valueAt(code, place.key, focusYear.value)])),
    ]),
  )

const revenueExpenseValues = computed(() => valuesFor(['4', '3']))

const tableOf = (
  head: string[],
  values: Record<string, Record<string, number | undefined>>,
  codes: string[],
): ChartTable => ({
  head,
  rows: focusPlaces.value.map((place) => ({
    key: place.key,
    label: place.label,
    cells: codes.map((code) => {
      const value = values[place.key]?.[code]
      return value === undefined ? '–' : formatValue(value)
    }),
  })),
})

const revenueExpenseTable = computed(() =>
  tableOf(
    [t('charts.place'), t('charts.figures.revenue'), t('charts.figures.expenses')],
    revenueExpenseValues.value,
    ['4', '3'],
  ),
)

// ---- Result
const resultSeries = computed<ChartSeries[]>(() => [
  { key: RESULT_CODE, label: t('charts.figures.result'), ...seriesColor(0) },
])
const resultValues = computed(() => valuesFor([RESULT_CODE]))
const resultTable = computed(() =>
  tableOf([t('charts.place'), t('charts.figures.result')], resultValues.value, [RESULT_CODE]),
)

// ---- Composition of revenue and expenses
const groupSeries = (groups: AccountGroup[], kind: 'revenue' | 'expenses') =>
  groups.map((group, index) => ({
    key: group.key,
    label: t(`charts.groups.${kind}.${group.key}`),
    ...seriesColor(index),
  }))

const revenueGroups = computed(() => groupSeries(REVENUE_GROUPS, 'revenue'))
const expenseGroups = computed(() => groupSeries(EXPENSE_GROUPS, 'expenses'))

const sharesFor = (groups: AccountGroup[]) =>
  Object.fromEntries(
    focusPlaces.value.map((place) => [
      place.key,
      groupShares(props.data, groups, datasetIdOf(place.key, focusYear.value)),
    ]),
  ) as Record<string, GroupShare[]>

const revenueShares = computed(() => sharesFor(REVENUE_GROUPS))
const expenseShares = computed(() => sharesFor(EXPENSE_GROUPS))

const structureTable = (
  groups: ChartSeries[],
  shares: Record<string, GroupShare[]>,
): ChartTable => ({
  head: [t('charts.place'), ...groups.map((group) => group.label)],
  rows: focusPlaces.value.map((place) => ({
    key: place.key,
    label: place.label,
    cells: groups.map((group) => {
      const part = shares[place.key]?.find((share) => share.key === group.key)
      return part ? `${formatPercent(part.share)} (${formatValue(part.value)})` : '–'
    }),
  })),
})

const revenueStructureTable = computed(() =>
  structureTable(revenueGroups.value, revenueShares.value),
)
const expenseStructureTable = computed(() =>
  structureTable(expenseGroups.value, expenseShares.value),
)

// ---- One measure: a key figure or any account
const measureCode = ref<string>('3')

const accountChoices = computed<MeasureChoice[]>(() => [
  ...KEY_FIGURES.map((figure) => ({
    code: figure.code,
    label: t(`charts.figures.${figure.key}`),
    keyFigure: true,
    depth: 0,
  })),
  ...accountOptions(props.data).map((option) => ({
    code: option.code,
    label: `${option.code} ${nameOf(option.labels, option.code)}`,
    keyFigure: false,
    depth: option.depth,
  })),
])

const measureLabel = computed(() => {
  const figure = KEY_FIGURES.find((f) => f.code === measureCode.value)
  if (figure) return t(`charts.figures.${figure.key}`)
  const account = findAccount(props.data, measureCode.value)
  return account ? nameOf(account.labels, measureCode.value) : measureCode.value
})

const measureNote = computed(() =>
  measureCode.value === NET_DEBT_CODE
    ? t('charts.netDebtNote')
    : measureCode.value === RESULT_CODE
      ? t('charts.result.note')
      : '',
)

const measureSignLabels = computed<[string, string] | undefined>(() =>
  measureCode.value === NET_DEBT_CODE
    ? [t('charts.netDebt'), t('charts.netAssets')]
    : measureCode.value === RESULT_CODE
      ? [t('charts.result.surplus'), t('charts.result.deficit')]
      : undefined,
)

const measureSeries = computed<ChartSeries[]>(() => [
  { key: measureCode.value, label: measureLabel.value, ...seriesColor(0) },
])
const measureValues = computed(() => valuesFor([measureCode.value]))
const measureTable = computed(() =>
  tableOf([t('charts.place'), measureLabel.value], measureValues.value, [measureCode.value]),
)

// ---- Development over the years, one line per place
const trendSeries = computed<LineSeries[]>(() =>
  places.value.slice(0, MAX_LINES).map((place) => ({
    key: place.key,
    label: place.label,
    ...seriesColor(place.slot),
    values: years.value.map((year) => valueAt(measureCode.value, place.key, year)),
  })),
)

const trendTable = computed<ChartTable>(() => ({
  head: [t('charts.place'), ...years.value],
  rows: places.value.map((place) => ({
    key: place.key,
    label: place.label,
    cells: years.value.map((year) => {
      const value = valueAt(measureCode.value, place.key, year)
      return value === undefined ? '–' : formatValue(value)
    }),
  })),
}))
</script>

<style scoped>
.financial-charts {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  min-width: 0;
}

.chart-grid {
  display: grid;
  gap: 1rem;
  min-width: 0;
}

@media (min-width: 1100px) {
  .chart-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

.charts-note {
  display: flex;
  gap: 0.5rem;
  margin: 0;
  padding: 0.65rem 0.85rem;
  border: 1px solid var(--gk-border);
  border-radius: var(--radius-md);
  background: var(--gk-surface-2);
  color: var(--gk-muted);
  font-size: 0.8125rem;
  line-height: 1.45;
}

.charts-note i {
  margin-top: 0.15rem;
}

.focus-year {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.25rem 0.75rem;
}

.focus-label {
  color: var(--gk-muted);
  font-size: 0.875rem;
  font-weight: 600;
}

.focus-stepper {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.focus-stepper :deep(.p-button) {
  width: 2.75rem;
  height: 2.75rem;
}

.focus-select {
  min-width: 6.5rem;
}
</style>
