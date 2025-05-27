// Simple test script to verify EntityLoader functionality
// Run this in the browser console

async function testEntityLoader() {
  try {
    console.log('Testing EntityLoader...');
    
    // Test loading GDN info
    console.log('1. Testing GDN info loading...');
    const gdnResponse = await fetch('/src/data/gdn-info.json');
    const gdnData = await gdnResponse.json();
    console.log(`✓ GDN data loaded: ${gdnData.length} entries`);
    console.log('First GDN entry:', gdnData[0]);
    
    // Test loading STD info
    console.log('2. Testing STD info loading...');
    const stdResponse = await fetch('/src/data/std-info.json');
    const stdData = await stdResponse.json();
    console.log(`✓ STD data loaded: ${stdData.length} entries`);
    console.log('First STD entry:', stdData[0]);
    
    console.log('✓ All tests passed!');
    return { gdnData, stdData };
  } catch (error) {
    console.error('✗ Test failed:', error);
    throw error;
  }
}

// Run the test
testEntityLoader().then(result => {
  console.log('Test completed successfully:', result);
}).catch(error => {
  console.error('Test failed:', error);
});
