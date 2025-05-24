import { useState, useMemo, useEffect } from 'react';
import './App.css';
import { type RecordType } from './types';
import ComparisonView from './components/ComparisonView';
import CodelistTest from './components/CodelistTest';
import * as DataLoader from './utils/DataLoader';

function App() {
  const [selectedYear, setSelectedYear] = useState<string>(DataLoader.getLatestYear());
  const [data, setData] = useState<RecordType[]>(DataLoader.getAllDataForYear(selectedYear));
  const [selectedA, setSelectedA] = useState<string[]>([]);
  const [selectedB, setSelectedB] = useState<string[]>([]);
  const [scaleToOne, setScaleToOne] = useState(false);
  const [showCodelistTest, setShowCodelistTest] = useState(false);

  // Load data when selected year changes
  useEffect(() => {
    setData(DataLoader.getAllDataForYear(selectedYear));
  }, [selectedYear]);

  // unique list of gemeinde
  const gemeinden = useMemo(
    () => DataLoader.getAvailableMunicipalities(),
    []
  );

  // set default selections once data is loaded
  useEffect(() => {
    if (
      gemeinden.length >= 2 &&
      selectedA.length === 0 &&
      selectedB.length === 0
    ) {
      setSelectedA([gemeinden[0]]);
      setSelectedB([gemeinden[1]]);
    }
  }, [gemeinden, selectedA, selectedB]);

  // aggregate by konto for a selection
  const aggregate = (list: string[]) => {
    const filtered = data.filter((r) => list.includes(r.gemeinde));
    const map = new Map<string, number>();
    filtered.forEach((r) => {
      const sum = map.get(r.konto) || 0;
      map.set(r.konto, sum + r.betrag);
    });
    return Array.from(map.entries()).map(([key, amount]) => ({ key, amount }));
  };

  const dataA = useMemo(() => aggregate(selectedA), [selectedA, data]);
  const dataB = useMemo(() => aggregate(selectedB), [selectedB, data]);

  return (
    <div className="App">
      <div className="app-header">
        <h1>{showCodelistTest ? 'Codelist Mapper Test' : 'Financial Comparison Tool'}</h1>
        <button
          onClick={() => setShowCodelistTest(!showCodelistTest)}
          style={{ marginLeft: '20px', padding: '5px 10px' }}
        >
          {showCodelistTest ? 'Show Financial Comparison' : 'Show Codelist Test'}
        </button>
      </div>

      {showCodelistTest ? (
        <CodelistTest />
      ) : (
        <>
          <div className="year-selector">
            <label>Select Year: </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
            >
              {DataLoader.getAvailableYears().map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
            <span className="year-info">
              {selectedYear === DataLoader.getLatestYear() ? ' (Latest)' : ''}
            </span>
          </div>
          <div className="controls">
            <div className="select-group">
              <label>Select Group A:</label>
              <select
                multiple
                size={5}
                value={selectedA}
                onChange={(e) =>
                  setSelectedA(
                    Array.from(e.target.selectedOptions, (o) => o.value)
                  )
                }
              >
                {gemeinden.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
            <div className="select-group">
              <label>Select Group B:</label>
              <select
                multiple
                size={5}
                value={selectedB}
                onChange={(e) =>
                  setSelectedB(
                    Array.from(e.target.selectedOptions, (o) => o.value)
                  )
                }
              >
                {gemeinden.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
            <div className="scale-control">
              <label>
                <input
                  type="checkbox"
                  checked={scaleToOne}
                  onChange={() => setScaleToOne(!scaleToOne)}
                />
                Scale to match totals
              </label>
            </div>
          </div>
          {dataA.length > 0 && dataB.length > 0 && (
            <ComparisonView
              dataA={dataA}
              dataB={dataB}
              scaleToOne={scaleToOne}
            />
          )}
        </>
      )}
    </div>
  );
}

export default App
