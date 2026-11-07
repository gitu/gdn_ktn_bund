<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import Button from 'primevue/button'
import {
  getCatalogSummary,
  loadAvailableDataCatalog,
  type CatalogGroupSummary,
} from '@/utils/AvailableDataLoader'
import { SAMPLE_COMPARISONS, sampleComparisonQuery } from '@/data/sampleComparisons'

const summary = ref<{ gdn: CatalogGroupSummary; std: CatalogGroupSummary } | null>(null)

const yearRange = (group: CatalogGroupSummary) => `${group.firstYear}–${group.lastYear}`

const sampleCards = computed(() =>
  Object.entries(SAMPLE_COMPARISONS).map(([key, sample]) => ({
    key,
    count: sample.datasets.length,
    scaling: 'scaling' in sample ? sample.scaling : undefined,
    to: { name: 'financial-comparison', query: sampleComparisonQuery(sample) },
  })),
)

onMounted(async () => {
  try {
    summary.value = getCatalogSummary(await loadAvailableDataCatalog())
  } catch {
    // The figures are decoration; the page works without them.
    summary.value = null
  }
})
</script>

<template>
  <main class="home" data-testid="home-main">
    <!-- Hero -->
    <section class="hero" data-testid="home-header">
      <div class="hero-copy">
        <p class="eyebrow">{{ $t('homeView.hero.eyebrow') }}</p>
        <h1 data-testid="home-title">{{ $t('homeView.title') }}</h1>
        <p class="lead" data-testid="home-subtitle">{{ $t('homeView.subtitle') }}</p>
        <Button
          as="router-link"
          to="/financial-comparison"
          icon="pi pi-chart-line"
          :label="$t('homeView.cta.startButtonText')"
          size="large"
          class="hero-cta"
          data-testid="home-hero-cta"
        />
      </div>

      <div class="hero-art" aria-hidden="true">
        <span style="--h: 36%"></span>
        <span style="--h: 62%"></span>
        <span style="--h: 100%"></span>
      </div>

      <ul v-if="summary" class="stats" data-testid="home-stats">
        <li>
          <strong>{{ summary.gdn.count }}</strong>
          <span>{{ $t('homeView.stats.municipalities') }}</span>
          <small>{{ yearRange(summary.gdn) }}</small>
        </li>
        <li>
          <strong>{{ summary.std.count }}</strong>
          <span>{{ $t('homeView.stats.aggregates') }}</span>
          <small>{{ yearRange(summary.std) }}</small>
        </li>
        <li>
          <strong>4</strong>
          <span>{{ $t('homeView.stats.languages') }}</span>
          <small>DE · FR · IT · EN</small>
        </li>
      </ul>
    </section>

    <!-- Ready-made comparisons -->
    <section class="section" aria-labelledby="home-quickstart-title">
      <header class="section-head">
        <h2 id="home-quickstart-title">{{ $t('homeView.quickStart.title') }}</h2>
        <p>{{ $t('homeView.quickStart.subtitle') }}</p>
      </header>
      <div class="quick-grid">
        <router-link
          v-for="card in sampleCards"
          :key="card.key"
          :to="card.to"
          class="quick-card"
          :data-testid="`home-sample-${card.key}`"
        >
          <span class="quick-title">{{
            $t(`financialDataComparison.sampleDatasets.${card.key}.name`)
          }}</span>
          <span class="quick-text">{{
            $t(`financialDataComparison.sampleDatasets.${card.key}.description`)
          }}</span>
          <span class="quick-meta">
            <span>{{ $t('homeView.quickStart.datasets', { count: card.count }) }}</span>
            <span v-if="card.scaling">
              · {{ $t(`financialDataScalingSelector.options.${card.scaling}`) }}
            </span>
          </span>
          <span class="quick-open">
            {{ $t('homeView.quickStart.open') }}
            <i class="pi pi-arrow-right" aria-hidden="true"></i>
          </span>
        </router-link>
      </div>
    </section>

    <!-- What it does -->
    <section class="section" data-testid="home-description-card">
      <header class="section-head">
        <h2 data-testid="home-description-title">{{ $t('homeView.description.title') }}</h2>
        <p data-testid="home-description-intro">{{ $t('homeView.description.intro') }}</p>
      </header>
      <ul class="features">
        <li>
          <i class="pi pi-table" aria-hidden="true"></i>
          <h3>{{ $t('homeView.features.compare.title') }}</h3>
          <p>{{ $t('homeView.features.compare.text') }}</p>
        </li>
        <li>
          <i class="pi pi-arrows-alt" aria-hidden="true"></i>
          <h3>{{ $t('homeView.features.scale.title') }}</h3>
          <p>{{ $t('homeView.description.scalingFeature') }}</p>
        </li>
        <li>
          <i class="pi pi-link" aria-hidden="true"></i>
          <h3>{{ $t('homeView.features.share.title') }}</h3>
          <p>{{ $t('homeView.features.share.text') }}</p>
        </li>
      </ul>
    </section>

    <!-- Call to action -->
    <section class="cta" data-testid="home-cta-card">
      <h2 data-testid="home-cta-title">{{ $t('homeView.cta.title') }}</h2>
      <p data-testid="home-cta-description">{{ $t('homeView.cta.description') }}</p>
      <div class="cta-actions">
        <Button
          as="router-link"
          to="/financial-comparison"
          icon="pi pi-chart-line"
          :label="$t('homeView.cta.startButtonText')"
          size="large"
          data-testid="home-cta-button-primary"
        />
        <Button
          as="router-link"
          to="/about"
          icon="pi pi-info-circle"
          :label="$t('homeView.cta.aboutButtonText')"
          severity="secondary"
          outlined
          size="large"
          data-testid="home-cta-button-secondary"
        />
      </div>
    </section>
  </main>
