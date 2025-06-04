import type {
  TreeStructure,
  DataLoadingResult,
  GdnDataRecord,
  StdDataRecord,
  CodeDefinition,
  DataSourceInfo,
  TreeNode,
  MultiLanguageLabels,
  DataLoadingContext
} from '../types/DataStructures';

interface GdnInfoItem {
  nr: string;
  gemeinde: string;
  models: Array<{
    model: string;
    jahre: string[];
  }>;
}

interface StdInfoItem {
  hh: string;
  models: Array<{
    model: string;
    jahre: string[];
  }>;
}

/**
 * Data loader utility for CSV and tree structure data
 */
export class DataLoader {
  private cache: Map<string, { data: unknown; timestamp: number }> = new Map();
  private context: DataLoadingContext;

  constructor(context?: Partial<DataLoadingContext>) {
    this.context = {
      baseUrl: '/data',
      cache: {
        enabled: true,
        ttl: 5 * 60 * 1000, // 5 minutes
        maxSize: 100,
        strategy: 'lru'
      },
      defaultLanguage: 'de',
      timeout: 10000,
      retryAttempts: 3,
      ...context
    };
  }

  /**
   * Load tree structure for a specific dimension and model
   */
  async loadTreeStructure(dimension: string, model: string = 'fs'): Promise<TreeStructure> {
    const cacheKey = `tree-${dimension}-${model}`;

    if (this.context.cache.enabled) {
      const cached = this.getCachedData(cacheKey);
      if (cached) return cached as TreeStructure;
    }

    try {
      const url = `${this.context.baseUrl}/trees/${dimension}-${model}-tree.json`;
      const response = await this.fetchWithRetry(url);

      if (!response.ok) {
        throw new Error(`Failed to load tree structure: ${response.statusText}`);
      }

      const treeStructure: TreeStructure = await response.json();

      if (this.context.cache.enabled) {
        this.setCachedData(cacheKey, treeStructure);
      }

      return treeStructure;
    } catch (error) {
      console.error(`Error loading tree structure for ${dimension}-${model}:`, error);
      throw error;
    }
  }

  /**
   * Load GDN data for a specific model, entity and year
   */
  async loadGdnData(entityId: string, year: string, model: string = 'fs'): Promise<DataLoadingResult<GdnDataRecord>> {

    const cacheKey = `gdn-${model}-${entityId}-${year}`;

    if (this.context.cache.enabled) {
      const cached = this.getCachedData(cacheKey);
      if (cached) return cached as DataLoadingResult<GdnDataRecord>;
    }

    try {
      const url = `${this.context.baseUrl}/gdn/${model}/${entityId}/${year}.csv`;
      const csvText = await this.fetchCsvText(url);
      const data = this.parseCsv(csvText, ',', true) as unknown as GdnDataRecord[];

      const result: DataLoadingResult<GdnDataRecord> = {
        data,
        metadata: {
          source: url,
          loadedAt: new Date().toISOString(),
          recordCount: data.length,
          entityId,
          year
        }
      };

      if (this.context.cache.enabled) {
        this.setCachedData(cacheKey, result);
      }

      return result;
    } catch (error) {
      console.error(`Error loading GDN data for ${model}/${entityId}/${year}:`, error);
      throw error;
    }
  }

  /**
   * Load STD data for a specific model, entity and year
   */
  async loadStdData(entityId: string, year: string, model: string = 'fs'): Promise<DataLoadingResult<StdDataRecord>> {
    const cacheKey = `std-${model}-${entityId}-${year}`;

    if (this.context.cache.enabled) {
      const cached = this.getCachedData(cacheKey);
      if (cached) return cached as DataLoadingResult<StdDataRecord>;
    }

    try {
      const url = `${this.context.baseUrl}/std/${model}/${entityId}/${year}.csv`;
      const csvText = await this.fetchCsvText(url);
      const data = this.parseCsv(csvText, ',', true) as unknown as StdDataRecord[];

      const result: DataLoadingResult<StdDataRecord> = {
        data,
        metadata: {
          source: url,
          loadedAt: new Date().toISOString(),
          recordCount: data.length,
          entityId,
          year,
          dimension: data[0]?.dim
        }
      };

      if (this.context.cache.enabled) {
        this.setCachedData(cacheKey, result);
      }

      return result;
    } catch (error) {
      console.error(`Error loading STD data for ${model}/${entityId}/${year}:`, error);
      throw error;
    }
  }

  /**
   * Load code definitions for a dimension and model
   */
  async loadCodeDefinitions(dimension: string, model: string = 'fs'): Promise<CodeDefinition[]> {
    const cacheKey = `codes-${dimension}-${model}`;

    if (this.context.cache.enabled) {
      const cached = this.getCachedData(cacheKey);
      if (cached) return cached as CodeDefinition[];
    }

    try {
      const url = `${this.context.baseUrl}/codes/${dimension}/${model}.csv`;
      const csvText = await this.fetchCsvText(url);
      const rawData = this.parseCsv(csvText, ',', true);

      const codeDefinitions: CodeDefinition[] = rawData.map((row: Record<string, string>) => ({
        code: row.arten || '',
        funk: row.funk || '',
        labels: {
          de: row.d || '',
          fr: row.f || '',
          it: row.i || '',
          en: row.e || ''
        },
        dim: row.dim || dimension,
        model: row.model || model
      })).filter(def => def.code);

      if (this.context.cache.enabled) {
        this.setCachedData(cacheKey, codeDefinitions);
      }

      return codeDefinitions;
    } catch (error) {
      console.error(`Error loading code definitions for ${dimension}/${model}:`, error);
      throw error;
    }
  }

