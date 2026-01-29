import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';

/**
 * Parse PDF file and extract text content
 */
async function parsePDF(buffer) {
  try {
    const render_page = async (pageData) => {
      // Come back to this: improved text extraction
      const textContent = await pageData.getTextContent();
      let lastY, text = '';
      for (const item of textContent.items) {
        if (lastY == item.transform[5] || !lastY){
            // Same line: add space
            text += item.str + ' ';
        }  
        else{
            // New line
            text += '\n' + item.str + ' ';
        }
        lastY = item.transform[5];
      }
      return text;
    };

    const options = {
      pagerender: render_page
    };

    const data = await pdfParse(buffer, options);
    // basic cleanup of multiple spaces
    const text = data.text ? data.text.replace(/  +/g, ' ') : '';
    
    if (!text || text.trim().length === 0) {
      throw new Error('PDF appears to be empty or contains only images.');
    }
    
    return text;
  } catch (error) {
    if (error.message.includes('empty') || error.message.includes('images')) {
      throw error;
    }
    throw new Error('Failed to parse PDF: ' + error.message);
  }
}

/**
 * Parse DOCX file and extract text content
 */
async function parseDOCX(buffer) {
  try {
    const result = await mammoth.extractRawText({ buffer });
    const text = result.value || '';
    
    if (!text || text.trim().length === 0) {
      throw new Error('DOCX file appears to be empty or contains no extractable text.');
    }
    
    return text;
  } catch (error) {
    if (error.message.includes('empty')) {
      throw error;
    }
    throw new Error('Failed to parse DOCX: ' + error.message);
  }
}

/**
 * Parse text file
 */
function parseTXT(buffer) {
  try {
    return buffer.toString('utf-8');
  } catch (error) {
    throw new Error('Failed to parse text file: ' + error.message);
  }
}

/**
 * Parse file based on its type
 */
async function parseFile(buffer, fileType, fileName = '') {
  if (!buffer || buffer.length === 0) {
    throw new Error('File buffer is empty');
  }

  const mimeType = fileType.toLowerCase();
  const fileNameLower = fileName.toLowerCase();
  console.log('Parsing file:', fileName, 'MIME type:', mimeType, 'Size:', buffer.length, 'bytes');

  try {
    if (mimeType === 'application/pdf') {
      return await parsePDF(buffer);
    } else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      return await parseDOCX(buffer);
    } else if (mimeType === 'application/msword') {
      try {
        return await parseDOCX(buffer);
      } catch (error) {
        throw new Error('Old .doc format detected. Please convert to .docx format or use PDF. Mammoth library may not fully support .doc files.');
      }
    } else if (mimeType === 'text/plain' || mimeType === 'text/markdown') {
      const text = parseTXT(buffer);
      if (!text || text.trim().length === 0) {
        throw new Error('Text file appears to be empty.');
      }
      return text;
    } else if (fileNameLower.endsWith('.pdf')) {
      return await parsePDF(buffer);
    } else if (fileNameLower.endsWith('.docx')) {
      return await parseDOCX(buffer);
    } else if (fileNameLower.endsWith('.doc')) {
      try {
        return await parseDOCX(buffer);
      } catch (error) {
        throw new Error('Old .doc format detected. Please convert to .docx format or use PDF.');
      }
    } else if (fileNameLower.endsWith('.txt') || fileNameLower.endsWith('.md')) {
      const text = parseTXT(buffer);
      if (!text || text.trim().length === 0) {
        throw new Error('Text file appears to be empty.');
      }
      return text;
    } else {
      throw new Error(`Unsupported file type: ${fileType}. Supported types: PDF, DOCX, DOC, TXT, MD`);
    }
  } catch (error) {
    console.error('File parsing error:', error.message);
    throw error;
  }
}

export { parseFile, parsePDF, parseDOCX, parseTXT };
