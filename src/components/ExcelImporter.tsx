import React, { useState, useCallback } from 'react';
import { read, utils } from 'xlsx';
import { FileUp, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

interface ExcelImporterProps {
  onDataImported: (data: any[], headers: string[]) => void;
  requiredHeaders?: string[];
  optionalHeaders?: string[];
  fileFormat?: string;
}

interface ValidationError {
  type: 'required' | 'format' | 'data';
  message: string;
}

export const ExcelImporter: React.FC<ExcelImporterProps> = ({ 
  onDataImported,
  requiredHeaders = [],
  optionalHeaders = [],
  fileFormat = '.xlsx, .xls'
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [isValid, setIsValid] = useState(false);

  const validateHeaders = (headers: string[]): ValidationError[] => {
    const errors: ValidationError[] = [];
    
    // Check for required headers
    const missingHeaders = requiredHeaders.filter(
      header => !headers.includes(header)
    );
    
    if (missingHeaders.length > 0) {
      errors.push({
        type: 'required',
        message: `Missing required headers: ${missingHeaders.join(', ')}`
      });
    }

    // Check for unrecognized headers
    const validHeaders = [...requiredHeaders, ...optionalHeaders];
    const unknownHeaders = headers.filter(
      header => !validHeaders.includes(header) && validHeaders.length > 0
    );
    
    if (unknownHeaders.length > 0) {
      errors.push({
        type: 'format',
        message: `Unrecognized headers found: ${unknownHeaders.join(', ')}`
      });
    }

    return errors;
  };

  const validateData = (data: any[]): ValidationError[] => {
    const errors: ValidationError[] = [];
    
    // Add your data validation logic here
    // Example: Check for empty required fields
    data.forEach((row, index) => {
      requiredHeaders.forEach(header => {
        if (!row[header] || row[header].toString().trim() === '') {
          errors.push({
            type: 'data',
            message: `Empty required field "${header}" in row ${index + 1}`
          });
        }
      });
    });

    return errors;
  };

  const processFile = async (file: File) => {
    try {
      setIsLoading(true);
      setErrors([]);
      setIsValid(false);

      // Validate file format
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      const allowedFormats = fileFormat.split(',').map(format => 
        format.trim().replace('.', '').toLowerCase()
      );
      
      if (!allowedFormats.includes(fileExtension || '')) {
        setErrors([{
          type: 'format',
          message: `Invalid file format. Please use ${fileFormat} files.`
        }]);
        return;
      }

      const data = await file.arrayBuffer();
      const workbook = read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = utils.sheet_to_json(worksheet);
      
      if (jsonData.length === 0) {
        setErrors([{
          type: 'data',
          message: 'The file contains no data.'
        }]);
        return;
      }

      const headers = Object.keys(jsonData[0] || {});
      
      // Validate headers and data
      const headerErrors = validateHeaders(headers);
      const dataErrors = validateData(jsonData);
      const allErrors = [...headerErrors, ...dataErrors];
      
      setErrors(allErrors);
      
      if (allErrors.length === 0) {
        setIsValid(true);
        onDataImported(jsonData, headers);
      }
    } catch (err) {
      setErrors([{
        type: 'format',
        message: 'Error processing file. Please ensure it\'s a valid Excel file.'
      }]);
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
    <div className="space-y-4">
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
                accept={fileFormat}
                onChange={handleFileChange}
              />
            </label>
          </>
        )}
      </div>

      {/* File Requirements */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="font-medium mb-2">File Requirements:</h3>
        <ul className="space-y-2 text-sm">
          {requiredHeaders.length > 0 && (
            <li className="flex items-start space-x-2">
              <span className="text-red-500">*</span>
              <span>
                Required columns: {requiredHeaders.join(', ')}
              </span>
            </li>
          )}
          {optionalHeaders.length > 0 && (
            <li className="flex items-start space-x-2">
              <span>Optional columns: {optionalHeaders.join(', ')}</span>
            </li>
          )}
          <li>Accepted formats: {fileFormat}</li>
        </ul>
      </div>

      {/* Validation Results */}
      {(errors.length > 0 || isValid) && (
        <div className={`rounded-lg p-4 ${
          isValid ? 'bg-green-50' : 'bg-red-50'
        }`}>
          {isValid ? (
            <div className="flex items-center space-x-2 text-green-700">
              <CheckCircle2 className="w-5 h-5" />
              <span>File validated successfully!</span>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-red-700">
                <AlertCircle className="w-5 h-5" />
                <span className="font-medium">Validation Errors:</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-sm text-red-700">
                {errors.map((error, index) => (
                  <li key={index}>{error.message}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};