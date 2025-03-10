import React, { useState } from 'react';
import { utils, write } from 'xlsx';
import { Download } from 'lucide-react';
import { ExcelImporter } from './components/ExcelImporter';
import { DataTable } from './components/DataTable';

function App() {
  const [data, setData] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [isPreview, setIsPreview] = useState(true);

  const handleDataImported = (importedData: any[], importedHeaders: string[]) => {
    setData(importedData);
    setHeaders(importedHeaders);
    setIsPreview(true);
  };

  const handleConfirmImport = () => {
    setIsPreview(false);
  };

  const handleExport = () => {
    const ws = utils.json_to_sheet(data);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, 'Sheet1');
    
    const excelBuffer = write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'exported-data.xlsx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-2xl font-bold mb-6">Excel File Import/Export System</h1>
          
          {data.length === 0 ? (
            <ExcelImporter onDataImported={handleDataImported} />
          ) : (
            <div className="space-y-6">
              {isPreview && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <h2 className="text-lg font-semibold mb-2">Preview Mode</h2>
                  <p className="text-gray-600 mb-4">
                    Review your imported data before confirming the import.
                  </p>
                  <button
                    onClick={handleConfirmImport}
                    className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Confirm Import
                  </button>
                </div>
              )}
              
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">
                  {isPreview ? 'Data Preview' : 'Imported Data'}
                </h2>
                <button
                  onClick={handleExport}
                  className="flex items-center space-x-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
                >
                  <Download className="w-5 h-5" />
                  <span>Export to Excel</span>
                </button>
              </div>

              <DataTable data={data} columns={headers} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;