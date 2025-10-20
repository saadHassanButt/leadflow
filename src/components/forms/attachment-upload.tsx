'use client';

import { useState, useRef } from 'react';
import { Upload, X, File, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui';

interface AttachmentFile {
  file: File;
  id: string;
  uploading: boolean;
  uploaded: boolean;
  error?: string;
  driveUrl?: string;
}

interface AttachmentUploadProps {
  onUpload: (files: { name: string; url: string }[]) => Promise<void>;
  onCancel: () => void;
  templateId: string;
  existingAttachments?: { name: string; url: string }[];
}

export function AttachmentUpload({ onUpload, onCancel, templateId, existingAttachments = [] }: AttachmentUploadProps) {
  const [files, setFiles] = useState<AttachmentFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB in bytes
  const ALLOWED_TYPES = [
    // Documents
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/csv',
    // Images
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    // Archives
    'application/zip',
    'application/x-rar-compressed',
    'application/x-7z-compressed',
    // Other common types
    'application/json',
    'application/xml',
  ];

  const validateFile = (file: File): string | null => {
    if (file.size > MAX_FILE_SIZE) {
      return `File size exceeds 20MB limit (${(file.size / 1024 / 1024).toFixed(1)}MB)`;
    }
    
    if (!ALLOWED_TYPES.includes(file.type) && !file.name.match(/\.(txt|csv|json|xml)$/i)) {
      return `File type not supported: ${file.type || 'unknown'}`;
    }
    
    return null;
  };

  const addFiles = (newFiles: FileList | File[]) => {
    const fileArray = Array.from(newFiles);
    const validFiles: AttachmentFile[] = [];
    
    fileArray.forEach(file => {
      const error = validateFile(file);
      const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      validFiles.push({
        file,
        id,
        uploading: false,
        uploaded: false,
        error: error || undefined
      });
    });
    
    setFiles(prev => [...prev, ...validFiles]);
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(e.target.files);
      // Reset input
      e.target.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files);
    }
  };

  const uploadFiles = async () => {
    const validFiles = files.filter(f => !f.error && !f.uploaded);
    if (validFiles.length === 0) return;

    setUploading(true);
    
    try {
      // Update file states to show uploading
      setFiles(prev => prev.map(f => 
        validFiles.some(vf => vf.id === f.id) 
          ? { ...f, uploading: true } 
          : f
      ));

      const uploadPromises = validFiles.map(async (fileItem) => {
        try {
          const formData = new FormData();
          formData.append('file', fileItem.file);
          formData.append('templateId', templateId);

          // Get tokens from localStorage
          const accessToken = localStorage.getItem('google_access_token');
          const refreshToken = localStorage.getItem('google_refresh_token');
          const tokenExpiry = localStorage.getItem('google_token_expiry');

          const response = await fetch('/api/attachments/upload', {
            method: 'POST',
            headers: {
              'x-google-access-token': accessToken || '',
              'x-google-refresh-token': refreshToken || '',
              'x-google-token-expiry': tokenExpiry || '0',
            },
            body: formData
          });

          const data = await response.json();
          
          if (data.success) {
            // Update file state to show success
            setFiles(prev => prev.map(f => 
              f.id === fileItem.id 
                ? { ...f, uploading: false, uploaded: true, driveUrl: data.data.url }
                : f
            ));
            
            return { name: fileItem.file.name, url: data.data.url };
          } else {
            // Handle insufficient permissions error
            if (response.status === 403 && data.error?.includes('Insufficient permissions')) {
              alert('Google Drive access required! You need to re-authenticate to grant Drive permissions. Redirecting to authentication...');
              window.location.href = `/auth/google?project_id=${templateId.split('_')[1]}`;
              return;
            }
            
            // Update file state to show error
            setFiles(prev => prev.map(f => 
              f.id === fileItem.id 
                ? { ...f, uploading: false, error: data.error || 'Upload failed' }
                : f
            ));
            throw new Error(data.error || 'Upload failed');
          }
        } catch (error) {
          console.error('Error uploading file:', fileItem.file.name, error);
          setFiles(prev => prev.map(f => 
            f.id === fileItem.id 
              ? { ...f, uploading: false, error: 'Upload failed' }
              : f
          ));
          throw error;
        }
      });

      const uploadedFiles = await Promise.allSettled(uploadPromises);
      const successfulUploads = uploadedFiles
        .filter((result): result is PromiseFulfilledResult<{ name: string; url: string }> => 
          result.status === 'fulfilled'
        )
        .map(result => result.value);

      if (successfulUploads.length > 0) {
        // Combine with existing attachments
        const allAttachments = [...existingAttachments, ...successfulUploads];
        await onUpload(allAttachments);
      }

    } catch (error) {
      console.error('Error uploading attachments:', error);
    } finally {
      setUploading(false);
    }
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return '🖼️';
    if (file.type.includes('pdf')) return '📄';
    if (file.type.includes('word') || file.type.includes('document')) return '📝';
    if (file.type.includes('excel') || file.type.includes('spreadsheet')) return '📊';
    if (file.type.includes('powerpoint') || file.type.includes('presentation')) return '📋';
    if (file.type.includes('zip') || file.type.includes('rar') || file.type.includes('7z')) return '🗜️';
    return '📎';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const hasValidFiles = files.some(f => !f.error);
  const hasUploadedFiles = files.some(f => f.uploaded);

  return (
    <div className="space-y-6">
      {/* Drag & Drop Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Upload Attachments
        </h3>
        <p className="text-gray-600 mb-4">
          Drag and drop files here, or click to select files
        </p>
        <Button
          variant="secondary"
          onClick={() => fileInputRef.current?.click()}
        >
          Choose Files
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.json,.xml,.jpg,.jpeg,.png,.gif,.webp,.svg,.zip,.rar,.7z"
        />
        <p className="text-xs text-gray-500 mt-2">
          Maximum file size: 20MB. Supports documents, images, and archives.
        </p>
      </div>

      {/* Existing Attachments */}
      {existingAttachments.length > 0 && (
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Current Attachments</h4>
          <div className="space-y-2">
            {existingAttachments.map((attachment, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  <File className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium text-green-900">{attachment.name}</span>
                </div>
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* File List */}
      {files.length > 0 && (
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Selected Files</h4>
          <div className="space-y-2">
            {files.map((fileItem) => (
              <div
                key={fileItem.id}
                className={`flex items-center justify-between p-3 border rounded-lg ${
                  fileItem.error 
                    ? 'bg-red-50 border-red-200' 
                    : fileItem.uploaded
                    ? 'bg-green-50 border-green-200'
                    : fileItem.uploading
                    ? 'bg-blue-50 border-blue-200'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-lg">{getFileIcon(fileItem.file)}</span>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {fileItem.file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(fileItem.file.size)}
                    </p>
                    {fileItem.error && (
                      <p className="text-xs text-red-600 mt-1">
                        {fileItem.error}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {fileItem.uploading && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  )}
                  {fileItem.uploaded && (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  )}
                  {fileItem.error && (
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  )}
                  {!fileItem.uploading && (
                    <button
                      onClick={() => removeFile(fileItem.id)}
                      className="p-1 hover:bg-gray-200 rounded"
                    >
                      <X className="w-4 h-4 text-gray-500" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3">
        <Button
          variant="secondary"
          onClick={onCancel}
          disabled={uploading}
        >
          Cancel
        </Button>
        <Button
          onClick={uploadFiles}
          disabled={!hasValidFiles || uploading || hasUploadedFiles}
          loading={uploading}
        >
          {uploading ? 'Uploading...' : `Upload ${files.filter(f => !f.error && !f.uploaded).length} Files`}
        </Button>
      </div>
    </div>
  );
}
