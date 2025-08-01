"use client";

import { useState, useCallback } from "react";
import { motion } from "motion/react";

interface FileUploadZoneProps {
  onFilesUploaded: (files: File[]) => void;
  isProcessing: boolean;
}

export function FileUploadZone({ onFilesUploaded, isProcessing }: FileUploadZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files).filter(file => 
      file.type === 'text/csv' || 
      file.type === 'application/json' || 
      file.name.endsWith('.csv') || 
      file.name.endsWith('.json')
    );
    
    if (files.length > 0) {
      setUploadedFiles(files);
      onFilesUploaded(files);
    }
  }, [onFilesUploaded]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).filter(file => 
      file.type === 'text/csv' || 
      file.type === 'application/json' || 
      file.name.endsWith('.csv') || 
      file.name.endsWith('.json')
    );
    
    if (files.length > 0) {
      setUploadedFiles(files);
      onFilesUploaded(files);
    }
  }, [onFilesUploaded]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (isProcessing) {
    return (
      <div className="flex flex-col items-center justify-center h-96 bg-gray-50 dark:bg-neutral-800 rounded-lg border-2 border-gray-200 dark:border-gray-700">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mb-4"
        />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Processing Your Files
        </h3>
        <p className="text-gray-600 dark:text-gray-400 text-center max-w-md">
          We're analyzing your product catalog files and setting up your inventory. This may take a few moments...
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {uploadedFiles.map((file, index) => (
            <div key={index} className="flex items-center gap-2 bg-blue-100 dark:bg-blue-900/20 px-3 py-1 rounded-full">
              <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 0a9 9 0 1 1 18 0 9 9 0 0 1-18 0z" />
              </svg>
              <span className="text-sm text-blue-800 dark:text-blue-300">{file.name}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={`
          relative w-full max-w-2xl h-96 border-2 border-dashed rounded-lg transition-all duration-300 cursor-pointer
          ${isDragOver 
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-400' 
            : 'border-gray-300 hover:border-gray-400 dark:border-gray-600 dark:hover:border-gray-500'
          }
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => document.getElementById('file-input')?.click()}
      >
        <input
          id="file-input"
          type="file"
          multiple
          accept=".csv,.json"
          onChange={handleFileSelect}
          className="hidden"
        />
        
        <div className="flex flex-col items-center justify-center h-full p-8 text-center">
          <motion.div
            animate={isDragOver ? { scale: 1.1 } : { scale: 1 }}
            transition={{ duration: 0.2 }}
            className={`
              w-16 h-16 rounded-full flex items-center justify-center mb-4
              ${isDragOver 
                ? 'bg-blue-100 dark:bg-blue-900/30' 
                : 'bg-gray-100 dark:bg-gray-800'
              }
            `}
          >
            <svg 
              className={`w-8 h-8 ${isDragOver ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" 
              />
            </svg>
          </motion.div>
          
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Upload Your Product Catalog
          </h3>
          
          <p className="text-gray-600 dark:text-gray-400 mb-4 max-w-md">
            Drag and drop your CSV or JSON files here, or click to browse. 
            We'll automatically process your product data and set up your catalog.
          </p>
          
          <div className="flex flex-wrap gap-2 justify-center mb-4">
            <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full text-sm">
              .csv
            </span>
            <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full text-sm">
              .json
            </span>
          </div>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Choose Files
          </motion.button>
        </div>
      </motion.div>
      
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Supported formats: CSV, JSON • Maximum file size: 10MB per file
        </p>
      </div>
    </div>
  );
}
