const express = require('express');
const multer = require('multer');
const Document = require('../models/Document');
const { parseFile } = require('../utils/fileParser');
const {
  summarizeDocument,
  analyzeDocument,
  extractKeyPoints,
} = require('../services/openaiService');

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'text/plain',
      'text/markdown',
    ];

    // Also check file extension as fallback
    const allowedExtensions = ['.pdf', '.docx', '.doc', '.txt', '.md'];
    const fileExtension = file.originalname.toLowerCase().substring(file.originalname.lastIndexOf('.'));

    if (allowedTypes.includes(file.mimetype) || allowedExtensions.includes(fileExtension)) {
      console.log('File accepted:', file.originalname, 'MIME type:', file.mimetype);
      cb(null, true);
    } else {
      console.log('File rejected:', file.originalname, 'MIME type:', file.mimetype, 'Extension:', fileExtension);
      cb(new Error(`Invalid file type: ${file.mimetype || 'unknown'}. Only PDF, DOCX, and TXT files are allowed.`));
    }
  },
});

// Get all documents
router.get('/', async (req, res) => {
  try {
    const documents = await Document.find().sort({ createdAt: -1 });
    res.json(documents);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get a single document by ID
router.get('/:id', async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }
    res.json(document);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Upload and process a document
router.post('/upload', (req, res) => {
  upload.single('document')(req, res, async (err) => {
    // Handle multer errors
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ error: 'File too large. Maximum size is 10MB.' });
        }
        return res.status(400).json({ error: 'File upload error: ' + err.message });
      }
      // Handle file filter errors
      if (err.message && err.message.includes('Invalid file type')) {
        return res.status(400).json({ error: err.message });
      }
      return res.status(400).json({ error: 'Upload error: ' + err.message });
    }

    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded. Please select a file.' });
      }

      // Log file info for debugging
      console.log('File received:', {
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
      });

      // Parse the file content
      let content;
      try {
        content = await parseFile(req.file.buffer, req.file.mimetype, req.file.originalname);
      } catch (parseError) {
        console.error('Parse error:', parseError);
        return res.status(400).json({ 
          error: parseError.message || 'Could not extract text from the document. Please ensure the file contains readable text.' 
        });
      }

      if (!content || content.trim().length === 0) {
        return res.status(400).json({ 
          error: 'Document appears to be empty or contains no extractable text. Please ensure the file contains readable text content.' 
        });
      }

      console.log('Successfully extracted', content.length, 'characters from document');

      // Create document record
      const document = new Document({
        filename: req.file.filename || `doc_${Date.now()}`,
        originalName: req.file.originalname,
        fileType: req.file.mimetype,
        fileSize: req.file.size,
        content: content,
      });

      await document.save();

      // Process document with OpenAI (async, don't wait)
      processDocumentAsync(document._id, content).catch((err) => {
        console.error('Error processing document:', err);
      });

      res.status(201).json({
        message: 'Document uploaded successfully',
        document: {
          id: document._id,
          filename: document.originalName,
          uploadedAt: document.createdAt,
          status: 'processing',
        },
      });
    } catch (error) {
      console.error('Upload processing error:', error);
      res.status(500).json({ error: error.message || 'Failed to process document' });
    }
  });
});

// Process document with OpenAI (async function)
async function processDocumentAsync(documentId, content) {
  try {
    const document = await Document.findById(documentId);
    if (!document) {
      throw new Error('Document not found');
    }

    // Run all analyses in parallel
    const [summary, analysis, keyPoints] = await Promise.all([
      summarizeDocument(content),
      analyzeDocument(content),
      extractKeyPoints(content),
    ]);

    // Update document with results
    document.summary = summary;
    document.analysis = analysis;
    document.keyPoints = keyPoints;
    await document.save();

    console.log(`Document ${documentId} processed successfully`);
  } catch (error) {
    console.error(`Error processing document ${documentId}:`, error);
    // Update document with error status
    const document = await Document.findById(documentId);
    if (document) {
      document.analysis = { error: error.message };
      await document.save();
    }
  }
}

// Re-analyze a document
router.post('/:id/analyze', async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Process document with OpenAI
    const [summary, analysis, keyPoints] = await Promise.all([
      summarizeDocument(document.content),
      analyzeDocument(document.content),
      extractKeyPoints(document.content),
    ]);

    document.summary = summary;
    document.analysis = analysis;
    document.keyPoints = keyPoints;
    await document.save();

    res.json({
      message: 'Document analyzed successfully',
      document,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a document
router.delete('/:id', async (req, res) => {
  try {
    const document = await Document.findByIdAndDelete(req.params.id);
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }
    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
