# Legal Document Analyzer and Summarizer

A comprehensive web application for analyzing and summarizing legal documents using AI. Built with React.js, Node.js, Express.js, MongoDB, and OpenAI API.

## Features

- 📄 **Document Upload**: Support for PDF, DOCX, and TXT files
- 🤖 **AI-Powered Analysis**: Automatic document analysis using OpenAI GPT-4
- 📋 **Smart Summarization**: Generate comprehensive summaries of legal documents
- 🔑 **Key Points Extraction**: Automatically extract important points from documents
- 📊 **Detailed Analysis**: Get structured analysis including:
  - Document type identification
  - Key parties involved
  - Main obligations and rights
  - Important dates and deadlines
  - Financial terms
  - Termination clauses
  - Risk factors
  - Compliance requirements
- 💾 **Document Storage**: MongoDB database for storing documents and analyses
- 🎨 **Modern UI**: Beautiful, responsive user interface

## Tech Stack

- **Frontend**: React.js
- **Backend**: Node.js, Express.js
- **Database**: MongoDB
- **AI**: OpenAI API (GPT-4)
- **File Parsing**: pdf-parse, mammoth

## Prerequisites

Before you begin, ensure you have the following installed:

- Node.js (v14 or higher)
- npm or yarn
- MongoDB (local installation or MongoDB Atlas account)
- OpenAI API key

## Installation

### 1. Clone the repository

```bash
git clone <repository-url>
cd "Legal Document Analyzer and Summarizer"
```

### 2. Install dependencies

You can install all dependencies at once using:

```bash
npm run install-all
```

Or install them separately:

```bash
# Install root dependencies
npm install

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 3. Configure environment variables

Create a `.env` file in the `server` directory:

```bash
cd server
cp .env.example .env
```

Edit the `.env` file and add your configuration:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/legal-documents
OPENAI_API_KEY=your_openai_api_key_here
CLIENT_URL=http://localhost:3000
```

**Important**: 
- Replace `your_openai_api_key_here` with your actual OpenAI API key
- If using MongoDB Atlas, replace the `MONGODB_URI` with your Atlas connection string

### 4. Start MongoDB

Make sure MongoDB is running on your system:

```bash
# For local MongoDB
mongod

# Or if using MongoDB as a service
# MongoDB should start automatically
```

### 5. Run the application

#### Option 1: Run both server and client together (Recommended)

From the root directory:

```bash
npm run dev
```

This will start:
- Backend server on `http://localhost:5000`
- Frontend React app on `http://localhost:3000`

#### Option 2: Run separately

**Terminal 1 - Backend:**
```bash
cd server
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd client
npm start
```

## Usage

1. **Open the application**: Navigate to `http://localhost:3000` in your browser

2. **Upload a document**: 
   - Drag and drop a legal document (PDF, DOCX, or TXT) into the upload zone
   - Or click to browse and select a file

3. **Wait for processing**: The document will be processed automatically. You'll see a "Processing..." status

4. **View results**: Once processing is complete, click on the document to view:
   - Summary
   - Key Points
   - Detailed Analysis

5. **Re-analyze**: You can re-analyze any document by clicking the "Re-analyze" button

## Project Structure

```
Legal Document Analyzer and Summarizer/
├── client/                 # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/     # React components
│   │   │   ├── DocumentUpload.js
│   │   │   ├── DocumentList.js
│   │   │   └── DocumentViewer.js
│   │   ├── services/       # API services
│   │   │   └── api.js
│   │   ├── App.js
│   │   └── index.js
│   └── package.json
├── server/                 # Express backend
│   ├── models/            # MongoDB models
│   │   └── Document.js
│   ├── routes/            # API routes
│   │   └── documents.js
│   ├── services/          # Business logic
│   │   └── openaiService.js
│   ├── utils/             # Utility functions
│   │   └── fileParser.js
│   ├── index.js           # Server entry point
│   ├── package.json
│   └── .env.example
├── package.json           # Root package.json
└── README.md
```

## API Endpoints

### Documents

- `GET /api/documents` - Get all documents
- `GET /api/documents/:id` - Get a specific document
- `POST /api/documents/upload` - Upload a new document
- `POST /api/documents/:id/analyze` - Re-analyze a document
- `DELETE /api/documents/:id` - Delete a document

### Health Check

- `GET /api/health` - Check server status

## Configuration

### File Upload Limits

- Maximum file size: 10MB
- Supported formats: PDF, DOCX, DOC, TXT, MD

### OpenAI Configuration

The application uses GPT-4 Turbo for analysis. You can modify the model and parameters in `server/services/openaiService.js`:

- Model: `gpt-4-turbo-preview`
- Temperature: `0.3` (for consistent results)
- Max tokens: Varies by function (1500-2500)

## Troubleshooting

### MongoDB Connection Issues

- Ensure MongoDB is running: `mongod` or check MongoDB service status
- Verify connection string in `.env` file
- For MongoDB Atlas, check network access settings

### OpenAI API Errors

- Verify your API key is correct in `.env`
- Check your OpenAI account has sufficient credits
- Ensure API key has access to GPT-4 models

### File Upload Issues

- Check file size (max 10MB)
- Verify file format is supported
- Check server logs for parsing errors

### Port Already in Use

- Change `PORT` in `server/.env` if 5000 is in use
- Change React default port: `PORT=3001 npm start` in client directory

## Development

### Adding New Features

1. **Backend**: Add routes in `server/routes/`, services in `server/services/`
2. **Frontend**: Add components in `client/src/components/`
3. **API Integration**: Update `client/src/services/api.js`

### Code Style

- Use ES6+ JavaScript features
- Follow React best practices (functional components, hooks)
- Use async/await for asynchronous operations
- Maintain consistent code formatting

## Security Notes

- Never commit `.env` files to version control
- Keep your OpenAI API key secure
- Implement authentication for production use
- Add rate limiting for API endpoints
- Validate and sanitize file uploads

## Production Deployment

### Build for Production

```bash
# Build React app
cd client
npm run build

# The build folder will contain optimized production files
```

### Environment Variables

Set production environment variables:
- Use a production MongoDB instance (MongoDB Atlas recommended)
- Use secure API keys
- Configure CORS for your production domain
- Set appropriate file upload limits

## License

MIT License

## Support

For issues, questions, or contributions, please open an issue in the repository.

## Acknowledgments

- OpenAI for the GPT-4 API
- React team for the excellent framework
- MongoDB for the database solution
