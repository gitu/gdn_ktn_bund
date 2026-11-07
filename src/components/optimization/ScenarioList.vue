<template>
  <section
    class="scenarios"
    data-testid="scenario-list"
    :aria-label="$t('optimizer.scenarios.title')"
  >
    <div class="head">
      <h5 class="title">{{ $t('optimizer.scenarios.title') }}</h5>
      <div class="head-actions">
        <Button
          size="small"
          severity="secondary"
          outlined
          class="head-button"
          icon="pi pi-plus"
          :label="$t('optimizer.scenarios.add')"
          :disabled="!canAdd"
          data-testid="scenario-add"
          @click="$emit('add')"
        />
        <Button
          v-if="items.length > 1"
          size="small"
          severity="secondary"
          text
          class="head-button"
          icon="pi pi-refresh"
          :label="$t('optimizer.scenarios.runAll')"
          :disabled="busy"
          data-testid="scenario-run-all"
          @click="$emit('runAll')"
        />
        <Button
          size="small"
          severity="secondary"
          text
          class="head-button"
          :icon="copied ? 'pi pi-check' : 'pi pi-link'"
          :label="
            copied ? $t('optimizer.scenarios.linkCopied') : $t('optimizer.scenarios.copyLink')
          "
          data-testid="scenario-copy-link"
          @click="$emit('copyLink')"
        />
      </div>
    </div>
    <p v-if="!canAdd" class="hint">{{ $t('optimizer.scenarios.maxReached', { max }) }}</p>

    <ul class="list">
      <li
        v-for="item in items"
        :key="item.id"
        class="scenario"
        :class="{ active: item.id === selectedId }"
        :data-testid="`scenario-${item.id}`"
      >
        <button
          type="button"
          class="main"
          :aria-pressed="item.id === selectedId"
          :aria-label="$t('optimizer.scenarios.select', { name: item.name })"
          @click="$emit('select', item.id)"
        >
          <span class="name">{{ item.name }}</span>
          <span class="summary">{{ item.summary }}</span>
          <span class="status" :class="`status-${item.status}`">
            <i :class="statusIcon[item.status]" aria-hidden="true"></i>
            {{ item.statusText }}
          </span>
        </button>
        <div class="actions">
          <Button
            icon="pi pi-refresh"
            text
            rounded
            severity="secondary"
            class="icon-button"
            :aria-label="$t('optimizer.scenarios.run', { name: item.name })"
            :disabled="busy"
            data-testid="scenario-run"
            @click="$emit('run', item.id)"
          />
          <Button
            icon="pi pi-copy"
            text
            rounded
            severity="secondary"
            class="icon-button"
            :aria-label="$t('optimizer.scenarios.duplicate', { name: item.name })"
            :disabled="!canAdd"
            data-testid="scenario-duplicate"
            @click="$emit('duplicate', item.id)"
          />
          <Button
            icon="pi pi-trash"
            text
            rounded
            severity="secondary"
            class="icon-button"
            :aria-label="$t('optimizer.scenarios.remove', { name: item.name })"
            data-testid="scenario-remove"
            @click="$emit('remove', item.id)"
          />
        </div>
      </li>
    </ul>
  </section>
</template>

<script setup lang="ts">
import Button from 'primevue/button'
import { MAX_SCENARIOS } from '@/utils/optimization/scenarioCodec'

export interface ScenarioItem {
  id: string
  name: string
  summary: string
  status: 'idle' | 'running' | 'stale' | 'error' | 'done'
  statusText: string
}

defineProps<{
  items: ScenarioItem[]
  selectedId: string
  canAdd: boolean
  busy: boolean
  copied: boolean
}>()

defineEmits<{
  select: [id: string]
  add: []
  duplicate: [id: string]
  remove: [id: string]
  run: [id: string]
  runAll: []
  copyLink: []
}>()

const max = MAX_SCENARIOS

const statusIcon: Record<ScenarioItem['status'], string> = {
  idle: 'pi pi-circle',
  running: 'pi pi-spin pi-spinner',
  stale: 'pi pi-exclamation-circle',
  error: 'pi pi-times-circle',
  done: 'pi pi-check-circle',
}
</script>

<style scoped>
.scenarios {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  min-width: 0;
}

.head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.25rem 0.75rem;
}

.title {
  margin: 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--gk-ink);
}

.head-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
}

.head-button.p-button {
  min-height: 2.75rem;
}

.hint {
  margin: 0;
  font-size: 0.75rem;
  color: var(--gk-muted);
}

.list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.scenario {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--gk-border);
  border-radius: var(--radius-md);
  background: var(--gk-surface);
  min-width: 0;
}

.scenario.active {
  border-color: var(--gk-accent);
  box-shadow: 0 0 0 1px var(--gk-accent);
}

.main {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  min-height: 2.75rem;
  padding: 0.625rem 0.75rem 0.25rem;
  border: 0;
  background: transparent;
  color: var(--gk-ink);
  font: inherit;
  text-align: start;
  cursor: pointer;
  border-radius: var(--radius-md) var(--radius-md) 0 0;
}

.main:focus-visible {
  outline: 2px solid var(--gk-accent);
  outline-offset: -2px;
}

.name {
  font-weight: 600;
  font-size: 0.9375rem;
  overflow-wrap: anywhere;
}

.summary {
  font-size: 0.75rem;
  line-height: 1.4;
  color: var(--gk-muted);
  overflow-wrap: anywhere;
}

.status {
  margin-top: 0.125rem;
  font-size: 0.75rem;
  font-variant-numeric: tabular-nums;
  color: var(--gk-muted);
}

.status-done {
  color: var(--gk-positive);
}

.status-error {
  color: var(--gk-negative);
}

.status-stale {
  color: var(--gk-ink);
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.125rem;
  padding: 0 0.25rem 0.25rem;
}

.icon-button.p-button {
  width: 2.75rem;
  height: 2.75rem;
}
</style>
