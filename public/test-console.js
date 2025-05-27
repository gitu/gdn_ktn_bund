// Console test script for DataLoader
// Copy and paste this into the browser console at http://localhost:5174

console.log('🧪 Starting DataLoader Console Tests...');

// Test function to be run in browser console
async function testDataLoaderInBrowser() {
  try {
    console.log('\n1️⃣ Testing DataLoader module import...');
    
    // Import DataLoader functions
    const DataLoader = await import('/src/utils/DataLoader.ts');
    console.log('✅ DataLoader imported successfully');
    console.log('Available functions:', Object.keys(DataLoader));
    
    console.log('\n2️⃣ Testing path construction...');
    
    // Test GDN path
    const gdnPath = DataLoader.constructDataPath('010176', '2020');
    console.log(`GDN path: ${gdnPath}`);
    console.assert(gdnPath === '/data/gdn/010176/2020.csv', 'GDN path should be correct');
    
    // Test STD path
    const stdPath = DataLoader.constructDataPath('ktn_zh', '2020');
    console.log(`STD path: ${stdPath}`);
    console.assert(stdPath === '/data/std/fs/ktn_zh/2020.csv', 'STD path should be correct');
    
    console.log('✅ Path construction tests passed');
    
    console.log('\n3️⃣ Testing file existence...');
    
    const gdnExists = await DataLoader.checkDataExists('010176', '2020');
    console.log(`GDN file exists: ${gdnExists}`);
    
    const stdExists = await DataLoader.checkDataExists('ktn_zh', '2020');
    console.log(`STD file exists: ${stdExists}`);
    
    console.log('\n4️⃣ Testing data loading...');
    
    if (gdnExists) {
      console.log('Loading GDN data...');
      const gdnData = await DataLoader.loadEntityData('010176', '2020');
      console.log(`✅ Loaded ${gdnData.length} GDN records`);
      console.log('Sample GDN record:', gdnData[0]);
      
      // Verify data structure
      const sampleRecord = gdnData[0];
      const expectedFields = ['jahr', 'nr', 'gemeinde', 'konto', 'funktion', 'betrag'];
      const hasAllFields = expectedFields.every(field => field in sampleRecord);
      console.log(`GDN data structure: ${hasAllFields ? '✅ CORRECT' : '❌ MISSING FIELDS'}`);
    }
    
    if (stdExists) {
      console.log('Loading STD data...');
      const stdData = await DataLoader.loadEntityData('ktn_zh', '2020');
      console.log(`✅ Loaded ${stdData.length} STD records`);
      console.log('Sample STD record:', stdData[0]);
      
      // Verify data structure
      const sampleRecord = stdData[0];
      const expectedFields = ['jahr', 'nr', 'gemeinde', 'konto', 'funktion', 'betrag'];
      const hasAllFields = expectedFields.every(field => field in sampleRecord);
      console.log(`STD data structure: ${hasAllFields ? '✅ CORRECT' : '❌ MISSING FIELDS'}`);
    }
    
    console.log('\n5️⃣ Testing cache functionality...');
    
    const cacheStats = DataLoader.getCacheStats();
    console.log(`Cache size: ${cacheStats.size}`);
    console.log('Cache keys:', cacheStats.keys);
    
    console.log('\n🎉 All DataLoader tests completed successfully!');
    
    return {
      pathConstruction: true,
      fileExistence: { gdnExists, stdExists },
      dataLoading: true,
      cacheStats
    };
    
  } catch (error) {
    console.error('❌ DataLoader test failed:', error);
    return { error: error.message };
  }
}

// Test DataEnricher integration
async function testDataEnricherIntegration() {
  try {
    console.log('\n🔧 Testing DataEnricher integration...');
    
    const DataEnricher = await import('/src/utils/DataEnricher.ts');
    console.log('✅ DataEnricher imported successfully');
    
    // Test loading and enriching data
    console.log('Testing loadAndEnrichEntityData...');
    const enrichedData = await DataEnricher.loadAndEnrichEntityData('010176', '2020', 'fs', 'de');
    
    console.log(`✅ Loaded and enriched ${enrichedData.length} records`);
    if (enrichedData.length > 0) {
      console.log('Sample enriched record:', enrichedData[0]);
    }
    
    return { enrichedRecords: enrichedData.length };
    
  } catch (error) {
    console.error('❌ DataEnricher test failed:', error);
    return { error: error.message };
  }
}

// Make functions available globally
window.testDataLoaderInBrowser = testDataLoaderInBrowser;
window.testDataEnricherIntegration = testDataEnricherIntegration;

// Instructions
console.log(`
📋 DataLoader Console Test Instructions:

1. Open browser console (F12)
2. Navigate to http://localhost:5174
3. Run: testDataLoaderInBrowser()
4. Run: testDataEnricherIntegration()

Or run both:
Promise.all([testDataLoaderInBrowser(), testDataEnricherIntegration()])
  .then(results => console.log('All tests completed:', results))
`);

// Auto-run if in browser
if (typeof window !== 'undefined' && window.location) {
  console.log('🚀 Ready to test! Run testDataLoaderInBrowser() in the console.');
}
