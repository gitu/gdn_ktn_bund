import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';

console.log('Starting data processing...');

// Paths to the input CSV files
const gdnInputFilePath = path.resolve('data/gdn_ab_5000.csv');
const stdInputFilePath = path.resolve('data/standardauswertung.csv');
const codelistInputFilePath = path.resolve('data/standardauswertung_codelist.csv');

// Base directories for output files
const gdnOutputBaseDir = path.resolve('public/data/gdn');
const stdOutputBaseDir = path.resolve('public/data/std');
const codesOutputBaseDir = path.resolve('public/data/codes');

// Paths for the info JSON files
const gdnInfoPath = path.resolve('public/data/gdn-info.json');
const stdInfoPath = path.resolve('public/data/std-info.json');
const codesInfoPath = path.resolve('public/data/codes-info.json');

// Ensure the base output directories exist
if (!fs.existsSync(gdnOutputBaseDir)) {
  fs.mkdirSync(gdnOutputBaseDir, { recursive: true });
}

if (!fs.existsSync(stdOutputBaseDir)) {
  fs.mkdirSync(stdOutputBaseDir, { recursive: true });
}

if (!fs.existsSync(codesOutputBaseDir)) {
  fs.mkdirSync(codesOutputBaseDir, { recursive: true });
}

// Helper function to map konto codes to dimensions
function mapKontoToDimension(konto) {
  if (!konto) return null;

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
      return null; // Skip records with unmappable konto codes
  }
}

// Process GDN data
function processGdnData() {
  console.log('Processing GDN data...');

  // Read and parse the CSV file
  const csvFile = fs.readFileSync(gdnInputFilePath, 'utf8');
  const { data } = Papa.parse(csvFile, {
    header: true,
    delimiter: ';',
    quoteChar: '"',
  });

  // Group data by nr and jahr
  const groupedByNrAndJahr = new Map();
  // Track distinct nr & gemeinde combinations
  const gdnInfoMap = new Map();

  // Process each record
  data.forEach((record) => {
    if (!record.nr || !record.jahr || !record.konto) return; // Skip records with missing required fields

    // Skip records with year before 2015
    if (record.jahr < 2015) return;

    // Map konto to dimension
    const dim = mapKontoToDimension(record.konto);
    if (!dim) return; // Skip records that don't map to our target dimensions

    // Transform record to standardized format
    const standardizedRecord = {
      arten: record.konto,
      funk: record.funktion || '',
      jahr: record.jahr,
      value: record.betrag || '',
      dim: dim,
      unit: 'CHF'
    };

    // Group by nr
    if (!groupedByNrAndJahr.has(record.nr)) {
      groupedByNrAndJahr.set(record.nr, new Map());
    }

    // Group by jahr within nr
    const jahrMap = groupedByNrAndJahr.get(record.nr);
    if (!jahrMap.has(record.jahr)) {
      jahrMap.set(record.jahr, []);
    }

    // Add standardized record to the appropriate group
    jahrMap.get(record.jahr).push(standardizedRecord);

    // Track distinct nr & gemeinde combinations for gdn-info.json
    if (!gdnInfoMap.has(record.nr)) {
      gdnInfoMap.set(record.nr, {
        nr: record.nr,
        gemeinde: record.gemeinde,
        jahre: []
      });
    }

    // Add jahr to the list if not already present
    const gdnInfo = gdnInfoMap.get(record.nr);
    if (!gdnInfo.jahre.includes(record.jahr)) {
      gdnInfo.jahre.push(record.jahr);
    }
  });

  // Create output directories and files
  groupedByNrAndJahr.forEach((jahrMap, nr) => {
    // Create directory for this nr
    const nrDir = path.join(gdnOutputBaseDir, nr);
    if (!fs.existsSync(nrDir)) {
      fs.mkdirSync(nrDir, { recursive: true });
    }

    // Create a file for each jahr
    jahrMap.forEach((records, jahr) => {
      const outputFilePath = path.join(nrDir, `${jahr}.csv`);

      // Convert records back to CSV with standardized column order
      const csv = Papa.unparse(records, {
        delimiter: ',',  // Use comma delimiter for consistency with STD data
        header: true,
        quotes: true,
        columns: ['arten', 'funk', 'jahr', 'value', 'dim', 'unit']  // Ensure consistent column order
      });

      // Write to file
      fs.writeFileSync(outputFilePath, csv);
      console.log(`Created file: ${outputFilePath}`);
    });
  });

  // Sort the gdnInfo array by nr
  const gdnInfoArray = Array.from(gdnInfoMap.values()).map(info => ({
    ...info,
    jahre: info.jahre.sort() // Sort jahre array
  })).sort((a, b) => a.nr.localeCompare(b.nr));

  // Write the gdn-info.json file
  fs.writeFileSync(gdnInfoPath, JSON.stringify(gdnInfoArray, null, 2));
  console.log(`Created file: ${gdnInfoPath}`);
}

