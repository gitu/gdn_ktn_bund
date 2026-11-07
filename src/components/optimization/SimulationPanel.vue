<template>
  <section
    class="simulations"
    data-testid="simulation-panel"
    :aria-label="$t('optimizer.sim.title')"
  >
    <h5 class="title">{{ $t('optimizer.sim.title') }}</h5>
    <p class="hint">{{ $t('optimizer.sim.intro') }}</p>

    <div v-for="tab in tabs" :key="tab.key" class="disclosure">
      <Button
        :aria-expanded="open === tab.key"
        :aria-controls="`${uid}-${tab.key}`"
        class="toggle"
        severity="secondary"
        outlined
        :data-testid="`sim-toggle-${tab.key}`"
        @click="open = open === tab.key ? null : tab.key"
      >
        <span class="toggle-label">
          <i :class="tab.icon" aria-hidden="true"></i>
          {{ $t(`optimizer.sim.tabs.${tab.key}`) }}
        </span>
        <i
          :class="open === tab.key ? 'pi pi-chevron-up' : 'pi pi-chevron-down'"
          aria-hidden="true"
        ></i>
      </Button>
      <div v-if="open === tab.key" :id="`${uid}-${tab.key}`" class="panel">
        <WhatIfSimulation v-if="tab.key === 'whatIf'" :result="result" :labels="labels" />
        <DeviationRanking v-else-if="tab.key === 'expected'" :result="result" :labels="labels" />
        <SensitivityTable v-else :result="result" :labels="labels" />
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, useId } from 'vue'
import Button from 'primevue/button'
import type { FitResult } from '@/utils/optimization/types'
import DeviationRanking from './DeviationRanking.vue'
import SensitivityTable from './SensitivityTable.vue'
import WhatIfSimulation from './WhatIfSimulation.vue'
import type { OptimizerLabels } from './useOptimizerLabels'

defineProps<{ result: FitResult; labels: OptimizerLabels }>()

type TabKey = 'whatIf' | 'expected' | 'sensitivity'
const tabs: { key: TabKey; icon: string }[] = [
  { key: 'whatIf', icon: 'pi pi-sliders-h' },
  { key: 'expected', icon: 'pi pi-chart-bar' },
  { key: 'sensitivity', icon: 'pi pi-arrows-v' },
]

const uid = useId()
const open = ref<TabKey | null>(null)
</script>

<style scoped>
.simulations {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  min-width: 0;
}

.title {
  margin: 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--gk-ink);
}

.hint {
  margin: 0;
  font-size: 0.75rem;
  line-height: 1.45;
  color: var(--gk-muted);
}

.disclosure {
  display: flex;
  flex-direction: column;
}

.toggle.p-button {
  --p-button-outlined-secondary-border-color: var(--gk-border-strong);
  --p-button-outlined-secondary-color: var(--gk-ink);
  --p-button-outlined-secondary-hover-background: var(--gk-surface-2);
  justify-content: space-between;
  width: 100%;
  min-height: 2.75rem;
  text-align: start;
}

.toggle-label {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 0;
}

.panel {
  margin-top: 0.5rem;
  padding: 0.75rem;
  border: 1px solid var(--gk-border);
  border-radius: var(--radius-md);
  background: var(--gk-surface);
  min-width: 0;
}
</style>
