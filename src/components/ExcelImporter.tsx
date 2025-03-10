import React, { useState, useCallback } from 'react';
import { read, utils } from 'xlsx';
import { FileUp, Download, Loader2 } from 'lucide-react';

interface ExcelImporterProps {
  onDataImported: (data: any[], headers: string[]) => void;
}

export const ExcelImporter: React.FC<ExcelImporterProps> = ({ onDataImported }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processFile = async (file: File) => {
    try {
      setIsLoading(true);
      setError(null);

      const data = await file.arrayBuffer();
      const workbook = read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = utils.sheet_to_json(worksheet);
      const headers = Object.keys(jsonData[0] || {});

      onDataImported(jsonData, headers);
    } catch (err) {
      setError('Error processing file. Please ensure it\'s a valid Excel file.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      processFile(file);
    }
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  }, []);

  return (
    <div
      className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
        isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {isLoading ? (
        <div className="flex items-center justify-center space-x-2">
          <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
          <span>Processing file...</span>
        </div>
      ) : (
        <>
          <FileUp className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <p className="text-lg mb-2">Drag and drop your Excel file here</p>
          <p className="text-sm text-gray-500 mb-4">or</p>
          <label className="bg-blue-500 text-white px-4 py-2 rounded-lg cursor-pointer hover:bg-blue-600 transition-colors">
            Choose File
            <input
              type="file"
              className="hidden"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
            />
          </label>
          {error && (
            <p className="text-red-500 mt-4">{error}</p>
          )}
        </>
      )}
    </div>
  );
};