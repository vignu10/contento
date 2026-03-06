import { NextRequest, NextResponse } from 'next/server';
import { generateRealOutputs } from '@/services/real-ai';

export async function POST(request: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ 
        error: 'OpenAI API key not configured',
        mode: 'mock'
      }, { status: 400 });
    }

    const body = await request.json();
    const { test } = body;

    // Test with a simple transcript
    const testTranscript = test || "This is a test transcript about AI and content creation. AI is transforming how we create and consume content.";
    
    console.log('[TEST] Testing AI generation...');
    const outputs = await generateRealOutputs(testTranscript, 'Test Content');
    
    return NextResponse.json({
      success: true,
      mode: 'real',
      outputs: {
        twitterThread: outputs.twitterThread.length,
        linkedinPost: outputs.linkedinPost.length,
        newsletter: outputs.newsletter.length,
        tiktokClips: outputs.tiktokClips.length,
        quoteGraphics: outputs.quoteGraphics.length,
        seoSummary: outputs.seoSummary.length,
        instagramCaption: outputs.instagramCaption.length,
        hashtags: outputs.hashtags.length,
      },
      sample: {
        firstTweet: outputs.twitterThread[0],
        linkedinPreview: outputs.linkedinPost.substring(0, 100) + '...',
      }
    });
  } catch (error) {
    console.error('[TEST] AI test failed:', error);
    return NextResponse.json({
      error: 'AI test failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
