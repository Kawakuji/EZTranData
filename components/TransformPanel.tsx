import React from 'react';
import { useDataState, useDataDispatch } from '../hooks/useDataStore';
import { PlayIcon, DatabaseIcon } from './icons';
import { FileFormat } from '../types';

const TransformPanel: React.FC = () => {
  const { sqlQuery, isLoading, fileFormat, previewData } = useDataState();
  const dispatch = useDataDispatch();
  
  const handleQueryChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    dispatch({ type: 'SET_SQL_QUERY', payload: e.target.value });
  };

  const handleRunQuery = () => {
    // This is a simulation of running a query, now based on the actual loaded data.
    console.log("Simulating SQL query execution:", sqlQuery);

    dispatch({ type: 'SET_TRANSFORMED_DATA', payload: [] }); // Clear previous results to indicate loading
    
    // Simulate worker processing time
    setTimeout(() => {
        // A very basic simulation that respects the original data.
        // It doesn't parse the SQL, but applies a mock transformation.
        // It mimics the "LIMIT 10" and filtering seen in the user's screenshot.
        const limit = 10;
        const resultData = previewData.slice(0, limit).map((row, i) => {
            const newRow = {...row};
            // Try to find columns to apply a "filter" to for demonstration
            const productNameKey = Object.keys(newRow).find(k => k.toLowerCase().includes('product') || k.toLowerCase().includes('name'));
            const categoryKey = Object.keys(newRow).find(k => k.toLowerCase().includes('category'));

            if (productNameKey) {
                newRow[productNameKey] = `Filtered Product ${i + 1}`;
            }
            if (categoryKey) {
                newRow[categoryKey] = `Filtered Category`;
            }
            return newRow;
        });

        dispatch({
            type: 'SET_TRANSFORMED_DATA',
            payload: resultData,
        });
        console.log('Simulation complete.');
    }, 1500);
  };

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 flex flex-col p-4 gap-4">
      <div className="flex items-center gap-3">
        <DatabaseIcon className="h-6 w-6 text-cyan-400" />
        <h2 className="text-lg font-semibold text-white">Transform Data</h2>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="sql-query" className="text-sm font-medium text-gray-300">
          Run SQL Query
        </label>
        <div className="relative font-mono text-sm rounded-md bg-gray-900 border border-gray-600 focus-within:border-cyan-500 focus-within:ring-1 focus-within:ring-cyan-500">
            <textarea
                id="sql-query"
                value={sqlQuery}
                onChange={handleQueryChange}
                className="w-full h-40 p-3 bg-transparent resize-none focus:outline-none"
                placeholder={`-- Your DuckDB SQL query here...\n-- Table is named 'source'`}
            />
            <div className="absolute bottom-2 right-2 text-xs text-gray-500">
                {fileFormat.toUpperCase()} source
            </div>
        </div>

      </div>

      <button
        onClick={handleRunQuery}
        disabled={isLoading || previewData.length === 0}
        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-cyan-600 text-white font-semibold rounded-md hover:bg-cyan-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-cyan-500"
      >
        <PlayIcon className="h-5 w-5" />
        <span>Run Query</span>
      </button>
      <div className="text-xs text-gray-500 text-center">
        Powered by DuckDB-Wasm (simulation)
      </div>
    </div>
  );
};

export default TransformPanel;