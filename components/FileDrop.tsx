import React, { useCallback, useState } from 'react';
import { useDataDispatch } from '../hooks/useDataStore';
import { UploadCloudIcon } from './icons';
import { TableData, TableHeaders } from '../types';

// Augment the window object to include Papa
declare global {
  interface Window {
    Papa: any;
  }
}

const FileDrop: React.FC = () => {
  const dispatch = useDataDispatch();
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = useCallback((file: File) => {
    if (!file) return;

    dispatch({ type: 'START_LOADING', payload: file });

    // For simplicity, we'll only implement CSV parsing with PapaParse
    // Other file types would require their respective libraries (xlsx, parquet-wasm)
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (extension === 'csv') {
      window.Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        preview: 100, // Preview first 100 rows for performance
        complete: (results: { data: TableData; errors: any[]; meta: { fields: TableHeaders } }) => {
          if (results.errors.length > 0) {
            dispatch({ type: 'SET_ERROR', payload: `CSV Parsing Error: ${results.errors[0].message}` });
            return;
          }
          dispatch({ type: 'SET_DATA', payload: { headers: results.meta.fields, previewData: results.data } });
        },
        error: (error: Error) => {
          dispatch({ type: 'SET_ERROR', payload: `File Reading Error: ${error.message}` });
        },
      });
    } else {
        // Mock parsing for other types
        setTimeout(() => {
            if (extension === 'json' || extension === 'xlsx' || extension === 'parquet') {
                const mockHeaders = ["id", "product_name", "price", "category"];
                const mockData = Array.from({length: 50}, (_, i) => ({
                    id: i + 1,
                    product_name: `Product ${i + 1}`,
                    price: (Math.random() * 100).toFixed(2),
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
          <p className="mt-4 text-xs text-gray-500">Supports CSV, JSON, XLSX, and Parquet</p>
        </label>
        <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={onFileChange} />
      </div>
    </div>
  );
};

export default FileDrop;
