import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserId } from '@/lib/auth';
import { generateOutputs } from '@/services/ai';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const userId = getUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ✅ Enforce ownership
    const content = await prisma.content.findFirst({
      where: { id, userId },
    });

    if (!content) {
      return NextResponse.json({ error: 'Content not found' }, { status: 404 });
    }

    // Check if transcript exists (for YouTube and file uploads)
    // For YouTube, we need to download and transcribe first
    // For file uploads, transcription should have been done already
    // For now, use placeholder transcript if none exists
    const transcript = content.transcript || `Transcript for: ${content.title || 'Untitled Content'}`;

    // Generate outputs using real AI service
    const outputs = await generateOutputs(transcript, content.title || undefined);

    // Delete existing outputs
    await prisma.output.deleteMany({
      where: { contentId: id },
    });

    // Create new outputs
    const outputPromises = [
      prisma.output.create({
        data: {
          contentId: id,
          format: 'twitter_thread',
          data: JSON.stringify(outputs.twitterThread),
        },
      }),
      prisma.output.create({
        data: {
          contentId: id,
          format: 'linkedin_post',
          data: JSON.stringify({ text: outputs.linkedinPost }),
        },
      }),
      prisma.output.create({
        data: {
          contentId: id,
          format: 'newsletter',
          data: JSON.stringify({ text: outputs.newsletter }),
        },
      }),
      prisma.output.create({
        data: {
          contentId: id,
          format: 'tiktok_clip',
          data: JSON.stringify(outputs.tiktokClips),
        },
      }),
      prisma.output.create({
        data: {
          contentId: id,
          format: 'quote_graphic',
          data: JSON.stringify(outputs.quoteGraphics),
        },
      }),
      prisma.output.create({
        data: {
          contentId: id,
          format: 'seo_summary',
          data: JSON.stringify({ text: outputs.seoSummary }),
        },
      }),
      prisma.output.create({
        data: {
          contentId: id,
          format: 'instagram_caption',
          data: JSON.stringify({
            caption: outputs.instagramCaption,
            hashtags: outputs.hashtags,
          }),
        },
      }),
    ];

    await Promise.all(outputPromises);

    // Update content status
    await prisma.content.update({
      where: { id },
      data: {
        status: 'completed',
        processedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, outputsGenerated: 7 });
  } catch (error) {
    console.error('Error generating outputs:', error);
    return NextResponse.json(
      { error: 'Failed to generate outputs', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
