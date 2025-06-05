import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';

console.log('Starting tree structure generation...');

// Paths to input files
const codesDir = path.resolve('public/data/codes');
const outputDir = path.resolve('src/data/trees');

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}



/**
 * Parse code definition files to get multilingual labels
 */
function parseCodeDefinitions(dimension, model = 'fs') {
  const codeFilePath = path.join(codesDir, dimension, `${model}.csv`);
  if (!fs.existsSync(codeFilePath)) {
    console.warn(`Code file not found: ${codeFilePath}`);
    return new Map();
  }

  const csvContent = fs.readFileSync(codeFilePath, 'utf8');
  const { data } = Papa.parse(csvContent, {
    header: true,
    delimiter: ',',
    quoteChar: '"',
    skipEmptyLines: true
  });

  const codeMap = new Map();
  data.forEach(row => {
    if (row.arten) {
      codeMap.set(row.arten, {
        code: row.arten,
        funk: row.funk || '',
        labels: {
          de: row.d || '',
          fr: row.f || '',
          it: row.i || '',
          en: row.e || ''
        },
        dim: row.dim || '',
        model: row.model || ''
      });
    }
  });

  return codeMap;
}

/**
 * Build hierarchical tree structure from flat account codes
 */
function buildHierarchicalTree(dataEntries, codeDefinitions) {
  const tree = {
    code: 'root',
    labels: {
      de: 'Gesamt',
      fr: 'Total',
      it: 'Totale',
      en: 'Total'
    },
    children: [],
    level: 0,
    hasValue: false
  };

  // Sort entries by code length and then alphabetically
  const sortedEntries = dataEntries.sort((a, b) => {
    const codeA = a[0] || '';
    const codeB = b[0] || '';
    if (codeA.length !== codeB.length) {
      return codeA.length - codeB.length;
    }
    return codeA.localeCompare(codeB);
  });

  const nodeMap = new Map();
  nodeMap.set('root', tree);

  sortedEntries.forEach(entry => {
    const code = entry[0];
    const description = entry[1] || '';
    const value = entry[2] || '';

    if (!code) return;

    // Get code definition if available
    const codeDef = codeDefinitions.get(code);

    const node = {
      code,
      labels: codeDef ? codeDef.labels : {
        de: description,
        fr: description,
        it: description,
        en: description
      },
      children: [],
      level: code.length,
      hasValue: !!value,
      value: value || null
    };

    nodeMap.set(code, node);

    // Find parent
    let parentCode = 'root';
    for (let i = code.length - 1; i > 0; i--) {
      const potentialParent = code.substring(0, i);
      if (nodeMap.has(potentialParent)) {
        parentCode = potentialParent;
        break;
      }
    }

    const parent = nodeMap.get(parentCode);
    if (parent) {
      parent.children.push(node);
    }
  });

  return tree;
}

/**
 * Count total nodes in tree
 */
function countNodes(node) {
  let count = 1;
  if (node.children) {
    node.children.forEach(child => {
      count += countNodes(child);
    });
  }
  return count;
}

/**
 * Get maximum depth of tree
 */
function getMaxDepth(node, currentDepth = 0) {
  let maxDepth = currentDepth;
  if (node.children && node.children.length > 0) {
    node.children.forEach(child => {
      const childDepth = getMaxDepth(child, currentDepth + 1);
      maxDepth = Math.max(maxDepth, childDepth);
    });
  }
  return maxDepth;
}

/**
 * Generate comprehensive tree structures for all dimensions
 */
function generateComprehensiveTreeStructures() {
  console.log('Generating comprehensive tree structures from code definitions...');

  // Get all available dimensions from codes directory
  const dimensions = fs.readdirSync(codesDir).filter(item => {
    const itemPath = path.join(codesDir, item);
    return fs.statSync(itemPath).isDirectory();
  });

  dimensions.forEach(dimension => {
    console.log(`Processing dimension: ${dimension}`);

    // Check for available models in this dimension
    const dimensionPath = path.join(codesDir, dimension);
    const modelFiles = fs.readdirSync(dimensionPath).filter(file => file.endsWith('.csv'));

    modelFiles.forEach(modelFile => {
      const model = path.basename(modelFile, '.csv');
      console.log(`  Processing model: ${model}`);

      const codeDefinitions = parseCodeDefinitions(dimension, model);

      // Convert code definitions to data entries format
      const dataEntries = Array.from(codeDefinitions.values()).map(def => [
        def.code,
        def.labels.de,
        '' // No value for code definitions
      ]);

      // Build tree structure
      const tree = buildHierarchicalTree(dataEntries, codeDefinitions);

      // Add metadata
      const treeWithMetadata = {
        metadata: {
          dimension,
          model,
          source: `codes/${dimension}/${model}.csv`,
          generatedAt: new Date().toISOString(),
          totalNodes: countNodes(tree),
          maxDepth: getMaxDepth(tree)
        },
        tree
      };

      // Write tree to file
      const outputPath = path.join(outputDir, `${dimension}-${model}-tree.json`);
      fs.writeFileSync(outputPath, JSON.stringify(treeWithMetadata, null, 2));
      console.log(`Generated comprehensive tree: ${outputPath}`);
    });
  });
}

