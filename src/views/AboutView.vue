<template>
  <div class="about">
    <div class="container">
      <header class="about-header">
        <h1>{{ t('aboutView.title') }}</h1>
        <p class="subtitle">{{ t('aboutView.subtitle') }}</p>
        <p class="description">{{ t('aboutView.description') }}</p>
      </header>

      <section class="features-section">
        <h2>{{ t('aboutView.features.title') }}</h2>
        <div class="features-grid">
          <div class="feature-card">
            <div class="feature-icon">🌳</div>
            <h3>{{ t('aboutView.features.treeNavigation') }}</h3>
          </div>
          <div class="feature-card">
            <div class="feature-icon">📊</div>
            <h3>{{ t('aboutView.features.tableView') }}</h3>
          </div>
          <div class="feature-card">
            <div class="feature-icon">🔍</div>
            <h3>{{ t('aboutView.features.dataBrowser') }}</h3>
          </div>
          <div class="feature-card">
            <div class="feature-icon">🌐</div>
            <h3>{{ t('aboutView.features.multiLanguage') }}</h3>
          </div>
          <div class="feature-card">
            <div class="feature-icon">📱</div>
            <h3>{{ t('aboutView.features.responsive') }}</h3>
          </div>
        </div>
      </section>

      <section class="data-info-section">
        <h2>{{ t('aboutView.dataInfo.title') }}</h2>
        <p>{{ t('aboutView.dataInfo.description') }}</p>
        <ul>
          <li>{{ t('aboutView.dataInfo.sources') }}</li>
          <li>{{ t('aboutView.dataInfo.coverage') }}</li>
        </ul>
      </section>

      <section class="technology-section">
        <h2>{{ t('aboutView.technology.title') }}</h2>
        <p>{{ t('aboutView.technology.description') }}</p>
        <ul>
          <li>{{ t('aboutView.technology.frontend') }}</li>
          <li>{{ t('aboutView.technology.testing') }}</li>
          <li>{{ t('aboutView.technology.build') }}</li>
        </ul>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';

// Use Vue i18n
const { t } = useI18n();
</script>

<style scoped>
.about {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 2rem 0;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
}

.about-header {
  text-align: center;
  color: white;
  margin-bottom: 4rem;
}

.about-header h1 {
  font-size: 3rem;
  font-weight: 700;
  margin-bottom: 1rem;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.subtitle {
  font-size: 1.5rem;
  font-weight: 300;
  margin-bottom: 1.5rem;
  opacity: 0.9;
}

.description {
  font-size: 1.1rem;
  max-width: 800px;
  margin: 0 auto;
  line-height: 1.6;
  opacity: 0.9;
}

.features-section,
.data-info-section,
.technology-section {
  background: white;
  border-radius: 12px;
  padding: 2.5rem;
  margin-bottom: 2rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.features-section h2,
.data-info-section h2,
.technology-section h2 {
  color: #2c3e50;
  font-size: 2rem;
  font-weight: 600;
  margin-bottom: 2rem;
  text-align: center;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
}

.feature-card {
  text-align: center;
  padding: 1.5rem;
  border-radius: 8px;
  background: #f8f9fa;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.feature-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.feature-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.feature-card h3 {
  color: #2c3e50;
  font-size: 1.1rem;
  font-weight: 500;
  margin: 0;
  line-height: 1.4;
}

.data-info-section p,
.technology-section p {
  font-size: 1.1rem;
  line-height: 1.6;
  color: #555;
  margin-bottom: 1.5rem;
}

.data-info-section ul,
.technology-section ul {
  list-style: none;
  padding: 0;
}

.data-info-section li,
.technology-section li {
  background: #f8f9fa;
  padding: 1rem 1.5rem;
  margin-bottom: 0.5rem;
  border-radius: 6px;
  border-left: 4px solid #667eea;
  font-size: 1rem;
  color: #555;
}

@media (max-width: 768px) {
  .about-header h1 {
    font-size: 2.5rem;
  }

  .subtitle {
    font-size: 1.3rem;
  }

  .features-grid {
    grid-template-columns: 1fr;
  }

  .features-section,
  .data-info-section,
  .technology-section {
    padding: 1.5rem;
  }

  .container {
    padding: 0 1rem;
  }
}
</style>
