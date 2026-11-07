<script setup lang="ts">
// Plain-language help for the result table. Native <details> keeps it accessible and light.
const sections = ['rows', 'scaling', 'compare', 'source', 'limits'] as const
</script>

<template>
  <details class="how-to-read" data-testid="how-to-read">
    <summary>
      <i class="pi pi-question-circle" aria-hidden="true"></i>
      <span class="summary-text">
        <strong>{{ $t('explain.title') }}</strong>
        <small>{{ $t('explain.hint') }}</small>
      </span>
      <span class="chevron" aria-hidden="true"></span>
    </summary>

    <div class="sections">
      <section v-for="key in sections" :key="key">
        <h3>{{ $t(`explain.${key}.title`) }}</h3>
        <template v-if="key === 'rows'">
          <p>{{ $t('explain.rows.balance') }}</p>
          <p>{{ $t('explain.rows.income') }}</p>
          <p>{{ $t('explain.rows.result') }}</p>
          <p>{{ $t('explain.rows.expand') }}</p>
        </template>
        <p v-else>{{ $t(`explain.${key}.text`) }}</p>
      </section>
    </div>
  </details>
</template>

<style scoped>
.how-to-read {
  margin-bottom: 1rem;
  border: 1px solid var(--gk-border);
  border-radius: var(--radius-lg);
  background: var(--gk-surface-2);
}

summary {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-height: 3rem;
  padding: 0.5rem 1rem;
  cursor: pointer;
  list-style: none;
}

summary::-webkit-details-marker {
  display: none;
}

summary:focus-visible {
  outline: 2px solid var(--gk-accent);
  outline-offset: 2px;
  border-radius: var(--radius-lg);
}

.summary-text {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
}

.summary-text small {
  color: var(--gk-muted);
  font-size: 0.8125rem;
}

.pi-question-circle {
  color: var(--gk-accent-strong);
  font-size: 1.25rem;
}

.chevron {
  flex: none;
  width: 0.55rem;
  height: 0.55rem;
  margin: 0 0.35rem 0.2rem 0;
  border-right: 2px solid var(--gk-muted);
  border-bottom: 2px solid var(--gk-muted);
  transform: rotate(45deg);
  transition: transform 0.2s ease;
}

details[open] .chevron {
  margin-bottom: 0;
  margin-top: 0.3rem;
  transform: rotate(225deg);
}

.sections {
  display: grid;
  gap: 1rem;
  padding: 0 1rem 1rem;
}

section h3 {
  margin: 0 0 0.35rem;
  font-size: 1rem;
}

section p {
  margin: 0 0 0.5rem;
  color: var(--gk-muted);
  font-size: 0.925rem;
  line-height: 1.55;
}

@media (min-width: 768px) {
  .sections {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 1.25rem 2rem;
  }
}
</style>
