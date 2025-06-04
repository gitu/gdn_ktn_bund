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
  balanceSheet: AggregatedDataPoint[];
  incomeStatement: AggregatedDataPoint[];
  metadata: {
    balanceSheetStructure: TreeStructure;
    incomeStatementStructure: TreeStructure;
    totalRecords: number;
    processedAt: string;
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
  async loadTreeStructure(dimension: string, model: string = 'fs'): Promise<TreeStructure> {
    const cacheKey = `${dimension}-${model}`;

    if (this.treeCache.has(cacheKey)) {
      return this.treeCache.get(cacheKey)!;
    }

    try {
      const filename = `${dimension}-${model}-tree.json`;
      const url = `${this.config.baseUrl}/trees/${filename}`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to load tree structure: ${response.status} ${response.statusText}`);
      }

      const treeStructure: TreeStructure = await response.json();
      this.treeCache.set(cacheKey, treeStructure);

      return treeStructure;
    } catch (error) {
      throw new Error(`Error loading tree structure for ${dimension}-${model}: ${error}`);
    }
  }

  /**
   * Aggregate GDN data into consolidated financial statements
   */
  async aggregateGdnData(
    data: GdnDataRecord[],
    entityId: string,
    year: string,
    model: string = 'fs'
  ): Promise<TreeAggregationResult> {
    const errors: string[] = [];

    // Load tree structures for all dimensions
    const [bilanzStructure, ertragStructure, aufwandStructure] = await Promise.all([
      this.loadTreeStructure('bilanz', model),
      this.loadTreeStructure('ertrag', model),
      this.loadTreeStructure('aufwand', model)
    ]);

    // Process data by dimension and function
    const bilanzData = new Map<string, number>();
    const ertragData = new Map<string, number>();
    const aufwandData = new Map<string, number>();
    let totalRecords = 0;

    for (const record of data) {
      try {
        const value = this.parseNumericValue(record.betrag);
        if (value !== null) {
          const dimension = this.determineDimensionFromKonto(record.konto);
          const key = record.funktion ? `${record.konto}-${record.funktion}` : record.konto;

          switch (dimension) {
            case 'bilanz':
              bilanzData.set(key, (bilanzData.get(key) || 0) + value);
              break;
            case 'ertrag':
              ertragData.set(key, (ertragData.get(key) || 0) + value);
              break;
            case 'aufwand':
              aufwandData.set(key, (aufwandData.get(key) || 0) + value);
              break;
          }
          totalRecords++;
        }
      } catch (error) {
        errors.push(`Error processing record ${record.konto}: ${error}`);
      }
    }

    // Generate balance sheet
    const balanceSheet = this.calculateTreeAggregation(
      bilanzStructure.tree,
      bilanzData,
      entityId,
      year,
      'bilanz'
    );

    // Generate combined income statement
    const incomeStatement = this.generateCombinedIncomeStatement(
      ertragStructure,
      aufwandStructure,
      ertragData,
      aufwandData,
      entityId,
      year
    );

    return {
      balanceSheet,
      incomeStatement,
      metadata: {
        balanceSheetStructure: bilanzStructure,
        incomeStatementStructure: this.createCombinedIncomeStructure(ertragStructure, aufwandStructure),
        totalRecords,
        processedAt: new Date().toISOString(),
        model
      },
      errors: errors.length > 0 ? errors : undefined
    };
  }

  /**
   * Aggregate STD data into consolidated financial statements
   */
  async aggregateStdData(
    data: StdDataRecord[],
    entityId: string,
    year: string,
    model: string = 'fs'
  ): Promise<TreeAggregationResult> {
    const errors: string[] = [];

    // Load tree structures for all dimensions
    const [bilanzStructure, ertragStructure, aufwandStructure] = await Promise.all([
      this.loadTreeStructure('bilanz', model),
      this.loadTreeStructure('ertrag', model),
      this.loadTreeStructure('aufwand', model)
    ]);

    // Process data by dimension and function
    const bilanzData = new Map<string, number>();
    const ertragData = new Map<string, number>();
    const aufwandData = new Map<string, number>();
    let totalRecords = 0;

    for (const record of data) {
      try {
        if (record.model === model && record.jahr === year) {
          const value = this.parseNumericValue(record.value);
          if (value !== null) {
            const key = record.funk ? `${record.arten}-${record.funk}` : record.arten;

            switch (record.dim) {
              case 'bilanz':
                bilanzData.set(key, (bilanzData.get(key) || 0) + value);
                break;
              case 'ertrag':
                ertragData.set(key, (ertragData.get(key) || 0) + value);
                break;
              case 'aufwand':
                aufwandData.set(key, (aufwandData.get(key) || 0) + value);
                break;
            }
            totalRecords++;
          }
        }
      } catch (error) {
        errors.push(`Error processing record ${record.arten}: ${error}`);
      }
    }

    // Generate balance sheet
    const balanceSheet = this.calculateTreeAggregation(
      bilanzStructure.tree,
      bilanzData,
      entityId,
      year,
      'bilanz'
    );

    // Generate combined income statement
    const incomeStatement = this.generateCombinedIncomeStatement(
      ertragStructure,
      aufwandStructure,
      ertragData,
      aufwandData,
      entityId,
      year
    );

    return {
      balanceSheet,
      incomeStatement,
      metadata: {
        balanceSheetStructure: bilanzStructure,
        incomeStatementStructure: this.createCombinedIncomeStructure(ertragStructure, aufwandStructure),
        totalRecords,
        processedAt: new Date().toISOString(),
        model
      },
      errors: errors.length > 0 ? errors : undefined
    };
  }

  /**
   * Determine dimension from account code (konto)
   */
  private determineDimensionFromKonto(konto: string): string {
    const firstDigit = konto.charAt(0);
    switch (firstDigit) {
      case '1':
      case '2':
        return 'bilanz';
      case '3':
        return 'aufwand';
      case '4':
        return 'ertrag';
      default:
        return 'bilanz'; // Default fallback
    }
  }

  /**
   * Generate combined income statement with profit/loss calculation
   */
  private generateCombinedIncomeStatement(
    ertragStructure: TreeStructure,
    aufwandStructure: TreeStructure,
    ertragData: Map<string, number>,
    aufwandData: Map<string, number>,
    entityId: string,
    year: string
  ): AggregatedDataPoint[] {
    const results: AggregatedDataPoint[] = [];

    // Calculate revenue (positive values)
    const ertragResults = this.calculateTreeAggregation(
      ertragStructure.tree,
      ertragData,
      entityId,
      year,
      'ertrag'
    );

    // Calculate expenses (negative values)
    const aufwandResults = this.calculateTreeAggregation(
      aufwandStructure.tree,
      aufwandData,
      entityId,
      year,
      'aufwand'
    ).map(item => ({
      ...item,
      value: -Math.abs(item.value) // Ensure expenses are negative
    }));

    // Calculate totals
    const totalErtrag = ertragResults.find(r => r.code === 'root')?.value || 0;
    const totalAufwand = aufwandResults.find(r => r.code === 'root')?.value || 0;
    const profitLoss = totalErtrag + totalAufwand; // aufwand is already negative

    // Add profit/loss at the top
    results.push({
      entityId,
      entityName: '',
      year,
      code: 'profit_loss',
      label: 'Profit/Loss (Gewinn/Verlust)',
      value: profitLoss,
      dimension: 'income_statement',
      unit: 'CHF'
    });

    // Add revenue section
    results.push(...ertragResults);

    // Add expenses section
    results.push(...aufwandResults);

    return results;
  }

  /**
   * Create combined income statement structure
   */
  private createCombinedIncomeStructure(
    ertragStructure: TreeStructure,
    aufwandStructure: TreeStructure
  ): TreeStructure {
    return {
      metadata: {
        dimension: 'income_statement',
        model: ertragStructure.metadata.model,
        source: 'combined',
        generatedAt: new Date().toISOString(),
        totalNodes: ertragStructure.metadata.totalNodes + aufwandStructure.metadata.totalNodes + 1,
        maxDepth: Math.max(ertragStructure.metadata.maxDepth, aufwandStructure.metadata.maxDepth)
      },
      tree: {
        code: 'income_statement',
        labels: {
          de: 'Erfolgsrechnung',
          fr: 'Compte de résultat',
          it: 'Conto economico',
          en: 'Income Statement'
        },
        children: [
          {
            code: 'profit_loss',
            labels: {
              de: 'Gewinn/Verlust',
              fr: 'Bénéfice/Perte',
              it: 'Utile/Perdita',
              en: 'Profit/Loss'
            },
            children: [],
            level: 1,
            hasValue: true
          },
          ertragStructure.tree,
          aufwandStructure.tree
        ],
        level: 0,
        hasValue: true
      }
    };
  }

  /**
   * Calculate aggregated values for tree nodes recursively with funk-based splitting
   */
  private calculateTreeAggregation(
    node: TreeNode,
    dataMap: Map<string, number>,
    entityId: string,
    year: string,
    dimension: string
  ): AggregatedDataPoint[] {
    const results: AggregatedDataPoint[] = [];

    // Calculate value for current node
    let nodeValue = 0;
    let hasDirectValue = false;

    // Check for direct value (without funk)
    if (dataMap.has(node.code)) {
      nodeValue += dataMap.get(node.code)!;
      hasDirectValue = true;
    }

    // Check for funk-based values (only at specific account level)
    const funkValues = new Map<string, number>();
    for (const [key, value] of dataMap.entries()) {
      if (key.startsWith(`${node.code}-`) && key.includes('-')) {
        const funk = key.split('-')[1];
        funkValues.set(funk, (funkValues.get(funk) || 0) + value);
        nodeValue += value;
        hasDirectValue = true;
      }
    }

    // Recursively calculate values for children
    let childrenTotal = 0;
    for (const child of node.children) {
      const childResults = this.calculateTreeAggregation(
        child,
        dataMap,
        entityId,
        year,
        dimension
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
        unit: 'CHF'
      });
    }

    // Add funk-based sub-entries if they exist
    if (funkValues.size > 0) {
      for (const [funk, value] of funkValues.entries()) {
        results.push({
          entityId,
          entityName: '',
          year,
          code: `${node.code}-${funk}`,
          label: `${node.labels[this.config.language]} (${funk})`,
          value,
          dimension,
          unit: 'CHF'
        });
      }
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
  entityId: string,
  year: string,
  config?: TreeAggregationConfig,
  model: string = 'fs'
): Promise<TreeAggregationResult> {
  const aggregator = config ? new TreeAggregator(config) : defaultTreeAggregator;
  return aggregator.aggregateGdnData(data, entityId, year, model);
}

/**
 * Convenience function for aggregating STD data
 */
export async function aggregateStdData(
  data: StdDataRecord[],
  entityId: string,
  year: string,
  config?: TreeAggregationConfig,
  model: string = 'fs'
): Promise<TreeAggregationResult> {
  const aggregator = config ? new TreeAggregator(config) : defaultTreeAggregator;
  return aggregator.aggregateStdData(data, entityId, year, model);
}
