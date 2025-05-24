import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';

// Paths to the input CSV file and output JSON file
const stdInputFilePath = path.resolve('data/standardauswertung.csv');
const stdInfoPath = path.resolve('src/data/std-info.json');

console.log('Starting test script for standardauswertung.csv processing...');

// Check if the input file exists
if (!fs.existsSync(stdInputFilePath)) {
  console.error(`ERROR: Input file does not exist: ${stdInputFilePath}`);
  process.exit(1);
}

// Read and parse the CSV file
let data;
try {
  const csvFile = fs.readFileSync(stdInputFilePath, 'utf8');
  console.log(`Successfully read file: ${stdInputFilePath}`);
  
  const parseResult = Papa.parse(csvFile, {
    header: true,
    delimiter: ',',  // The file uses comma as delimiter
    quoteChar: '"',
  });
  
  data = parseResult.data;
  console.log(`Found ${data.length} records in standardauswertung.csv`);
  
  // Log a few sample records to see their structure
  if (data.length > 0) {
    console.log(`Sample record 1:`, JSON.stringify(data[0]));
  }
  if (data.length > 1) {
    console.log(`Sample record 2:`, JSON.stringify(data[1]));
  }
} catch (error) {
  console.error(`Error reading or parsing file ${stdInputFilePath}:`, error);
  process.exit(1);
}

// Group data by model, hh, and jahr
const groupedByModelHhJahr = new Map();
// Track distinct hh & model combinations with their jahre
const stdInfoMap = new Map();

// Process each record
let skippedCount = 0;
let processedCount = 0;

data.forEach((record, index) => {
  // Log the record properties to debug
  if (index < 5) {
    console.log(`Record ${index} properties:`, Object.keys(record));
    console.log(`Record ${index} model:`, record.model);
    console.log(`Record ${index} hh:`, record.hh);
    console.log(`Record ${index} jahr:`, record.jahr);
  }
  
  if (!record.model || !record.hh || !record.jahr) {
    skippedCount++;
    return; // Skip records with missing model, hh, or jahr
  }
  
  processedCount++;
  
  // Track distinct hh & model combinations for std-info.json
  if (!stdInfoMap.has(record.hh)) {
    stdInfoMap.set(record.hh, {
      hh: record.hh,
      models: new Map()
    });
  }
  
  const hhInfo = stdInfoMap.get(record.hh);
  if (!hhInfo.models.has(record.model)) {
    hhInfo.models.set(record.model, {
      model: record.model,
      jahre: []
    });
  }
  
  // Add jahr to the list if not already present
  const modelInfo = hhInfo.models.get(record.model);
  if (!modelInfo.jahre.includes(record.jahr)) {
    modelInfo.jahre.push(record.jahr);
  }
});

console.log(`Skipped ${skippedCount} records due to missing model, hh, or jahr`);
console.log(`Processed ${processedCount} records`);

// Log the contents of stdInfoMap
console.log(`HH values found:`, Array.from(stdInfoMap.keys()));

// Prepare the stdInfo array with the required format
// Format: { "hh": "ktn", "models": [{"model":"gfs", "jahre": ["1990", .... ,"2024"] }, ... ]}
const stdInfoArray = Array.from(stdInfoMap.values()).map(info => {
  console.log(`Processing hh: ${info.hh}, models:`, Array.from(info.models.keys()));
  return {
    hh: info.hh,
    models: Array.from(info.models.values()).map(modelInfo => ({
      model: modelInfo.model,
      jahre: modelInfo.jahre.sort() // Sort jahre array
    }))
  };
}).sort((a, b) => a.hh.localeCompare(b.hh));

console.log(`Generated ${stdInfoArray.length} entries for std-info.json`);
if (stdInfoArray.length > 0) {
  console.log(`Sample entry:`, JSON.stringify(stdInfoArray[0]));
}

// Ensure the directory exists
const stdInfoDir = path.dirname(stdInfoPath);
if (!fs.existsSync(stdInfoDir)) {
  console.log(`Creating directory: ${stdInfoDir}`);
  fs.mkdirSync(stdInfoDir, { recursive: true });
}

// Write the std-info.json file
try {
  console.log(`Writing to file: ${stdInfoPath}`);
  console.log(`Data to write:`, JSON.stringify(stdInfoArray));
  
  fs.writeFileSync(stdInfoPath, JSON.stringify(stdInfoArray, null, 2));
  console.log(`Created file: ${stdInfoPath}`);
  
  // Verify the file was created
  if (fs.existsSync(stdInfoPath)) {
    console.log(`Verified file exists: ${stdInfoPath}`);
    
    // Read the file back to verify its contents
    const fileContents = fs.readFileSync(stdInfoPath, 'utf8');
    console.log(`File contents length: ${fileContents.length}`);
  } else {
    console.log(`ERROR: File was not created: ${stdInfoPath}`);
  }
} catch (error) {
  console.error(`Error writing file ${stdInfoPath}:`, error);
}

console.log('Test script completed!');