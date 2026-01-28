import React from 'react';
import './DocumentViewer.css';

const DocumentViewer = ({ document, onReanalyze, loading }) => {
  if (!document) {
    return (
      <div className="document-viewer">
        <div className="empty-viewer">
          <svg
            className="empty-icon"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h3>Select a document to view details</h3>
          <p>Choose a document from the list to see its analysis and summary</p>
        </div>
      </div>
    );
  }

  const isProcessing = !document.summary || document.summary === '';

  return (
    <div className="document-viewer">
      <div className="viewer-header">
        <div>
          <h2>{document.originalName}</h2>
          <p className="viewer-meta">
            Uploaded on {new Date(document.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>
        {!isProcessing && (
          <button
            className="reanalyze-button"
            onClick={() => onReanalyze(document._id)}
            disabled={loading}
          >
            🔄 Re-analyze
          </button>
        )}
      </div>

      {isProcessing ? (
        <div className="processing-view">
          <div className="processing-spinner"></div>
          <h3>Processing Document...</h3>
          <p>AI is analyzing your document. This may take a few moments.</p>
        </div>
      ) : (
        <div className="viewer-content">
          <section className="summary-section">
            <h3>📋 Summary</h3>
            <div className="content-box">
              <p className="summary-text">{document.summary}</p>
            </div>
          </section>

          {document.keyPoints && document.keyPoints.length > 0 && (
            <section className="key-points-section">
              <h3>🔑 Key Points</h3>
              <div className="content-box">
                <ul className="key-points-list">
                  {document.keyPoints.map((point, index) => (
                    <li key={index}>{point}</li>
                  ))}
                </ul>
              </div>
            </section>
          )}

          {document.analysis && Object.keys(document.analysis).length > 0 && (
            <section className="analysis-section">
              <h3>📊 Detailed Analysis</h3>
              <div className="content-box">
                {document.analysis.error ? (
                  <p className="error-text">Error: {document.analysis.error}</p>
                ) : (
                  <div className="analysis-content">
                    {Object.entries(document.analysis).map(([key, value]) => {
                      if (key === 'error') return null;
                      
                      return (
                        <div key={key} className="analysis-item">
                          <h4 className="analysis-key">
                            {key
                              .replace(/([A-Z])/g, ' $1')
                              .replace(/^./, (str) => str.toUpperCase())
                              .trim()}
                          </h4>
                          <div className="analysis-value">
                            {Array.isArray(value) ? (
                              <ul>
                                {value.map((item, idx) => (
                                  <li key={idx}>{item}</li>
                                ))}
                              </ul>
                            ) : typeof value === 'object' ? (
                              <pre>{JSON.stringify(value, null, 2)}</pre>
                            ) : (
                              <p>{value}</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
};

export default DocumentViewer;
