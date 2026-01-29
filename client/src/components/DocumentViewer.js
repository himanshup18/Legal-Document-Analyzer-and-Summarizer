import React, { useState, useMemo } from 'react';
import jsPDF from 'jspdf';
import { updateHighlightNote } from '../services/api';
import RichTextEditor from './RichTextEditor';
import './DocumentViewer.css';

const DocumentViewer = ({ document, onReanalyze, loading, onDocumentUpdate }) => {
  const isEmpty = !document;
  const isProcessing = !document?.summary || document?.summary === '';
  const highlights = useMemo(
    () => (Array.isArray(document?.highlights) ? document.highlights : []),
    [document?.highlights]
  );
  const [editingNoteIndex, setEditingNoteIndex] = useState(null);
  const [noteText, setNoteText] = useState('');
  const [savingNote, setSavingNote] = useState(false);



  const exportPdf = () => {
    if (!document) return;
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const margin = 40;
    const pageWidth = doc.internal.pageSize.getWidth();
    const maxWidth = pageWidth - margin * 2;

    const addTitle = (t) => {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text(t, margin, doc.y || margin);
      doc.y = (doc.y || margin) + 18;
    };

    const addSection = (title, text) => {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text(title, margin, doc.y);
      doc.y += 14;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      const lines = doc.splitTextToSize(String(text || ''), maxWidth);
      doc.text(lines, margin, doc.y);
      doc.y += lines.length * 12 + 10;
      if (doc.y > doc.internal.pageSize.getHeight() - margin) {
        doc.addPage();
        doc.y = margin;
      }
    };

    doc.y = margin;
    addTitle('Legal Document Summary');
    addSection('File', document.originalName);
    addSection('Summary', document.summary);

    if (Array.isArray(document.keyPoints) && document.keyPoints.length) {
      addSection(
        'Key Points',
        document.keyPoints
          .map((p, i) => `${i + 1}. ${typeof p === 'object' ? JSON.stringify(p) : p}`)
          .join('\n')
      );
    }

    if (highlights.length) {
      addSection(
        'Highlighted Risks',
        highlights
          .slice(0, 20)
          .map((h, i) => {
            const title = h.title ? `${h.title}` : `Risk ${i + 1}`;
            const sev = h.severity ? ` (${h.severity})` : '';
            const note = h.note ? `\nNote: ${h.note}` : '';
            return `${i + 1}. ${title}${sev}\nSnippet: ${h.snippet}${note}`;
          })
          .join('\n\n')
      );
    }

    doc.save(`${(document.originalName || 'summary').replace(/[^\w.-]+/g, '_')}_summary.pdf`);
  };

  const handleEditNote = (index, currentNote) => {
    setEditingNoteIndex(index);
    setNoteText(currentNote || '');
  };

  const handleSaveNote = async (index) => {
    if (!document) return;
    setSavingNote(true);
    try {
      const result = await updateHighlightNote(document._id, index, noteText);
      if (onDocumentUpdate && result.document) {
        onDocumentUpdate(result.document);
      }
      setEditingNoteIndex(null);
      setNoteText('');
    } catch (error) {
      console.error('Failed to save note:', error);
      alert('Failed to save note: ' + (error.response?.data?.error || error.message));
    } finally {
      setSavingNote(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingNoteIndex(null);
    setNoteText('');
  };

  if (isEmpty) {
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
          <div className="viewer-actions">
            <button
              className="export-button"
              onClick={exportPdf}
              disabled={loading}
              title="Export summary as PDF"
            >
              ⬇ Export PDF
            </button>
            <button
              className="reanalyze-button"
              onClick={() => onReanalyze(document._id)}
              disabled={loading}
            >
              🔄 Re-analyze
            </button>
          </div>
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
                    <li key={index}>
                      {typeof point === 'object' ? JSON.stringify(point) : point}
                    </li>
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
                                  <li key={idx}>
                                    {typeof item === 'object' ? (
                                      <pre>{JSON.stringify(item, null, 2)}</pre>
                                    ) : (
                                      item
                                    )}
                                  </li>
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

          {highlights.length > 0 && (
            <section className="analysis-section">
              <h3>⚠️ Highlighted Risks & Notes</h3>
              <div className="content-box">
                <div className="risk-list">
                  {highlights.slice(0, 20).map((h, idx) => (
                    <div key={idx} className={`risk-item risk-${(h.severity || 'medium').toLowerCase()}`}>
                      <div className="risk-title">
                        <span className="risk-badge">{(h.severity || 'medium').toUpperCase()}</span>
                        <strong>{h.title || `Risk ${idx + 1}`}</strong>
                      </div>
                      {h.snippet && <div className="risk-snippet">"{h.snippet}"</div>}
                      
                      {editingNoteIndex === idx ? (
                        <div className="note-editor">
                          <textarea
                            className="note-textarea"
                            value={noteText}
                            onChange={(e) => setNoteText(e.target.value)}
                            placeholder="Add your note here..."
                            rows={3}
                            disabled={savingNote}
                          />
                          <div className="note-actions">
                            <button
                              className="note-save-btn"
                              onClick={() => handleSaveNote(idx)}
                              disabled={savingNote}
                            >
                              {savingNote ? 'Saving...' : 'Save'}
                            </button>
                            <button
                              className="note-cancel-btn"
                              onClick={handleCancelEdit}
                              disabled={savingNote}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="note-section">
                          {h.note ? (
                            <div className="risk-note">
                              <div className="note-content">{h.note}</div>
                              <button
                                className="note-edit-btn"
                                onClick={() => handleEditNote(idx, h.note)}
                                title="Edit note"
                              >
                                ✏️ Edit
                              </button>
                            </div>
                          ) : (
                            <button
                              className="note-add-btn"
                              onClick={() => handleEditNote(idx, '')}
                              title="Add note"
                            >
                              ➕ Add Note
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {document.content && (
            <section className="analysis-section">
              <h3>🖍 Highlighted Document Text</h3>
              <div className="content-box">
                <RichTextEditor 
                  content={document.content}
                  highlights={highlights}
                  onHighlightClick={(h) => {
                     // Find the index of this highlight to edit note
                     const idx = highlights.findIndex(item => item === h);
                     if (idx !== -1) {
                       handleEditNote(idx, h.note);
                     }
                  }}
                />
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
};

export default DocumentViewer;