/**
 * Convert hierarchical tree to FinancialDataNode format
 */
function convertToFinancialDataNode(node) {
  return {
    code: node.code,
    labels: node.labels,
    values: {}, // Empty Map will be converted to empty object in JSON
    children: node.children.map(child => convertToFinancialDataNode(child))
  };
}

/**
 * Generate empty FinancialData structure according to FinancialDataStructure.ts interface
 */
function generateEmptyFinancialDataStructure() {
  console.log('Generating empty FinancialData structure...');

  // Parse code definitions for the three required dimensions
  const bilanzCodes = parseCodeDefinitions('bilanz', 'fs');
  const ertragCodes = parseCodeDefinitions('ertrag', 'fs');
  const aufwandCodes = parseCodeDefinitions('aufwand', 'fs');

  // Convert to data entries format for tree building
  const bilanzEntries = Array.from(bilanzCodes.values()).map(def => [def.code, def.labels.de, '']);
  const ertragEntries = Array.from(ertragCodes.values()).map(def => [def.code, def.labels.de, '']);
  const aufwandEntries = Array.from(aufwandCodes.values()).map(def => [def.code, def.labels.de, '']);

  // Build hierarchical trees
  const bilanzTree = buildHierarchicalTree(bilanzEntries, bilanzCodes);
  const ertragTree = buildHierarchicalTree(ertragEntries, ertragCodes);
  const aufwandTree = buildHierarchicalTree(aufwandEntries, aufwandCodes);

  // Create income statement tree by combining revenue and expenses
  const incomeStatementTree = {
    code: 'root',
    labels: {
      de: 'Erfolgsrechnung',
      fr: 'Compte de résultats',
      it: 'Conto economico',
      en: 'Income Statement'
    },
    children: [
      aufwandTree.children[0],  // Expenses (negative)
      ertragTree.children[0],  // Revenue (positive)
    ],
    level: 0,
    hasValue: false
  };

  // Convert to FinancialDataNode format
  const balanceSheetNode = convertToFinancialDataNode(bilanzTree);
  const incomeStatementNode = convertToFinancialDataNode(incomeStatementTree);

  // Create the complete FinancialData structure
  const financialDataStructure = {
    balanceSheet: balanceSheetNode,
    incomeStatement: incomeStatementNode,
    usedCodes: [], // Empty array
    unusedCodes: [], // Empty array
    entities: {}, // Empty Map will be converted to empty object in JSON
    metadata: {
      source: 'Generated from code definitions',
      loadedAt: new Date().toISOString(),
      recordCount: 0
    }
  };

  return financialDataStructure;
}

// Main execution
try {
  console.log('Generating comprehensive tree structures...');
  generateComprehensiveTreeStructures();

  console.log('Generating empty FinancialData structure...');
  const emptyFinancialData = generateEmptyFinancialDataStructure();

  // Save as JSON file
  const emptyStructureOutputPath = path.resolve('src/data/emptyFinancialDataStructure.json');
  fs.writeFileSync(emptyStructureOutputPath, JSON.stringify(emptyFinancialData, null, 2));
  console.log(`Generated empty FinancialData structure: ${emptyStructureOutputPath}`);

  // Also generate a TypeScript function file
  const tsOutputPath = path.resolve('src/data/emptyFinancialDataStructure.ts');
  const tsContent = `import type { FinancialData, FinancialDataNode } from '../types/FinancialDataStructure';

/**
 * Creates an empty FinancialData structure with hierarchical trees
 * populated from code definitions but with empty values.
 *
 * This structure includes:
 * - Balance sheet tree from bilanz/fs.csv
 * - Income statement tree combining ertrag/fs.csv and aufwand/fs.csv
 * - Empty arrays for usedCodes and unusedCodes
 * - Empty Map for entities
 */
export function createEmptyFinancialDataStructure(): FinancialData {
  return ${JSON.stringify(emptyFinancialData, null, 2)
    .replace(/"values": {}/g, '"values": new Map()')
    .replace(/"entities": {}/g, '"entities": new Map()')};
}

/**
 * Get the empty FinancialData structure as a plain object (for JSON serialization)
 */
export function getEmptyFinancialDataStructureAsObject() {
  return ${JSON.stringify(emptyFinancialData, null, 2)};
}
`;

  fs.writeFileSync(tsOutputPath, tsContent);
  console.log(`Generated TypeScript function: ${tsOutputPath}`);

  console.log('Tree structure generation completed successfully!');
} catch (error) {
  console.error('Error generating tree structures:', error);
  process.exit(1);
}
