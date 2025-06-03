import type { MultiLanguageLabels } from '@/types/DataStructures';
import type { SupportedLanguage } from '@/composables/useLanguage';

/**
 * Translation key definitions for type safety
 */
export interface TranslationKeys {
  // Common UI elements
  common: {
    loading: MultiLanguageLabels;
    error: MultiLanguageLabels;
    noData: MultiLanguageLabels;
    search: MultiLanguageLabels;
    clear: MultiLanguageLabels;
    select: MultiLanguageLabels;
    cancel: MultiLanguageLabels;
    confirm: MultiLanguageLabels;
    save: MultiLanguageLabels;
    close: MultiLanguageLabels;
    back: MultiLanguageLabels;
    next: MultiLanguageLabels;
    previous: MultiLanguageLabels;
    all: MultiLanguageLabels;
    none: MultiLanguageLabels;
  };
  
  // Navigation and layout
  navigation: {
    home: MultiLanguageLabels;
    about: MultiLanguageLabels;
    treeTable: MultiLanguageLabels;
    calendar: MultiLanguageLabels;
    messages: MultiLanguageLabels;
    profile: MultiLanguageLabels;
  };
  
  // Data browser
  dataBrowser: {
    title: MultiLanguageLabels;
    searchPlaceholder: MultiLanguageLabels;
    noResults: MultiLanguageLabels;
    resultsCount: MultiLanguageLabels;
    filterAll: MultiLanguageLabels;
    filterStandard: MultiLanguageLabels;
    filterMunicipalities: MultiLanguageLabels;
    yearRangeFrom: MultiLanguageLabels;
    yearRangeTo: MultiLanguageLabels;
    showDescriptions: MultiLanguageLabels;
    showYearRange: MultiLanguageLabels;
    showModelInfo: MultiLanguageLabels;
  };
  
  // Tree table
  treeTable: {
    title: MultiLanguageLabels;
    noDataSelected: MultiLanguageLabels;
    realTimeAggregation: MultiLanguageLabels;
    labelColumn: MultiLanguageLabels;
    codeColumn: MultiLanguageLabels;
    valueColumn: MultiLanguageLabels;
    expandAll: MultiLanguageLabels;
    collapseAll: MultiLanguageLabels;
  };
  
  // Language selector
  languageSelector: {
    selectLanguage: MultiLanguageLabels;
    currentLanguage: MultiLanguageLabels;
  };
}

/**
 * Default translations for the application
 */
