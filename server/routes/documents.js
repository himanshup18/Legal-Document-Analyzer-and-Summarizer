import express from 'express';
import multer from 'multer';
import { GridFsStorage } from 'multer-gridfs-storage';
import mongoose from 'mongoose';
import { Readable } from 'stream';

import Document from '../models/Document.js';
import { parseFile } from '../utils/fileParser.js';
import { summarizeDocument, analyzeDocument, extractKeyPoints } from '../services/openaiService.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/legal-documents';

// Use memory storage for reliable handling of small/medium files on Render
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Init gfs variables
let gfs;
let gridfsBucket;

// Helper to ensure GridFS is initialized
const ensureGridFSConnection = () => {
  if (gridfsBucket) return gridfsBucket;
  const conn = mongoose.connection;
  if (conn.readyState === 1 && conn.db) {
    gridfsBucket = new mongoose.mongo.GridFSBucket(conn.db, { bucketName: 'uploads' });
    gfs = gridfsBucket;
    return gridfsBucket;
  }
  throw new Error('Database connection not ready for GridFS');
};

const conn = mongoose.connection;
conn.once('open', () => {
    // Attempt init, but valid if skipped (handled by helper)
    if (!gridfsBucket && conn.db) {
        gridfsBucket = new mongoose.mongo.GridFSBucket(conn.db, { bucketName: 'uploads' });
        gfs = gridfsBucket;
    }
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

// Route to stream the file
router.get('/:id/file', requireAuth, async (req, res) => {
  try {
    const document = await Document.findOne({ _id: req.params.id, userId: req.user.id });
    if (!document || !document.fileId) {
      return res.status(404).json({ error: 'File not found' });
    }

    const _id = new mongoose.Types.ObjectId(document.fileId);
    const bucket = ensureGridFSConnection();
    const downloadStream = bucket.openDownloadStream(_id);

    downloadStream.on('error', (err) => {
      console.error('Stream error:', err);
      return res.status(404).json({ error: 'Error retrieving file' });
    });

    downloadStream.pipe(res);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/upload', requireAuth, upload.single('document'), async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    try {
      console.log('File received in memory:', req.file.originalname);
      const buffer = req.file.buffer;
      
      // 1. Analyze Content from Memory
      let content;
      try {
        content = await parseFile(buffer, req.file.mimetype, req.file.originalname);
      } catch (parseError) {
        console.error('Parse error:', parseError);
         return res.status(400).json({ 
          error: parseError.message || 'Could not extract text from the document.' 
        });
      }

      if (!content || content.trim().length === 0) {
         return res.status(400).json({ 
          error: 'Document appears to be empty or contains no extractable text.' 
        });
      }

      // 2. Save to GridFS (Manual)
      const bucket = ensureGridFSConnection();
      const uploadStream = bucket.openUploadStream(req.file.originalname, {
        contentType: req.file.mimetype,
        metadata: { userId: req.user.id }
      });
      
      const fileId = uploadStream.id;
      
      // Upload buffer to GridFS
      await new Promise((resolve, reject) => {
          uploadStream.end(buffer);
          uploadStream.on('finish', resolve);
          uploadStream.on('error', reject);
      });

      // 3. Create Document Record
      const document = new Document({
        userId: req.user.id,
        filename: req.file.originalname, // Using originalname as filename
        originalName: req.file.originalname,
        fileType: req.file.mimetype,
        fileSize: req.file.size,
        content: content,
        fileId: fileId
      });

      await document.save();

      // Process async (analysis)
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

    // Refresh content from file to ensure latest parsing logic (fixes spacing issues)
    if (document.fileId) {
      try {
        const bucket = ensureGridFSConnection();
        // Handle fileId being string or ObjectId
        const _id = new mongoose.Types.ObjectId(document.fileId);
        
        const downloadStream = bucket.openDownloadStream(_id);
        const chunks = [];
        
        // Promisify stream reading
        await new Promise((resolve, reject) => {
             downloadStream.on('data', (chunk) => chunks.push(chunk));
             downloadStream.on('error', reject);
             downloadStream.on('end', resolve);
        });
        
        const buffer = Buffer.concat(chunks);
        const freshContent = await parseFile(buffer, document.fileType || 'application/pdf', document.originalName);
        
        if (freshContent && freshContent.trim().length > 0) {
           console.log('Refreshed document content during re-analysis');
           document.content = freshContent;
           await document.save();
        }
      } catch (parseErr) {
        console.error('Error refreshing content during re-analysis:', parseErr);
        // Continue with existing content if re-parsing fails
      }
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
    const document = await Document.findOne({ _id: req.params.id, userId: req.user.id });
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Delete file from GridFS
    if (document.fileId) {
        try {
            const _id = new mongoose.Types.ObjectId(document.fileId);
            await gridfsBucket.delete(_id);
        } catch(err) {
            console.error('Error deleting file from GridFS:', err);
            // Continue to delete document even if file delete fails
        }
    }

    await Document.deleteOne({ _id: req.params.id }); 
    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
