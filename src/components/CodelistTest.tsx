import React, { useEffect, useState } from 'react';
import { getCodeLabel, isCodeIncluded, buildCodeTree } from '../utils/CodelistMapper';

const CodelistTest: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<string[]>([]);

  useEffect(() => {
    const runTests = async () => {
      try {
        setLoading(true);
        const results: string[] = [];

        // Test getCodeLabel function
        results.push('Testing getCodeLabel function:');
        results.push('------------------------------');

        // Test with arten only
        const label1 = await getCodeLabel('2');
        results.push(`Label for arten "2" in German: ${label1}`);

        // Test with arten and funk
        const label2 = await getCodeLabel('2', '');
        results.push(`Label for arten "2", funk "" in German: ${label2}`);

        // Test with different languages
        results.push(`Label for arten "2" in French: ${await getCodeLabel('2', '', 'f')}`);
        results.push(`Label for arten "2" in Italian: ${await getCodeLabel('2', '', 'i')}`);
        results.push(`Label for arten "2" in English: ${await getCodeLabel('2', '', 'e')}`);

        // Test with model and dimension
        results.push(
          `Label for arten "2" with model "gfs" and dimension "aufwand": ${await getCodeLabel(
            '2',
            '',
            'd',
            'gfs',
            'aufwand'
          )}`
        );

        // Test isCodeIncluded function
        results.push('\nTesting isCodeIncluded function:');
        results.push('--------------------------------');
        results.push(`Is "21" included in "2"? ${isCodeIncluded('21', '2')}`);
        results.push(`Is "211" included in "21"? ${isCodeIncluded('211', '21')}`);
        results.push(`Is "21" included in "21"? ${isCodeIncluded('21', '21')}`);
        results.push(`Is "2" included in "21"? ${isCodeIncluded('2', '21')}`);

        // Test buildCodeTree function
        results.push('\nTesting buildCodeTree function:');
        results.push('-------------------------------');
        const tree = await buildCodeTree('d', 'gfs', 'aufwand');
        results.push('Tree structure (first level only):');

        if (tree.length === 0) {
          results.push('No tree nodes found.');
        } else {
          tree.forEach((node) => {
            results.push(`- ${node.code}: ${node.label} (${node.children.length} children)`);
            if (node.children.length > 0) {
              node.children.slice(0, 3).forEach((child) => {
                results.push(`  - ${child.code}: ${child.label} (${child.children.length} children)`);
              });
              if (node.children.length > 3) {
                results.push(`  - ... and ${node.children.length - 3} more children`);
              }
            }
          });
        }

        results.push('\nTest completed.');
        setTestResults(results);
      } catch (err) {
        setError(`Error running tests: ${err instanceof Error ? err.message : String(err)}`);
      } finally {
        setLoading(false);
      }
    };

    runTests();
  }, []);

  if (loading) {
    return <div>Loading test results...</div>;
  }

  if (error) {
    return <div className="error">Error: {error}</div>;
  }

  return (
    <div className="codelist-test">
      <h1>Codelist Mapper Test</h1>
      <pre>
        {testResults.join('\n')}
      </pre>
    </div>
  );
};

export default CodelistTest;
