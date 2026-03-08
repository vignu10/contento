import OpenAI from 'openai';
import { config } from '@/lib/config';

const openai = new OpenAI({
  apiKey: config.openaiApiKey,
});

export interface TikTokClip {
  hook: string;
  timestamp: { start: number; end: number };
  script: string;
}

export interface ContentOutputs {
  twitterThread: string[];
  linkedinPost: string;
  newsletter: string;
  tiktokClips: TikTokClip[];
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
- Preserve key insights and quotable moments`;

export async function generateOutputs(
  transcript: string,
  title?: string,
  styleExamples?: string[]
): Promise<ContentOutputs> {
  const styleContext = styleExamples?.length 
    ? `\n\nHere are examples of the creator's style:\n${styleExamples.join('\n\n')}`
    : '';

  const prompt = `Transform this content into multiple formats.

Title: ${title || 'Untitled'}

Transcript:
${transcript}
${styleContext}

Generate:
1. Twitter thread (8-12 tweets with a strong hook)
2. LinkedIn post (engagement-optimized, professional tone)
3. Newsletter draft (conversational, valuable insights)
4. 3 TikTok/Reels clip ideas with hooks and timestamps (find viral moments)
5. 5-8 quotable moments for graphics
6. SEO-optimized blog summary (300-400 words)
7. Instagram caption with 15-20 relevant hashtags

Return as JSON with keys: twitterThread (array), linkedinPost, newsletter, tiktokClips (array with hook/timestamp/script), quoteGraphics (array), seoSummary, instagramCaption, hashtags (array)`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini', // More cost-effective than gpt-4o, faster
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: prompt },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.7,
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
${transcript}

Return as JSON array with keys: timestamp, text, type`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: 'You are an expert at identifying viral moments in content.' },
      { role: 'user', content: prompt },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.5,
  });

  const result = JSON.parse(response.choices[0].message.content || '{}');
  return result.moments || [];
}
