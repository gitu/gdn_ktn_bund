/**
 * Utility for converting between custom TreeNode format and PrimeVue Tree format
 */

import type { TreeNode, MultiLanguageLabels } from '../types/DataStructures';

/**
 * PrimeVue Tree Node interface
 */
export interface PrimeVueTreeNode {
  key: string;
  label: string;
  data?: Record<string, unknown>;
  icon?: string;
  children?: PrimeVueTreeNode[];
  leaf?: boolean;
  expanded?: boolean;
  selectable?: boolean;
  styleClass?: string;
}

/**
 * Configuration for tree conversion
 */
export interface TreeConversionConfig {
  language: keyof MultiLanguageLabels;
  showIcons?: boolean;
  includeValues?: boolean;
  expandAll?: boolean;
  iconMapping?: {
    folder?: string;
    folderOpen?: string;
    file?: string;
    default?: string;
  };
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: Required<TreeConversionConfig> = {
  language: 'de',
  showIcons: true,
  includeValues: true,
  expandAll: false,
  iconMapping: {
    folder: 'pi pi-folder',
    folderOpen: 'pi pi-folder-open',
    file: 'pi pi-file',
    default: 'pi pi-circle'
  }
};

/**
 * TreeNodeAdapter class for format conversions
 */
export class TreeNodeAdapter {
  private config: Required<TreeConversionConfig>;

  constructor(config: Partial<TreeConversionConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Convert custom TreeNode to PrimeVue format
   */
  toPrimeVueFormat(node: TreeNode): PrimeVueTreeNode {
    const hasChildren = node.children && node.children.length > 0;
    const label = this.getNodeLabel(node);

    const primeVueNode: PrimeVueTreeNode = {
      key: node.code,
      label: this.config.includeValues && node.hasValue && node.value
        ? `${label} (${this.formatValue(node.value)})`
        : label,
      data: {
        code: node.code,
        labels: node.labels,
        hasValue: node.hasValue,
        value: node.value,
        funk: node.funk,
        level: node.level,
        originalNode: node
      },
      leaf: !hasChildren,
      expanded: this.config.expandAll,
      selectable: true
    };

    // Add icon if enabled
    if (this.config.showIcons) {
      primeVueNode.icon = this.getNodeIcon(node, hasChildren);
    }

    // Add style class based on node properties
    const styleClasses = [];
    if (node.hasValue) styleClasses.push('has-value');
    if (hasChildren) styleClasses.push('has-children');
    if (styleClasses.length > 0) {
      primeVueNode.styleClass = styleClasses.join(' ');
    }

    // Convert children recursively
    if (hasChildren) {
      primeVueNode.children = node.children.map(child => this.toPrimeVueFormat(child));
    }

    return primeVueNode;
  }

  /**
   * Convert PrimeVue format back to custom TreeNode
   */
  fromPrimeVueFormat(primeVueNode: PrimeVueTreeNode): TreeNode {
    const data = primeVueNode.data || {};

    // If we have original node data, use it
    if (data.originalNode) {
      return data.originalNode as TreeNode;
    }

    // Otherwise reconstruct from available data
    const node: TreeNode = {
      code: primeVueNode.key,
      labels: data.labels || this.createLabelsFromString(primeVueNode.label),
      children: primeVueNode.children
        ? primeVueNode.children.map(child => this.fromPrimeVueFormat(child))
        : [],
      level: data.level || 0,
      hasValue: data.hasValue || false,
      value: data.value || null,
      funk: data.funk
    };

    return node;
  }

  /**
   * Convert tree structure for PrimeVue Tree component
   */
  convertTreeStructure(treeStructure: { tree: TreeNode; metadata?: Record<string, unknown> }): PrimeVueTreeNode[] {
    return [this.toPrimeVueFormat(treeStructure.tree)];
  }

  /**
   * Get selection keys from TreeNode codes
   */
  getSelectionKeys(selectedCodes: string[]): Record<string, boolean> {
    const selectionKeys: Record<string, boolean> = {};
    selectedCodes.forEach(code => {
      selectionKeys[code] = true;
    });
    return selectionKeys;
  }

  /**
   * Extract selected codes from PrimeVue selection keys
   */
  getSelectedCodes(selectionKeys: Record<string, boolean>): string[] {
    return Object.keys(selectionKeys).filter(key => selectionKeys[key]);
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<TreeConversionConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current configuration
   */
  getConfig(): Required<TreeConversionConfig> {
    return { ...this.config };
  }

  // Private helper methods

  private getNodeLabel(node: TreeNode): string {
    return node.labels[this.config.language] || node.labels.de || node.code;
  }

  private getNodeIcon(node: TreeNode, hasChildren: boolean): string {
    if (hasChildren) {
      return this.config.iconMapping.folder || 'pi pi-folder';
    } else if (node.hasValue) {
      return this.config.iconMapping.file || 'pi pi-file';
    } else {
      return this.config.iconMapping.default || 'pi pi-circle';
    }
  }

  private formatValue(value: string | number | null): string {
    if (value === null || value === undefined) return '';

    const numValue = typeof value === 'string' ? parseFloat(value.replace(/,/g, '')) : value;

    if (isNaN(numValue)) return String(value);

    // Format large numbers with thousand separators
    return new Intl.NumberFormat('de-CH', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(numValue);
  }

  private createLabelsFromString(label: string): MultiLanguageLabels {
    return {
      de: label,
      fr: label,
      it: label,
      en: label
    };
  }
}

/**
 * Default adapter instance
 */
export const defaultTreeNodeAdapter = new TreeNodeAdapter();

/**
 * Convenience functions for quick conversions
 */
export const convertToPrimeVue = (
  node: TreeNode,
  config?: Partial<TreeConversionConfig>
): PrimeVueTreeNode => {
  const adapter = config ? new TreeNodeAdapter(config) : defaultTreeNodeAdapter;
  return adapter.toPrimeVueFormat(node);
};

export const convertFromPrimeVue = (
  primeVueNode: PrimeVueTreeNode,
  config?: Partial<TreeConversionConfig>
): TreeNode => {
  const adapter = config ? new TreeNodeAdapter(config) : defaultTreeNodeAdapter;
  return adapter.fromPrimeVueFormat(primeVueNode);
};

export const convertTreeStructureToPrimeVue = (
  treeStructure: { tree: TreeNode; metadata?: Record<string, unknown> },
  config?: Partial<TreeConversionConfig>
): PrimeVueTreeNode[] => {
  const adapter = config ? new TreeNodeAdapter(config) : defaultTreeNodeAdapter;
  return adapter.convertTreeStructure(treeStructure);
};
