<template>
  <nav class="stepper" :aria-label="$t('wizard.stepsLabel')" data-testid="wizard-steps">
    <ol>
      <li
        v-for="(step, index) in steps"
        :key="step.key"
        class="step"
        :class="{
          'is-current': step.key === current,
          'is-done': step.done && step.key !== current,
        }"
      >
        <button
          type="button"
          class="step-button"
          :disabled="!step.enabled"
          :aria-current="step.key === current ? 'step' : undefined"
          :data-testid="`step-${step.key}`"
          @click="emit('go', step.key)"
        >
          <span class="step-number" aria-hidden="true">
            <i v-if="step.done && step.key !== current" class="pi pi-check"></i>
            <template v-else>{{ index + 1 }}</template>
          </span>
          <span class="step-text">
            <span class="step-label">{{ step.label }}</span>
            <span v-if="step.summary" class="step-summary">{{ step.summary }}</span>
          </span>
        </button>
      </li>
    </ol>
  </nav>
</template>

<script setup lang="ts">
export interface WizardStep<K extends string = string> {
  key: K
  label: string
  /** What was chosen in this step, e.g. "3 Orte" */
  summary?: string
  done: boolean
  enabled: boolean
}

defineProps<{ steps: WizardStep[]; current: string }>()
const emit = defineEmits<{ go: [key: string] }>()
</script>

<style scoped>
.stepper ol {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.375rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.step {
  position: relative;
  min-width: 0;
}

.step-button {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  width: 100%;
  min-height: 3.25rem;
  padding: 0.5rem 0.65rem;
  border: 1px solid var(--gk-border);
  border-radius: var(--radius-md);
  background: var(--gk-surface);
  color: var(--gk-ink);
  font: inherit;
  text-align: start;
  cursor: pointer;
  transition:
    border-color 0.15s ease,
    background 0.15s ease;
}

.step-button:hover:not(:disabled) {
  border-color: var(--gk-border-strong);
}

.step-button:disabled {
  color: var(--gk-muted);
  cursor: not-allowed;
  opacity: 0.7;
}

.step-button:focus-visible {
  outline: 2px solid var(--gk-accent);
  outline-offset: 2px;
}

.is-current .step-button {
  border-color: var(--gk-accent);
  background: color-mix(in srgb, var(--gk-accent) 10%, var(--gk-surface));
  box-shadow: 0 0 0 1px var(--gk-accent);
}

.step-number {
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 1.75rem;
  height: 1.75rem;
  border: 1px solid var(--gk-border-strong);
  border-radius: 999px;
  color: var(--gk-muted);
  font-size: 0.8125rem;
  font-variant-numeric: tabular-nums;
  font-weight: 650;
}

.is-current .step-number {
  border-color: transparent;
  background: var(--gk-accent);
  color: #ffffff;
}

.is-done .step-number {
  border-color: transparent;
  background: color-mix(in srgb, var(--gk-accent) 18%, var(--gk-surface));
  color: var(--gk-accent-strong);
}

.step-number .pi {
  font-size: 0.75rem;
}

.step-text {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.step-label {
  font-size: 0.875rem;
  font-weight: 650;
  line-height: 1.25;
}

.step-summary {
  overflow: hidden;
  color: var(--gk-muted);
  font-size: 0.75rem;
  line-height: 1.3;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Phones: number above a short label, the summary moves into the step itself */
@media (max-width: 767px) {
  .stepper ol {
    gap: 0.25rem;
  }

  .step-button {
    flex-direction: column;
    gap: 0.25rem;
    min-height: 3.5rem;
    padding: 0.4rem 0.2rem;
    text-align: center;
  }

  .step-text {
    align-items: center;
    width: 100%;
  }

  .step-label {
    max-width: 100%;
    overflow: hidden;
    font-size: 0.75rem;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .step-summary {
    display: none;
  }
}
</style>