export const translations: TranslationKeys = {
  common: {
    loading: {
      de: 'Laden...',
      en: 'Loading...',
      fr: 'Chargement...',
      it: 'Caricamento...'
    },
    error: {
      de: 'Fehler',
      en: 'Error',
      fr: 'Erreur',
      it: 'Errore'
    },
    noData: {
      de: 'Keine Daten verfügbar',
      en: 'No data available',
      fr: 'Aucune donnée disponible',
      it: 'Nessun dato disponibile'
    },
    search: {
      de: 'Suchen',
      en: 'Search',
      fr: 'Rechercher',
      it: 'Cerca'
    },
    clear: {
      de: 'Löschen',
      en: 'Clear',
      fr: 'Effacer',
      it: 'Cancella'
    },
    select: {
      de: 'Auswählen',
      en: 'Select',
      fr: 'Sélectionner',
      it: 'Seleziona'
    },
    cancel: {
      de: 'Abbrechen',
      en: 'Cancel',
      fr: 'Annuler',
      it: 'Annulla'
    },
    confirm: {
      de: 'Bestätigen',
      en: 'Confirm',
      fr: 'Confirmer',
      it: 'Conferma'
    },
    save: {
      de: 'Speichern',
      en: 'Save',
      fr: 'Enregistrer',
      it: 'Salva'
    },
    close: {
      de: 'Schließen',
      en: 'Close',
      fr: 'Fermer',
      it: 'Chiudi'
    },
    back: {
      de: 'Zurück',
      en: 'Back',
      fr: 'Retour',
      it: 'Indietro'
    },
    next: {
      de: 'Weiter',
      en: 'Next',
      fr: 'Suivant',
      it: 'Avanti'
    },
    previous: {
      de: 'Vorherige',
      en: 'Previous',
      fr: 'Précédent',
      it: 'Precedente'
    },
    all: {
      de: 'Alle',
      en: 'All',
      fr: 'Tous',
      it: 'Tutti'
    },
    none: {
      de: 'Keine',
      en: 'None',
      fr: 'Aucun',
      it: 'Nessuno'
    }
  },
  
  navigation: {
    home: {
      de: 'Startseite',
      en: 'Home',
      fr: 'Accueil',
      it: 'Home'
    },
    about: {
      de: 'Über',
      en: 'About',
      fr: 'À propos',
      it: 'Informazioni'
    },
    treeTable: {
      de: 'Hierarchische Tabelle',
      en: 'Tree Table',
      fr: 'Tableau hiérarchique',
      it: 'Tabella gerarchica'
    },
    calendar: {
      de: 'Kalender',
      en: 'Calendar',
      fr: 'Calendrier',
      it: 'Calendario'
    },
    messages: {
      de: 'Nachrichten',
      en: 'Messages',
      fr: 'Messages',
      it: 'Messaggi'
    },
    profile: {
      de: 'Profil',
      en: 'Profile',
      fr: 'Profil',
      it: 'Profilo'
    }
  },
  
  dataBrowser: {
    title: {
      de: 'Daten-Browser',
      en: 'Data Browser',
      fr: 'Navigateur de données',
      it: 'Browser dati'
    },
    searchPlaceholder: {
      de: 'Suche nach Entitäten, Gemeinden oder Codes...',
      en: 'Search for entities, municipalities or codes...',
      fr: 'Rechercher des entités, communes ou codes...',
      it: 'Cerca entità, comuni o codici...'
    },
    noResults: {
      de: 'Keine Ergebnisse gefunden',
      en: 'No results found',
      fr: 'Aucun résultat trouvé',
      it: 'Nessun risultato trovato'
    },
    resultsCount: {
      de: 'Ergebnisse',
      en: 'results',
      fr: 'résultats',
      it: 'risultati'
    },
    filterAll: {
      de: 'Alle',
      en: 'All',
      fr: 'Tous',
      it: 'Tutti'
    },
    filterStandard: {
      de: 'Standard',
      en: 'Standard',
      fr: 'Standard',
      it: 'Standard'
    },
    filterMunicipalities: {
      de: 'Gemeinden',
      en: 'Municipalities',
      fr: 'Communes',
      it: 'Comuni'
    },
    yearRangeFrom: {
      de: 'Von',
      en: 'From',
      fr: 'De',
      it: 'Da'
    },
    yearRangeTo: {
      de: 'Bis',
      en: 'To',
      fr: 'À',
      it: 'A'
    },
    showDescriptions: {
      de: 'Beschreibungen',
      en: 'Descriptions',
      fr: 'Descriptions',
      it: 'Descrizioni'
    },
    showYearRange: {
      de: 'Jahresbereich',
      en: 'Year Range',
      fr: 'Plage d\'années',
      it: 'Intervallo anni'
    },
    showModelInfo: {
      de: 'Modell-Info',
      en: 'Model Info',
      fr: 'Info modèle',
      it: 'Info modello'
    }
  },
  
  treeTable: {
    title: {
      de: 'Hierarchische Datenansicht',
      en: 'Hierarchical Data View',
      fr: 'Vue hiérarchique des données',
      it: 'Vista dati gerarchica'
    },
    noDataSelected: {
      de: 'Bitte wählen Sie Daten aus dem Browser oben aus, um die hierarchische Tabelle anzuzeigen.',
      en: 'Please select data from the browser above to view the hierarchical table.',
      fr: 'Veuillez sélectionner des données dans le navigateur ci-dessus pour afficher le tableau hiérarchique.',
      it: 'Seleziona i dati dal browser sopra per visualizzare la tabella gerarchica.'
    },
    realTimeAggregation: {
      de: 'Echtzeitdatenaggregation mit TreeAggregator',
      en: 'Real-time data aggregation using TreeAggregator',
      fr: 'Agrégation de données en temps réel avec TreeAggregator',
      it: 'Aggregazione dati in tempo reale con TreeAggregator'
    },
    labelColumn: {
      de: 'Bezeichnung',
      en: 'Label',
      fr: 'Désignation',
      it: 'Denominazione'
    },
    codeColumn: {
      de: 'Code',
      en: 'Code',
      fr: 'Code',
      it: 'Codice'
    },
    valueColumn: {
      de: 'Wert',
      en: 'Value',
      fr: 'Valeur',
      it: 'Valore'
    },
    expandAll: {
      de: 'Alle erweitern',
      en: 'Expand All',
      fr: 'Tout développer',
      it: 'Espandi tutto'
    },
    collapseAll: {
      de: 'Alle einklappen',
      en: 'Collapse All',
      fr: 'Tout réduire',
      it: 'Comprimi tutto'
    }
  },
  
  languageSelector: {
    selectLanguage: {
      de: 'Sprache auswählen',
      en: 'Select language',
      fr: 'Sélectionner la langue',
      it: 'Seleziona lingua'
    },
    currentLanguage: {
      de: 'Aktuelle Sprache',
      en: 'Current language',
      fr: 'Langue actuelle',
      it: 'Lingua attuale'
    }
  }
};

/**
 * Helper function to get a translation by path
 */
export function getTranslationByPath(
  path: string,
  language: SupportedLanguage,
  fallback?: string
): string {
  const keys = path.split('.');
  let current: any = translations;
  
  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = current[key];
    } else {
      return fallback || path;
    }
  }
  
  if (current && typeof current === 'object' && language in current) {
    return current[language] || current.de || fallback || path;
  }
  
  return fallback || path;
}

/**
 * Helper function to format translation with parameters
 */
export function formatTranslation(
  translation: string,
  params: Record<string, string | number>
): string {
  return translation.replace(/\{(\w+)\}/g, (match, key) => {
    return params[key]?.toString() || match;
  });
}
