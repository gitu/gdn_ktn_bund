<template>
  <main class="tree-table-view">
    <div class="header">
      <h1>{{ getLocalizedText('title', 'Hierarchical Tree Table') }}</h1>
      <p>{{ getLocalizedText('description', 'Explore financial data in a hierarchical table format with collapsible tree structure') }}</p>
    </div>

    <div class="demo-controls">
      <div class="control-group">
        <label for="dimension-select">{{ getLocalizedText('dimension', 'Dimension') }}:</label>
        <select id="dimension-select" v-model="selectedDimension">
          <option v-for="dim in dimensions" :key="dim.value" :value="dim.value">
            {{ dim.label }}
          </option>
        </select>
      </div>

      <div class="control-group">
        <label for="title-input">{{ getLocalizedText('tableTitle', 'Table Title') }}:</label>
        <input
          id="title-input"
          v-model="tableTitle"
          type="text"
          :placeholder="getLocalizedText('titlePlaceholder', 'Enter table title')"
          class="title-input"
        />
      </div>
    </div>

    <div class="data-browser-section">
      <h3>{{ getLocalizedText('dataBrowser', 'Data Browser') }}</h3>
      <p>{{ getLocalizedText('dataBrowserDescription', 'Search and browse available data entities:') }}</p>
      <DataBrowser
        :title="getLocalizedText('availableEntities', 'Available Data Entities')"
        :initial-config="{ language: tableConfig.language }"
        @result-selected="onDataBrowserSelection"
        @error="onDataBrowserError"
      />
    </div>

    <div class="table-section">
      <HierarchicalTreeTable
        v-if="currentDataPath"
        :data-path="currentDataPath"
        :title="tableTitle"
        :dimension="selectedDimension"
        :initial-config="tableConfig"
        @data-loaded="onDataLoaded"
        @row-toggled="onRowToggled"
        @error="onError"
      />
      <div v-else class="no-selection">
        <p>{{ getLocalizedText('noDataSelected', 'Please select data from the browser above to view the hierarchical table.') }}</p>
      </div>
    </div>

    <div v-if="lastLoadedData" class="metadata-section">
      <h3>{{ getLocalizedText('dataInformation', 'Data Information') }}</h3>
      <div class="metadata-grid">
        <div class="metadata-item">
          <strong>{{ getLocalizedText('dimension', 'Dimension') }}:</strong>
          {{ lastLoadedData.metadata.dimension }}
        </div>
        <div class="metadata-item" v-if="lastLoadedData.metadata.model">
          <strong>{{ getLocalizedText('model', 'Model') }}:</strong>
          {{ lastLoadedData.metadata.model }}
        </div>
        <div class="metadata-item">
          <strong>{{ getLocalizedText('totalRecords', 'Total Records') }}:</strong>
          {{ lastLoadedData.metadata.totalRecords }}
        </div>
        <div class="metadata-item">
          <strong>{{ getLocalizedText('treeNodes', 'Tree Nodes') }}:</strong>
          {{ lastLoadedData.metadata.treeStructure?.metadata.totalNodes || 'N/A' }}
        </div>
        <div class="metadata-item">
          <strong>{{ getLocalizedText('maxDepth', 'Max Depth') }}:</strong>
          {{ lastLoadedData.metadata.treeStructure?.metadata.maxDepth || 'N/A' }}
        </div>
        <div class="metadata-item">
          <strong>{{ getLocalizedText('processedAt', 'Processed At') }}:</strong>
          {{ formatDate(lastLoadedData.metadata.processedAt) }}
        </div>
      </div>
    </div>

    <div v-if="errorMessage" class="error-section">
      <h3>{{ getLocalizedText('error', 'Error') }}</h3>
      <div class="error-message">
        {{ errorMessage }}
      </div>
    </div>

    <div class="documentation-section">
      <h3>{{ getLocalizedText('usageDocumentation', 'Usage Documentation') }}</h3>
      <div class="doc-content">
        <h4>{{ getLocalizedText('dataPathFormat', 'Data Path Format') }}</h4>
        <ul>
          <li><strong>{{ getLocalizedText('gdnData', 'GDN Data') }}:</strong> <code>gdn/{entityId}/{year}</code> ({{ getLocalizedText('example', 'e.g.') }}, <code>gdn/ag/2019</code>)</li>
          <li><strong>{{ getLocalizedText('stdData', 'STD Data') }}:</strong> <code>std/{model}/{entityId}/{year}</code> ({{ getLocalizedText('example', 'e.g.') }}, <code>std/fs/ag/2019</code>)</li>
        </ul>

        <h4>{{ getLocalizedText('availableDimensions', 'Available Dimensions') }}</h4>
        <ul>
          <li><strong>aufwand:</strong> {{ getLocalizedText('expenditure', 'Expenditure/Expenses') }}</li>
          <li><strong>ertrag:</strong> {{ getLocalizedText('revenue', 'Revenue') }}</li>
          <li><strong>einnahmen:</strong> {{ getLocalizedText('income', 'Income') }}</li>
          <li><strong>ausgaben:</strong> {{ getLocalizedText('expenses', 'Expenses') }}</li>
          <li><strong>bilanz:</strong> {{ getLocalizedText('balanceSheet', 'Balance Sheet') }}</li>
        </ul>

        <h4>{{ getLocalizedText('features', 'Features') }}</h4>
        <ul>
          <li>{{ getLocalizedText('hierarchicalStructure', 'Hierarchical tree structure with collapsible nodes') }}</li>
          <li>{{ getLocalizedText('multiLanguageSupport', 'Multi-language support (German, French, Italian, English)') }}</li>
          <li>{{ getLocalizedText('configurableDisplay', 'Configurable display options (show/hide codes and values)') }}</li>
          <li>{{ getLocalizedText('responsiveDesign', 'Responsive design for mobile and desktop') }}</li>
          <li>{{ getLocalizedText('realTimeAggregation', 'Real-time data aggregation using TreeAggregator') }}</li>
        </ul>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import HierarchicalTreeTable from '../components/HierarchicalTreeTable.vue';
