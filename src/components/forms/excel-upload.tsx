'use client';

import { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle, X } from 'lucide-react';
import { Button } from '@/components/ui';
import * as XLSX from 'xlsx';

interface ExcelUploadProps {
  onUpload: (data: Record<string, unknown>[]) => Promise<void>;
  onCancel: () => void;
  projectId: string;
}

interface ColumnMapping {
  [key: string]: string; // Excel column -> Database column
}

interface DatabaseColumn {
  key: string;
  label: string;
  required: boolean;
  description: string;
}

// Interface for parsed lead data (not currently used but kept for reference)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface ParsedLead {
  lead_id: string;
  project_id: string;
  name: string;
  email: string;
  company: string;
  position: string;
  source: string;
  status: string;
  phone?: string;
  website?: string;
  address?: string;
  rating?: string;
  scraped_at?: string;
  error?: string;
}

// Database column definitions
const DATABASE_COLUMNS: DatabaseColumn[] = [
  { key: 'name', label: 'Name', required: true, description: 'Contact full name' },
  { key: 'email', label: 'Email', required: true, description: 'Email address' },
  { key: 'company', label: 'Company', required: true, description: 'Company name' },
  { key: 'website', label: 'Website', required: true, description: 'Company website URL' },
  { key: 'position', label: 'Position', required: false, description: 'Job title or position' },
  { key: 'phone', label: 'Phone', required: false, description: 'Phone number' },
  { key: 'address', label: 'Address', required: false, description: 'Physical address' },
  { key: 'source', label: 'Source', required: false, description: 'Lead source' },
  { key: 'status', label: 'Status', required: false, description: 'Lead status' },
  { key: 'rating', label: 'Rating', required: false, description: 'Lead rating or score' },
];

