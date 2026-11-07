import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { FinancialData } from '@/types/FinancialDataStructure'
import type { StatsAvailabilityInfo } from '@/types/StatsData'
import {
  cloneConstellation,
  constellationSignature,
  createConstellation,
  runConstellation,
  type Constellation,
  type ConstellationRun,
} from '@/utils/optimization/constellation'
import { MAX_SCENARIOS } from '@/utils/optimization/scenarioCodec'
import { loadFactorValues, type FactorTable } from '@/utils/optimization/scalingFactors'
import { Logger } from '@/utils/Logger'

export type ScenarioStatus = 'idle' | 'running' | 'done' | 'error'

export interface Scenario {
  constellation: Constellation
  status: ScenarioStatus
  run: ConstellationRun | null
  /** Fingerprint of the inputs the stored run was computed from. */
  signature: string | null
  error: string | null
}

/** What a run needs from the page. */
export interface RunContext {
  financialData: FinancialData
  stats: StatsAvailabilityInfo[]
  /** Overridable for tests. */
  loadFactors?: (entityCodes: string[], statIds: string[]) => Promise<FactorTable>
}

const freshScenario = (constellation: Constellation = createConstellation()): Scenario => ({
  constellation,
  status: 'idle',
  run: null,
  signature: null,
  error: null,
})

/** Lets the browser paint (spinner) before a synchronous computation starts. */
const nextFrame = () => new Promise<void>((resolve) => setTimeout(resolve, 0))

export const useOptimizerStore = defineStore('optimizer', () => {
  const scenarios = ref<Scenario[]>([freshScenario()])
  const selectedId = ref<string>(scenarios.value[0].constellation.id)

  const selected = computed(
    () =>
      scenarios.value.find((s) => s.constellation.id === selectedId.value) ?? scenarios.value[0],
  )
  const definitions = computed(() => scenarios.value.map((s) => s.constellation))
  const canAdd = computed(() => scenarios.value.length < MAX_SCENARIOS)

  const indexOf = (id: string) => scenarios.value.findIndex((s) => s.constellation.id === id)

  function select(id: string) {
    if (indexOf(id) >= 0) selectedId.value = id
  }

  function add(partial: Partial<Constellation> = {}): Scenario | null {
    if (!canAdd.value) return null
    const scenario = freshScenario(createConstellation(partial))
    scenarios.value.push(scenario)
    selectedId.value = scenario.constellation.id
    return scenario
  }

  /** Copy of a scenario (definition only; it has to be run again). */
  function duplicate(id: string, name?: string): Scenario | null {
    const i = indexOf(id)
    if (i < 0 || !canAdd.value) return null
    const copy = freshScenario(
      cloneConstellation(scenarios.value[i].constellation, {
        name: name ?? scenarios.value[i].constellation.name,
      }),
    )
    scenarios.value.splice(i + 1, 0, copy)
    selectedId.value = copy.constellation.id
    return copy
  }

  /** Removes a scenario; the last one cannot be removed (it is reset instead). */
  function remove(id: string) {
    const i = indexOf(id)
    if (i < 0) return
    if (scenarios.value.length === 1) {
      scenarios.value = [freshScenario()]
      selectedId.value = scenarios.value[0].constellation.id
      return
    }
    scenarios.value.splice(i, 1)
    if (selectedId.value === id) {
      selectedId.value = scenarios.value[Math.min(i, scenarios.value.length - 1)].constellation.id
    }
  }

  /** Change a definition. The stored result stays visible but is marked outdated by its signature. */
  function update(id: string, patch: Partial<Omit<Constellation, 'id'>>) {
    const scenario = scenarios.value[indexOf(id)]
    if (scenario) Object.assign(scenario.constellation, patch)
  }

  /** Replace all scenarios (restore from a link). Results are dropped, definitions kept. */
  function replaceAll(constellations: Constellation[]) {
    scenarios.value =
      constellations.length > 0 ? constellations.map((c) => freshScenario(c)) : [freshScenario()]
    selectedId.value = scenarios.value[0].constellation.id
  }

  function isStale(
    scenario: Scenario,
    data: FinancialData | null,
    allFactorIds: string[],
  ): boolean {
    return (
      scenario.run !== null &&
      scenario.signature !== constellationSignature(scenario.constellation, data, allFactorIds)
    )
  }

  async function run(id: string, ctx: RunContext): Promise<void> {
    const scenario = scenarios.value[indexOf(id)]
    if (!scenario) return
    scenario.status = 'running'
    scenario.error = null
    try {
      const factorIds = ctx.stats.map((s) => s.id)
      const load = ctx.loadFactors ?? loadFactorValues
      const table = await load([...ctx.financialData.entities.keys()], factorIds)
      await nextFrame()
      const result = runConstellation(scenario.constellation, {
        financialData: ctx.financialData,
        factors: table,
        allFactorIds: factorIds,
      })
      scenario.run = result
      scenario.signature = constellationSignature(
        scenario.constellation,
        ctx.financialData,
        factorIds,
      )
      scenario.status = result.outcome.isValid ? 'done' : 'error'
      scenario.error = result.outcome.isValid ? null : result.outcome.error
    } catch (error) {
      Logger.error('Scenario run failed', error)
      scenario.status = 'error'
      scenario.run = null
      scenario.error = error instanceof Error ? error.message : 'Optimization failed'
    }
  }

  /** Runs one scenario after the other (they share the loaded statistics). */
  async function runAll(ctx: RunContext): Promise<void> {
    for (const scenario of scenarios.value.slice()) {
      await run(scenario.constellation.id, ctx)
    }
  }

  return {
    scenarios,
    selectedId,
    selected,
    definitions,
    canAdd,
    select,
    add,
    duplicate,
    remove,
    update,
    replaceAll,
    isStale,
    run,
    runAll,
  }
})
