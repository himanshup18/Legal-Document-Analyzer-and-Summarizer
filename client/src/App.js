import React, { useState, useEffect } from 'react';
import './App.css';
import DocumentUpload from './components/DocumentUpload';
import DocumentList from './components/DocumentList';
import DocumentViewer from './components/DocumentViewer';
import { getDocuments, uploadDocument, deleteDocument, reanalyzeDocument } from './services/api';

function App() {
  const [documents, setDocuments] = useState([]);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const data = await getDocuments();
      setDocuments(data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch documents: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (file) => {
    try {
      setLoading(true);
      setError(null);
      await uploadDocument(file);
      await fetchDocuments();
    } catch (err) {
      setError('Failed to upload document: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      setLoading(true);
      setError(null);
      await deleteDocument(id);
      if (selectedDocument && selectedDocument._id === id) {
        setSelectedDocument(null);
      }
      await fetchDocuments();
    } catch (err) {
      setError('Failed to delete document: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDocument = async (id) => {
    try {
      setLoading(true);
      setError(null);
      const doc = documents.find(d => d._id === id);
      if (doc) {
        // Check if document is still processing
        if (!doc.summary || doc.summary === '') {
          // Poll for updates
          const checkDocument = async () => {
            const updatedDoc = await getDocuments();
            const found = updatedDoc.find(d => d._id === id);
            if (found && found.summary) {
              setDocuments(updatedDoc);
              setSelectedDocument(found);
              setLoading(false);
            } else {
              setTimeout(checkDocument, 2000);
            }
          };
          checkDocument();
        } else {
          setSelectedDocument(doc);
          setLoading(false);
        }
      }
    } catch (err) {
      setError('Failed to load document: ' + err.message);
      setLoading(false);
    }
  };

  const handleReanalyze = async (id) => {
    try {
      setLoading(true);
      setError(null);
      await reanalyzeDocument(id);
      await fetchDocuments();
      const updatedDoc = documents.find(d => d._id === id);
      if (updatedDoc) {
        setSelectedDocument(updatedDoc);
      }
    } catch (err) {
      setError('Failed to reanalyze document: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Legal Document Analyzer & Summarizer</h1>
        <p>Upload legal documents to get AI-powered analysis and summaries</p>
      </header>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <main className="App-main">
        <div className="container">
          <DocumentUpload onUpload={handleUpload} loading={loading} />
          
          <div className="content-grid">
            <DocumentList
              documents={documents}
              selectedDocument={selectedDocument}
              onSelectDocument={handleSelectDocument}
              onDeleteDocument={handleDelete}
              loading={loading}
            />
            
            <DocumentViewer
              document={selectedDocument}
              onReanalyze={handleReanalyze}
              loading={loading}
            />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