// Process standardauswertung data
function processStdData() {
  console.log('Processing standardauswertung data...');

  // Check if the input file exists
  if (!fs.existsSync(stdInputFilePath)) {
    console.error(`ERROR: Input file does not exist: ${stdInputFilePath}`);
    return;
  }

  let data;

  // Read and parse the CSV file
  try {
    const csvFile = fs.readFileSync(stdInputFilePath, 'utf8');
    console.log(`Successfully read file: ${stdInputFilePath}`);

    const parseResult = Papa.parse(csvFile, {
      header: true,
      delimiter: ',',  // The file uses comma as delimiter
      quoteChar: '"',
    });

    data = parseResult.data;
  } catch (error) {
    console.error(`Error reading or parsing file ${stdInputFilePath}:`, error);
    return;
  }

  // Group data by model, hh, and jahr
  const groupedByModelHhJahr = new Map();
  // Track distinct hh & model combinations with their jahre
  const stdInfoMap = new Map();

  // Process each record
  console.log(`Found ${data.length} records in standardauswertung.csv`);

  // Log a few sample records to see their structure
  if (data.length > 0) {
    console.log(`Sample record 1:`, JSON.stringify(data[0]));
  }
  if (data.length > 1) {
    console.log(`Sample record 2:`, JSON.stringify(data[1]));
  }

  let skippedCount = 0;
  let processedCount = 0;

  data.forEach((record) => {
    // Log the record properties to debug
    if (processedCount < 2) {
      console.log(`Record ${processedCount} properties:`, Object.keys(record));
      console.log(`Record ${processedCount} model:`, record.model);
      console.log(`Record ${processedCount} hh:`, record.hh);
      console.log(`Record ${processedCount} jahr:`, record.jahr);
      console.log(`Record ${processedCount} dim:`, record.dim);
    }

    if (!record.model || !record.hh || !record.jahr || !record.dim) {
      skippedCount++;
      return; // Skip records with missing required fields
    }

    // Filter: only include records with model="fs" and dim in target dimensions
    if (record.model !== 'fs' || !['aufwand', 'ertrag', 'bilanz'].includes(record.dim)) {
      skippedCount++;
      return;
    }

    // skip records with year before 2015
    if (record.jahr < 2015) {
      skippedCount++;
      return;
    }

    // Transform record to standardized format (remove hh and model columns)
    const standardizedRecord = {
      arten: record.arten || '',
      funk: record.funk || '',
      jahr: record.jahr,
      value: record.value || '',
      dim: record.dim,
      unit: record.unit || 'CHF'
    };

    processedCount++;

    // Group by model
    if (!groupedByModelHhJahr.has(record.model)) {
      groupedByModelHhJahr.set(record.model, new Map());
    }

    // Group by hh within model
    const hhMap = groupedByModelHhJahr.get(record.model);
    if (!hhMap.has(record.hh)) {
      hhMap.set(record.hh, new Map());
    }

    // Group by jahr within hh
    const jahrMap = hhMap.get(record.hh);
    if (!jahrMap.has(record.jahr)) {
      jahrMap.set(record.jahr, []);
    }

    // Add standardized record to the appropriate group
    jahrMap.get(record.jahr).push(standardizedRecord);

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

  // Log the contents of groupedByModelHhJahr
  console.log(`Models found:`, Array.from(groupedByModelHhJahr.keys()));

  // Create output directories and files
  groupedByModelHhJahr.forEach((hhMap, model) => {
    hhMap.forEach((jahrMap, hh) => {
      // Create directory structure for this model/hh
      const modelHhDir = path.join(stdOutputBaseDir, model, hh);
      if (!fs.existsSync(modelHhDir)) {
        fs.mkdirSync(modelHhDir, { recursive: true });
      }

      // Create a file for each jahr
      jahrMap.forEach((records, jahr) => {
        const outputFilePath = path.join(modelHhDir, `${jahr}.csv`);

        // Convert records back to CSV with standardized column order
        const csv = Papa.unparse(records, {
          delimiter: ',',  // Keep the same delimiter as the input file
          header: true,
          quotes: true,
          columns: ['arten', 'funk', 'jahr', 'value', 'dim', 'unit']  // Ensure consistent column order
        });

        // Write to file
        fs.writeFileSync(outputFilePath, csv);
        console.log(`Created file: ${outputFilePath}`);
      });
    });
  });

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
    console.log(`Sample entry:`, stdInfoArray[0]);
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
}

// Process codelist data
function processCodelistData() {
  console.log('Processing codelist data...');

  // Check if the input file exists
  if (!fs.existsSync(codelistInputFilePath)) {
    console.error(`ERROR: Input file does not exist: ${codelistInputFilePath}`);
    return;
  }

  let data;

  // Read and parse the CSV file
  try {
    const csvFile = fs.readFileSync(codelistInputFilePath, 'utf8');
    console.log(`Successfully read file: ${codelistInputFilePath}`);

    const parseResult = Papa.parse(csvFile, {
      header: true,
      delimiter: ',',
      quoteChar: '"',
    });

    data = parseResult.data;
  } catch (error) {
    console.error(`Error reading or parsing file ${codelistInputFilePath}:`, error);
    return;
  }

  // Group data by dim and model
  const groupedByDimModel = new Map();
  // Track distinct dim & model combinations
  const codesInfoMap = new Map();

  // Process each record
  console.log(`Found ${data.length} records in standardauswertung_codelist.csv`);

  // Log a few sample records to see their structure
  if (data.length > 0) {
    console.log(`Sample record 1:`, JSON.stringify(data[0]));
  }
  if (data.length > 1) {
    console.log(`Sample record 2:`, JSON.stringify(data[1]));
  }

  let skippedCount = 0;
  let processedCount = 0;

  data.forEach((record) => {
    // Log the record properties to debug
    if (processedCount < 2) {
      console.log(`Record ${processedCount} properties:`, Object.keys(record));
      console.log(`Record ${processedCount} dim:`, record.dim);
      console.log(`Record ${processedCount} model:`, record.model);
    }

    if (!record.dim || !record.model) {
      skippedCount++;
      return; // Skip records with missing dim or model
    }

    processedCount++;

    // Group by dim
    if (!groupedByDimModel.has(record.dim)) {
      groupedByDimModel.set(record.dim, new Map());
    }

    // Group by model within dim
    const modelMap = groupedByDimModel.get(record.dim);
    if (!modelMap.has(record.model)) {
      modelMap.set(record.model, []);
    }

    // Add record to the appropriate group
    modelMap.get(record.model).push(record);

    // Track distinct dim & model combinations for codes-info.json
    if (!codesInfoMap.has(record.dim)) {
      codesInfoMap.set(record.dim, {
        dim: record.dim,
        models: new Map()
      });
    }

    const dimInfo = codesInfoMap.get(record.dim);
    if (!dimInfo.models.has(record.model)) {
      dimInfo.models.set(record.model, {
        model: record.model,
        count: 0
      });
    }

    // Increment count for this model
    dimInfo.models.get(record.model).count++;
  });

  console.log(`Processed ${processedCount} records, skipped ${skippedCount} records`);
  console.log(`Found ${groupedByDimModel.size} dimensions`);

  // Create output directories and files
  groupedByDimModel.forEach((modelMap, dim) => {
    console.log(`Processing dimension: ${dim} with ${modelMap.size} models`);

    modelMap.forEach((records, model) => {
      // Create directory structure for this dim/model
      const dimModelDir = path.join(codesOutputBaseDir, dim);
      if (!fs.existsSync(dimModelDir)) {
        fs.mkdirSync(dimModelDir, { recursive: true });
      }

      // Create a file for this model
      const outputFilePath = path.join(dimModelDir, `${model}.csv`);

      // Convert records back to CSV
      const csv = Papa.unparse(records, {
        delimiter: ',',
        header: true,
        quotes: true
      });

      // Write to file
      fs.writeFileSync(outputFilePath, csv);
      console.log(`Created file: ${outputFilePath} with ${records.length} records`);
    });
  });

  // Prepare the codesInfo array with the required format
  // Format: { "dim": "aufwand", "models": [{"model":"gfs", "count": 123 }, ... ]}
  const codesInfoArray = Array.from(codesInfoMap.values()).map(info => {
    console.log(`Processing dim: ${info.dim}, models:`, Array.from(info.models.keys()));
    return {
      dim: info.dim,
      models: Array.from(info.models.values()).map(modelInfo => ({
        model: modelInfo.model,
        count: modelInfo.count
      }))
    };
  }).sort((a, b) => a.dim.localeCompare(b.dim));

  console.log(`Generated ${codesInfoArray.length} entries for codes-info.json`);
  if (codesInfoArray.length > 0) {
    console.log(`Sample entry:`, codesInfoArray[0]);
  }

  // Write the codes-info.json file
  fs.writeFileSync(codesInfoPath, JSON.stringify(codesInfoArray, null, 2));
  console.log(`Created file: ${codesInfoPath}`);
}

// Execute all processing functions
processGdnData();
processStdData();
processCodelistData();

console.log('Processing complete!');
