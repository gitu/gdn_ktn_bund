/**
 * Data Enricher for Swiss Financial Data
 *
 * This module provides functions to enrich raw financial data with code descriptions
 * from the codes directory, preparing it for use with the BalanceCalculator.
 */


import { getCodeLabel } from './CodelistMapper';
import type { EnrichedFinancialRecord } from './BalanceCalculator';

// Define the structure for raw financial data (from CSV files)
export interface RawFinancialRecord {
  arten: string;
  funk: string;
  jahr: string;
  value: string | number;
  dim: string;
  hh: string;
  unit: string;
  model: string;
}

/**
 * Enriches raw financial data with code descriptions
 *
 * @param rawData - Array of raw financial records from CSV files
 * @param language - Language for descriptions ('de', 'fr', 'it', 'en')
 * @returns Promise resolving to enriched financial records
 *
 * @example
 * ```typescript
 * const rawData = [
 *   {
 *     arten: "4000",
 *     funk: "",
 *     jahr: "2022",
 *     value: "1000000",
 *     dim: "einnahmen",
 *     hh: "gdn_zh",
 *     unit: "CHF",
 *     model: "fs"
 *   }
 * ];
 *
 * const enrichedData = await enrichFinancialData(rawData, 'de');
 * ```
 */
export async function enrichFinancialData(
  rawData: RawFinancialRecord[],
  _language: 'de' | 'fr' | 'it' | 'en' = 'de'
): Promise<EnrichedFinancialRecord[]> {
  const enrichedData: EnrichedFinancialRecord[] = [];

  for (const record of rawData) {
    // Convert value to number
    const numericValue = typeof record.value === 'string'
      ? parseFloat(record.value.replace(/[^0-9.-]/g, ''))
      : record.value;

    // Skip records with invalid values
    if (isNaN(numericValue)) {
      console.warn(`Skipping record with invalid value: ${record.value}`);
      continue;
    }

    // Get descriptions in all languages
    const description_de = await getCodeLabel(record.arten, record.funk, 'd', record.model, record.dim);
    const description_fr = await getCodeLabel(record.arten, record.funk, 'f', record.model, record.dim);
    const description_it = await getCodeLabel(record.arten, record.funk, 'i', record.model, record.dim);
    const description_en = await getCodeLabel(record.arten, record.funk, 'e', record.model, record.dim);

    const enrichedRecord: EnrichedFinancialRecord = {
      arten: record.arten,
      funk: record.funk,
      jahr: record.jahr,
      value: numericValue,
      dim: record.dim,
      hh: record.hh,
      unit: record.unit,
      model: record.model,
      description_de: description_de || undefined,
      description_fr: description_fr || undefined,
      description_it: description_it || undefined,
      description_en: description_en || undefined
    };

    enrichedData.push(enrichedRecord);
  }

  return enrichedData;
}

/**
 * Enriches a single financial record with code descriptions
 *
 * @param record - Raw financial record
 * @param language - Language for descriptions
 * @returns Promise resolving to enriched financial record
 */
export async function enrichSingleRecord(
  record: RawFinancialRecord,
  language: 'de' | 'fr' | 'it' | 'en' = 'de'
): Promise<EnrichedFinancialRecord | null> {
  const enrichedData = await enrichFinancialData([record], language);
  return enrichedData.length > 0 ? enrichedData[0] : null;
}

/**
 * Loads and enriches financial data from the data directory structure
 *
 * This function integrates with the updated DataLoader to load CSV data
 * from the correct directory structure and enrich it for display.
 *
 * @param entityId - Entity identifier (e.g., "010176", "ktn_zh", "bund")
 * @param year - Year to load data for
 * @param model - Model type (e.g., "fs", "gfs")
 * @param language - Language for descriptions
 * @returns Promise resolving to enriched financial records
 */