import DataBrowser from '../components/DataBrowser.vue';
import type { TreeAggregationResult, TreeTableConfig, DataBrowserSearchResult } from '../types/DataStructures';

// Reactive state
const currentDataPath = ref('');
const selectedDimension = ref('aufwand');
const tableTitle = ref('');
const lastLoadedData = ref<TreeAggregationResult | null>(null);
const errorMessage = ref<string | null>(null);

// Configuration
const tableConfig = reactive<Partial<TreeTableConfig>>({
  showValues: true,
  showCodes: false,
  expandAll: false,
  language: 'de',
  numberFormat: 'de-CH'
});

// Localization helper
const getLocalizedText = (key: string, fallback: string): string => {
  const texts: Record<string, Record<string, string>> = {
    title: {
      de: 'Hierarchische Baumtabelle',
      fr: 'Table arborescente hiérarchique',
      it: 'Tabella ad albero gerarchica',
      en: 'Hierarchical Tree Table'
    },
    description: {
      de: 'Erkunden Sie Finanzdaten in einem hierarchischen Tabellenformat mit zusammenklappbarer Baumstruktur',
      fr: 'Explorez les données financières dans un format de table hiérarchique avec structure arborescente pliable',
      it: 'Esplora i dati finanziari in un formato di tabella gerarchica con struttura ad albero pieghevole',
      en: 'Explore financial data in a hierarchical table format with collapsible tree structure'
    },
    dimension: {
      de: 'Dimension',
      fr: 'Dimension',
      it: 'Dimensione',
      en: 'Dimension'
    },
    tableTitle: {
      de: 'Tabellentitel',
      fr: 'Titre du tableau',
      it: 'Titolo della tabella',
      en: 'Table Title'
    },
    titlePlaceholder: {
      de: 'Tabellentitel eingeben',
      fr: 'Entrer le titre du tableau',
      it: 'Inserire il titolo della tabella',
      en: 'Enter table title'
    },
    dataBrowser: {
      de: 'Datenbrowser',
      fr: 'Navigateur de données',
      it: 'Browser dati',
      en: 'Data Browser'
    },
    dataBrowserDescription: {
      de: 'Suchen und durchsuchen Sie verfügbare Datenentitäten:',
      fr: 'Rechercher et parcourir les entités de données disponibles:',
      it: 'Cerca e sfoglia le entità dati disponibili:',
      en: 'Search and browse available data entities:'
    },
    availableEntities: {
      de: 'Verfügbare Datenentitäten',
      fr: 'Entités de données disponibles',
      it: 'Entità dati disponibili',
      en: 'Available Data Entities'
    },
    loading: {
      de: 'Lade Daten...',
      fr: 'Chargement des données...',
      it: 'Caricamento dati...',
      en: 'Loading data...'
    },
    dataInformation: {
      de: 'Dateninformationen',
      fr: 'Informations sur les données',
      it: 'Informazioni sui dati',
      en: 'Data Information'
    },
    model: {
      de: 'Modell',
      fr: 'Modèle',
      it: 'Modello',
      en: 'Model'
    },
    totalRecords: {
      de: 'Gesamtanzahl Datensätze',
      fr: 'Total des enregistrements',
      it: 'Totale record',
      en: 'Total Records'
    },
    treeNodes: {
      de: 'Baumknoten',
      fr: 'Nœuds d\'arbre',
      it: 'Nodi albero',
      en: 'Tree Nodes'
    },
    maxDepth: {
      de: 'Maximale Tiefe',
      fr: 'Profondeur maximale',
      it: 'Profondità massima',
      en: 'Max Depth'
    },
    processedAt: {
      de: 'Verarbeitet am',
      fr: 'Traité le',
      it: 'Elaborato il',
      en: 'Processed At'
    },
    error: {
      de: 'Fehler',
      fr: 'Erreur',
      it: 'Errore',
      en: 'Error'
    },
    dataBrowserError: {
      de: 'Datenbrowser-Fehler',
      fr: 'Erreur du navigateur de données',
      it: 'Errore browser dati',
      en: 'Data browser error'
    },
    usageDocumentation: {
      de: 'Nutzungsdokumentation',
      fr: 'Documentation d\'utilisation',
      it: 'Documentazione d\'uso',
      en: 'Usage Documentation'
    },
    dataPathFormat: {
      de: 'Datenpfad-Format',
      fr: 'Format du chemin de données',
      it: 'Formato percorso dati',
      en: 'Data Path Format'
    },
    gdnData: {
      de: 'GDN-Daten',
      fr: 'Données GDN',
      it: 'Dati GDN',
      en: 'GDN Data'
    },
    stdData: {
      de: 'STD-Daten',
      fr: 'Données STD',
      it: 'Dati STD',
      en: 'STD Data'
    },
    example: {
      de: 'z.B.',
      fr: 'p.ex.',
      it: 'ad es.',
      en: 'e.g.'
    },
    availableDimensions: {
      de: 'Verfügbare Dimensionen',
      fr: 'Dimensions disponibles',
      it: 'Dimensioni disponibili',
      en: 'Available Dimensions'
    },
    expenditure: {
      de: 'Ausgaben/Aufwand',
      fr: 'Dépenses/Charges',
      it: 'Spese/Costi',
      en: 'Expenditure/Expenses'
    },
    revenue: {
      de: 'Ertrag',
      fr: 'Revenus',
      it: 'Ricavi',
      en: 'Revenue'
    },
    income: {
      de: 'Einnahmen',
      fr: 'Recettes',
      it: 'Entrate',
      en: 'Income'
    },
    expenses: {
      de: 'Ausgaben',
      fr: 'Dépenses',
      it: 'Spese',
      en: 'Expenses'
    },
    balanceSheet: {
      de: 'Bilanz',
      fr: 'Bilan',
      it: 'Bilancio',
      en: 'Balance Sheet'
    },
    features: {
      de: 'Funktionen',
      fr: 'Fonctionnalités',
      it: 'Funzionalità',
      en: 'Features'
    },
    hierarchicalStructure: {
      de: 'Hierarchische Baumstruktur mit zusammenklappbaren Knoten',
      fr: 'Structure arborescente hiérarchique avec nœuds pliables',
      it: 'Struttura ad albero gerarchica con nodi pieghevoli',
      en: 'Hierarchical tree structure with collapsible nodes'
    },
    multiLanguageSupport: {
      de: 'Mehrsprachige Unterstützung (Deutsch, Französisch, Italienisch, Englisch)',
      fr: 'Support multilingue (allemand, français, italien, anglais)',
      it: 'Supporto multilingue (tedesco, francese, italiano, inglese)',
      en: 'Multi-language support (German, French, Italian, English)'
    },
    configurableDisplay: {
      de: 'Konfigurierbare Anzeigeoptionen (Codes und Werte ein-/ausblenden)',
      fr: 'Options d\'affichage configurables (afficher/masquer codes et valeurs)',
      it: 'Opzioni di visualizzazione configurabili (mostra/nascondi codici e valori)',
      en: 'Configurable display options (show/hide codes and values)'
    },
    responsiveDesign: {
      de: 'Responsives Design für Mobilgeräte und Desktop',
      fr: 'Design réactif pour mobile et bureau',
      it: 'Design responsivo per mobile e desktop',
      en: 'Responsive design for mobile and desktop'
    },
    realTimeAggregation: {
      de: 'Echtzeitdatenaggregation mit TreeAggregator',
      fr: 'Agrégation de données en temps réel avec TreeAggregator',
      it: 'Aggregazione dati in tempo reale con TreeAggregator',
      en: 'Real-time data aggregation using TreeAggregator'
    },
    noDataSelected: {
      de: 'Bitte wählen Sie Daten aus dem Browser oben aus, um die hierarchische Tabelle anzuzeigen.',
      fr: 'Veuillez sélectionner des données dans le navigateur ci-dessus pour afficher le tableau hiérarchique.',
      it: 'Seleziona i dati dal browser sopra per visualizzare la tabella gerarchica.',
      en: 'Please select data from the browser above to view the hierarchical table.'
    }
  };

  const currentLang = tableConfig.language || 'de';
  return texts[key]?.[currentLang] || fallback;
};

