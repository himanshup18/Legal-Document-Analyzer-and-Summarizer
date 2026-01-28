import React, { useState, useEffect } from 'react';
import './App.css';
import { AuthProvider, useAuth } from './context/AuthContext';
import Header from './components/Header';
import AuthModal from './components/AuthModal';
import DocumentUpload from './components/DocumentUpload';
import DocumentList from './components/DocumentList';
import DocumentViewer from './components/DocumentViewer';
import { getDocuments, uploadDocument, deleteDocument, reanalyzeDocument } from './services/api';

function AppContent() {
  const { isAuthenticated, signup, signin, loading: authLoading } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      fetchDocuments();
    }
  }, [isAuthenticated]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const data = await getDocuments();
      setDocuments(data);
      setError(null);
    } catch (err) {
      if (err.response?.status === 401) {
        setError('Please sign in to view your documents');
      } else {
        setError('Failed to fetch documents: ' + err.message);
      }
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

  if (authLoading) {
    return (
      <div className="App">
        <div className="loading-screen">
          <div className="spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="App">
        <Header onAuthClick={() => setShowAuthModal(true)} />
        <div className="auth-required">
          <div className="auth-required-content">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M17 21v-8H7v8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M7 3v5h5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <h2>Sign In Required</h2>
            <p>Please sign in to access the Legal Document Analyzer</p>
            <button className="auth-required-button" onClick={() => setShowAuthModal(true)}>
              Sign In
            </button>
          </div>
        </div>
        {showAuthModal && (
          <AuthModal
            onClose={() => setShowAuthModal(false)}
            onSignup={signup}
            onSignin={signin}
          />
        )}
      </div>
    );
  }

  return (
    <div className="App">
      <Header onAuthClick={() => setShowAuthModal(true)} />

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

      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          onSignup={signup}
          onSignin={signin}
        />
      )}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
