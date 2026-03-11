'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, File, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const ALLOWED_TYPES = {
  'audio/mpeg': 'audio',
  'audio/mp3': 'audio',
  'audio/wav': 'audio',
  'audio/x-m4a': 'audio',
  'audio/m4a': 'audio',
  'video/mp4': 'video',
  'video/quicktime': 'video',
  'video/x-msvideo': 'video',
  'application/pdf': 'pdf',
} as const;

interface FileUploadProps {
  onUpload: (file: File, sourceType: string) => void;
  processing: boolean;
}

export default function FileUpload({ onUpload, processing }: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

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
    const fileType = ALLOWED_TYPES[file.type as keyof typeof ALLOWED_TYPES];

    if (!fileType) {
      toast.error('Invalid file type', {
        description: 'Please upload audio (MP3, WAV, M4A), video (MP4, MOV, AVI), or PDF files.',
      });
      return;
    }

    // Check file size (100MB limit)
    if (file.size > 100 * 1024 * 1024) {
      toast.error('File too large', {
        description: 'Maximum size is 100MB.',
      });
      return;
    }

    setSelectedFile(file);
    toast.success('File selected', {
      description: `${file.name} is ready to process.`,
    });
  }

  const handleUpload = useCallback(() => {
    if (!selectedFile) return;

    const fileType = ALLOWED_TYPES[selectedFile.type as keyof typeof ALLOWED_TYPES];
    onUpload(selectedFile, fileType);
    setSelectedFile(null);
    toast.promise(
      new Promise((resolve) => {
        // The actual upload happens in the parent component
        setTimeout(() => resolve('uploaded'), 100);
      }),
      {
        loading: 'Processing your file...',
        success: 'File uploaded successfully',
        error: 'Failed to process file',
      }
    );
  }, [selectedFile, onUpload]);

  function formatFileSize(bytes: number) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  // Handle keyboard activation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      inputRef.current?.click();
    }
  }, []);

  const handleFileRemoveKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setSelectedFile(null);
    }
  }, []);

  const handleUploadKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleUpload();
    }
  }, [handleUpload]);

  return (
    <div className="w-full">
      {/* Drop Zone */}
      <div
        ref={dropZoneRef}
        tabIndex={0}
        role="button"
        aria-label="Upload file"
        className={`
          relative border-2 border-dashed rounded-xl p-8 text-center transition-base outline-none
          ${dragActive ? 'border-accent bg-accent/10 ring-2 ring-accent/30' : 'border-border'}
          ${processing ? 'opacity-50 pointer-events-none' : 'cursor-pointer hover:border-accent/50 hover:bg-accent/5'}
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        onKeyDown={handleKeyDown}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept=".mp3,.wav,.m4a,.mp4,.mov,.avi,.pdf,audio/*,video/*,.pdf"
          onChange={handleChange}
          disabled={processing}
          aria-label="Select file to upload"
        />

        {processing ? (
          <div className="flex flex-col items-center">
            <Loader2 className="w-12 h-12 text-accent animate-spin mb-4" aria-hidden="true" />
            <p className="text-text-secondary">Processing your file...</p>
            <p className="text-sm text-text-tertiary mt-2">This may take a few minutes</p>
          </div>
        ) : (
          <>
            <Upload className="w-12 h-12 mx-auto text-text-tertiary mb-4" aria-hidden="true" />
            <p className="text-lg font-medium text-text-primary mb-2">
              Drop your file here or click to upload
            </p>
            <p className="text-sm text-text-secondary">
              Audio (MP3, WAV, M4A) • Video (MP4, MOV) • PDF • Max 100MB
            </p>
          </>
        )}
      </div>

      {/* Selected File Preview */}
      {selectedFile && !processing && (
        <div className="mt-4 p-4 bg-surface-elevated rounded-lg flex items-center justify-between border border-border">
          <div className="flex items-center gap-3">
            <File className="w-8 h-8 text-accent" aria-hidden="true" />
            <div>
              <p className="font-medium text-text-primary truncate max-w-xs">
                {selectedFile.name}
              </p>
              <p className="text-sm text-text-secondary">
                {formatFileSize(selectedFile.size)} • {ALLOWED_TYPES[selectedFile.type as keyof typeof ALLOWED_TYPES]?.toUpperCase()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedFile(null);
              }}
              onKeyDown={handleFileRemoveKeyDown}
              className="p-2 text-text-secondary hover:text-text-primary rounded focus-visible:outline-none"
              aria-label="Remove selected file"
            >
              <X className="w-5 h-5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleUpload();
              }}
              onKeyDown={handleUploadKeyDown}
              className="px-4 py-2 bg-accent hover:bg-accent-hover text-text-inverse rounded-lg font-medium transition-base focus-visible:outline-none"
              aria-label="Process selected file"
            >
              Process File
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
