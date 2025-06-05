/**
 * Semantic mapper for Swiss entity codes and abbreviations
 * Provides human-readable interpretations for entity codes like "gdn_ag", "sv", etc.
 */

import type { MultiLanguageLabels } from '../types/DataStructures';

/**
 * Swiss canton codes mapping
 */
const CANTON_CODES: Record<string, MultiLanguageLabels> = {
  ag: {
    de: 'Aargau',
    fr: 'Argovie',
    it: 'Argovia',
    en: 'Aargau'
  },
  ai: {
    de: 'Appenzell Innerrhoden',
    fr: 'Appenzell Rhodes-Intérieures',
    it: 'Appenzello Interno',
    en: 'Appenzell Inner Rhodes'
  },
  ar: {
    de: 'Appenzell Ausserrhoden',
    fr: 'Appenzell Rhodes-Extérieures',
    it: 'Appenzello Esterno',
    en: 'Appenzell Outer Rhodes'
  },
  be: {
    de: 'Bern',
    fr: 'Berne',
    it: 'Berna',
    en: 'Bern'
  },
  bl: {
    de: 'Basel-Landschaft',
    fr: 'Bâle-Campagne',
    it: 'Basilea Campagna',
    en: 'Basel-Country'
  },
  bs: {
    de: 'Basel-Stadt',
    fr: 'Bâle-Ville',
    it: 'Basilea Città',
    en: 'Basel-City'
  },
  fr: {
    de: 'Freiburg',
    fr: 'Fribourg',
    it: 'Friborgo',
    en: 'Fribourg'
  },
  ge: {
    de: 'Genf',
    fr: 'Genève',
    it: 'Ginevra',
    en: 'Geneva'
  },
  gl: {
    de: 'Glarus',
    fr: 'Glaris',
    it: 'Glarona',
    en: 'Glarus'
  },
  gr: {
    de: 'Graubünden',
    fr: 'Grisons',
    it: 'Grigioni',
    en: 'Grisons'
  },
  ju: {
    de: 'Jura',
    fr: 'Jura',
    it: 'Giura',
    en: 'Jura'
  },
  lu: {
    de: 'Luzern',
    fr: 'Lucerne',
    it: 'Lucerna',
    en: 'Lucerne'
  },
  ne: {
    de: 'Neuenburg',
    fr: 'Neuchâtel',
    it: 'Neuchâtel',
    en: 'Neuchâtel'
  },
  nw: {
    de: 'Nidwalden',
    fr: 'Nidwald',
    it: 'Nidvaldo',
    en: 'Nidwalden'
  },
  ow: {
    de: 'Obwalden',
    fr: 'Obwald',
    it: 'Obvaldo',
    en: 'Obwalden'
  },
  sg: {
    de: 'St. Gallen',
    fr: 'Saint-Gall',
    it: 'San Gallo',
    en: 'St. Gallen'
  },
  sh: {
    de: 'Schaffhausen',
    fr: 'Schaffhouse',
    it: 'Sciaffusa',
    en: 'Schaffhausen'
  },
  so: {
    de: 'Solothurn',
    fr: 'Soleure',
    it: 'Soletta',
    en: 'Solothurn'
  },
  sz: {
    de: 'Schwyz',
    fr: 'Schwyz',
    it: 'Svitto',
    en: 'Schwyz'
  },
  tg: {
    de: 'Thurgau',
    fr: 'Thurgovie',
    it: 'Turgovia',
    en: 'Thurgau'
  },
  ti: {
    de: 'Tessin',
    fr: 'Tessin',
    it: 'Ticino',
    en: 'Ticino'
  },
  ur: {
    de: 'Uri',
    fr: 'Uri',
    it: 'Uri',
    en: 'Uri'
  },
  vd: {
    de: 'Waadt',
    fr: 'Vaud',
    it: 'Vaud',
    en: 'Vaud'
  },
  vs: {
    de: 'Wallis',
    fr: 'Valais',
    it: 'Vallese',
    en: 'Valais'
  },
  zg: {
    de: 'Zug',
    fr: 'Zoug',
    it: 'Zugo',
    en: 'Zug'
  },
  zh: {
    de: 'Zürich',
    fr: 'Zurich',
    it: 'Zurigo',
    en: 'Zurich'
  }
};

