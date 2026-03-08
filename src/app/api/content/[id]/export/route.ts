import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserId } from '@/lib/auth';
import JSZip from 'jszip';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const searchParams = request.nextUrl.searchParams;
  const format = searchParams.get('format') || 'json';

  try {
    const userId = getUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify ownership
    const content = await prisma.content.findFirst({
      where: { id, userId },
      include: { outputs: true },
    });

    if (!content) {
      return NextResponse.json({ error: 'Content not found' }, { status: 404 });
    }

    // Handle different export formats
    if (format === 'zip') {
      return await exportAsZip(content);
    } else if (format === 'csv') {
      return await exportAsCsv(content);
    } else {
      return NextResponse.json({ error: 'Invalid format' }, { status: 400 });
    }
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { error: 'Failed to export content' },
      { status: 500 }
    );
  }
}

/**
 * Export all outputs as a ZIP file
 */
async function exportAsZip(content: { title: string | null; transcript: string | null; outputs: unknown[] }): Promise<NextResponse> {
  const zip = new JSZip();
  const title = content.title || 'untitled';

  // Add transcript if available
  if (content.transcript) {
    zip.file('transcript.txt', content.transcript);
  }

  // Add each output
  for (const output of content.outputs) {
    const data = JSON.parse((output as { editedData?: string; data: string }).editedData || (output as { data: string }).data);
    const parsedOutput = data as unknown;

    switch ((output as { format: string }).format) {
      case 'twitter_thread':
        if (Array.isArray(parsedOutput)) {
          (parsedOutput as unknown[]).forEach((tweet, i) => {
            zip.file(`twitter/tweet-${i + 1}.txt`, tweet);
          });
        }
        zip.file('twitter/thread.json', JSON.stringify(parsedOutput, null, 2));
        break;

      case 'linkedin_post':
        zip.file('linkedin/post.txt', (parsedOutput as { text?: string }).text || '');
        zip.file('linkedin/post.json', JSON.stringify(parsedOutput, null, 2));
        break;

      case 'newsletter':
        zip.file('newsletter/newsletter.md', (parsedOutput as { text?: string }).text || '');
        zip.file('newsletter/newsletter.json', JSON.stringify(parsedOutput, null, 2));
        break;

      case 'tiktok_clip':
        if (Array.isArray(parsedOutput)) {
          (parsedOutput as unknown[]).forEach((clip, i) => {
            const c = clip as { hook: string; timestamp?: { start: number; end: number }; script: string };
            zip.file(`tiktok/clip-${i + 1}.txt`, `Hook: ${c.hook}\nTimestamp: ${c.timestamp?.start}s - ${c.timestamp?.end}s\n\n${c.script}`);
          });
        }
        zip.file('tiktok/clips.json', JSON.stringify(parsedOutput, null, 2));
        break;

      case 'quote_graphic':
        if (Array.isArray(parsedOutput)) {
          (parsedOutput as unknown[]).forEach((quote, i) => {
            zip.file(`quotes/quote-${i + 1}.txt`, `"${quote}"`);
          });
        }
        zip.file('quotes/quotes.json', JSON.stringify(parsedOutput, null, 2));
        break;

      case 'seo_summary':
        zip.file('seo/summary.md', (parsedOutput as { text?: string }).text || '');
        zip.file('seo/summary.json', JSON.stringify(parsedOutput, null, 2));
        break;

      case 'instagram_caption':
        const d = parsedOutput as { caption?: string; hashtags?: string[] };
        const captionWithHashtags = `${d.caption || ''}\n\n${Array.isArray(d.hashtags) ? d.hashtags.map(h => `#${h}`).join(' ') : ''}`;
        zip.file('instagram/caption.txt', captionWithHashtags);
        zip.file('instagram/caption.json', JSON.stringify(parsedOutput, null, 2));
        break;
    }
  }

  // Generate ZIP buffer
  const buffer = await zip.generateAsync({ type: 'arraybuffer' });
  const uint8Array = new Uint8Array(buffer);

  return new NextResponse(uint8Array, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${title.replace(/[^a-z0-9]+/gi, '-')}-exports.zip"`,
    },
  });
}

/**
 * Export content metadata as CSV
 */
async function exportAsCsv(content: { title: string | null; outputs: unknown[] }): Promise<NextResponse> {
  const headers = ['ID', 'Title', 'Source Type', 'Status', 'Created At', 'Processed At', 'Output Formats'];
  const formats = content.outputs.map((o) => {
    const parsed = o as { format: string };
    return parsed.format;
  }).join(', ');

  const csv = [
    headers.join(','),
    [
      content.id,
      `"${(content.title || '').replace(/"/g, '""')}"`,
      content.sourceType,
      content.status,
      content.createdAt,
      content.processedAt || '',
      `"${formats.replace(/"/g, '""')}"`,
    ].join(','),
  ].join('\n');

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="content-export.csv"',
    },
  });
}
