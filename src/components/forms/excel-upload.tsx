'use client';

import { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle, X } from 'lucide-react';
import { Button } from '@/components/ui';
import * as XLSX from 'xlsx';

interface ExcelUploadProps {
  onUpload: (data: any[]) => Promise<void>;
  onCancel: () => void;
  projectId: string;
}

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

export function ExcelUpload({ onUpload, onCancel, projectId }: ExcelUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [validationResults, setValidationResults] = useState<{
    valid: number;
    invalid: number;
    issues: string[];
  } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      if (jsonData.length < 2) {
        setError('The file appears to be empty or contains only headers');
        return;
      }

      // Get headers from first row
      const headers = jsonData[0] as string[];
      const dataRows = jsonData.slice(1); // Skip header row

      console.log('Headers found:', headers);
      console.log('Data rows:', dataRows.length);

      // Map the data to our lead structure
      const mappedData = dataRows
        .filter((row: any) => row && row.length > 0 && row.some((cell: any) => cell !== null && cell !== undefined && cell !== ''))
        .map((row: any, index: number) => {
          const leadData: any = {};
          
          headers.forEach((header, headerIndex) => {
            if (header && row[headerIndex] !== undefined) {
              // Map common header variations to our standard fields
              const normalizedHeader = header.toLowerCase().trim();
              
              if (normalizedHeader.includes('name') || normalizedHeader === 'full name' || normalizedHeader === 'contact name') {
                leadData.name = String(row[headerIndex] || '').trim();
              } else if (normalizedHeader.includes('email') || normalizedHeader === 'email address') {
                leadData.email = String(row[headerIndex] || '').trim();
              } else if (normalizedHeader.includes('company') || normalizedHeader === 'organization' || normalizedHeader === 'business') {
                leadData.company = String(row[headerIndex] || '').trim();
              } else if (normalizedHeader.includes('position') || normalizedHeader === 'title' || normalizedHeader === 'job title' || normalizedHeader === 'role') {
                leadData.position = String(row[headerIndex] || '').trim();
              } else if (normalizedHeader.includes('phone') || normalizedHeader === 'mobile' || normalizedHeader === 'telephone') {
                leadData.phone = String(row[headerIndex] || '').trim();
              } else if (normalizedHeader.includes('website') || normalizedHeader === 'url' || normalizedHeader === 'web') {
                leadData.website = String(row[headerIndex] || '').trim();
              } else if (normalizedHeader.includes('address') || normalizedHeader === 'location') {
                leadData.address = String(row[headerIndex] || '').trim();
              } else if (normalizedHeader.includes('source')) {
                leadData.source = String(row[headerIndex] || '').trim();
              } else if (normalizedHeader.includes('status')) {
                leadData.status = String(row[headerIndex] || '').trim();
              } else if (normalizedHeader.includes('rating') || normalizedHeader === 'score') {
                leadData.rating = String(row[headerIndex] || '').trim();
              }
            }
          });

          // Generate lead ID and set defaults
          leadData.lead_id = `lead_${projectId}_${Date.now()}_${index}`;
          leadData.project_id = projectId;
          leadData.source = leadData.source || 'Excel Upload';
          leadData.status = leadData.status || 'Active';
          leadData.scraped_at = new Date().toISOString();

          return leadData;
        });

      console.log('Mapped data sample:', mappedData.slice(0, 3));

      // Validate the data
      const validation = validateLeads(mappedData);
      setValidationResults(validation);
      
      // Show preview of first 5 rows
      setPreviewData(mappedData.slice(0, 5));
      
    } catch (error) {
      console.error('Error parsing file:', error);
      setError('Failed to parse the file. Please ensure it\'s a valid Excel or CSV file.');
    }
  };

  const validateLeads = (leads: any[]) => {
    let valid = 0;
    let invalid = 0;
    const issues: string[] = [];

    leads.forEach((lead, index) => {
      const rowNumber = index + 2; // +2 because we skip header and arrays are 0-indexed
      let hasIssues = false;

      if (!lead.name || lead.name.trim() === '') {
        issues.push(`Row ${rowNumber}: Missing name`);
        hasIssues = true;
      }

      if (!lead.email || lead.email.trim() === '') {
        issues.push(`Row ${rowNumber}: Missing email`);
        hasIssues = true;
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email)) {
        issues.push(`Row ${rowNumber}: Invalid email format (${lead.email})`);
        hasIssues = true;
      }

      if (!lead.company || lead.company.trim() === '') {
        issues.push(`Row ${rowNumber}: Missing company`);
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

  const handleUpload = async () => {
    if (!file || !previewData.length) return;

    setUploading(true);
    try {
      await onUpload(previewData);
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

      {/* Validation Results */}
      {validationResults && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">Validation Results</h4>
          <div className="grid grid-cols-2 gap-4 mb-3">
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
                    <td className="py-2 px-3 text-gray-900">{lead.name || 'N/A'}</td>
                    <td className="py-2 px-3 text-gray-900">{lead.email || 'N/A'}</td>
                    <td className="py-2 px-3 text-gray-900">{lead.company || 'N/A'}</td>
                    <td className="py-2 px-3 text-gray-900">{lead.position || 'N/A'}</td>
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
          disabled={!file || !previewData.length || (validationResults?.valid === 0)}
          icon={<Upload className="w-4 h-4" />}
        >
          {uploading ? 'Uploading...' : `Upload ${previewData.length} Leads`}
        </Button>
      </div>

      {/* Instructions */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h4 className="font-medium text-yellow-900 mb-2">File Format Requirements</h4>
        <ul className="text-sm text-yellow-800 space-y-1">
          <li>• First row should contain column headers</li>
          <li>• Required columns: Name, Email, Company</li>
          <li>• Optional columns: Position, Phone, Website, Address, Source, Status</li>
          <li>• Supported formats: .xlsx, .xls, .csv</li>
          <li>• Maximum file size: 10MB</li>
        </ul>
      </div>
    </div>
  );
}
