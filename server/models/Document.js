import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  filename: {
    type: String,
    required: true,
  },
  originalName: {
    type: String,
    required: true,
  },
  fileType: {
    type: String,
    required: true,
  },
  fileSize: {
    type: Number,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  summary: {
    type: String,
    default: '',
  },
  analysis: {
    type: Object,
    default: {},
  },
  highlights: {
    type: [
      {
        title: { type: String, default: '' },
        severity: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
        snippet: { type: String, default: '' },
        note: { type: String, default: '' },
      },
    ],
    default: [],
  },
  keyPoints: {
    type: [String],
    default: [],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

documentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model('Document', documentSchema);
