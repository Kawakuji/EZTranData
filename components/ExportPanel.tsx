import React, { useState } from 'react';
import { useDataState } from '../hooks/useDataStore';
import { DownloadIcon } from './icons';
import { FileFormat, TableData } from '../types';

declare global {
  interface Window {
    Papa: any;
    XLSX: any;
  }
}

// Helper functions for new formats
const getSqlType = (value: any): string => {
    if (typeof value === 'number') {
        return Number.isInteger(value) ? 'INTEGER' : 'REAL';
    }
    if (typeof value === 'boolean') {
        return 'BOOLEAN';
    }
    return 'TEXT';
};

const generateSql = (tableName: string, data: TableData): string => {
    if (data.length === 0) return '/* No data to export */';
    const headers = Object.keys(data[0]);
    const firstRow = data[0];
    
    const createTableStmt = `CREATE TABLE ${tableName} (\n${headers.map(h => `  "${h}" ${getSqlType(firstRow[h])}`).join(',\n')}\n);\n\n`;

    const insertStmts = data.map(row => {
        const values = headers.map(h => {
            const val = row[h];
            if (val === null || val === undefined) return 'NULL';
            if (typeof val === 'number') return val;
            if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
            // Escape single quotes for SQL strings
            return `'${String(val).replace(/'/g, "''")}'`;
        }).join(', ');
        return `INSERT INTO ${tableName} ("${headers.join('", "')}") VALUES (${values});`;
    }).join('\n');

    return createTableStmt + insertStmts;
};

const generateXml = (data: TableData): string => {
    const rows = data.map(row => {
        const fields = Object.entries(row).map(([key, value]) => {
            const sanitizedKey = key.replace(/[^a-zA-Z0-9_]/g, '_');
            const sanitizedValue = value === null || value === undefined ? '' : String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
            return `    <${sanitizedKey}>${sanitizedValue}</${sanitizedKey}>`;
        }).join('\n');
        return `  <row>\n${fields}\n  </row>`;
    }).join('\n');
    return `<?xml version="1.0" encoding="UTF-8"?>\n<data>\n${rows}\n</data>`;
};

const generateMarkdown = (data: TableData): string => {
    if (data.length === 0) return '| No data to export |';
    const headers = Object.keys(data[0]);
    const headerLine = `| ${headers.join(' | ')} |`;
    const separatorLine = `| ${headers.map(() => '---').join(' | ')} |`;
    const body = data.map(row => {
        const rowValues = headers.map(h => String(row[h] ?? '').replace(/\|/g, '\\|'));
        return `| ${rowValues.join(' | ')} |`;
    }).join('\n');
    return `${headerLine}\n${separatorLine}\n${body}`;
};


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
        let mimeType = 'application/octet-stream';

        try {
            switch (exportFormat) {
                case FileFormat.CSV:
                    mimeType = 'text/csv;charset=utf-8;';
                    blob = new Blob([window.Papa.unparse(transformedData)], { type: mimeType });
                    break;
                case FileFormat.JSON:
                    mimeType = 'application/json';
                    blob = new Blob([JSON.stringify(transformedData, null, 2)], { type: mimeType });
                    break;
                case FileFormat.XLSX: {
                    if (typeof window.XLSX === 'undefined') throw new Error('XLSX library not available.');
                    const worksheet = window.XLSX.utils.json_to_sheet(transformedData);
                    const workbook = window.XLSX.utils.book_new();
                    window.XLSX.utils.book_append_sheet(workbook, worksheet, 'Transformed Data');
                    const excelBuffer = window.XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
                    blob = new Blob([excelBuffer], { type: mimeType });
                    break;
                }
                case FileFormat.SQL:
                    mimeType = 'application/sql';
                    blob = new Blob([generateSql(baseFileName, transformedData)], { type: mimeType });
                    break;
                case FileFormat.XML:
                    mimeType = 'application/xml';
                    blob = new Blob([generateXml(transformedData)], { type: mimeType });
                    break;
                case FileFormat.MARKDOWN:
                    mimeType = 'text/markdown';
                    blob = new Blob([generateMarkdown(transformedData)], { type: mimeType });
                    break;
                case FileFormat.PARQUET:
                case FileFormat.ARROW:
                    alert(`${exportFormat.toUpperCase()} export is not yet supported.`);
                    return;
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

    const exportOptions = [
      { format: FileFormat.CSV, label: 'CSV' },
      { format: FileFormat.JSON, label: 'JSON' },
      { format: FileFormat.XLSX, label: 'Excel (XLSX)' },
      { format: FileFormat.SQL, label: 'SQL' },
      { format: FileFormat.XML, label: 'XML' },
      { format: FileFormat.MARKDOWN, label: 'Markdown' },
      { format: FileFormat.PARQUET, label: 'Parquet', comingSoon: true },
      { format: FileFormat.ARROW, label: 'Arrow', comingSoon: true },
    ];

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
                        {exportOptions.map(({format, label, comingSoon}) => (
                           <option key={format} value={format} disabled={comingSoon}>
                               {label}
                               {comingSoon && ' (Coming Soon)'}
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