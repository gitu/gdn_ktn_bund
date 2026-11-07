<template>
  <div class="about" data-testid="about-main">
    <header class="about-head">
      <h1>{{ t('aboutView.title') }}</h1>
      <p class="about-subtitle">{{ t('aboutView.subtitle') }}</p>
      <p class="about-description">{{ t('aboutView.description') }}</p>
    </header>

    <div class="about-grid">
      <!-- Data -->
      <section class="panel">
        <header class="panel-head">
          <h2>{{ t('aboutView.dataInfo.title') }}</h2>
          <i class="pi pi-database" aria-hidden="true"></i>
        </header>
        <p>{{ t('aboutView.dataInfo.description') }}</p>
        <ul class="facts">
          <li>{{ t('aboutView.dataInfo.sources') }}</li>
          <li v-if="coverageText">{{ coverageText }}</li>
        </ul>
        <h3 class="panel-sub">{{ t('aboutView.dataInfo.officialSources') }}</h3>
        <Button
          :label="t('aboutView.dataInfo.federalFinanceAdmin')"
          icon="pi pi-external-link"
          class="panel-button"
          outlined
          @click="openFederalFinanceAdmin"
        />
      </section>

      <!-- Technology -->
      <section class="panel">
        <header class="panel-head">
          <h2>{{ t('aboutView.technology.title') }}</h2>
          <i class="pi pi-cog" aria-hidden="true"></i>
        </header>
        <p>{{ t('aboutView.technology.description') }}</p>
        <ul class="facts">
          <li>{{ t('aboutView.technology.frontend') }}</li>
          <li>{{ t('aboutView.technology.testing') }}</li>
          <li>{{ t('aboutView.technology.build') }}</li>
        </ul>
      </section>

      <!-- Build -->
      <section class="panel">
        <header class="panel-head">
          <h2>{{ t('aboutView.buildInfo.title') }}</h2>
          <i class="pi pi-clock" aria-hidden="true"></i>
        </header>
        <dl class="kv">
          <div>
            <dt>{{ t('aboutView.buildInfo.buildTime') }}</dt>
            <dd>{{ buildTimestamp }}</dd>
          </div>
          <div>
            <dt>{{ t('aboutView.buildInfo.commit') }}</dt>
            <dd class="mono">{{ appVersion }}</dd>
          </div>
          <div v-if="fullCommitHash !== appVersion">
            <dt>{{ t('aboutView.buildInfo.fullCommit') }}</dt>
            <dd class="mono hash">{{ fullCommitHash }}</dd>
          </div>
        </dl>
      </section>

      <!-- Repository -->
      <section class="panel">
        <header class="panel-head">
          <h2>{{ t('aboutView.repository.title') }}</h2>
          <i class="pi pi-github" aria-hidden="true"></i>
        </header>
        <p>{{ t('aboutView.repository.description') }}</p>
        <div class="panel-actions">
          <Button
            :label="t('aboutView.repository.viewOnGitHub')"
            icon="pi pi-external-link"
            class="panel-button"
            outlined
            @click="openGitHubRepository"
          />
          <Button
            :label="t('aboutView.repository.contribute')"
            icon="pi pi-users"
            class="panel-button"
            severity="secondary"
            outlined
            @click="openGitHubRepository"
          />
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import Button from 'primevue/button'
import {
  getCatalogSummary,
  loadAvailableDataCatalog,
  type CatalogGroupSummary,
} from '@/utils/AvailableDataLoader'

// Use Vue i18n
const { t } = useI18n()

// Coverage is read from the catalogue so the text cannot drift from the data
const summary = ref<{ gdn: CatalogGroupSummary; std: CatalogGroupSummary } | null>(null)

onMounted(async () => {
  try {
    summary.value = getCatalogSummary(await loadAvailableDataCatalog())
  } catch {
    summary.value = null
  }
})

