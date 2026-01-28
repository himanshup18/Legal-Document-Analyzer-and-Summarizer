import OpenAI from 'openai';

function getOpenAIClient() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not set in environment variables');
  }
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

/**
 * Summarize a legal document
 */
async function summarizeDocument(content) {
  try {
    const openai = getOpenAIClient();
    const prompt = `Please provide a comprehensive summary of the following legal document. 
    Focus on key legal points, important clauses, obligations, rights, and any critical information.
    Make it clear and concise but thorough enough for legal professionals.
    
    Document content:
    ${content.substring(0, 12000)}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are a legal document analysis expert. Provide clear, accurate summaries of legal documents.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 2000,
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error('OpenAI summarization error:', error);
    throw new Error('Failed to generate summary: ' + error.message);
  }
}

/**
 * Analyze a legal document for key points and structure
 */
async function analyzeDocument(content) {
  try {
    const openai = getOpenAIClient();
    const prompt = `Analyze the following document and provide:
    1. Document type (contract, agreement, policy, certificate, grade sheet, etc.)
    2. Key parties involved (if applicable)
    3. Main obligations and rights (if applicable)
    4. Important dates and deadlines (if applicable)
    5. Financial terms (if any)
    6. Termination clauses (if applicable)
    7. Risk factors or important warnings (if any)
    8. Compliance requirements (if applicable)
    9. Highlighted clauses/points: an array of objects with { title, severity(low|medium|high), snippet, note }.
       - ALWAYS provide at least 3-5 highlighted items, even if they are just key points or important information.
       - For non-legal documents (like certificates, grade sheets), highlight important information, key details, or notable sections.
       - snippet must be an exact quote from the document (short, 1-3 sentences) so we can highlight it in the UI.
       - title should be descriptive (e.g., "Important Date", "Key Requirement", "Critical Information").
       - severity can be "low", "medium", or "high" based on importance.
    
    Format your response as a structured JSON object with a field called "highlightedRiskClauses" (or "highlightedClauses") containing the array.
    
    Document content:
    ${content.substring(0, 12000)}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are a legal document analysis expert. Provide structured analysis in JSON format.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 2500,
      response_format: { type: 'json_object' },
    });

    const analysisText = response.choices[0].message.content;
    return JSON.parse(analysisText);
  } catch (error) {
    console.error('OpenAI analysis error:', error);
    throw new Error('Failed to analyze document: ' + error.message);
  }
}

/**
 * Extract key points from a legal document
 */
async function extractKeyPoints(content) {
  try {
    const openai = getOpenAIClient();
    const prompt = `Extract the 10 most important key points from the following legal document.
    Present them as a numbered list, each point being concise but informative.
    
    Document content:
    ${content.substring(0, 12000)}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are a legal document analysis expert. Extract key points clearly and concisely.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 1500,
    });

    const keyPointsText = response.choices[0].message.content;
    const points = keyPointsText
      .split(/\d+[\.\)]/)
      .filter(point => point.trim().length > 0)
      .map(point => point.trim())
      .slice(0, 10);

    return points;
  } catch (error) {
    console.error('OpenAI key points extraction error:', error);
    throw new Error('Failed to extract key points: ' + error.message);
  }
}

export { summarizeDocument, analyzeDocument, extractKeyPoints };
