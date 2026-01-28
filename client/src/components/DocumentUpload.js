import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import './DocumentUpload.css';

const DocumentUpload = ({ onUpload, loading }) => {
  const onDrop = useCallback(
    (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        onUpload(acceptedFiles[0]);
      }
    },
    [onUpload]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/msword': ['.doc'],
      'text/plain': ['.txt'],
      'text/markdown': ['.md'],
    },
    maxFiles: 1,
    disabled: loading,
  });

  return (
    <div className="document-upload">
      <div
        {...getRootProps()}
        className={`upload-zone ${isDragActive ? 'active' : ''} ${loading ? 'disabled' : ''}`}
      >
        <input {...getInputProps()} />
        <div className="upload-content">
          {loading ? (
            <>
              <div className="spinner"></div>
              <p>Processing document...</p>
            </>
          ) : (
            <>
              <svg
                className="upload-icon"
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
              <h3>
                {isDragActive
                  ? 'Drop the document here'
                  : 'Drag & drop a document here, or click to select'}
              </h3>
              <p>Supports PDF, DOCX, and TXT files (max 10MB)</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentUpload;
