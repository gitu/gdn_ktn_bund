<script setup lang="ts">
import { useI18n } from 'vue-i18n';

// Vue i18n (used in template)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const { t } = useI18n();
</script>

<template>
  <main class="home-view">
    <div class="header">
      <h1>{{ $t('homeView.title') }}</h1>
      <p>{{ $t('homeView.subtitle') }}</p>
    </div>

    <div class="description-section">
      <h2>{{ $t('homeView.description.title') }}</h2>
      <p class="intro">{{ $t('homeView.description.intro') }}</p>

      <div class="capabilities">
        <p class="capabilities-title">{{ $t('homeView.description.capabilities') }}</p>
        <div class="data-types">
          <div class="data-type">
            <h3>
              <i class="pi pi-chart-bar"></i>
              {{ $t('homeView.dimensions.bilanz') }}
            </h3>
            <p>{{ $t('homeView.description.bilanzDescription') }}</p>
          </div>
          <div class="data-type">
            <h3>
              <i class="pi pi-trending-up"></i>
              {{ $t('homeView.dimensions.ertrag') }} / {{ $t('homeView.dimensions.aufwand') }}
            </h3>
            <p>{{ $t('homeView.description.incomeDescription') }}</p>
          </div>
        </div>
      </div>

      <p class="footer">{{ $t('homeView.description.footer') }}</p>
    </div>

    <div class="cta-section">
      <h3>{{ $t('homeView.cta.title') }}</h3>
      <p>{{ $t('homeView.cta.description') }}</p>

      <div class="cta-buttons">
        <router-link to="/financial-comparison" class="cta-button primary">
          <i class="pi pi-chart-line"></i>
          {{ $t('homeView.cta.comparisonButtonText') }}
        </router-link>

        <router-link to="/about" class="cta-button secondary">
          <i class="pi pi-info-circle"></i>
          {{ $t('homeView.cta.learnMoreButtonText') }}
        </router-link>
      </div>
    </div>

  </main>
</template>

<style scoped>
.home-view {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.header {
  text-align: center;
  margin-bottom: 2rem;
}

.header h1 {
  color: #2c3e50;
  margin-bottom: 0.5rem;
}

.header p {
  color: #666;
  font-size: 1.1rem;
}

.description-section {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  padding: 2rem;
  border-radius: 12px;
  margin-bottom: 2rem;
  border: 1px solid #dee2e6;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.description-section h2 {
  color: #2c3e50;
  margin-bottom: 1rem;
  font-size: 1.5rem;
  text-align: center;
}

.description-section .intro {
  font-size: 1.1rem;
  color: #495057;
  text-align: center;
  margin-bottom: 1.5rem;
  line-height: 1.6;
}

.capabilities {
  margin: 1.5rem 0;
}

.capabilities-title {
  font-weight: 600;
  color: #343a40;
  margin-bottom: 1rem;
  text-align: center;
}

.data-types {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  margin: 1rem 0;
}

.data-type {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  border: 1px solid #e9ecef;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.data-type:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.data-type h3 {
  color: #2c3e50;
  margin-bottom: 0.75rem;
  font-size: 1.1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.data-type h3 i {
  color: #007bff;
  font-size: 1.2rem;
}

.data-type p {
  color: #6c757d;
  line-height: 1.5;
  margin: 0;
}

.description-section .footer {
  text-align: center;
  color: #6c757d;
  font-style: italic;
  margin-top: 1.5rem;
  margin-bottom: 0;
}

.cta-section {
  text-align: center;
  padding: 2rem;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.cta-section h3 {
  color: #2c3e50;
  margin-bottom: 1rem;
  font-size: 1.4rem;
}

.cta-section p {
  color: #6c757d;
  margin-bottom: 1.5rem;
  font-size: 1.1rem;
}

.cta-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.cta-button {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 2rem;
  color: white;
  text-decoration: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 1.1rem;
  transition: all 0.3s ease;
  min-width: 200px;
  justify-content: center;
}

.cta-button.primary {
  background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
  box-shadow: 0 4px 12px rgba(0, 123, 255, 0.3);
}

.cta-button.primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 123, 255, 0.4);
  background: linear-gradient(135deg, #0056b3 0%, #004085 100%);
  text-decoration: none;
  color: white;
}

.cta-button.secondary {
  background: linear-gradient(135deg, #6c757d 0%, #495057 100%);
  box-shadow: 0 4px 12px rgba(108, 117, 125, 0.3);
}

.cta-button.secondary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(108, 117, 125, 0.4);
  background: linear-gradient(135deg, #495057 0%, #343a40 100%);
  text-decoration: none;
  color: white;
}

.cta-button i {
  font-size: 1.2rem;
}



@media (max-width: 768px) {
  .home-view {
    padding: 1rem;
  }

  .description-section {
    padding: 1.5rem;
    margin-bottom: 1.5rem;
  }

  .description-section h2 {
    font-size: 1.3rem;
  }

  .data-types {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .data-type {
    padding: 1rem;
  }

  .cta-section {
    padding: 1.5rem;
  }

  .cta-buttons {
    flex-direction: column;
    align-items: center;
  }

  .cta-button {
    padding: 0.8rem 1.5rem;
    font-size: 1rem;
    min-width: 250px;
  }
}
</style>