export async function loadAndEnrichEntityData(
  entityId: string,
  year: string,
  model: string = 'fs',
  language: 'de' | 'fr' | 'it' | 'en' = 'de'
): Promise<EnrichedFinancialRecord[]> {
  try {
    // Import the loadEntityData function dynamically to avoid circular imports
    const { loadEntityData } = await import('./DataLoader')

    // Load the raw data using the updated DataLoader
    const recordData = await loadEntityData(entityId, year, model)

    // Convert RecordType data to RawFinancialRecord format for enrichment
    const rawData: RawFinancialRecord[] = recordData.map(record => ({
      arten: record.konto,
      funk: record.funktion || '',
      jahr: record.jahr,
      value: record.betrag.toString(),
      dim: inferDimensionFromKonto(record.konto),
      hh: entityId,
      unit: 'CHF',
      model: model
    }))

    // Enrich the data
    return await enrichFinancialData(rawData, language)

  } catch (error) {
    console.error(`Error loading and enriching data for ${entityId}/${year}:`, error)
    return []
  }
}

/**
 * Infers the dimension type from a financial code (konto)
 * @param konto - Financial account code
 * @returns Dimension string
 */
function inferDimensionFromKonto(konto: string): string {
  const code = parseInt(konto)

  if (code >= 1000 && code < 2000) {
    return 'bilanz'
  } else if (code >= 3000 && code < 4000) {
    return 'aufwand'
  } else if (code >= 4000 && code < 5000) {
    return 'ertrag'
  } else if (code >= 5000 && code < 6000) {
    return 'ausgaben'
  } else if (code >= 6000 && code < 7000) {
    return 'einnahmen'
  } else {
    return 'sonstige'
  }
}

/**
 * Batch enrichment for multiple entities and years
 *
 * @param entities - Array of entity configurations
 * @param language - Language for descriptions
 * @returns Promise resolving to enriched financial records for all entities
 */
export async function batchEnrichData(
  entities: Array<{
    entityId: string;
    year: string;
    model?: string;
  }>,
  language: 'de' | 'fr' | 'it' | 'en' = 'de'
): Promise<EnrichedFinancialRecord[]> {
  const allEnrichedData: EnrichedFinancialRecord[] = [];

  for (const entity of entities) {
    const entityData = await loadAndEnrichEntityData(
      entity.entityId,
      entity.year,
      entity.model || 'fs',
      language
    );
    allEnrichedData.push(...entityData);
  }

  return allEnrichedData;
}

/**
 * Validates enriched financial data for balance calculation
 *
 * @param data - Enriched financial data
 * @returns Validation result with any issues found
 */
export function validateEnrichedData(data: EnrichedFinancialRecord[]): {
  isValid: boolean;
  issues: string[];
  validRecords: number;
  totalRecords: number;
} {
  const issues: string[] = [];
  let validRecords = 0;

  if (!Array.isArray(data)) {
    issues.push('Data must be an array');
    return { isValid: false, issues, validRecords: 0, totalRecords: 0 };
  }

  if (data.length === 0) {
    issues.push('Data array is empty');
    return { isValid: false, issues, validRecords: 0, totalRecords: 0 };
  }

  data.forEach((record, index) => {
    const recordIssues: string[] = [];

    // Check required fields
    if (!record.arten) recordIssues.push('missing arten');
    if (!record.jahr) recordIssues.push('missing jahr');
    if (typeof record.value !== 'number' || isNaN(record.value)) recordIssues.push('invalid value');
    if (!record.dim) recordIssues.push('missing dim');
    if (!record.hh) recordIssues.push('missing hh');
    if (!record.unit) recordIssues.push('missing unit');
    if (!record.model) recordIssues.push('missing model');

    if (recordIssues.length > 0) {
      issues.push(`Record ${index}: ${recordIssues.join(', ')}`);
    } else {
      validRecords++;
    }
  });

  return {
    isValid: issues.length === 0,
    issues,
    validRecords,
    totalRecords: data.length
  };
}