// Available dimensions
const dimensions = [
  { value: 'aufwand', label: 'Aufwand (Expenditure)' },
  { value: 'ertrag', label: 'Ertrag (Revenue)' },
  { value: 'einnahmen', label: 'Einnahmen (Income)' },
  { value: 'ausgaben', label: 'Ausgaben (Expenses)' },
  { value: 'bilanz', label: 'Bilanz (Balance Sheet)' }
];

// Methods
const loadDataFromSelection = (dataPath: string, title: string) => {
  errorMessage.value = null;
  lastLoadedData.value = null;
  currentDataPath.value = dataPath;
  tableTitle.value = title;
};

const onDataLoaded = (data: TreeAggregationResult) => {
  lastLoadedData.value = data;
  errorMessage.value = null;
  console.log('Data loaded successfully:', data);
};

const onRowToggled = (rowId: string, isExpanded: boolean) => {
  console.log(`Row ${rowId} ${isExpanded ? 'expanded' : 'collapsed'}`);
};

const onError = (error: string) => {
  errorMessage.value = error;
  lastLoadedData.value = null;
  console.error('Error loading data:', error);
};

const onDataBrowserSelection = (result: DataBrowserSearchResult) => {
  console.log('Data browser selection:', result);

  // Convert the selected result to a data path format and load data
  const currentLang = (tableConfig.language || 'de') as keyof typeof result.displayName;

  if (result.type === 'std') {
    // For STD data: std/fs/entityCode/year (always use 'fs' model)
    const latestYear = result.availableYears[result.availableYears.length - 1];
    const dataPath = `std/fs/${result.entityCode}/${latestYear}`;
    const title = `${result.displayName[currentLang] || result.displayName.de} ${latestYear} (FS)`;
    loadDataFromSelection(dataPath, title);
  } else if (result.type === 'gdn') {
    // For GDN data: gdn/fs/entityCode/year (always use 'fs' model)
    const latestYear = result.availableYears[result.availableYears.length - 1];
    const dataPath = `gdn/fs/${result.entityCode}/${latestYear}`;
    const title = `${result.displayName[currentLang] || result.displayName.de} ${latestYear}`;
    loadDataFromSelection(dataPath, title);
  }
};

