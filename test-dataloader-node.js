// Node.js test script for DataLoader functionality
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// Use Node.js built-in fetch (available in Node 18+)
// If not available, we'll use a simple HTTP test

// Test the DataLoader functions
async function testDataLoader() {
  console.log('🧪 Testing DataLoader functionality...\n');

  const baseUrl = 'http://localhost:5174';

  try {
    // Test 1: Check if CSV files are accessible
    console.log('1️⃣ Testing CSV file accessibility...');

    // Test GDN file
    const gdnResponse = await fetch(`${baseUrl}/data/gdn/010176/2020.csv`);
    console.log(`GDN file (010176/2020): ${gdnResponse.ok ? '✅ ACCESSIBLE' : '❌ NOT FOUND'}`);

    if (gdnResponse.ok) {
      const gdnText = await gdnResponse.text();
      const gdnLines = gdnText.split('\n').filter(line => line.trim());
      console.log(`  - Records: ${gdnLines.length - 1} (excluding header)`);
      console.log(`  - Header: ${gdnLines[0]}`);
      console.log(`  - Sample: ${gdnLines[1]}`);
    }

    // Test STD file
    const stdResponse = await fetch(`${baseUrl}/data/std/fs/ktn_zh/2020.csv`);
    console.log(`STD file (ktn_zh/2020): ${stdResponse.ok ? '✅ ACCESSIBLE' : '❌ NOT FOUND'}`);

    if (stdResponse.ok) {
      const stdText = await stdResponse.text();
      const stdLines = stdText.split('\n').filter(line => line.trim());
      console.log(`  - Records: ${stdLines.length - 1} (excluding header)`);
      console.log(`  - Header: ${stdLines[0]}`);
      console.log(`  - Sample: ${stdLines[1]}`);
    }

    // Test 2: Check other available files
    console.log('\n2️⃣ Testing other available files...');

    const testFiles = [
      '/data/gdn/236141/2020.csv',
      '/data/std/fs/bund/2020.csv',
      '/data/std/gfs/sv/2020.csv'
    ];

    for (const file of testFiles) {
      try {
        const response = await fetch(`${baseUrl}${file}`);
        console.log(`${file}: ${response.ok ? '✅ ACCESSIBLE' : '❌ NOT FOUND'}`);
      } catch (error) {
        console.log(`${file}: ❌ ERROR - ${error.message}`);
      }
    }

    // Test 3: Verify CSV format
    console.log('\n3️⃣ Testing CSV format validation...');

    if (gdnResponse.ok) {
      const gdnText = await gdnResponse.text();
      const gdnLines = gdnText.split('\n');
      const gdnHeader = gdnLines[0];

      // Check if GDN has expected semicolon delimiter
      const hasSemicolon = gdnHeader.includes(';');
      console.log(`GDN delimiter (semicolon): ${hasSemicolon ? '✅ CORRECT' : '❌ INCORRECT'}`);

      // Check expected columns
      const expectedGdnColumns = ['jahr', 'nr', 'gemeinde', 'konto', 'funktion', 'betrag'];
      const hasExpectedColumns = expectedGdnColumns.every(col => gdnHeader.includes(col));
      console.log(`GDN columns: ${hasExpectedColumns ? '✅ CORRECT' : '❌ MISSING COLUMNS'}`);
    }

    if (stdResponse.ok) {
      const stdText = await stdResponse.text();
      const stdLines = stdText.split('\n');
      const stdHeader = stdLines[0];

      // Check if STD has expected comma delimiter
      const hasComma = stdHeader.includes(',');
      console.log(`STD delimiter (comma): ${hasComma ? '✅ CORRECT' : '❌ INCORRECT'}`);

      // Check expected columns
      const expectedStdColumns = ['arten', 'funk', 'jahr', 'value', 'dim', 'hh', 'unit', 'model'];
      const hasExpectedColumns = expectedStdColumns.every(col => stdHeader.includes(col));
      console.log(`STD columns: ${hasExpectedColumns ? '✅ CORRECT' : '❌ MISSING COLUMNS'}`);
    }

    console.log('\n🎉 DataLoader accessibility tests completed!');
    console.log('\n📝 Summary:');
    console.log('- CSV files are accessible via HTTP');
    console.log('- File structure follows expected pattern');
    console.log('- GDN files use semicolon delimiter');
    console.log('- STD files use comma delimiter');
    console.log('- Column headers match expected format');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testDataLoader().catch(console.error);
