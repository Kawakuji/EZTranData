import React from 'react';
import { DataProvider, useDataState, useDataDispatch } from './hooks/useDataStore';
import FileDrop from './components/FileDrop';
import PreviewTable from './components/PreviewTable';
import TransformPanel from './components/TransformPanel';
import ExportPanel from './components/ExportPanel';
import { DatabaseIcon, ZapIcon, ArrowLeftIcon } from './components/icons';

const App: React.FC = () => {
  return (
    <DataProvider>
      <MainLayout />
    </DataProvider>
  );
};

const MainLayout: React.FC = () => {
  const { file, isLoading, error, previewData } = useDataState();

  return (
    <div className="min-h-screen flex flex-col bg-gray-900 text-gray-200 font-sans">
      <header className="flex items-center justify-between p-4 border-b border-gray-700 bg-gray-800/50 backdrop-blur-sm sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <ZapIcon className="h-8 w-8 text-cyan-400" />
          <h1 className="text-2xl font-bold tracking-tight text-white">
            FastData
          </h1>
        </div>
      </header>

      <main className="flex-1 flex flex-col p-4 md:p-6 lg:p-8 gap-6">
        {!file ? (
          <FileDrop />
        ) : (
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
            <div className="lg:col-span-4 xl:col-span-3 flex flex-col gap-6">
              <TransformPanel />
              <ExportPanel />
            </div>
            <div className="lg:col-span-8 xl:col-span-9 flex flex-col min-h-0">
              {isLoading && <LoadingState />}
              {error && <ErrorState message={error} />}
              {!isLoading && !error && previewData.length > 0 && <PreviewTable />}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

const LoadingState: React.FC = () => (
    <div className="flex-1 flex flex-col items-center justify-center bg-gray-800/50 rounded-lg border border-gray-700 p-8">
        <DatabaseIcon className="h-16 w-16 text-cyan-500 animate-pulse" />
        <p className="mt-4 text-lg font-medium text-gray-300">Processing your data...</p>
        <p className="text-gray-400">Please wait a moment.</p>
    </div>
);

const ErrorState: React.FC<{ message: string }> = ({ message }) => {
    const dispatch = useDataDispatch();
    const handleClear = () => {
        dispatch({ type: 'CLEAR_DATA' });
    };

    return (
        <div className="flex-1 flex flex-col items-center justify-center bg-red-900/20 rounded-lg border border-red-500/50 p-8 text-center">
            <h3 className="text-xl font-semibold text-red-400">An Error Occurred</h3>
            <p className="mt-2 text-red-300">{message}</p>
            <button
                onClick={handleClear}
                className="mt-6 flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-500 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-red-500"
            >
                <ArrowLeftIcon className="h-4 w-4" />
                <span>Upload a different file</span>
            </button>
        </div>
    );
};


export default App;