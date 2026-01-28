import express from 'express';
import multer from 'multer';

import Document from '../models/Document.js';
import { parseFile } from '../utils/fileParser.js';
import { summarizeDocument, analyzeDocument, extractKeyPoints } from '../services/openaiService.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'text/plain',
      'text/markdown',
    ];

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

router.get('/', requireAuth, async (req, res) => {
  try {
    const documents = await Document.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(documents);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', requireAuth, async (req, res) => {
  try {
    const document = await Document.findOne({ _id: req.params.id, userId: req.user.id });
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }
    res.json(document);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/upload', requireAuth, (req, res) => {
  upload.single('document')(req, res, async (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ error: 'File too large. Maximum size is 10MB.' });
        }
        return res.status(400).json({ error: 'File upload error: ' + err.message });
      }
      if (err.message && err.message.includes('Invalid file type')) {
        return res.status(400).json({ error: err.message });
      }
      return res.status(400).json({ error: 'Upload error: ' + err.message });
    }

    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded. Please select a file.' });
      }

      console.log('File received:', {
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
      });

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

      const document = new Document({
        userId: req.user.id,
        filename: req.file.filename || `doc_${Date.now()}`,
        originalName: req.file.originalname,
        fileType: req.file.mimetype,
        fileSize: req.file.size,
        content: content,
      });

      await document.save();

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

async function processDocumentAsync(documentId, content) {
  try {
    const document = await Document.findById(documentId);
    if (!document) {
      throw new Error('Document not found');
    }

    const [summary, analysis, keyPoints] = await Promise.all([
      summarizeDocument(content),
      analyzeDocument(content),
      extractKeyPoints(content),
    ]);

    document.summary = summary;
    document.analysis = analysis;
    
    // Extract highlights from various possible field names
    let extractedHighlights = [];
    if (Array.isArray(analysis?.highlightedRiskClauses)) {
      extractedHighlights = analysis.highlightedRiskClauses;
    } else if (Array.isArray(analysis?.highlightedClauses)) {
      extractedHighlights = analysis.highlightedClauses;
    } else if (Array.isArray(analysis?.highlighted_risks)) {
      extractedHighlights = analysis.highlighted_risks;
    } else if (Array.isArray(analysis?.highlightedRisks)) {
      extractedHighlights = analysis.highlightedRisks;
    } else if (Array.isArray(analysis?.highlights)) {
      extractedHighlights = analysis.highlights;
    }
    
    // Ensure each highlight has required fields
    document.highlights = extractedHighlights.map((h, idx) => ({
      title: h.title || `Highlight ${idx + 1}`,
      severity: h.severity || 'medium',
      snippet: h.snippet || '',
      note: h.note || '',
    }));
    
    document.keyPoints = keyPoints;
    await document.save();

    console.log(`Document ${documentId} processed successfully`);
  } catch (error) {
    console.error(`Error processing document ${documentId}:`, error);
    const document = await Document.findById(documentId);
    if (document) {
      document.analysis = { error: error.message };
      await document.save();
    }
  }
}

router.post('/:id/analyze', requireAuth, async (req, res) => {
  try {
    const document = await Document.findOne({ _id: req.params.id, userId: req.user.id });
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const [summary, analysis, keyPoints] = await Promise.all([
      summarizeDocument(document.content),
      analyzeDocument(document.content),
      extractKeyPoints(document.content),
    ]);

    document.summary = summary;
    document.analysis = analysis;
    
    // Extract highlights from various possible field names
    let extractedHighlights = [];
    if (Array.isArray(analysis?.highlightedRiskClauses)) {
      extractedHighlights = analysis.highlightedRiskClauses;
    } else if (Array.isArray(analysis?.highlightedClauses)) {
      extractedHighlights = analysis.highlightedClauses;
    } else if (Array.isArray(analysis?.highlighted_risks)) {
      extractedHighlights = analysis.highlighted_risks;
    } else if (Array.isArray(analysis?.highlightedRisks)) {
      extractedHighlights = analysis.highlightedRisks;
    } else if (Array.isArray(analysis?.highlights)) {
      extractedHighlights = analysis.highlights;
    }
    
    // Ensure each highlight has required fields
    document.highlights = extractedHighlights.map((h, idx) => ({
      title: h.title || `Highlight ${idx + 1}`,
      severity: h.severity || 'medium',
      snippet: h.snippet || '',
      note: h.note || '',
    }));
    
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

router.patch('/:id/highlights/:highlightIndex', requireAuth, async (req, res) => {
  try {
    const document = await Document.findOne({ _id: req.params.id, userId: req.user.id });
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const highlightIndex = parseInt(req.params.highlightIndex);
    if (!Array.isArray(document.highlights) || highlightIndex < 0 || highlightIndex >= document.highlights.length) {
      return res.status(400).json({ error: 'Invalid highlight index' });
    }

    const { note } = req.body;
    if (note !== undefined) {
      document.highlights[highlightIndex].note = String(note || '').trim();
      await document.save();
    }

    res.json({
      message: 'Note updated successfully',
      document,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const document = await Document.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }
    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