/**
 * Entity type mappings
 */
const ENTITY_TYPES: Record<string, MultiLanguageLabels> = {
  bund: {
    de: 'Bund (CH)',
    fr: 'Confédération (CH)',
    it: 'Confederazione (CH)',
    en: 'Federal Government (CH)'
  },
  ktn: {
    de: 'Kantone (KTN)',
    fr: 'Cantons (CT)',
    it: 'Cantoni (CT)',
    en: 'Cantons (CT)'
  },
  gdn: {
    de: 'Gemeinden (GDN)',
    fr: 'Communes (COM)',
    it: 'Comuni (COM)',
    en: 'Municipalities (MUN)'
  },
  sv: {
    de: 'Sozialversicherung (SV)',
    fr: 'Assurances sociales (AS)',
    it: 'Assicurazioni sociali (AS)',
    en: 'Social Insurance (SI)'
  },
  staat: {
    de: 'Staat (ST)',
    fr: 'État (ET)',
    it: 'Stato (ST)',
    en: 'State (ST)'
  }
};

/**
 * Social insurance sub-types
 */
const SOCIAL_INSURANCE_TYPES: Record<string, MultiLanguageLabels> = {
  ahv: {
    de: 'Alters- und Hinterlassenenversicherung (AHV)',
    fr: 'Assurance-vieillesse et survivants (AVS)',
    it: 'Assicurazione vecchiaia e superstiti (AVS)',
    en: 'Old Age and Survivors Insurance (AHV/AVS)'
  },
  alv: {
    de: 'Arbeitslosenversicherung (ALV)',
    fr: 'Assurance-chômage (AC)',
    it: 'Assicurazione contro la disoccupazione (AD)',
    en: 'Unemployment Insurance (ALV)'
  },
  eo: {
    de: 'Erwerbsersatzordnung (EO)',
    fr: 'Allocations pour perte de gain (APG)',
    it: 'Indennità per perdita di guadagno (IPG)',
    en: 'Income Compensation (EO/APG)'
  },
  fl: {
    de: 'Familienzulagen (FZ)',
    fr: 'Allocations familiales (AF)',
    it: 'Assegni familiari (AF)',
    en: 'Family Allowances (FZ/AF)'
  },
  iv: {
    de: 'Invalidenversicherung (IV)',
    fr: 'Assurance-invalidité (AI)',
    it: 'Assicurazione invalidità (AI)',
    en: 'Disability Insurance (IV/AI)'
  },
  mat_ge: {
    de: 'Allocation de maternité Genève',
    fr: 'Allocation de maternité Genève',
    it: 'Allocation de maternité Genève',
    en: 'Allocation de maternité Genève'
  }
};

/**
 * EntitySemanticMapper class for interpreting entity codes
 */