  /**
   * Load available data sources information
   */
  async loadDataSourcesInfo(): Promise<{ gdn: DataSourceInfo[]; std: DataSourceInfo[] }> {
    const cacheKey = 'data-sources-info';

    if (this.context.cache.enabled) {
      const cached = this.getCachedData(cacheKey);
      if (cached) return cached as { gdn: DataSourceInfo[]; std: DataSourceInfo[]; };
    }

    try {
      const [gdnInfo, stdInfo] = await Promise.all([
        this.fetchJson(`${this.context.baseUrl}/gdn-info.json`),
        this.fetchJson(`${this.context.baseUrl}/std-info.json`)
      ]);

      const result = {
        gdn: (gdnInfo as GdnInfoItem[]).map((item) => ({
          type: 'gdn' as const,
          entityId: item.nr,
          entityName: item.gemeinde,
          availableYears: item.models.flatMap((m) => m.jahre),
          models: item.models.map((m) => m.model)
        })),
        std: (stdInfo as StdInfoItem[]).map((item) => ({
          type: 'std' as const,
          entityId: item.hh,
          availableYears: item.models.flatMap((m) => m.jahre),
          models: item.models.map((m) => m.model)
        }))
      };

      if (this.context.cache.enabled) {
        this.setCachedData(cacheKey, result);
      }

      return result;
    } catch (error) {
      console.error('Error loading data sources info:', error);
      throw error;
    }
  }

  /**
   * Search tree nodes by label or code
   */
  searchTreeNodes(tree: TreeNode, query: string, language: keyof MultiLanguageLabels = 'de'): TreeNode[] {
    const results: TreeNode[] = [];
    const searchTerm = query.toLowerCase();

    const searchRecursive = (node: TreeNode) => {
      const label = node.labels[language].toLowerCase();
      const code = node.code.toLowerCase();

      if (label.includes(searchTerm) || code.includes(searchTerm)) {
        results.push(node);
      }

      node.children.forEach(child => searchRecursive(child));
    };

    searchRecursive(tree);
    return results;
  }

  /**
   * Get node path from root to specific node
   */
  getNodePath(tree: TreeNode, targetCode: string): TreeNode[] | null {
    const path: TreeNode[] = [];

    const findPath = (node: TreeNode): boolean => {
      path.push(node);

      if (node.code === targetCode) {
        return true;
      }

      for (const child of node.children) {
        if (findPath(child)) {
          return true;
        }
      }

      path.pop();
      return false;
    };

    return findPath(tree) ? path : null;
  }

  /**
   * Fetch with retry logic
   */
  private async fetchWithRetry(url: string, attempt: number = 1): Promise<Response> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.context.timeout);

      const response = await fetch(url, {signal: controller.signal});
      clearTimeout(timeoutId);

      return response;
    } catch (error) {
      if (attempt < this.context.retryAttempts) {
        console.warn(`Fetch attempt ${attempt} failed, retrying...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        return this.fetchWithRetry(url, attempt + 1);
      }
      throw error;
    }
  }

  /**
   * Fetch CSV text content
   */
  private async fetchCsvText(url: string): Promise<string> {
    const response = await this.fetchWithRetry(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch CSV: ${response.statusText}`);
    }
    return response.text();
  }

  /**
   * Fetch JSON content
   */
  private async fetchJson(url: string): Promise<unknown> {
    const response = await this.fetchWithRetry(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch JSON: ${response.statusText}`);
    }
    return response.json();
  }

  /**
   * Parse CSV content
   */
  private parseCsv(csvText: string, delimiter: string = ',', hasHeader: boolean = true): Record<string, string>[] {
    const lines = csvText.trim().split('\n');
    if (lines.length === 0) return [];

    const headers = hasHeader ? this.parseCsvLine(lines[0], delimiter) : null;
    const dataLines = hasHeader ? lines.slice(1) : lines;

    return dataLines.map(line => {
      const values = this.parseCsvLine(line, delimiter);
      if (headers) {
        const obj: Record<string, string> = {};
        headers.forEach((header, index) => {
          obj[header] = values[index] || '';
        });
        return obj;
      }
      return values;
    });
  }

  /**
   * Parse a single CSV line respecting quotes
   */
  private parseCsvLine(line: string, delimiter: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++; // Skip next quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === delimiter && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }

    result.push(current);
    return result;
  }

  /**
   * Get cached data if valid
   */
  private getCachedData(key: string): unknown | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const isExpired = Date.now() - cached.timestamp > this.context.cache.ttl;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  /**
   * Set cached data with cleanup if needed
   */
  private setCachedData(key: string, data: unknown): void {
    // Clean up cache if it's too large
    if (this.cache.size >= this.context.cache.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }
}