const onDataBrowserError = (error: string) => {
  console.error('Data browser error:', error);
  errorMessage.value = `${getLocalizedText('dataBrowserError', 'Data browser error')}: ${error}`;
};

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleString(tableConfig.language || 'de-CH');
};
</script>

<style scoped>
.tree-table-view {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.header {
  text-align: center;
  margin-bottom: 2rem;
}

.header h1 {
  color: var(--color-heading, #2c3e50);
  margin-bottom: 0.5rem;
}

.header p {
  color: var(--color-text-soft, #6c757d);
  font-size: 1.1rem;
}

.demo-controls {
  background-color: var(--color-background-soft, #f8f9fa);
  padding: 1.5rem;
  border-radius: 8px;
  margin-bottom: 2rem;
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
}

.control-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.control-group label {
  font-weight: 600;
  color: var(--color-heading, #2c3e50);
}

.title-input,
select {
  padding: 0.75rem;
  border: 1px solid var(--color-border, #ddd);
  border-radius: 4px;
  font-size: 1rem;
}

.loading-section {
  margin-bottom: 2rem;
  padding: 2rem;
  text-align: center;
  background-color: var(--color-background-soft, #f8f9fa);
  border-radius: 8px;
  border: 1px solid var(--color-border, #ddd);
}

.loading-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid var(--color-background-mute, #f1f3f4);
  border-top: 4px solid var(--color-primary, #007bff);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-spinner p {
  margin: 0;
  color: var(--color-text-soft, #6c757d);
  font-size: 1rem;
}

.data-browser-section {
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: var(--color-background-soft, #f8f9fa);
  border-radius: 8px;
  border: 1px solid var(--color-border, #ddd);
}

.data-browser-section h3 {
  margin: 0 0 0.5rem 0;
  color: var(--color-heading, #2c3e50);
  font-size: 1.25rem;
}

.data-browser-section p {
  margin: 0 0 1rem 0;
  color: var(--color-text-soft, #6c757d);
  font-size: 0.875rem;
}

.table-section {
  margin-bottom: 2rem;
}

.no-selection {
  text-align: center;
  padding: 3rem 2rem;
  background-color: var(--color-background-soft, #f8f9fa);
  border-radius: 8px;
  border: 1px solid var(--color-border, #ddd);
}

.no-selection p {
  margin: 0;
  color: var(--color-text-soft, #6c757d);
  font-size: 1.1rem;
}

.metadata-section,
.error-section,
.documentation-section {
  margin-bottom: 2rem;
}

.metadata-section h3,
.error-section h3,
.documentation-section h3 {
  margin-bottom: 1rem;
  color: var(--color-heading, #2c3e50);
}

.metadata-grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  background-color: var(--color-background-soft, #f8f9fa);
  padding: 1rem;
  border-radius: 8px;
}

.metadata-item {
  padding: 0.5rem;
}

.error-message {
  background-color: var(--color-danger-soft, #f8d7da);
  color: var(--color-danger, #dc3545);
  padding: 1rem;
  border-radius: 4px;
  border: 1px solid var(--color-danger-border, #f5c6cb);
}

.doc-content {
  background-color: var(--color-background-soft, #f8f9fa);
  padding: 1.5rem;
  border-radius: 8px;
}

.doc-content h4 {
  margin-top: 1.5rem;
  margin-bottom: 0.5rem;
  color: var(--color-heading, #2c3e50);
}

.doc-content h4:first-child {
  margin-top: 0;
}

.doc-content ul {
  margin-bottom: 1rem;
}

.doc-content code {
  background-color: var(--color-background-mute, #f1f3f4);
  padding: 0.2rem 0.4rem;
  border-radius: 3px;
  font-family: 'Courier New', monospace;
  font-size: 0.9rem;
}

/* Responsive design */
@media (max-width: 768px) {
  .tree-table-view {
    padding: 1rem;
  }

  .demo-controls {
    grid-template-columns: 1fr;
  }

  .example-buttons {
    flex-direction: column;
  }

  .metadata-grid {
    grid-template-columns: 1fr;
  }
}
</style>
