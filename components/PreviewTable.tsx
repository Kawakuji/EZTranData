import React from 'react';
import { useDataState, useDataDispatch } from '../hooks/useDataStore';
import { FileIcon, XIcon } from './icons';

const PreviewTable: React.FC = () => {
  const { headers, transformedData, fileName, fileSize } = useDataState();
  const dispatch = useDataDispatch();

  if (transformedData.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-gray-800 rounded-lg border border-gray-700">
        <p className="text-gray-400">No data to display. Your query might have returned an empty result.</p>
      </div>
    );
  }

  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  const handleClearData = () => {
    dispatch({ type: 'CLEAR_DATA' });
  };


  return (
    <div className="flex-1 flex flex-col bg-gray-800 rounded-lg border border-gray-700 overflow-hidden min-h-0">
      <div className="flex items-center justify-between p-3 border-b border-gray-700 bg-gray-800/80 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <FileIcon className="h-5 w-5 text-gray-400" />
            <span className="font-medium text-white">{fileName}</span>
            <span className="text-sm text-gray-400">{formatBytes(fileSize)}</span>
            <span className="text-sm text-gray-400 font-mono">({transformedData.length} rows)</span>
          </div>
          <button onClick={handleClearData} className="p-1 rounded-md text-gray-400 hover:bg-gray-700 hover:text-white transition-colors">
            <XIcon className="h-5 w-5" />
          </button>
      </div>
      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm text-left table-auto">
          <thead className="text-xs text-gray-300 uppercase bg-gray-700/50 sticky top-0 backdrop-blur-sm">
            <tr>
              <th scope="col" className="px-4 py-3 font-mono font-normal w-16 text-right text-gray-500">#</th>
              {headers.map((header) => (
                <th key={header} scope="col" className="px-4 py-3 font-normal whitespace-nowrap">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {transformedData.slice(0, 200).map((row, rowIndex) => ( // Virtualize by showing only 200 rows
              <tr key={rowIndex} className="border-b border-gray-700 hover:bg-gray-700/50">
                <td className="px-4 py-2 font-mono text-right text-gray-500">{rowIndex + 1}</td>
                {headers.map((header) => (
                  <td key={`${rowIndex}-${header}`} className="px-4 py-2 whitespace-nowrap overflow-hidden text-ellipsis text-gray-300">
                    {String(row[header] ?? '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {transformedData.length > 200 && (
             <div className="p-4 text-center text-sm text-gray-500 bg-gray-800">
                Showing first 200 rows of {transformedData.length}.
             </div>
        )}
      </div>
    </div>
  );
};

export default PreviewTable;
