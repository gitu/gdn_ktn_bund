<template>
  <section class="optimizer" data-testid="optimizer-panel">
    <header class="head">
      <h4 class="optimization-title">
        {{ $t('financialDataScalingSelector.customFormula.optimization.title') }}
      </h4>
      <p class="optimization-description">
        {{ $t('financialDataScalingSelector.customFormula.optimization.description') }}
      </p>
    </header>

    <ScenarioList
      :items="items"
      :selected-id="store.selectedId"
      :can-add="store.canAdd"
      :busy="busy"
      :copied="copied"
      @select="store.select"
      @add="addScenario"
      @duplicate="duplicateScenario"
      @remove="store.remove"
      @run="runScenario"
      @run-all="runAll"
      @copy-link="copyLink"
    />

    <ScenarioEditor
      :key="store.selected.constellation.id"
      :scenario="store.selected.constellation"
      :entities="entities"
      :factors="factorOptions"
      :running="store.selected.status === 'running'"
      @update="(patch) => store.update(store.selected.constellation.id, patch)"
      @run="runScenario(store.selected.constellation.id)"
    />

    <Message v-if="failureText" severity="warn" :closable="false" data-testid="optimization-failed">
      {{ $t('financialDataScalingSelector.customFormula.optimizationFailed') }}: {{ failureText }}
    </Message>

    <template v-else-if="selectedResult">
      <OptimizationResult
        :result="selectedResult"
        :name="selectedName"
        :stale="selectedStale"
        :labels="labels"
        @apply="applySelected"
      />
      <ScenarioComparison
        v-if="comparisonRows.length > 1"
        :rows="comparisonRows"
        :selected-id="store.selectedId"
        :best-id="bestId"
        @select="store.select"
      />
      <SimulationPanel :key="store.selectedId" :result="selectedResult" :labels="labels" />
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, toRef } from 'vue'
import { useI18n } from 'vue-i18n'
import Message from 'primevue/message'
import { useOptimizerStore, type Scenario } from '@/stores/optimizer'
import type { FinancialData } from '@/types/FinancialDataStructure'
import type { StatsAvailabilityInfo } from '@/types/StatsData'
import {
  bestComparisonId,
  comparisonRow,
  resolveEntities,
  type Constellation,
} from '@/utils/optimization/constellation'
import type { FitResult } from '@/utils/optimization/types'
import { formatCv } from './format'
import OptimizationResult from './OptimizationResult.vue'
import ScenarioComparison from './ScenarioComparison.vue'
import ScenarioEditor from './ScenarioEditor.vue'
import ScenarioList, { type ScenarioItem } from './ScenarioList.vue'
import SimulationPanel from './SimulationPanel.vue'
import { useOptimizerLabels } from './useOptimizerLabels'
import { useScenarioUrl } from './useScenarioUrl'

const props = defineProps<{
  financialData?: FinancialData | null
  stats: StatsAvailabilityInfo[]
}>()

const emit = defineEmits<{ apply: [formula: string] }>()

const { t, locale } = useI18n()
const store = useOptimizerStore()

const { labels, entities } = useOptimizerLabels(
  toRef(props, 'financialData'),
  toRef(props, 'stats'),
)
const allFactorIds = computed(() => props.stats.map((s) => s.id))
const factorOptions = computed(() =>
  props.stats.map((s) => ({
    id: s.id,
    label: labels.value.factor(s.id),
    unit: labels.value.factorUnit(s.id),
  })),
)

const ctx = computed(() =>
  props.financialData ? { financialData: props.financialData, stats: props.stats } : null,
)
const busy = computed(() => store.scenarios.some((s) => s.status === 'running'))

// --- list ------------------------------------------------------------------------------------
const displayName = (s: Scenario, index: number) =>
  s.constellation.name.trim() || t('optimizer.scenarios.defaultName', { n: index + 1 })

function describe(c: Constellation): string {
  const entityCount = props.financialData ? resolveEntities(c, props.financialData).length : 0
  const accounts =
    c.accounts.kind === 'codes'
      ? c.accounts.input.trim() || '–'
      : t(
          `optimizer.editor.preset.${c.accounts.parents.join(',') === '3' ? 'expense' : c.accounts.parents.join(',') === '4' ? 'revenue' : 'both'}`,
        )
  const factors = c.selection.enabled
    ? t('optimizer.scenarios.autoFactors', { max: c.selection.maxFactors })
    : t('optimizer.scenarios.nFactors', {
        n: c.factors === null ? allFactorIds.value.length : c.factors.length,
      })
  return [
    t('optimizer.scenarios.entities', { n: entityCount }),
    accounts,
    factors,
    t(`optimizer.editor.modes.${c.mode}`),
  ].join(' · ')
}