const coverageText = computed(() =>
  summary.value
    ? t('aboutView.dataInfo.coverage', {
        gdnCount: summary.value.gdn.count,
        gdnFrom: summary.value.gdn.firstYear,
        gdnTo: summary.value.gdn.lastYear,
        stdCount: summary.value.std.count,
        stdFrom: summary.value.std.firstYear,
        stdTo: summary.value.std.lastYear,
      })
    : '',
)

// Build timestamp injected during build process
const buildTimestamp = computed(() => {
  try {
    return new Date(__BUILD_TIME__).toLocaleDateString()
  } catch {
    return new Date().toLocaleDateString()
  }
})

// App version (short commit hash) injected during build process
const appVersion = computed(() => {
  return __APP_VERSION__ || 'unknown'
})

// Full Git commit hash
const fullCommitHash = computed(() => {
  return __GIT_COMMIT_HASH__ || 'unknown'
})

// GitHub repository URL
const GITHUB_REPOSITORY_URL = 'https://github.com/gitu/gdn_ktn_bund'

// Open GitHub repository
const openGitHubRepository = () => {
  window.open(GITHUB_REPOSITORY_URL, '_blank', 'noopener,noreferrer')
}

// Open Federal Finance Administration data page
const openFederalFinanceAdmin = () => {
  const url = t('aboutView.dataInfo.federalFinanceAdminUrl')
  window.open(url, '_blank', 'noopener,noreferrer')
}
</script>

<style scoped>
.about {
  max-width: 64rem;
  margin: 0 auto;
}

.about-head {
  margin-bottom: clamp(1.25rem, 4vw, 2rem);
}

.about-head h1 {
  margin: 0 0 0.5rem;
}

.about-subtitle {
  margin: 0 0 0.75rem;
  color: var(--gk-accent-strong);
  font-weight: 600;
}

.about-description {
  max-width: 46rem;
  color: var(--gk-muted);
}

.about-grid {
  display: grid;
  gap: 1rem;
  /* min-width: 0 on the items keeps long unbroken strings (commit hash) from widening the page */
  grid-template-columns: minmax(0, 1fr);
}

.panel {
  min-width: 0;
  padding: clamp(1rem, 3vw, 1.5rem);
  border: 1px solid var(--gk-border);
  border-radius: var(--radius-lg);
  background: var(--gk-surface);
  box-shadow: var(--gk-shadow-1);
}

.panel p {
  color: var(--gk-muted);
}

.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.panel-head h2 {
  margin: 0;
  font-size: 1.25rem;
}

.panel-head i {
  display: inline-grid;
  place-items: center;
  flex: none;
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 0.65rem;
  background: color-mix(in srgb, var(--gk-accent) 14%, transparent);
  color: var(--gk-accent-strong);
}

.panel-sub {
  margin: 1.25rem 0 0.5rem;
  font-size: 0.95rem;
}

.facts {
  display: grid;
  gap: 0.5rem;
  margin: 0.75rem 0 0;
  padding: 0;
  list-style: none;
}

.facts li {
  padding: 0.6rem 0.8rem;
  border-left: 3px solid var(--gk-accent);
  border-radius: 0 var(--radius-md) var(--radius-md) 0;
  background: var(--gk-surface-2);
  font-size: 0.925rem;
  line-height: 1.45;
  overflow-wrap: anywhere;
}

.kv {
  display: grid;
  gap: 0.75rem;
  margin: 0;
}

.kv dt {
  color: var(--gk-muted);
  font-size: 0.8rem;
}

.kv dd {
  margin: 0.15rem 0 0;
  font-weight: 600;
}

.mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
}

.hash {
  font-size: 0.8rem;
  font-weight: 500;
  word-break: break-all;
}

.panel-actions {
  display: grid;
  gap: 0.5rem;
}

.panel-button {
  width: 100%;
  min-height: 2.75rem;
}

@media (min-width: 640px) {
  .panel-actions {
    grid-template-columns: 1fr 1fr;
  }
}

@media (min-width: 992px) {
  .about-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