export class EntitySemanticMapper {
  /**
   * Get semantic interpretation of an entity code
   */
  static getEntityDisplayName(entityCode: string): MultiLanguageLabels {
    // Handle complex entity codes like "gdn_ag", "ktn_zh", "sv_ahv", etc.
    const parts = entityCode.toLowerCase().split('_');

    if (parts.length === 1) {
      // Simple entity codes
      return ENTITY_TYPES[parts[0]] || this.createFallbackLabels(entityCode);
    }

    if (parts.length === 2) {
      const [entityType, subType] = parts;

      // Handle canton-specific entities
      if ((entityType === 'gdn' || entityType === 'ktn') && CANTON_CODES[subType]) {
        const cantonName = CANTON_CODES[subType];
        const entityTypeName = ENTITY_TYPES[entityType];

        return {
          de: `${entityTypeName?.de || entityType} ${cantonName.de}`,
          fr: `${entityTypeName?.fr || entityType} ${cantonName.fr}`,
          it: `${entityTypeName?.it || entityType} ${cantonName.it}`,
          en: `${entityTypeName?.en || entityType} ${cantonName.en}`
        };
      }

      // Handle social insurance types
      if (entityType === 'sv' && SOCIAL_INSURANCE_TYPES[subType]) {
        return SOCIAL_INSURANCE_TYPES[subType];
      }

      // Handle other combinations
      const baseEntity = ENTITY_TYPES[entityType];
      const subEntity = ENTITY_TYPES[subType] || CANTON_CODES[subType];

      if (baseEntity && subEntity) {
        return {
          de: `${baseEntity.de} ${subEntity.de}`,
          fr: `${baseEntity.fr} ${subEntity.fr}`,
          it: `${baseEntity.it} ${subEntity.it}`,
          en: `${baseEntity.en} ${subEntity.en}`
        };
      }
    }

    if (parts.length === 3) {
      // Handle complex codes like "ktn_gdn_ag" and "sv_mat_ge"
      const [level1, level2, level3] = parts;

      if (level1 === 'ktn' && level2 === 'gdn' && CANTON_CODES[level3]) {
        const cantonName = CANTON_CODES[level3];
        return {
          de: `Gemeinden Kanton ${cantonName.de}`,
          fr: `Communes Canton ${cantonName.fr}`,
          it: `Comuni Cantone ${cantonName.it}`,
          en: `Municipalities Canton ${cantonName.en}`
        };
      }

      // Handle social insurance with compound codes like "sv_mat_ge"
      if (level1 === 'sv') {
        const compoundKey = `${level2}_${level3}`;
        if (SOCIAL_INSURANCE_TYPES[compoundKey]) {
          return SOCIAL_INSURANCE_TYPES[compoundKey];
        }
      }
    }

    // Fallback to original code
    return this.createFallbackLabels(entityCode);
  }

  /**
   * Get description for an entity code
   */
  static getEntityDescription(entityCode: string): MultiLanguageLabels {
    const parts = entityCode.toLowerCase().split('_');

    if (parts.length === 2 && parts[0] === 'gdn' && CANTON_CODES[parts[1]]) {
      const cantonName = CANTON_CODES[parts[1]];
      return {
        de: `Alle Gemeinden des Kantons ${cantonName.de}`,
        fr: `Toutes les communes du canton ${cantonName.fr}`,
        it: `Tutti i comuni del cantone ${cantonName.it}`,
        en: `All municipalities of Canton ${cantonName.en}`
      };
    }

    if (parts[0] === 'sv') {
      return {
        de: 'Sozialversicherungsdaten der Schweiz',
        fr: 'Données des assurances sociales suisses',
        it: 'Dati delle assicurazioni sociali svizzere',
        en: 'Swiss social insurance data'
      };
    }

    if (parts[0] === 'bund') {
      return {
        de: 'Bundesdaten der Schweiz',
        fr: 'Données fédérales suisses',
        it: 'Dati federali svizzeri',
        en: 'Swiss federal data'
      };
    }

    // Default description
    return {
      de: `Daten für ${entityCode}`,
      fr: `Données pour ${entityCode}`,
      it: `Dati per ${entityCode}`,
      en: `Data for ${entityCode}`
    };
  }

  /**
   * Create fallback labels when no mapping is found
   */
  private static createFallbackLabels(code: string): MultiLanguageLabels {
    const formatted = code.toUpperCase().replace(/_/g, ' ');
    return {
      de: formatted,
      fr: formatted,
      it: formatted,
      en: formatted
    };
  }

  /**
   * Get all available canton codes
   */
  static getCantonCodes(): string[] {
    return Object.keys(CANTON_CODES);
  }

  /**
   * Get all available entity types
   */
  static getEntityTypes(): string[] {
    return Object.keys(ENTITY_TYPES);
  }

  /**
   * Check if a code represents a canton-specific entity
   */
  static isCantonSpecific(entityCode: string): boolean {
    const parts = entityCode.toLowerCase().split('_');
    return parts.length >= 2 && CANTON_CODES[parts[parts.length - 1]] !== undefined;
  }

  /**
   * Check if a code represents social insurance
   */
  static isSocialInsurance(entityCode: string): boolean {
    return entityCode.toLowerCase().startsWith('sv');
  }
}
