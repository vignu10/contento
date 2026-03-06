'use client';

import { useState, useRef } from 'react';
import { Upload, File, X, Loader2 } from 'lucide-react';

interface FileUploadProps {
  onUpload: (file: File, sourceType: string) => void;
  processing: boolean;
}

export default function FileUpload({ onUpload, processing }: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const allowedTypes = {
    'audio/mpeg': 'audio',
    'audio/mp3': 'audio',
    'audio/wav': 'audio',
    'audio/x-m4a': 'audio',
    'audio/m4a': 'audio',
    'video/mp4': 'video',
    'video/quicktime': 'video',
    'video/x-msvideo': 'video',
    'application/pdf': 'pdf',
  };

  function handleDrag(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  }

  function handleFile(file: File) {
    const fileType = allowedTypes[file.type as keyof typeof allowedTypes];
    
    if (!fileType) {
      alert('Invalid file type. Please upload audio (MP3, WAV, M4A), video (MP4, MOV, AVI), or PDF files.');
      return;
    }

    // Check file size (100MB limit)
    if (file.size > 100 * 1024 * 1024) {
      alert('File too large. Maximum size is 100MB.');
      return;
    }

    setSelectedFile(file);
  }

  function handleUpload() {
    if (!selectedFile) return;
    
    const fileType = allowedTypes[selectedFile.type as keyof typeof allowedTypes];
    onUpload(selectedFile, fileType);
    setSelectedFile(null);
  }

  function formatFileSize(bytes: number) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  return (
    <div className="w-full">
      {/* Drop Zone */}
      <div
        className={`
          relative border-2 border-dashed rounded-xl p-8 text-center transition-all
          ${dragActive ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-300 dark:border-gray-600'}
          ${processing ? 'opacity-50 pointer-events-none' : 'cursor-pointer hover:border-primary-400'}
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept=".mp3,.wav,.m4a,.mp4,.mov,.avi,.pdf,audio/*,video/*,.pdf"
          onChange={handleChange}
          disabled={processing}
        />

        {processing ? (
          <div className="flex flex-col items-center">
            <Loader2 className="w-12 h-12 text-primary-500 animate-spin mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Processing your file...</p>
            <p className="text-sm text-gray-500 mt-2">This may take a few minutes</p>
          </div>
        ) : (
          <>
            <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
              Drop your file here or click to upload
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Audio (MP3, WAV, M4A) • Video (MP4, MOV) • PDF • Max 100MB
            </p>
          </>
        )}
      </div>

      {/* Selected File Preview */}
      {selectedFile && !processing && (
        <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-3">
            <File className="w-8 h-8 text-primary-500" />
            <div>
              <p className="font-medium text-gray-900 dark:text-white truncate max-w-xs">
                {selectedFile.name}
              </p>
              <p className="text-sm text-gray-500">
                {formatFileSize(selectedFile.size)} • {allowedTypes[selectedFile.type as keyof typeof allowedTypes]?.toUpperCase()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedFile(null);
              }}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X className="w-5 h-5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleUpload();
              }}
              className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-colors"
            >
              Process File
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