function isStale(s: Scenario): boolean {
  return store.isStale(s, props.financialData ?? null, allFactorIds.value)
}

const items = computed<ScenarioItem[]>(() =>
  store.scenarios.map((s, i) => {
    let status: ScenarioItem['status'] = 'idle'
    let statusText = t('optimizer.scenarios.status.idle')
    if (s.status === 'running') {
      status = 'running'
      statusText = t('optimizer.scenarios.status.running')
    } else if (s.run && isStale(s)) {
      status = 'stale'
      statusText = t('optimizer.scenarios.status.stale')
    } else if (s.status === 'error') {
      status = 'error'
      statusText = t('optimizer.scenarios.status.error')
    } else if (s.run?.outcome.isValid) {
      status = 'done'
      const m = s.run.outcome.metrics
      statusText = t('optimizer.scenarios.status.done', {
        before: formatCv(m.beforeCV, locale.value),
        after: formatCv(m.cvCV, locale.value),
      })
    }
    return {
      id: s.constellation.id,
      name: displayName(s, i),
      summary: describe(s.constellation),
      status,
      statusText,
    }
  }),
)

// --- selected scenario -----------------------------------------------------------------------
const selectedIndex = computed(() => store.scenarios.findIndex((s) => s === store.selected))
const selectedName = computed(() => displayName(store.selected, selectedIndex.value))
const selectedStale = computed(() => isStale(store.selected))
const selectedResult = computed<FitResult | null>(() => {
  const outcome = store.selected.run?.outcome
  return outcome?.isValid ? outcome : null
})

const failureText = computed(() => {
  const s = store.selected
  if (s.status !== 'error' || !s.run) return s.status === 'error' ? s.error : null
  if (s.run.inputError) return s.run.inputError
  const outcome = s.run.outcome
  if (outcome.isValid) return null
  const key = `optimizer.failure.${outcome.code}`
  return t(key, { codes: s.run.unknownCodes.join(', ') })
})

const comparisonRows = computed(() =>
  store.scenarios
    .map((s, i) =>
      s.run && !isStale(s) ? comparisonRow(s.constellation.id, displayName(s, i), s.run) : null,
    )
    .filter((r): r is NonNullable<typeof r> => r !== null),
)
const bestId = computed(() => bestComparisonId(comparisonRows.value))

// --- actions ---------------------------------------------------------------------------------
function addScenario() {
  store.add()
}

function duplicateScenario(id: string) {
  const source = store.scenarios.find((s) => s.constellation.id === id)
  if (!source) return
  const index = store.scenarios.indexOf(source)
  store.duplicate(id, t('optimizer.scenarios.copyName', { name: displayName(source, index) }))
}

async function runScenario(id: string) {
  if (ctx.value) await store.run(id, ctx.value)
}

async function runAll() {
  if (ctx.value) await store.runAll(ctx.value)
}

function applySelected() {
  const formula = selectedResult.value?.model.formula
  if (formula) emit('apply', formula)
}

// --- sharing ---------------------------------------------------------------------------------
const copied = ref(false)
let copiedTimer: ReturnType<typeof setTimeout> | null = null

const url = useScenarioUrl({
  definitions: computed(() => store.definitions),
  entityCodes: computed(() =>
    props.financialData ? [...props.financialData.entities.keys()] : [],
  ),
  onImport: (scenarios) => {
    store.replaceAll(scenarios)
    void runAll()
  },
})

async function copyLink() {
  const link = url.shareUrl()
  try {
    await navigator.clipboard.writeText(link)
  } catch {
    window.prompt(t('optimizer.scenarios.copyPrompt'), link)
  }
  copied.value = true
  if (copiedTimer) clearTimeout(copiedTimer)
  copiedTimer = setTimeout(() => (copied.value = false), 2500)
}
</script>

<style scoped>
.optimizer {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  min-width: 0;
}

.head {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.optimization-title {
  margin: 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--gk-ink);
}

.optimization-description {
  margin: 0;
  font-size: 0.75rem;
  line-height: 1.45;
  color: var(--gk-muted);
}
</style>
