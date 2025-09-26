import React, { useCallback, useState } from 'react';
import { useDataDispatch } from '../hooks/useDataStore';
import { UploadCloudIcon } from './icons';
import { TableData, TableHeaders } from '../types';

// Augment the window object to include Papa and XLSX
declare global {
  interface Window {
    Papa: any;
    XLSX: any;
  }
}

// Helper to auto-convert types from strings
const autoType = (value: string | null): string | number | boolean | null => {
    if (value === null || value.trim() === '') return null;
    const lowerValue = value.toLowerCase();
    if (lowerValue === 'true') return true;
    if (lowerValue === 'false') return false;
    // Check for number, including decimals and negatives
    if (!isNaN(Number(value)) && value.trim() !== '') {
        return Number(value);
    }
    return value;
};


const FileDrop: React.FC = () => {
  const dispatch = useDataDispatch();
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = useCallback((file: File) => {
    if (!file) return;

    dispatch({ type: 'START_LOADING', payload: file });

    const extension = file.name.split('.').pop()?.toLowerCase();
    if (extension === 'csv' || extension === 'tsv') {
      window.Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true, // Automatically infer types for numbers, booleans
        delimiter: extension === 'tsv' ? '\t' : ',',
        preview: 100, // Preview first 100 rows for performance
        complete: (results: { data: TableData; errors: any[]; meta: { fields: TableHeaders } }) => {
          if (results.errors.length > 0) {
            dispatch({ type: 'SET_ERROR', payload: `CSV/TSV Parsing Error: ${results.errors[0].message}` });
            return;
          }
          dispatch({ type: 'SET_DATA', payload: { headers: results.meta.fields, previewData: results.data } });
        },
        error: (error: Error) => {
          dispatch({ type: 'SET_ERROR', payload: `File Reading Error: ${error.message}` });
        },
      });
    } else if (extension === 'json') {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result as string;
                const data: TableData = JSON.parse(text);

                if (!Array.isArray(data) || data.length === 0) {
                    dispatch({ type: 'SET_ERROR', payload: 'Invalid JSON format. Expected an array of objects.' });
                    return;
                }

                const headers = Object.keys(data[0]);
                dispatch({ type: 'SET_DATA', payload: { headers, previewData: data } });

            } catch (err) {
                const error = err as Error;
                dispatch({ type: 'SET_ERROR', payload: `JSON Parsing Error: ${error.message}` });
            }
        };
        reader.onerror = () => {
            dispatch({ type: 'SET_ERROR', payload: 'Could not read the file.' });
        };
        reader.readAsText(file);
    } else if (extension === 'xlsx' || extension === 'ods') {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                if (typeof window.XLSX === 'undefined') {
                    dispatch({ type: 'SET_ERROR', payload: 'Spreadsheet library not available. Please ensure you are online.' });
                    return;
                }
                const data = e.target?.result;
                const workbook = window.XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const jsonData: TableData = window.XLSX.utils.sheet_to_json(worksheet);

                if (jsonData.length === 0) {
                    dispatch({ type: 'SET_ERROR', payload: 'Spreadsheet file is empty or could not be read.' });
                    return;
                }

                const headers = Object.keys(jsonData[0]);
                dispatch({ type: 'SET_DATA', payload: { headers, previewData: jsonData } });

            } catch (err) {
                const error = err as Error;
                dispatch({ type: 'SET_ERROR', payload: `Spreadsheet Parsing Error: ${error.message}` });
            }
        };
        reader.onerror = () => {
            dispatch({ type: 'SET_ERROR', payload: 'Could not read the spreadsheet file.' });
        };
        reader.readAsArrayBuffer(file);
    } else if (extension === 'xml') {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result as string;
                const parser = new DOMParser();
                const xmlDoc = parser.parseFromString(text, "application/xml");
                
                const parserError = xmlDoc.getElementsByTagName("parsererror");
                if (parserError.length > 0) {
                    throw new Error("Invalid XML file structure. Check file for errors.");
                }
                
                // Find a repeating element to treat as a row. Common names are 'row', 'item', 'record'.
                const rowTagName = ['row', 'item', 'record'].find(tagName => xmlDoc.getElementsByTagName(tagName).length > 0);
                if (!rowTagName) {
                     dispatch({ type: 'SET_ERROR', payload: 'Invalid XML format. Could not find repeating <row>, <item>, or <record> elements.' });
                     return;
                }
                const rows = xmlDoc.getElementsByTagName(rowTagName);

                const headers: TableHeaders = [];
                const firstRowChildren = rows[0].children;
                for (let i = 0; i < firstRowChildren.length; i++) {
                    headers.push(firstRowChildren[i].tagName);
                }

                const jsonData: TableData = [];
                for (let i = 0; i < rows.length; i++) {
                    const rowNode = rows[i];
                    const rowObj: Record<string, any> = {};
                    for (let j = 0; j < headers.length; j++) {
                        const tagName = headers[j];
                        const cellNode = rowNode.getElementsByTagName(tagName)[0];
                        rowObj[tagName] = autoType(cellNode?.textContent ?? null);
                    }
                    jsonData.push(rowObj);
                }

                dispatch({ type: 'SET_DATA', payload: { headers, previewData: jsonData } });
            } catch (err) {
                const error = err as Error;
                dispatch({ type: 'SET_ERROR', payload: `XML Parsing Error: ${error.message}` });
            }
        };
        reader.onerror = () => {
            dispatch({ type: 'SET_ERROR', payload: 'Could not read the XML file.' });
        };
        reader.readAsText(file);
    } else if (extension === 'html' || extension === 'htm') {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result as string;
                const parser = new DOMParser();
                const htmlDoc = parser.parseFromString(text, "text/html");
                const table = htmlDoc.querySelector('table');

                if (!table) {
                    dispatch({ type: 'SET_ERROR', payload: 'No <table> element found in the HTML file.' });
                    return;
                }

                const headers: TableHeaders = Array.from(table.querySelectorAll('th')).map(th => th.textContent || '');
                const rows: HTMLTableRowElement[] = Array.from(table.querySelectorAll('tbody tr'));
                
                const jsonData: TableData = rows.map(row => {
                    const rowObj: Record<string, any> = {};
                    const cells = row.querySelectorAll('td');
                    headers.forEach((header, index) => {
                        rowObj[header] = autoType(cells[index]?.textContent || null);
                    });
                    return rowObj;
                });
                
                dispatch({ type: 'SET_DATA', payload: { headers, previewData: jsonData } });
            } catch (err) {
                const error = err as Error;
                dispatch({ type: 'SET_ERROR', payload: `HTML Parsing Error: ${error.message}` });
            }
        };
        reader.onerror = () => {
            dispatch({ type: 'SET_ERROR', payload: 'Could not read the HTML file.' });
        };
        reader.readAsText(file);
    } else if (extension === 'md') {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result as string;
                const lines = text.split('\n').map(l => l.trim()).filter(l => l.startsWith('|') && l.endsWith('|'));
                
                if (lines.length < 2) { // Need at least header and separator
                    throw new Error("No valid Markdown table found.");
                }

                const rawHeaders = lines[0].slice(1, -1).split('|').map(h => h.trim());
                const separator = lines[1];

                // Basic check for a valid separator line
                if (!separator.slice(1, -1).split('|').every(s => s.trim().match(/^:?-+:?$/))) {
                    throw new Error("Invalid Markdown table format (separator line is malformed).");
                }
                
                const dataRows = lines.slice(2);
                
                const jsonData: TableData = dataRows.map(row => {
                    const values = row.slice(1, -1).split('|').map(v => v.trim());
                    const rowObj: Record<string, any> = {};
                    rawHeaders.forEach((header, index) => {
                        rowObj[header] = autoType(values[index] || null);
                    });
                    return rowObj;
                });

                dispatch({ type: 'SET_DATA', payload: { headers: rawHeaders, previewData: jsonData } });
            } catch (err) {
                const error = err as Error;
                dispatch({ type: 'SET_ERROR', payload: `Markdown Parsing Error: ${error.message}` });
            }
        };
        reader.onerror = () => {
            dispatch({ type: 'SET_ERROR', payload: 'Could not read the Markdown file.' });
        };
        reader.readAsText(file);
    }
    else {
        // Mock parsing for other types as libraries aren't available in this environment
        setTimeout(() => {
            if (extension === 'parquet') {
                const mockHeaders = ["id", "product_name", "price", "category"];
                const mockData = Array.from({length: 50}, (_, i) => ({
                    id: i + 1,
                    product_name: `Product ${i + 1}`,
                    price: parseFloat((Math.random() * 100).toFixed(2)),
                    category: `Category ${String.fromCharCode(65 + (i % 5))}`
                }));
                dispatch({ type: 'SET_DATA', payload: { headers: mockHeaders, previewData: mockData } });
            } else {
                dispatch({ type: 'SET_ERROR', payload: `Unsupported file type: .${extension}` });
            }
        }, 1000);
    }
  }, [dispatch]);

  const onDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
      e.dataTransfer.clearData();
    }
  }, [handleFile]);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center">
      <div 
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={`w-full max-w-2xl p-10 lg:p-16 border-2 border-dashed rounded-xl transition-all duration-300 ${isDragging ? 'border-cyan-400 bg-cyan-900/10' : 'border-gray-600 hover:border-cyan-500 hover:bg-gray-800/50'}`}
      >
        <label htmlFor="file-upload" className="flex flex-col items-center justify-center text-center cursor-pointer">
          <UploadCloudIcon className={`h-16 w-16 mb-4 transition-colors ${isDragging ? 'text-cyan-400' : 'text-gray-500'}`} />
          <h3 className="text-xl font-semibold text-gray-200">Drag and drop your file here</h3>
          <p className="mt-1 text-gray-400">or <span className="text-cyan-400 font-medium">click to browse</span></p>
          <p className="mt-4 text-xs text-gray-500">Supports CSV, TSV, JSON, XLSX, ODS, XML, HTML, Markdown, and Parquet</p>
        </label>
        <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={onFileChange} />
      </div>
    </div>
  );
};

export default FileDrop;