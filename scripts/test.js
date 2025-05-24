import fs from 'fs';
import path from 'path';

// Path for the std-info.json file
const stdInfoPath = path.resolve('src/data/std-info.json');

// Create a simple test object
const testObject = {
  test: 'This is a test',
  timestamp: new Date().toISOString()
};

console.log(`Attempting to write to: ${stdInfoPath}`);

// Ensure the directory exists
const stdInfoDir = path.dirname(stdInfoPath);
if (!fs.existsSync(stdInfoDir)) {
  console.log(`Creating directory: ${stdInfoDir}`);
  fs.mkdirSync(stdInfoDir, { recursive: true });
}

// Write the file
try {
  fs.writeFileSync(stdInfoPath, JSON.stringify(testObject, null, 2));
  console.log(`Successfully wrote to: ${stdInfoPath}`);
  
  // Verify the file was created
  if (fs.existsSync(stdInfoPath)) {
    console.log(`Verified file exists: ${stdInfoPath}`);
    
    // Read the file back to verify its contents
    const fileContents = fs.readFileSync(stdInfoPath, 'utf8');
    console.log(`File contents: ${fileContents}`);
  } else {
    console.log(`ERROR: File was not created: ${stdInfoPath}`);
  }
} catch (error) {
  console.error(`Error writing file ${stdInfoPath}:`, error);
}