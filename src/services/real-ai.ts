import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface ContentOutputs {
  twitterThread: string[];
  linkedinPost: string;
  newsletter: string;
  tiktokClips: Array<{
    hook: string;
    timestamp: { start: number; end: number };
    script: string;
  }>;
  quoteGraphics: string[];
  seoSummary: string;
  instagramCaption: string;
  hashtags: string[];
}

const SYSTEM_PROMPT = `You are an expert content repurposing assistant. Your job is to transform long-form content into multiple formats optimized for different platforms.

Rules:
- Maintain the original voice and tone
- Create platform-optimized content (not generic)
- Include hooks that grab attention
- Be concise but impactful
- Preserve key insights and quotable moments
- Use proper formatting for each platform`;

export async function generateRealOutputs(
  transcript: string,
  title?: string,
  styleExamples?: string[]
): Promise<ContentOutputs> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured. Please set OPENAI_API_KEY in environment.');
  }

  const styleContext = styleExamples?.length 
    ? `\n\nHere are examples of the creator's style:\n${styleExamples.join('\n\n')}`
    : '';

  const prompt = `Transform this content into multiple formats.

Title: ${title || 'Untitled'}

Transcript:
${transcript.substring(0, 12000)}${transcript.length > 12000 ? '...' : ''}
${styleContext}

Generate:
1. Twitter thread (8-12 tweets with a strong hook, engaging content, and clear thread structure)
2. LinkedIn post (engagement-optimized, professional tone, with line breaks for readability)
3. Newsletter draft (conversational, valuable insights, with a clear structure)
4. 3 TikTok/Reels clip ideas with hooks and timestamps (find viral moments, specify exact start/end times)
5. 5-8 quotable moments for graphics (short, punchy, shareable quotes)
6. SEO-optimized blog summary (300-400 words, keyword-rich, structured)
7. Instagram caption with 15-20 relevant hashtags (engaging, emoji-friendly)

Return as JSON with keys: twitterThread (array), linkedinPost, newsletter, tiktokClips (array with hook/timestamp/script), quoteGraphics (array), seoSummary, instagramCaption, hashtags (array)`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 4000,
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    
    return {
      twitterThread: result.twitterThread || [],
      linkedinPost: result.linkedinPost || '',
      newsletter: result.newsletter || '',
      tiktokClips: result.tiktokClips || [],
      quoteGraphics: result.quoteGraphics || [],
      seoSummary: result.seoSummary || '',
      instagramCaption: result.instagramCaption || '',
      hashtags: result.hashtags || [],
    };
  } catch (error) {
    console.error('AI generation error:', error);
    throw new Error('Failed to generate content. Please check your OpenAI API key and try again.');
  }
}

export async function extractKeyMoments(transcript: string): Promise<Array<{
  timestamp: number;
  text: string;
  type: 'hook' | 'insight' | 'quote' | 'story';
}>> {
  const prompt = `Analyze this transcript and identify 10-15 key moments that would make great standalone content.

For each moment, provide:
- Timestamp (in seconds, estimate based on context)
- The exact text
- Type: hook (attention-grabbing), insight (valuable lesson), quote (memorable statement), or story (engaging narrative)

Transcript:
${transcript.substring(0, 10000)}

Return as JSON array with keys: timestamp, text, type`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: 'You are an expert at identifying viral moments in content.' },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.5,
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return result.moments || [];
  } catch (error) {
    console.error('Key moments extraction error:', error);
    return [];
  }
}
