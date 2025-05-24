import { getCodeLabel, isCodeIncluded, buildCodeTree } from '../src/utils/CodelistMapper';

// Test getCodeLabel function
console.log('Testing getCodeLabel function:');
console.log('------------------------------');

// Test with arten only
const label1 = getCodeLabel('2');
console.log('Label for arten "2" in German:', label1);

// Test with arten and funk
const label2 = getCodeLabel('2', '');
console.log('Label for arten "2", funk "" in German:', label2);

// Test with different languages
console.log('Label for arten "2" in French:', getCodeLabel('2', '', 'f'));
console.log('Label for arten "2" in Italian:', getCodeLabel('2', '', 'i'));
console.log('Label for arten "2" in English:', getCodeLabel('2', '', 'e'));

// Test with model and dimension
console.log('Label for arten "2" with model "gfs" and dimension "aufwand":', 
  getCodeLabel('2', '', 'd', 'gfs', 'aufwand'));

// Test isCodeIncluded function
console.log('\nTesting isCodeIncluded function:');
console.log('--------------------------------');
console.log('Is "21" included in "2"?', isCodeIncluded('21', '2'));
console.log('Is "211" included in "21"?', isCodeIncluded('211', '21'));
console.log('Is "21" included in "21"?', isCodeIncluded('21', '21'));
console.log('Is "2" included in "21"?', isCodeIncluded('2', '21'));

// Test buildCodeTree function
console.log('\nTesting buildCodeTree function:');
console.log('-------------------------------');
const tree = buildCodeTree('d', 'gfs', 'aufwand');
console.log('Tree structure (first level only):');
tree.forEach(node => {
  console.log(`- ${node.code}: ${node.label} (${node.children.length} children)`);
  if (node.children.length > 0) {
    node.children.forEach(child => {
      console.log(`  - ${child.code}: ${child.label} (${child.children.length} children)`);
    });
  }
});

console.log('\nTest completed.');