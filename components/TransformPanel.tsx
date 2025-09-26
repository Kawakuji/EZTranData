import React from 'react';
import { useDataState, useDataDispatch } from '../hooks/useDataStore';
import { PlayIcon, DatabaseIcon } from './icons';
import { FileFormat } from '../types';

const TransformPanel: React.FC = () => {
  const { sqlQuery, isLoading, fileFormat } = useDataState();
  const dispatch = useDataDispatch();
  
  const handleQueryChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    dispatch({ type: 'SET_SQL_QUERY', payload: e.target.value });
  };

  const handleRunQuery = () => {
    // This is a simulation of running a query in a Web Worker with DuckDB-Wasm
    console.log("Simulating SQL query execution:", sqlQuery);

    // In a real app, you would post this message to a Web Worker:
    // worker.postMessage({ type: 'RUN_SQL', query: sqlQuery, file: file });

    // For this simulation, we'll just show a loading state and return the original data.
    // A real implementation would parse the SQL, apply it to the data, and return the result.
    dispatch({ type: 'SET_TRANSFORMED_DATA', payload: [] }); // Clear previous results
    
    // Simulate worker processing time
    setTimeout(() => {
        // This is where you would dispatch 'SET_TRANSFORMED_DATA' with the actual result from the worker
        // For now, we dispatch the original data again for demonstration.
        // Let's pretend we're applying a filter.
        dispatch({
            type: 'SET_DATA',
            payload: {
                headers: ["id", "product_name", "price", "category"],
                previewData: Array.from({length: 10}, (_, i) => ({
                    id: i + 1,
                    product_name: `Filtered Product ${i + 1}`,
                    price: (Math.random() * 50).toFixed(2),
                    category: `Filtered Category`
                }))
            }
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
        disabled={isLoading}
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
