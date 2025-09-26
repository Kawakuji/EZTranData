import React, { createContext, useReducer, useContext, Dispatch, ReactNode } from 'react';
import { DataState, DataAction, FileFormat } from '../types';

const initialState: DataState = {
  file: null,
  fileName: '',
  fileSize: 0,
  fileFormat: FileFormat.UNKNOWN,
  headers: [],
  previewData: [],
  transformedData: [],
  isLoading: false,
  error: null,
  sqlQuery: 'SELECT * FROM source LIMIT 100;',
};

const getFileFormat = (fileName: string): FileFormat => {
  const extension = fileName.split('.').pop()?.toLowerCase();
  switch (extension) {
    case 'csv': return FileFormat.CSV;
    case 'tsv': return FileFormat.TSV;
    case 'json': return FileFormat.JSON;
    case 'xlsx': return FileFormat.XLSX;
    case 'ods': return FileFormat.ODS;
    case 'xml': return FileFormat.XML;
    case 'html':
    case 'htm':
      return FileFormat.HTML;
    case 'md': return FileFormat.MARKDOWN;
    case 'parquet': return FileFormat.PARQUET;
    default: return FileFormat.UNKNOWN;
  }
};

const dataReducer = (state: DataState, action: DataAction): DataState => {
  switch (action.type) {
    case 'START_LOADING':
      return {
        ...initialState,
        isLoading: true,
        file: action.payload,
        fileName: action.payload.name,
        fileSize: action.payload.size,
        fileFormat: getFileFormat(action.payload.name),
      };
    case 'SET_DATA':
      return {
        ...state,
        headers: action.payload.headers,
        previewData: action.payload.previewData,
        transformedData: action.payload.previewData, // Initially, transformed data is the same
        isLoading: false,
        error: null,
      };
    case 'SET_TRANSFORMED_DATA':
        return {
          ...state,
          transformedData: action.payload,
          isLoading: false,
        };
    case 'SET_ERROR':
      return {
        ...state,
        isLoading: false,
        error: action.payload,
      };
    case 'CLEAR_DATA':
      return initialState;
    case 'SET_SQL_QUERY':
        return {
            ...state,
            sqlQuery: action.payload,
        };
    default:
      return state;
  }
};

const DataStateContext = createContext<DataState | undefined>(undefined);
const DataDispatchContext = createContext<Dispatch<DataAction> | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(dataReducer, initialState);

  return (
    <DataStateContext.Provider value={state}>
      <DataDispatchContext.Provider value={dispatch}>
        {children}
      </DataDispatchContext.Provider>
    </DataStateContext.Provider>
  );
};

export const useDataState = () => {
  const context = useContext(DataStateContext);
  if (context === undefined) {
    throw new Error('useDataState must be used within a DataProvider');
  }
  return context;
};

export const useDataDispatch = () => {
  const context = useContext(DataDispatchContext);
  if (context === undefined) {
    throw new Error('useDataDispatch must be used within a DataProvider');
  }
  return context;
};