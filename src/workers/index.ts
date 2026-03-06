import { contentQueue, JOB_TYPES } from '../lib/queue';
import { transcribeFromFile } from '../services/transcription';
import { generateOutputs } from '../services/ai';
import { getVideoInfo, extractVideoId } from '../services/youtube';
import { prisma } from '../lib/db';
import { getFile } from '../lib/storage';

// Transcribe job handler
contentQueue.process(JOB_TYPES.TRANSCRIBE, async (job) => {
  const { contentId, sourceFile, sourceUrl, sourceType } = job.data;

  console.log(`[Worker] Transcribing content: ${contentId}`);

  try {
    let transcript: string;
    let segments: any[] = [];

    if (sourceType === 'youtube') {
      // For YouTube, we'd download audio first (using yt-dlp or similar)
      // Then transcribe with Whisper
      throw new Error('YouTube transcription requires audio download step');
    } else if (sourceFile) {
      // Get file from S3
      const fileBuffer = await getFile(sourceFile);
      const result = await transcribeFromFile(fileBuffer, sourceFile);
      transcript = result.text;
      segments = result.segments || [];
    } else {
      throw new Error('No source file provided');
    }

    // Update content with transcript
    await prisma.content.update({
      where: { id: contentId },
      data: {
        transcript,
        status: 'transcribed',
      },
    });

    // Queue output generation
    await contentQueue.add(JOB_TYPES.GENERATE_OUTPUTS, {
      contentId,
      transcript,
    });

    console.log(`[Worker] Transcription complete: ${contentId}`);
    return { success: true, transcriptLength: transcript.length };
  } catch (error) {
    console.error(`[Worker] Transcription failed: ${contentId}`, error);
    
    await prisma.content.update({
      where: { id: contentId },
      data: { status: 'failed' },
    });

    throw error;
  }
});

// Generate outputs job handler
contentQueue.process(JOB_TYPES.GENERATE_OUTPUTS, async (job) => {
  const { contentId, transcript } = job.data;

  console.log(`[Worker] Generating outputs for: ${contentId}`);

  try {
    // Get content details
    const content = await prisma.content.findUnique({
      where: { id: contentId },
    });

    if (!content) {
      throw new Error('Content not found');
    }

    // Generate all outputs using AI
    const outputs = await generateOutputs(transcript, content.title || undefined);

    // Save outputs to database
    const outputPromises = [
      prisma.output.create({
        data: {
          contentId,
          format: 'twitter_thread',
          data: outputs.twitterThread,
        },
      }),
      prisma.output.create({
        data: {
          contentId,
          format: 'linkedin_post',
          data: { text: outputs.linkedinPost },
        },
      }),
      prisma.output.create({
        data: {
          contentId,
          format: 'newsletter',
          data: { text: outputs.newsletter },
        },
      }),
      prisma.output.create({
        data: {
          contentId,
          format: 'tiktok_clip',
          data: outputs.tiktokClips,
        },
      }),
      prisma.output.create({
        data: {
          contentId,
          format: 'quote_graphic',
          data: outputs.quoteGraphics,
        },
      }),
      prisma.output.create({
        data: {
          contentId,
          format: 'seo_summary',
          data: { text: outputs.seoSummary },
        },
      }),
      prisma.output.create({
        data: {
          contentId,
          format: 'instagram_caption',
          data: { 
            caption: outputs.instagramCaption,
            hashtags: outputs.hashtags,
          },
        },
      }),
    ];

    await Promise.all(outputPromises);

    // Update content status
    await prisma.content.update({
      where: { id: contentId },
      data: {
        status: 'completed',
        processedAt: new Date(),
      },
    });

    console.log(`[Worker] Outputs generated: ${contentId}`);
    return { success: true, outputsGenerated: 7 };
  } catch (error) {
    console.error(`[Worker] Output generation failed: ${contentId}`, error);
    
    await prisma.content.update({
      where: { id: contentId },
      data: { status: 'failed' },
    });

    throw error;
  }
});

console.log('[Worker] Content processing worker started');

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('[Worker] Shutting down...');
  await contentQueue.close();
  process.exit(0);
});
