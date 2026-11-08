<template>
  <div class="account-picker" data-testid="account-picker">
    <!-- The accounts chosen so far, one chip per account (or "+" sum of accounts) -->
    <ul v-if="groups.length > 0" class="account-chips" data-testid="account-chips">
      <li v-for="group in groups" :key="group" class="account-chip">
        <span class="chip-code">{{ group.split('+').join(' + ') }}</span>
        <span class="chip-label">{{ groupLabel(group) }}</span>
        <button
          type="button"
          class="chip-remove"
          :aria-label="$t('optimizer.accountPicker.remove', { account: groupTitle(group) })"
          @click="removeGroup(group)"
        >
          <i class="pi pi-times" aria-hidden="true"></i>
        </button>
      </li>
    </ul>
    <p v-else class="picker-empty">{{ $t('optimizer.accountPicker.empty') }}</p>

    <Select
      :model-value="null"
      :options="choices"
      option-label="label"
      option-value="code"
      option-disabled="taken"
      filter
      :filter-placeholder="$t('optimizer.accountPicker.search')"
      :placeholder="$t('optimizer.accountPicker.add')"
      :aria-label="$t('optimizer.accountPicker.add')"
      class="account-add"
      data-testid="account-add"
      @update:model-value="(code: string | null) => code && addGroup(code)"
    >
      <template #option="{ option }">
        <span :style="{ paddingInlineStart: `${option.depth * 0.75}rem` }">{{ option.label }}</span>
      </template>
    </Select>

    <div class="quick-row" role="group" :aria-label="$t('optimizer.accountPicker.quick')">
      <button
        v-for="quick in quickChoices"
        :key="quick.code"
        type="button"
        class="quick-chip"
        :disabled="groups.includes(quick.code)"
        @click="addGroup(quick.code)"
      >
        <i class="pi pi-plus" aria-hidden="true"></i>
        {{ quick.label }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import Select from 'primevue/select'
import { parseAccountCodeInput } from '@/utils/optimization/accountTargets'

export interface AccountChoice {
  code: string
  /** Name of the account in the current language */
  name: string
  depth: number
}

const props = defineProps<{ accounts: AccountChoice[] }>()
/** The same text as the code input: "36,46,400+401" */
const input = defineModel<string>({ required: true })

const { t } = useI18n()

// Groups the optimiser will fit; invalid text keeps its chips empty until it is fixed
const groups = computed(() => parseAccountCodeInput(input.value).groups)

const byCode = computed(() => new Map(props.accounts.map((account) => [account.code, account])))

const groupLabel = (group: string) =>
  group
    .split('+')
    .map((code) => byCode.value.get(code)?.name ?? '')
    .filter(Boolean)
    .join(' + ')

const groupTitle = (group: string) => `${group} ${groupLabel(group)}`.trim()

const choices = computed(() =>
  props.accounts.map((account) => ({
    code: account.code,
    label: `${account.code} ${account.name}`,
    depth: account.depth,
    taken: groups.value.includes(account.code),
  })),
)

// The groups that differ most between places in practice: transfers, taxes, personnel
const QUICK_CODES = ['36', '46', '40', '30', '31']
const quickChoices = computed(() =>
  QUICK_CODES.filter((code) => byCode.value.has(code)).map((code) => ({
    code,
    label: t('optimizer.accountPicker.quickLabel', { code, name: byCode.value.get(code)!.name }),
  })),
)

const write = (next: string[]) => {
  input.value = next.join(',')
}

const addGroup = (code: string) => {
  if (!groups.value.includes(code)) write([...groups.value, code])
}

const removeGroup = (group: string) => {
  write(groups.value.filter((g) => g !== group))
}
</script>

<style scoped>
.account-picker {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  min-width: 0;
}

.account-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.account-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  max-width: 100%;
  min-height: 2.25rem;
  padding: 0 0.15rem 0 0.65rem;
  border: 1px solid color-mix(in srgb, var(--gk-accent) 45%, var(--gk-border));
  border-radius: 999px;
  background: color-mix(in srgb, var(--gk-accent) 10%, var(--gk-surface));
  font-size: 0.8125rem;
}

.chip-code {
  flex: none;
  font-variant-numeric: tabular-nums;
  font-weight: 650;
}

.chip-label {
  min-width: 0;
  overflow: hidden;
  color: var(--gk-muted);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chip-remove {
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: var(--gk-muted);
  cursor: pointer;
}

.chip-remove:hover {
  background: var(--gk-surface-2);
  color: var(--gk-ink);
}

.chip-remove:focus-visible {
  outline: 2px solid var(--gk-accent);
}

.chip-remove .pi {
  font-size: 0.7rem;
}

.picker-empty {
  margin: 0;
  color: var(--gk-muted);
  font-size: 0.8125rem;
}

.account-add {
  width: 100%;
}

.quick-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
}

.quick-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  min-height: 2.25rem;
  max-width: 100%;
  padding: 0 0.65rem;
  border: 1px dashed var(--gk-border-strong);
  border-radius: 999px;
  background: transparent;
  color: var(--gk-ink);
  font: inherit;
  font-size: 0.75rem;
  cursor: pointer;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.quick-chip:disabled {
  cursor: default;
  opacity: 0.45;
}

.quick-chip .pi {
  font-size: 0.65rem;
}
</style>
