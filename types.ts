export enum FileFormat {
  CSV = 'csv',
  TSV = 'tsv',
  JSON = 'json',
  XLSX = 'xlsx',
  ODS = 'ods',
  PARQUET = 'parquet',
  SQL = 'sql',
  XML = 'xml',
  HTML = 'html',
  MARKDOWN = 'md',
  ARROW = 'arrow',
  UNKNOWN = 'unknown',
}

export type TableRow = Record<string, string | number | boolean | null>;
export type TableData = TableRow[];
export type TableHeaders = string[];

export interface DataState {
  file: File | null;
  fileName: string;
  fileSize: number;
  fileFormat: FileFormat;
  headers: TableHeaders;
  previewData: TableData;
  transformedData: TableData;
  isLoading: boolean;
  error: string | null;
  sqlQuery: string;
}

export type DataAction =
  | { type: 'START_LOADING'; payload: File }
  | { type: 'SET_DATA'; payload: { headers: TableHeaders; previewData: TableData } }
  | { type: 'SET_TRANSFORMED_DATA'; payload: TableData }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'CLEAR_DATA' }
  | { type: 'SET_SQL_QUERY'; payload: string };