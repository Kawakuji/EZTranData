import React, { useState } from 'react';
import { useDataState } from '../hooks/useDataStore';
import { DownloadIcon } from './icons';
import { FileFormat } from '../types';

const ExportPanel: React.FC = () => {
    const { transformedData } = useDataState();
    const [exportFormat, setExportFormat] = useState<FileFormat>(FileFormat.CSV);

    const handleExport = () => {
        if (transformedData.length === 0) {
            alert("No data to export.");
            return;
        }

        // In a real application, this would trigger a download.
        // For CSV, you'd use Papa.unparse().
        // For other formats, you'd use libraries like 'xlsx' or 'parquet-wasm'.
        
        console.log(`Simulating export of ${transformedData.length} rows as ${exportFormat.toUpperCase()}`);
        
        const content = exportFormat === FileFormat.JSON 
            ? JSON.stringify(transformedData, null, 2)
            : window.Papa.unparse(transformedData);
        
        const blob = new Blob([content], { type: exportFormat === FileFormat.JSON ? 'application/json' : 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `fastdata_export.${exportFormat}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        alert(`Data exported as ${exportFormat.toUpperCase()}! Check your downloads.`);
    };

    const exportOptions = [FileFormat.CSV, FileFormat.JSON, FileFormat.PARQUET, FileFormat.XLSX];

    return (
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
            <h2 className="text-lg font-semibold text-white mb-4">Export Data</h2>
            <div className="flex flex-col gap-4">
                <div>
                    <label htmlFor="export-format" className="block text-sm font-medium text-gray-300 mb-2">
                        Export Format
                    </label>
                    <select
                        id="export-format"
                        value={exportFormat}
                        onChange={(e) => setExportFormat(e.target.value as FileFormat)}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                    >
                        {exportOptions.map(format => (
                           <option key={format} value={format}>
                               {format.toUpperCase()}
                           </option>
                        ))}
                    </select>
                </div>
                <button
                    onClick={handleExport}
                    disabled={transformedData.length === 0}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white font-semibold rounded-md hover:bg-green-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-green-500"
                >
                    <DownloadIcon className="h-5 w-5" />
                    <span>Export</span>
                </button>
            </div>
        </div>
    );
};

export default ExportPanel;
