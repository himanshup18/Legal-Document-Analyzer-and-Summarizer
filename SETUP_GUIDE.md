# Quick Setup Guide

## Step 1: Add Your OpenAI API Key

1. Open `server/.env` file
2. Replace `your_openai_api_key_here` with your actual OpenAI API key:
   ```
   OPENAI_API_KEY=sk-your-actual-api-key-here
   ```

## Step 2: Set Up MongoDB

### Option A: MongoDB Atlas (Recommended - Free & Easy)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)
2. Create a free account
3. Create a new cluster (free tier is fine)
4. Click "Connect" → "Connect your application"
5. Copy the connection string (looks like: `mongodb+srv://username:password@cluster.mongodb.net/`)
6. Update `server/.env`:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/legal-documents?retryWrites=true&w=majority
   ```
   Replace `username` and `password` with your Atlas credentials

### Option B: Local MongoDB

1. Download MongoDB from [mongodb.com/download](https://www.mongodb.com/try/download/community)
2. Install MongoDB Community Edition
3. Start MongoDB service (usually starts automatically on Windows)
4. The default connection string in `.env` should work:
   ```
   MONGODB_URI=mongodb://localhost:27017/legal-documents
   ```

## Step 3: Install Dependencies

Run from the project root:
```bash
npm run install-all
```

This will install:
- Root dependencies
- Server dependencies
- Client dependencies

## Step 4: Start the Application

Run from the project root:
```bash
npm run dev
```

This starts:
- Backend server on `http://localhost:5000`
- Frontend app on `http://localhost:3000`

## Step 5: Use the Application

1. Open your browser to `http://localhost:3000`
2. Drag and drop a legal document (PDF, DOCX, or TXT)
3. Wait for AI processing (usually 10-30 seconds)
4. Click on the document to view analysis and summary

## Troubleshooting

### MongoDB Connection Error
- **Atlas**: Check your IP is whitelisted (0.0.0.0/0 for development)
- **Local**: Ensure MongoDB service is running

### OpenAI API Error
- Verify your API key is correct
- Check you have credits/quota available
- Ensure API key has access to GPT-4 models

### Port Already in Use
- Change `PORT=5000` to another port in `server/.env`
- Or kill the process using the port

## Need Help?

Check the main `README.md` for more detailed information.