</template>

<style scoped>
.home {
  max-width: 64rem;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: clamp(1.75rem, 5vw, 3rem);
}

/* Hero */
.hero {
  position: relative;
  overflow: hidden;
  display: grid;
  gap: 1.5rem;
  padding: clamp(1.25rem, 5vw, 3rem);
  border: 1px solid var(--gk-border);
  border-radius: calc(var(--radius-lg) * 1.5);
  background:
    radial-gradient(60% 90% at 100% 0%, var(--gk-hero-glow-1), transparent 62%),
    radial-gradient(55% 80% at 0% 100%, var(--gk-hero-glow-2), transparent 62%), var(--gk-surface);
  box-shadow: var(--gk-shadow-1);
}

.hero-copy {
  position: relative;
  z-index: 1;
  max-width: 38rem;
}

.eyebrow {
  display: inline-block;
  margin: 0 0 0.875rem;
  padding: 0.3rem 0.7rem;
  border: 1px solid color-mix(in srgb, var(--gk-accent) 35%, transparent);
  border-radius: 999px;
  background: color-mix(in srgb, var(--gk-accent) 10%, transparent);
  color: var(--gk-accent-strong);
  font-size: 0.78rem;
  font-weight: 600;
  line-height: 1.3;
}

.hero h1 {
  margin: 0 0 0.75rem;
  font-size: clamp(1.875rem, 1.2rem + 3.4vw, 3.25rem);
  line-height: 1.1;
}

.lead {
  margin: 0 0 1.5rem;
  color: var(--gk-muted);
  font-size: clamp(1rem, 0.95rem + 0.35vw, 1.2rem);
  line-height: 1.5;
}

.hero-cta {
  min-height: 3rem;
  width: 100%;
}

.hero-art {
  display: none;
}

.stats {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(8.5rem, 1fr));
  gap: 0.75rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.stats li {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  padding: 0.75rem 0.9rem;
  border: 1px solid var(--gk-border);
  border-radius: var(--radius-md);
  background: color-mix(in srgb, var(--gk-surface) 70%, transparent);
  backdrop-filter: blur(6px);
}

.stats strong {
  font-size: 1.6rem;
  font-weight: 700;
  line-height: 1.1;
  font-variant-numeric: tabular-nums;
}

.stats span {
  color: var(--gk-ink);
  font-size: 0.8rem;
  line-height: 1.3;
}

.stats small {
  color: var(--gk-muted);
  font-size: 0.75rem;
  font-variant-numeric: tabular-nums;
}

@media (max-width: 639px) {
  /* Three chips on two columns: let the last one use the full row */
  .stats li:last-child:nth-child(odd) {
    grid-column: 1 / -1;
  }
}

@media (min-width: 640px) {
  .hero-cta {
    width: auto;
    min-width: 13rem;
  }
}

