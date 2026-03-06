import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ 
        error: 'OpenAI API key not configured',
        mode: 'mock',
        message: 'Add OPENAI_API_KEY to environment variables to use real AI'
      }, { status: 400 });
    }

    // Dynamically import to avoid build-time errors
    const { generateRealOutputs } = await import('@/services/real-ai');
    
    const body = await request.json();
    const { test } = body;

    const testTranscript = test || "This is a test transcript about AI and content creation.";
    
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
