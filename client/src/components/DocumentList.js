import React from 'react';
import './DocumentList.css';

const DocumentList = ({
  documents,
  selectedDocument,
  onSelectDocument,
  onDeleteDocument,
  loading,
}) => {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getFileTypeIcon = (fileType) => {
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('word') || fileType.includes('document')) return '📝';
    if (fileType.includes('text')) return '📃';
    return '📋';
  };

  return (
    <div className="document-list">
      <div className="document-list-header">
        <h2>Documents</h2>
        <span className="document-count">{documents.length}</span>
      </div>

      {documents.length === 0 ? (
        <div className="empty-state">
          <p>No documents uploaded yet</p>
          <p className="empty-state-subtitle">Upload a document to get started</p>
        </div>
      ) : (
        <div className="document-items">
          {documents.map((doc) => {
            const isSelected = selectedDocument && selectedDocument._id === doc._id;
            const isProcessing = !doc.summary || doc.summary === '';

            return (
              <div
                key={doc._id}
                className={`document-item ${isSelected ? 'selected' : ''} ${isProcessing ? 'processing' : ''}`}
                onClick={() => onSelectDocument(doc._id)}
              >
                <div className="document-item-header">
                  <span className="file-icon">{getFileTypeIcon(doc.fileType)}</span>
                  <div className="document-item-info">
                    <h3 className="document-name" title={doc.originalName}>
                      {doc.originalName}
                    </h3>
                    <p className="document-meta">
                      {formatFileSize(doc.fileSize)} • {formatDate(doc.createdAt)}
                    </p>
                  </div>
                </div>

                {isProcessing && (
                  <div className="processing-badge">
                    <span className="processing-dot"></span>
                    Processing...
                  </div>
                )}

                {!isProcessing && (
                  <div className="document-status">
                    <span className="status-badge ready">✓ Ready</span>
                  </div>
                )}

                <button
                  className="delete-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm('Are you sure you want to delete this document?')) {
                      onDeleteDocument(doc._id);
                    }
                  }}
                  disabled={loading}
                  title="Delete document"
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DocumentList;