@media (min-width: 768px) {
  .hero {
    grid-template-columns: 1fr auto;
    align-items: center;
  }

  .stats {
    grid-column: 1 / -1;
  }

  .hero-art {
    display: flex;
    align-items: flex-end;
    gap: 0.75rem;
    height: 11rem;
    padding-right: 1rem;
  }

  .hero-art span {
    width: 2.5rem;
    height: var(--h);
    border-radius: 0.875rem;
    background: var(--gk-gradient);
    box-shadow: 0 14px 30px -12px rgb(8 145 178 / 0.55);
    transform-origin: bottom;
    animation: grow 0.9s cubic-bezier(0.2, 0.8, 0.2, 1) both;
  }

  .hero-art span:nth-child(2) {
    animation-delay: 0.08s;
  }

  .hero-art span:nth-child(3) {
    animation-delay: 0.16s;
  }
}

@keyframes grow {
  from {
    transform: scaleY(0.05);
    opacity: 0;
  }
}

/* Sections */
.section-head {
  margin-bottom: 1.1rem;
}

.section-head h2 {
  margin: 0 0 0.4rem;
}

.section-head p {
  margin: 0;
  max-width: 44rem;
  color: var(--gk-muted);
}

.quick-grid {
  display: grid;
  gap: 0.875rem;
}

.quick-card {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  min-height: 44px;
  padding: 1.1rem 1.2rem;
  border: 1px solid var(--gk-border);
  border-radius: var(--radius-lg);
  background: var(--gk-surface);
  box-shadow: var(--gk-shadow-1);
  color: var(--gk-ink);
  transition:
    transform 0.18s ease,
    border-color 0.18s ease,
    box-shadow 0.18s ease;
}

.quick-card:hover,
.quick-card:focus-visible {
  transform: translateY(-2px);
  border-color: color-mix(in srgb, var(--gk-accent) 55%, var(--gk-border));
  box-shadow: var(--gk-shadow-2);
}

.quick-title {
  font-size: 1.1rem;
  font-weight: 650;
  line-height: 1.3;
}

.quick-text {
  color: var(--gk-muted);
  font-size: 0.9rem;
  line-height: 1.45;
}

.quick-meta {
  color: var(--gk-muted);
  font-size: 0.78rem;
}

.quick-open {
  margin-top: 0.4rem;
  color: var(--gk-accent-strong);
  font-size: 0.9rem;
  font-weight: 600;
}

.quick-open i {
  margin-left: 0.3rem;
  font-size: 0.8rem;
  transition: transform 0.18s ease;
}

.quick-card:hover .quick-open i {
  transform: translateX(3px);
}

.features {
  display: grid;
  gap: 0.875rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.features li {
  padding: 1.1rem 1.2rem;
  border: 1px solid var(--gk-border);
  border-radius: var(--radius-lg);
  background: var(--gk-surface);
}

.features i {
  display: inline-grid;
  place-items: center;
  width: 2.5rem;
  height: 2.5rem;
  margin-bottom: 0.75rem;
  border-radius: 0.75rem;
  background: color-mix(in srgb, var(--gk-accent) 14%, transparent);
  color: var(--gk-accent-strong);
  font-size: 1.1rem;
}

.features h3 {
  margin: 0 0 0.35rem;
  font-size: 1.05rem;
}

.features p {
  margin: 0;
  color: var(--gk-muted);
  font-size: 0.9rem;
  line-height: 1.5;
}

@media (min-width: 640px) {
  .quick-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 768px) {
  .features {
    grid-template-columns: repeat(3, 1fr);
  }
}

/* CTA */
.cta {
  padding: clamp(1.5rem, 5vw, 2.5rem) clamp(1rem, 4vw, 2rem);
  border: 1px solid var(--gk-border);
  border-radius: var(--radius-lg);
  background: var(--gk-surface-2);
  text-align: center;
}

.cta h2 {
  margin: 0 0 0.5rem;
}

.cta p {
  margin: 0 auto 1.25rem;
  max-width: 34rem;
  color: var(--gk-muted);
}

.cta-actions {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  align-items: stretch;
}

@media (min-width: 640px) {
  .cta-actions {
    flex-direction: row;
    justify-content: center;
  }

  .cta-actions > * {
    min-width: 13rem;
  }
}
</style>
