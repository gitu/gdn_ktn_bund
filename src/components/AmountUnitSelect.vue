<template>
  <div
    class="amount-unit"
    role="group"
    :aria-label="$t('amountUnit.label')"
    data-testid="amount-unit"
  >
    <span class="unit-label" aria-hidden="true">{{ $t('amountUnit.label') }}</span>
    <div class="unit-options">
      <button
        v-for="option in AMOUNT_UNITS"
        :key="option"
        type="button"
        class="unit-option"
        :aria-pressed="unit === option"
        :title="$t(`amountUnit.hint.${option}`)"
        :data-testid="`amount-unit-${option}`"
        @click="unit = option"
      >
        {{ $t(`amountUnit.options.${option}`) }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAmountFormat } from '@/composables/useAmountFormat'
import { AMOUNT_UNITS } from '@/utils/numberFormat'

// Shared with every table and chart: rounding here rounds them all
const { unit } = useAmountFormat()
</script>

<style scoped>
.amount-unit {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.25rem 0.5rem;
}

.unit-label {
  color: var(--gk-muted);
  font-size: 0.8125rem;
  font-weight: 600;
}

.unit-options {
  display: inline-flex;
  padding: 0.2rem;
  border: 1px solid var(--gk-border);
  border-radius: 999px;
  background: var(--gk-surface-2);
}

.unit-option {
  min-height: 2.25rem;
  padding: 0 0.75rem;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: var(--gk-muted);
  font: inherit;
  font-size: 0.8125rem;
  font-weight: 600;
  white-space: nowrap;
  cursor: pointer;
}

.unit-option[aria-pressed='true'] {
  background: var(--gk-surface);
  box-shadow: var(--gk-shadow-1);
  color: var(--gk-ink);
}

.unit-option:focus-visible {
  outline: 2px solid var(--gk-accent);
  outline-offset: 2px;
}
</style>
