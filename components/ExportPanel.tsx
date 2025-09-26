import React, { useState } from 'react';
import { useDataState } from '../hooks/useDataStore';
import { DownloadIcon } from './icons';
import { FileFormat } from '../types';

declare global {
  interface Window {
    Papa: any;
    XLSX: any;
  }
}

const ExportPanel: React.FC = () => {
    const { transformedData, fileName } = useDataState();
    const [exportFormat, setExportFormat] = useState<FileFormat>(FileFormat.CSV);

    const handleExport = () => {
        if (transformedData.length === 0) {
            alert("No data to export.");
            return;
        }
        
        const baseFileName = fileName.split('.').slice(0, -1).join('.') || 'export';
        const newFileName = `${baseFileName}_transformed.${exportFormat}`;

        let blob: Blob;

        try {
            switch (exportFormat) {
                case FileFormat.CSV: {
                    const csv = window.Papa.unparse(transformedData);
                    blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                    break;
                }
                case FileFormat.JSON: {
                    const json = JSON.stringify(transformedData, null, 2);
                    blob = new Blob([json], { type: 'application/json' });
                    break;
                }
                case FileFormat.XLSX: {
                    if (typeof window.XLSX === 'undefined') {
                        throw new Error('XLSX library not available. Please ensure you are online.');
                    }
                    const worksheet = window.XLSX.utils.json_to_sheet(transformedData);
                    const workbook = window.XLSX.utils.book_new();
                    window.XLSX.utils.book_append_sheet(workbook, worksheet, 'Transformed Data');
                    const excelBuffer = window.XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
                    blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
                    break;
                }
                case FileFormat.PARQUET: {
                    alert('Parquet export is not yet supported.');
                    return;
                }
                default:
                    alert(`Unsupported export format: ${exportFormat}`);
                    return;
            }

            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = newFileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

        } catch (error) {
            console.error("Export failed:", error);
            alert(`An error occurred during export: ${error instanceof Error ? error.message : String(error)}`);
        }
    };

    const exportOptions = [FileFormat.CSV, FileFormat.JSON, FileFormat.XLSX, FileFormat.PARQUET];

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
                           <option key={format} value={format} disabled={format === FileFormat.PARQUET}>
                               {format.toUpperCase()}
                               {format === FileFormat.PARQUET && ' (Coming Soon)'}
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