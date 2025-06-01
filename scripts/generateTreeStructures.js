import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';

console.log('Starting tree structure generation...');

// Paths to input files
const fixturesDir = path.resolve('fixtures');
const codesDir = path.resolve('public/data/codes');
const outputDir = path.resolve('public/data/trees');

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

/**
 * Parse a CSV file and return the data
 */
function parseCSV(filePath, delimiter = ';') {
  if (!fs.existsSync(filePath)) {
    console.warn(`File not found: ${filePath}`);
    return [];
  }
  
  const csvContent = fs.readFileSync(filePath, 'utf8');
  const { data } = Papa.parse(csvContent, {
    header: false,
    delimiter,
    quoteChar: '"',
    skipEmptyLines: true
  });
  
  return data;
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
 * Process fixture files to generate tree structures
 */
function processFixtureFiles() {
  const fixtureFiles = fs.readdirSync(fixturesDir).filter(file => file.endsWith('.csv'));
  
  fixtureFiles.forEach(filename => {
    console.log(`Processing fixture file: ${filename}`);
    
    // Extract dimension from filename (e.g., gdn_ag-2019-ertrag-de.csv -> ertrag)
    const parts = filename.split('-');
    if (parts.length < 3) return;
    
    const dimension = parts[2]; // ertrag, aufwand, bilanz
    const filePath = path.join(fixturesDir, filename);
    
    // Parse the fixture data
    const data = parseCSV(filePath, ';');
    
    // Get code definitions for this dimension
    const codeDefinitions = parseCodeDefinitions(dimension);
    
    // Build tree structure
    const tree = buildHierarchicalTree(data, codeDefinitions);
    
    // Add metadata
    const treeWithMetadata = {
      metadata: {
        dimension,
        source: filename,
        generatedAt: new Date().toISOString(),
        totalNodes: countNodes(tree),
        maxDepth: getMaxDepth(tree)
      },
      tree
    };
    
    // Write tree to file
    const outputPath = path.join(outputDir, `${dimension}-tree.json`);
    fs.writeFileSync(outputPath, JSON.stringify(treeWithMetadata, null, 2));
    console.log(`Generated tree structure: ${outputPath}`);
  });
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

// Main execution
try {
  console.log('Processing fixture files...');
  processFixtureFiles();
  
  console.log('Generating comprehensive tree structures...');
  generateComprehensiveTreeStructures();
  
  console.log('Tree structure generation completed successfully!');
} catch (error) {
  console.error('Error generating tree structures:', error);
  process.exit(1);
}