export function ExcelUpload({ onUpload, onCancel, projectId }: ExcelUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [previewData, setPreviewData] = useState<Record<string, unknown>[]>([]);
  const [fullData, setFullData] = useState<Record<string, unknown>[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [excelHeaders, setExcelHeaders] = useState<string[]>([]);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({});
  const [showMapping, setShowMapping] = useState(false);
  const [validationResults, setValidationResults] = useState<{
    valid: number;
    invalid: number;
    issues: string[];
  } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-map columns based on common patterns
  const autoMapColumns = (headers: string[]): ColumnMapping => {
    const mapping: ColumnMapping = {};
    
    headers.forEach(header => {
      const normalizedHeader = header.toLowerCase().trim();
      
      // Name variations
      if (normalizedHeader.match(/^(name|full.?name|contact.?name|first.?name|person|lead.?name)$/)) {
        mapping[header] = 'name';
      }
      // Email variations
      else if (normalizedHeader.match(/^(email|email.?address|e.?mail|contact.?email)$/)) {
        mapping[header] = 'email';
      }
      // Company variations
      else if (normalizedHeader.match(/^(company|organization|business|firm|corp|corporation|org)$/)) {
        mapping[header] = 'company';
      }
      // Website variations
      else if (normalizedHeader.match(/^(website|url|web|site|domain|homepage|web.?site|company.?url)$/)) {
        mapping[header] = 'website';
      }
      // Position variations
      else if (normalizedHeader.match(/^(position|title|job.?title|role|designation|job)$/)) {
        mapping[header] = 'position';
      }
      // Phone variations
      else if (normalizedHeader.match(/^(phone|mobile|telephone|tel|contact|number|phone.?number)$/)) {
        mapping[header] = 'phone';
      }
      // Address variations
      else if (normalizedHeader.match(/^(address|location|city|street|addr)$/)) {
        mapping[header] = 'address';
      }
      // Source variations
      else if (normalizedHeader.match(/^(source|origin|channel|lead.?source)$/)) {
        mapping[header] = 'source';
      }
      // Status variations
      else if (normalizedHeader.match(/^(status|state|stage|lead.?status)$/)) {
        mapping[header] = 'status';
      }
      // Rating variations
      else if (normalizedHeader.match(/^(rating|score|rank|priority|grade)$/)) {
        mapping[header] = 'rating';
      }
    });
    
    return mapping;
  };

  // Check if all required columns are mapped
  const validateMapping = (mapping: ColumnMapping): { isValid: boolean; missingColumns: string[] } => {
    const requiredColumns = DATABASE_COLUMNS.filter(col => col.required).map(col => col.key);
    const mappedColumns = Object.values(mapping);
    const missingColumns = requiredColumns.filter(col => !mappedColumns.includes(col));
    
    return {
      isValid: missingColumns.length === 0,
      missingColumns
    };
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    // Validate file type
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'text/csv' // .csv
    ];

    if (!validTypes.includes(selectedFile.type) && !selectedFile.name.match(/\.(xlsx|xls|csv)$/i)) {
      setError('Please select a valid Excel file (.xlsx, .xls) or CSV file (.csv)');
      return;
    }

    setFile(selectedFile);
    setError(null);
    parseFile(selectedFile);
  };

  const parseFile = async (file: File) => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      
      // Get the first worksheet
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      
      // Convert to JSON, skipping the first row (headers)
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as unknown[][];
      
      if (jsonData.length < 2) {
        setError('The file appears to be empty or contains only headers');
        return;
      }

      // Get headers from first row
      const headers = jsonData[0] as string[];
      const dataRows = jsonData.slice(1) as unknown[][]; // Skip header row

      console.log('Headers found:', headers);
      console.log('Data rows:', dataRows.length);
      console.log('Total rows in file (including header):', jsonData.length);

      // Store headers for mapping
      setExcelHeaders(headers);
      
      // Auto-map columns
      const autoMapping = autoMapColumns(headers);
      setColumnMapping(autoMapping);
      
      // Check if mapping is valid
      const mappingValidation = validateMapping(autoMapping);
      
      if (!mappingValidation.isValid) {
        console.log('Auto-mapping incomplete. Missing columns:', mappingValidation.missingColumns);
        setShowMapping(true);
        setError(`Please map the required columns: ${mappingValidation.missingColumns.join(', ')}`);
        return;
      }

      // Process data with mapping
      processDataWithMapping(dataRows, autoMapping);
      
    } catch (error) {
      console.error('Error parsing file:', error);
      setError('Failed to parse the file. Please ensure it\'s a valid Excel or CSV file.');
    }
  };

  // Process data using column mapping
  const processDataWithMapping = (dataRows: unknown[][], mapping: ColumnMapping) => {
    const mappedData = dataRows
      .filter((row: unknown[]) => row && row.length > 0 && row.some((cell: unknown) => cell !== null && cell !== undefined && cell !== ''))
      .map((row: unknown[], index: number) => {
        const leadData: Record<string, unknown> = {};
        
        // Apply column mapping for standard database fields
        Object.entries(mapping).forEach(([excelColumn, dbColumn]) => {
          const columnIndex = excelHeaders.indexOf(excelColumn);
          if (columnIndex !== -1 && row[columnIndex] !== undefined) {
            leadData[dbColumn] = String(row[columnIndex] || '').trim();
          }
        });

        // Note: Extra columns are intentionally not processed
        // Only mapped columns are included in the final data

        // Generate lead ID and set defaults
        leadData.lead_id = `lead_${projectId}_${Date.now()}_${index}`;
        leadData.project_id = projectId;
        leadData.source = leadData.source || 'Excel Upload';
        leadData.status = leadData.status || 'Active';
        leadData.scraped_at = new Date().toISOString();

        return leadData;
      });

    console.log('Mapped data sample:', mappedData.slice(0, 3));
    console.log('Total mapped leads:', mappedData.length);

    // Validate the data
    const validation = validateLeads(mappedData);
    setValidationResults(validation);
    
    // Store full data for upload
    setFullData(mappedData);
    
    // Show preview of first 5 rows
    setPreviewData(mappedData.slice(0, 5));
    
    // Hide mapping interface if it was shown
    setShowMapping(false);
    setError(null);
  };

  const validateLeads = (leads: Record<string, unknown>[]) => {
    let valid = 0;
    let invalid = 0;
    const issues: string[] = [];

    leads.forEach((lead, index) => {
      const rowNumber = index + 2; // +2 because we skip header and arrays are 0-indexed
      let hasIssues = false;

      // Check required fields: name, email, company, website
      const name = lead.name as string | undefined;
      const email = lead.email as string | undefined;
      const company = lead.company as string | undefined;
      const website = lead.website as string | undefined;

      if (!name || name.trim() === '') {
        issues.push(`Row ${rowNumber}: Missing name`);
        hasIssues = true;
      }

      if (!email || email.trim() === '') {
        issues.push(`Row ${rowNumber}: Missing email`);
        hasIssues = true;
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        issues.push(`Row ${rowNumber}: Invalid email format (${email})`);
        hasIssues = true;
      }

      if (!company || company.trim() === '') {
        issues.push(`Row ${rowNumber}: Missing company`);
        hasIssues = true;
      }

      if (!website || website.trim() === '') {
        issues.push(`Row ${rowNumber}: Missing website`);
        hasIssues = true;
      } else if (website && !/^https?:\/\/.+/.test(website) && !/^www\..+/.test(website) && !/\..+/.test(website)) {
        issues.push(`Row ${rowNumber}: Invalid website format (${website})`);
        hasIssues = true;
      }

      if (hasIssues) {
        invalid++;
      } else {
        valid++;
      }
    });

    return { valid, invalid, issues: issues.slice(0, 10) }; // Show max 10 issues
  };

  // Handle manual column mapping changes
  const handleMappingChange = (excelColumn: string, dbColumn: string) => {
    const newMapping = { ...columnMapping };
    
    if (dbColumn === '') {
      // Remove mapping
      delete newMapping[excelColumn];
    } else {
      // Remove any existing mapping for this database column
      Object.keys(newMapping).forEach(key => {
        if (newMapping[key] === dbColumn) {
          delete newMapping[key];
        }
      });
      // Add new mapping
      newMapping[excelColumn] = dbColumn;
    }
    
    setColumnMapping(newMapping);
  };

  // Apply manual mapping
  const applyMapping = async () => {
    const mappingValidation = validateMapping(columnMapping);
    
    if (!mappingValidation.isValid) {
      setError(`Please map the required columns: ${mappingValidation.missingColumns.join(', ')}`);
      return;
    }

    try {
      // Re-read the file to get the original data rows
      const arrayBuffer = await file!.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as unknown[][];
      const dataRows = jsonData.slice(1) as unknown[][];

      processDataWithMapping(dataRows, columnMapping);
    } catch (error) {
      console.error('Error re-reading file for mapping:', error);
      setError('Failed to process the file with mapping. Please try again.');
    }
  };

  const handleUpload = async () => {
    if (!file || !fullData.length) return;

    setUploading(true);
    try {
      await onUpload(fullData);
    } catch (error) {
      console.error('Upload failed:', error);
      setError('Failed to upload leads. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      setFile(droppedFile);
      setError(null);
      parseFile(droppedFile);
    }
  };

  return (
    <div className="space-y-6">
      {/* File Upload Area */}
      <div
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
          error ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400 bg-gray-50'
        }`}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleFileSelect}
          className="hidden"
        />
        
        <FileSpreadsheet className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        
        {!file ? (
          <>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Upload Excel or CSV File
            </h3>
            <p className="text-gray-600 mb-4">
              Drag and drop your file here, or click to browse
            </p>
            <Button
              onClick={() => fileInputRef.current?.click()}
              icon={<Upload className="w-4 h-4" />}
              variant="secondary"
            >
              Choose File
            </Button>
          </>
        ) : (
          <div className="space-y-2">
            <CheckCircle className="w-8 h-8 text-green-500 mx-auto" />
            <p className="font-medium text-gray-900">{file.name}</p>
            <p className="text-sm text-gray-600">
              {(file.size / 1024).toFixed(1)} KB
            </p>
            <Button
              onClick={() => {
                setFile(null);
                setPreviewData([]);
                setFullData([]);
                setExcelHeaders([]);
                setColumnMapping({});
                setShowMapping(false);
                setValidationResults(null);
                setError(null);
              }}
              variant="ghost"
              size="sm"
              icon={<X className="w-4 h-4" />}
            >
              Remove
            </Button>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
            <span className="text-red-800 font-medium">Error</span>
          </div>
          <p className="text-red-700 mt-1">{error}</p>
        </div>
      )}

      {/* Column Mapping Interface */}
      {showMapping && excelHeaders.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h4 className="font-medium text-yellow-900 mb-4">Map Your Columns</h4>
          <p className="text-sm text-yellow-800 mb-4">
            Please map your Excel columns to the database fields. Required fields are marked with *.
          </p>
          
          <div className="space-y-3">
            {excelHeaders.map((header, index) => (
              <div key={index} className="flex items-center space-x-4">
                <div className="w-1/3">
                  <label className="block text-sm font-medium text-gray-700">
                    Excel Column: <span className="font-bold text-blue-600">{header}</span>
                  </label>
                </div>
                <div className="w-1/3">
                  <select
                    value={columnMapping[header] || ''}
                    onChange={(e) => handleMappingChange(header, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-gray-900 bg-white"
                  >
                    <option value="">-- Select Database Field --</option>
                    {DATABASE_COLUMNS.map((col) => (
                      <option key={col.key} value={col.key}>
                        {col.label} {col.required ? '*' : ''} - {col.description}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="w-1/3">
                  {columnMapping[header] && (
                    <div className="flex items-center">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-1" />
                      <span className="text-sm text-green-700">
                        Mapped to: {DATABASE_COLUMNS.find(col => col.key === columnMapping[header])?.label}
                        {DATABASE_COLUMNS.find(col => col.key === columnMapping[header])?.required && (
                          <span className="text-red-500 ml-1">*</span>
                        )}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h5 className="font-medium text-blue-900 mb-2">Required Fields Status:</h5>
            <div className="grid grid-cols-2 gap-2">
              {DATABASE_COLUMNS.filter(col => col.required).map((col) => {
                const isMapped = Object.values(columnMapping).includes(col.key);
                return (
                  <div key={col.key} className="flex items-center">
                    {isMapped ? (
                      <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-500 mr-2" />
                    )}
                    <span className={`text-sm ${isMapped ? 'text-green-700' : 'text-red-700'}`}>
                      {col.label} {isMapped ? '✓' : '(Required)'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>


          <div className="flex justify-end space-x-3 mt-6">
            <Button
              onClick={() => setShowMapping(false)}
              variant="secondary"
            >
              Cancel
            </Button>
            <Button
              onClick={applyMapping}
              disabled={!validateMapping(columnMapping).isValid}
            >
              Apply Mapping
            </Button>
          </div>
        </div>
      )}

      {/* Validation Results */}
      {validationResults && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">Validation Results</h4>
          <div className="grid grid-cols-3 gap-4 mb-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{fullData.length}</div>
              <div className="text-sm text-blue-700">Total Leads</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{validationResults.valid}</div>
              <div className="text-sm text-green-700">Valid Leads</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{validationResults.invalid}</div>
              <div className="text-sm text-red-700">Invalid Leads</div>
            </div>
          </div>
          
          {validationResults.issues.length > 0 && (
            <div>
              <p className="text-sm font-medium text-blue-900 mb-2">Issues found:</p>
              <ul className="text-sm text-blue-800 space-y-1">
                {validationResults.issues.map((issue, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-red-500 mr-2">•</span>
                    {issue}
                  </li>
                ))}
              </ul>
              {validationResults.issues.length === 10 && (
                <p className="text-xs text-blue-600 mt-2">... and possibly more issues</p>
              )}
            </div>
          )}
          
          <div className="mt-3 p-2 bg-blue-100 rounded-md">
            <p className="text-xs text-blue-800">
              <strong>Note:</strong> All {fullData.length} leads from your file will be uploaded, including both valid and invalid ones. Invalid leads can be corrected later in the leads table.
            </p>
            {(() => {
              const mappedExcelColumns = Object.keys(columnMapping);
              const extraColumns = excelHeaders.filter(header => !mappedExcelColumns.includes(header));
              if (extraColumns.length > 0) {
                return (
                  <p className="text-xs text-blue-800 mt-1">
                    <strong>Extra Columns:</strong> {extraColumns.length} additional columns ({extraColumns.join(', ')}) will be preserved and appended at the end of your database.
                  </p>
                );
              }
              return null;
            })()}
          </div>
        </div>
      )}

      {/* Preview Data */}
      {previewData.length > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-3">Preview (First 5 rows)</h4>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-3 font-medium text-gray-700">Name</th>
                  <th className="text-left py-2 px-3 font-medium text-gray-700">Email</th>
                  <th className="text-left py-2 px-3 font-medium text-gray-700">Company</th>
                  <th className="text-left py-2 px-3 font-medium text-gray-700">Position</th>
                </tr>
              </thead>
              <tbody>
                {previewData.map((lead, index) => (
                  <tr key={index} className="border-b border-gray-100">
                    <td className="py-2 px-3 text-gray-900">{(lead.name as string) || 'N/A'}</td>
                    <td className="py-2 px-3 text-gray-900">{(lead.email as string) || 'N/A'}</td>
                    <td className="py-2 px-3 text-gray-900">{(lead.company as string) || 'N/A'}</td>
                    <td className="py-2 px-3 text-gray-900">{(lead.position as string) || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end space-x-4">
        <Button
          onClick={onCancel}
          variant="secondary"
          disabled={uploading}
        >
          Cancel
        </Button>
        <Button
          onClick={handleUpload}
          loading={uploading}
          disabled={!file || !fullData.length}
          icon={<Upload className="w-4 h-4" />}
        >
          {uploading ? 'Uploading...' : `Upload ${fullData.length} Leads`}
        </Button>
      </div>

      {/* Instructions */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h4 className="font-medium text-yellow-900 mb-2">File Format Requirements</h4>
        <ul className="text-sm text-yellow-800 space-y-1">
          <li>• First row should contain column headers</li>
          <li>• <strong>Required columns:</strong> Name, Email, Company, Website</li>
          <li>• <strong>Optional columns:</strong> Position, Phone, Address, Source, Status, Rating</li>
          <li>• Column names can be in any order - we&apos;ll auto-map them</li>
          <li>• Supported formats: .xlsx, .xls, .csv</li>
          <li>• Maximum file size: 10MB</li>
        </ul>
        <div className="mt-3 p-3 bg-blue-50 rounded-md">
          <p className="text-xs text-blue-800">
            <strong>Smart Mapping:</strong> Our system automatically detects common column variations like &quot;Full Name&quot; → Name, &quot;Email Address&quot; → Email, &quot;Organization&quot; → Company, etc. If auto-mapping fails, you&apos;ll get a manual mapping interface.
          </p>
        </div>
      </div>
    </div>
  );
}
