<template>
  <section
    class="comparison"
    data-testid="scenario-comparison"
    :aria-label="$t('optimizer.compare.title')"
  >
    <h5 class="title">{{ $t('optimizer.compare.title') }}</h5>
    <p class="hint">{{ $t('optimizer.compare.hint') }}</p>
    <div class="table-wrap">
      <table class="table">
        <thead>
          <tr>
            <th scope="col">{{ $t('optimizer.compare.scenario') }}</th>
            <th scope="col">{{ $t('optimizer.compare.formula') }}</th>
            <th scope="col" class="num">{{ $t('optimizer.compare.data') }}</th>
            <th scope="col" class="num">{{ $t('optimizer.compare.cvBefore') }}</th>
            <th scope="col" class="num">{{ $t('optimizer.compare.cvAfter') }}</th>
            <th scope="col" class="num">{{ $t('optimizer.compare.improvement') }}</th>
            <th scope="col">{{ $t('optimizer.compare.risk') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="row in rows"
            :key="row.id"
            :class="{ active: row.id === selectedId, best: row.id === bestId }"
            :data-testid="`comparison-row-${row.id}`"
          >
            <th scope="row" :data-label="$t('optimizer.compare.scenario')" class="name-cell">
              <button type="button" class="link" @click="$emit('select', row.id)">
                {{ row.name }}
              </button>
              <span v-if="row.id === bestId && rows.length > 1" class="badge">
                <i class="pi pi-star-fill" aria-hidden="true"></i>
                {{ $t('optimizer.compare.best') }}
              </span>
            </th>
            <td :data-label="$t('optimizer.compare.formula')" class="formula-cell">
              <code class="formula">{{ row.formula }}</code>
            </td>
            <td :data-label="$t('optimizer.compare.data')" class="num">
              {{
                $t('optimizer.compare.dataValue', {
                  entities: row.entityCount,
                  accounts: row.accountCount,
                })
              }}
            </td>
            <td :data-label="$t('optimizer.compare.cvBefore')" class="num">
              {{ cv(row.beforeCV) }}
            </td>
            <td :data-label="$t('optimizer.compare.cvAfter')" class="num">
              <span>
                <strong>{{ cv(row.cvCV) }}</strong>
                <span class="muted"> ({{ cv(row.afterCV) }})</span>
              </span>
            </td>
            <td
              :data-label="$t('optimizer.compare.improvement')"
              class="num"
              :class="row.cvImprovement < 0 ? 'neg' : 'pos'"
            >
              {{ formatPercent(row.cvImprovement / 100, locale, 0, true) }}
            </td>
            <td :data-label="$t('optimizer.compare.risk')">
              <span class="risk" :class="`risk-${row.overfitRisk}`">{{
                $t(`optimizer.result.risk.${row.overfitRisk}`)
              }}</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <p class="hint">{{ $t('optimizer.compare.footnote') }}</p>
  </section>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { ComparisonRow } from '@/utils/optimization/constellation'
import { formatCv, formatPercent } from './format'

defineProps<{
  rows: ComparisonRow[]
  selectedId: string
  bestId: string | null
}>()

defineEmits<{ select: [id: string] }>()

const { locale } = useI18n()
const cv = (v: number) => formatCv(v, locale.value)
</script>

<style scoped>
.comparison {
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

.table-wrap {
  min-width: 0;
}

.table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.8125rem;
  font-variant-numeric: tabular-nums;
}

.table th,
.table td {
  padding: 0.5rem 0.5rem;
  text-align: start;
  vertical-align: top;
  border-bottom: 1px solid var(--gk-border);
}

.table thead th {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--gk-muted);
}

.num {
  text-align: end !important;
  white-space: nowrap;
}

.formula {
  font-size: 0.75rem;
  word-break: break-all;
}

.link {
  min-height: 2.75rem;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--gk-accent-strong);
  font: inherit;
  font-weight: 600;
  text-align: start;
  text-decoration: underline;
  text-underline-offset: 2px;
  cursor: pointer;
}

.active {
  background: color-mix(in srgb, var(--gk-accent) 8%, transparent);
}

.badge {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  margin-inline-start: 0.5rem;
  padding: 0.0625rem 0.5rem;
  border-radius: 999px;
  background: color-mix(in srgb, var(--gk-accent) 16%, transparent);
  color: var(--gk-accent-strong);
  font-size: 0.6875rem;
  font-weight: 600;
}

.muted {
  color: var(--gk-muted);
}

.pos {
  color: var(--gk-positive);
}

.neg {
  color: var(--gk-negative);
}

.risk {
  font-weight: 600;
}

.risk-low {
  color: var(--gk-positive);
}

.risk-high {
  color: var(--gk-negative);
}

/* Phones: every row becomes a labelled card, no horizontal scrolling */
@media (max-width: 767.98px) {
  .table,
  .table tbody,
  .table tr,
  .table th,
  .table td {
    display: block;
  }

  .table thead {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
  }

  .table tr {
    margin-bottom: 0.5rem;
    padding: 0.25rem 0.5rem;
    border: 1px solid var(--gk-border);
    border-radius: var(--radius-md);
    background: var(--gk-surface);
  }

  .table th,
  .table td {
    display: flex;
    justify-content: space-between;
    gap: 0.75rem;
    padding: 0.25rem 0;
    border-bottom: 0;
    text-align: end;
  }

  .table td::before,
  .table th[scope='row']::before {
    content: attr(data-label);
    flex: 0 0 auto;
    color: var(--gk-muted);
    font-size: 0.75rem;
    text-align: start;
  }

  .name-cell {
    align-items: center;
    flex-wrap: wrap;
  }

  .name-cell::before {
    display: none;
  }

  .formula-cell {
    flex-direction: column;
    gap: 0.125rem;
    text-align: start;
  }

  .num {
    white-space: normal;
  }
}
</style>
