import type {
  TreeStructure,
  TreeNode,
  GdnDataRecord,
  StdDataRecord,
  AggregatedDataPoint,
  MultiLanguageLabels
} from '../types/DataStructures';

/**
 * Configuration for tree aggregation
 */
export interface TreeAggregationConfig {
  baseUrl?: string;
  language?: keyof MultiLanguageLabels;
  includeZeroValues?: boolean;
  maxDepth?: number;
}

/**
 * Result of tree aggregation operation
 */
export interface TreeAggregationResult {
  aggregatedData: AggregatedDataPoint[];
  metadata: {
    treeStructure: TreeStructure;
    totalRecords: number;
    processedAt: string;
    dimension: string;
    model?: string;
  };
  errors?: string[];
}

/**
 * Tree aggregation utility for calculating hierarchical data sums
 */
export class TreeAggregator {
  private config: Required<TreeAggregationConfig>;
  private treeCache: Map<string, TreeStructure> = new Map();

  constructor(config: TreeAggregationConfig = {}) {
    this.config = {
      baseUrl: '/data',
      language: 'de',
      includeZeroValues: false,
      maxDepth: 10,
      ...config
    };
  }

  /**
   * Load tree structure from file
   */
  async loadTreeStructure(dimension: string, model?: string): Promise<TreeStructure> {
    const cacheKey = model ? `${dimension}-${model}` : dimension;

    if (this.treeCache.has(cacheKey)) {
      return this.treeCache.get(cacheKey)!;
    }

    try {
      const filename = model ? `${dimension}-${model}-tree.json` : `${dimension}-tree.json`;
      const url = `${this.config.baseUrl}/trees/${filename}`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to load tree structure: ${response.status} ${response.statusText}`);
      }

      const treeStructure: TreeStructure = await response.json();
      this.treeCache.set(cacheKey, treeStructure);

      return treeStructure;
    } catch (error) {
      throw new Error(`Error loading tree structure for ${dimension}${model ? `-${model}` : ''}: ${error}`);
    }
  }

  /**
   * Aggregate GDN data using tree structure
   */
  async aggregateGdnData(
    data: GdnDataRecord[],
    dimension: string,
    entityId: string,
    year: string
  ): Promise<TreeAggregationResult> {
    const treeStructure = await this.loadTreeStructure(dimension);
    const errors: string[] = [];

    // Create a map of account codes to values
    const dataMap = new Map<string, number>();
    let totalRecords = 0;

    for (const record of data) {
      try {
        const value = this.parseNumericValue(record.betrag);
        if (value !== null) {
          const key = record.funktion ? `${record.konto}-${record.funktion}` : record.konto;
          dataMap.set(key, (dataMap.get(key) || 0) + value);
          totalRecords++;
        }
      } catch (error) {
        errors.push(`Error processing record ${record.konto}: ${error}`);
      }
    }

    // Calculate aggregated values for each tree node
    const aggregatedData = this.calculateTreeAggregation(
      treeStructure.tree,
      dataMap,
      entityId,
      year,
      dimension
    );

    return {
      aggregatedData,
      metadata: {
        treeStructure,
        totalRecords,
        processedAt: new Date().toISOString(),
        dimension
      },
      errors: errors.length > 0 ? errors : undefined
    };
  }

  /**
   * Aggregate STD data using tree structure
   */
  async aggregateStdData(
    data: StdDataRecord[],
    dimension: string,
    entityId: string,
    year: string,
    model: string = 'fs'
  ): Promise<TreeAggregationResult> {
    const treeStructure = await this.loadTreeStructure(dimension, model);
    const errors: string[] = [];

    // Create a map of account codes to values
    const dataMap = new Map<string, number>();
    let totalRecords = 0;

    for (const record of data) {
      try {
        if (record.dim === dimension && record.model === model && record.jahr === year) {
          const value = this.parseNumericValue(record.value);
          if (value !== null) {
            const key = record.funk ? `${record.arten}-${record.funk}` : record.arten;
            dataMap.set(key, (dataMap.get(key) || 0) + value);
            totalRecords++;
          }
        }
      } catch (error) {
        errors.push(`Error processing record ${record.arten}: ${error}`);
      }
    }

    // Calculate aggregated values for each tree node
    const aggregatedData = this.calculateTreeAggregation(
      treeStructure.tree,
      dataMap,
      entityId,
      year,
      dimension,
      record => record.unit
    );

    return {
      aggregatedData,
      metadata: {
        treeStructure,
        totalRecords,
        processedAt: new Date().toISOString(),
        dimension,
        model
      },
      errors: errors.length > 0 ? errors : undefined
    };
  }

  /**
   * Calculate aggregated values for tree nodes recursively
   */
  private calculateTreeAggregation(
    node: TreeNode,
    dataMap: Map<string, number>,
    entityId: string,
    year: string,
    dimension: string,
    unitExtractor?: (record: StdDataRecord) => string
  ): AggregatedDataPoint[] {
    const results: AggregatedDataPoint[] = [];

    // Calculate value for current node
    let nodeValue = 0;
    let hasDirectValue = false;

    // Check if this node has a direct value in the data
    if (dataMap.has(node.code)) {
      nodeValue = dataMap.get(node.code)!;
      hasDirectValue = true;
    }

    // Recursively calculate values for children
    let childrenTotal = 0;
    for (const child of node.children) {
      const childResults = this.calculateTreeAggregation(
        child,
        dataMap,
        entityId,
        year,
        dimension,
        unitExtractor
      );
      results.push(...childResults);

      // Sum up children values
      const childValue = childResults.find(r => r.code === child.code)?.value || 0;
      childrenTotal += childValue;
    }

    // If no direct value, use sum of children
    if (!hasDirectValue && childrenTotal > 0) {
      nodeValue = childrenTotal;
    }

    // Add current node to results if it has a value or if we include zero values
    if (nodeValue !== 0 || this.config.includeZeroValues) {
      results.unshift({
        entityId,
        entityName: '', // Will be filled by caller if needed
        year,
        code: node.code,
        label: node.labels[this.config.language],
        value: nodeValue,
        dimension,
        unit: 'CHF' // Default unit, can be enhanced later
      });
    }

    return results;
  }

  /**
   * Parse numeric value from string or number
   */
  private parseNumericValue(value: string | number): number | null {
    if (typeof value === 'number') {
      return isNaN(value) ? null : value;
    }

    if (typeof value === 'string') {
      // Remove common formatting characters
      const cleaned = value.replace(/[,\s]/g, '').replace(/'/g, '');

      // Handle scientific notation
      if (cleaned.includes('e+') || cleaned.includes('E+')) {
        const parsed = parseFloat(cleaned);
        return isNaN(parsed) ? null : parsed;
      }

      const parsed = parseFloat(cleaned);
      return isNaN(parsed) ? null : parsed;
    }

    return null;
  }

  /**
   * Clear the tree structure cache
   */
  clearCache(): void {
    this.treeCache.clear();
  }

  /**
   * Get available tree structures
   */
  async getAvailableTreeStructures(): Promise<string[]> {
    try {
      const response = await fetch(`${this.config.baseUrl}/trees/`);
      if (!response.ok) {
        throw new Error('Failed to fetch tree structure list');
      }

      const html = await response.text();
      const matches = html.match(/href="([^"]*-tree\.json)"/g);

      if (!matches) {
        return [];
      }

      return matches.map(match => {
        const filename = match.match(/href="([^"]*)"/)?.[1];
        return filename?.replace('-tree.json', '') || '';
      }).filter(Boolean);
    } catch (error) {
      console.warn('Could not fetch available tree structures:', error);
      return [];
    }
  }
}

/**
 * Default instance for convenience
 */
export const defaultTreeAggregator = new TreeAggregator();

/**
 * Convenience function for aggregating GDN data
 */
export async function aggregateGdnData(
  data: GdnDataRecord[],
  dimension: string,
  entityId: string,
  year: string,
  config?: TreeAggregationConfig
): Promise<TreeAggregationResult> {
  const aggregator = config ? new TreeAggregator(config) : defaultTreeAggregator;
  return aggregator.aggregateGdnData(data, dimension, entityId, year);
}

/**
 * Convenience function for aggregating STD data
 */
export async function aggregateStdData(
  data: StdDataRecord[],
  dimension: string,
  entityId: string,
  year: string,
  config?: TreeAggregationConfig,
  model: string = 'fs'
): Promise<TreeAggregationResult> {
  const aggregator = config ? new TreeAggregator(config) : defaultTreeAggregator;
  return aggregator.aggregateStdData(data, dimension, entityId, year, model);
}
