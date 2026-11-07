<template>
  <div class="disclosure">
    <Button
      type="button"
      class="toggle"
      severity="secondary"
      outlined
      :aria-expanded="open"
      :aria-controls="id"
      @click="open = !open"
    >
      <span class="label">{{ title }}</span>
      <i :class="open ? 'pi pi-chevron-up' : 'pi pi-chevron-down'" aria-hidden="true"></i>
    </Button>
    <div v-if="open" :id="id" class="panel">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, useId } from 'vue'
import Button from 'primevue/button'

defineProps<{ title: string }>()

const id = useId()
const open = ref(false)
</script>

<style scoped>
.disclosure {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.toggle.p-button {
  --p-button-outlined-secondary-border-color: var(--gk-border-strong);
  --p-button-outlined-secondary-color: var(--gk-ink);
  --p-button-outlined-secondary-hover-background: var(--gk-surface-2);
  justify-content: space-between;
  gap: 0.75rem;
  width: 100%;
  min-height: 2.75rem;
  font-size: 0.875rem;
  text-align: start;
}

.label {
  min-width: 0;
  overflow-wrap: anywhere;
}

.panel {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 0.5rem;
  padding: 0.5rem 0.75rem 0.75rem;
  border: 1px solid var(--gk-border);
  border-radius: var(--radius-md);
  background: var(--gk-surface);
  min-width: 0;
}
</style>
