import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserId } from '@/lib/auth';
import JSZip from 'jszip';

interface Output {
  id: string;
  format: string;
  data: string;
  editedData: string | null;
  isExported: boolean;
}

interface Content {
  id: string;
  title: string | null;
  sourceType: string;
  sourceUrl: string | null;
  status: string;
  transcript: string | null;
  outputs: Output[];
  createdAt: string;
  processedAt: string | null;
}

interface TikTokClip {
  hook: string;
  timestamp?: { start: number; end: number };
  script: string;
}

interface InstagramData {
  caption: string;
  hashtags: string[];
}

interface NewsletterData {
  text: string;
}

interface LinkedInData {
  text: string;
}

interface SEOData {
  text: string;
}

/**
 * Export content in various formats
 *
 * Query params:
 * - format: 'zip' | 'json' | 'csv'
 * - output: optional specific output format (twitter_thread, linkedin_post, etc.)
 */

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const userId = getUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'zip';
    const output = searchParams.get('output');

    // Enforce ownership
    const content = await prisma.content.findFirst({
      where: { id, userId },
      include: { outputs: true },
    }) as Content | null;

    if (!content) {
      return NextResponse.json({ error: 'Content not found' }, { status: 404 });
    }

    // Handle different export formats
    switch (format) {
      case 'zip':
        return await exportAsZip(content);
      case 'json':
        return exportAsJson(content, output);
      case 'csv':
        return exportAsCsv(content);
      default:
        return NextResponse.json({ error: 'Invalid format' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error exporting content:', error);
    return NextResponse.json(
      { error: 'Failed to export content' },
      { status: 500 }
    );
  }
}

/**
 * Export all outputs as a ZIP file
 */
async function exportAsZip(content: Content): Promise<NextResponse> {
  const zip = new JSZip();

  // Add transcript if available
  if (content.transcript) {
    zip.file(`transcript.txt`, content.transcript);
  }

  // Add metadata
  const metadata = {
    id: content.id,
    title: content.title,
    sourceType: content.sourceType,
    sourceUrl: content.sourceUrl,
    createdAt: content.createdAt,
    exportedAt: new Date().toISOString(),
  };
  zip.file('metadata.json', JSON.stringify(metadata, null, 2));

  // Add outputs by format
  for (const output of content.outputs) {
    const data = JSON.parse(output.editedData || output.data);

    switch (output.format) {
      case 'twitter_thread':
        const twitterFolder = zip.folder('twitter');
        if (Array.isArray(data)) {
          data.forEach((tweet: string, i: number) => {
            twitterFolder?.file(`tweet-${i + 1}.txt`, tweet);
          });
        }
        twitterFolder?.file('full-thread.txt', (data as string[]).join('\n\n'));
        twitterFolder?.file('full-thread.json', JSON.stringify(data, null, 2));
        break;

      case 'linkedin_post':
        const linkedinFolder = zip.folder('linkedin');
        const linkedinText = (data as LinkedInData).text || data;
        linkedinFolder?.file('post.txt', linkedinText);
        linkedinFolder?.file('post.json', JSON.stringify(data, null, 2));
        break;

      case 'newsletter':
        const newsletterFolder = zip.folder('newsletter');
        const newsletterText = (data as NewsletterData).text || data;
        newsletterFolder?.file('newsletter.md', newsletterText);
        newsletterFolder?.file('newsletter.html', markdownToHtml(newsletterText));
        break;

      case 'tiktok_clip':
        const tiktokFolder = zip.folder('tiktok');
        if (Array.isArray(data)) {
          data.forEach((clip: TikTokClip, i: number) => {
            const clipText = `${clip.hook}\n\n${clip.script}\n\nTimestamp: ${clip.timestamp?.start}s - ${clip.timestamp?.end}s`;
            tiktokFolder?.file(`clip-${i + 1}.txt`, clipText);
          });
        }
        tiktokFolder?.file('all-clips.json', JSON.stringify(data, null, 2));
        break;

      case 'quote_graphic':
        const quotesFolder = zip.folder('quotes');
        if (Array.isArray(data)) {
          data.forEach((quote: string, i: number) => {
            quotesFolder?.file(`quote-${i + 1}.txt`, quote);
          });
        }
        quotesFolder?.file('all-quotes.json', JSON.stringify(data, null, 2));
        break;

      case 'seo_summary':
        const seoFolder = zip.folder('seo');
        const seoText = (data as SEOData).text || data;
        seoFolder?.file('summary.md', seoText);
        seoFolder?.file('summary.json', JSON.stringify(data, null, 2));
        break;

      case 'instagram_caption':
        const instagramFolder = zip.folder('instagram');
        instagramFolder?.file('caption.txt', (data as InstagramData).caption);
        const hashtags = Array.isArray((data as InstagramData).hashtags) 
          ? (data as InstagramData).hashtags.map((t: string) => `#${t}`).join(' ') 
          : '';
        instagramFolder?.file('hashtags.txt', hashtags);
        instagramFolder?.file('full.json', JSON.stringify(data, null, 2));
        break;
    }
  }

  // Generate ZIP buffer
  const zipBuffer = await zip.generateAsync({ type: 'uint8array' });

  // Return ZIP file
  const filename = `contento-export-${content.id}-${Date.now()}.zip`;

  return new NextResponse(Buffer.from(zipBuffer), {
    status: 200,
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-cache',
    },
  });
}

/**
 * Export as JSON
 */
function exportAsJson(content: Content, output: string | null): NextResponse {
  let data: unknown;

  if (output) {
    // Export specific output
    const outputData = content.outputs.find((o) => o.format === output);
    if (!outputData) {
      return NextResponse.json({ error: 'Output not found' }, { status: 404 });
    }
    data = JSON.parse(outputData.editedData || outputData.data);
  } else {
    // Export all content
    data = {
      metadata: {
        id: content.id,
        title: content.title,
        sourceType: content.sourceType,
        sourceUrl: content.sourceUrl,
        createdAt: content.createdAt,
        exportedAt: new Date().toISOString(),
      },
      transcript: content.transcript,
      outputs: content.outputs.map((o) => ({
        format: o.format,
        data: JSON.parse(o.editedData || o.data),
        edited: !!o.editedData,
      })),
    };
  }

  const filename = output
    ? `contento-${output}-${content.id}.json`
    : `contento-export-${content.id}.json`;

  return new NextResponse(JSON.stringify(data, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-cache',
    },
  });
}

/**
 * Export single content as CSV
 */
function exportAsCsv(content: Content): NextResponse {
  // For single content CSV, include metadata and outputs count
  const csvContent = `ID,Title,Source Type,Status,Created At,Outputs Count,Transcript Length\n${content.id},"${content.title || ''}",${content.sourceType},${content.status},${content.createdAt},${content.outputs.length},${content.transcript?.length || 0}\n`;

  const filename = `contento-${content.id}.csv`;

  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-cache',
    },
  });
}

/**
 * Simple markdown to HTML converter for newsletter export
 */
function markdownToHtml(markdown: string): string {
  return markdown
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
    .replace(/\*(.*)\*/gim, '<em>$1</em>')
    .replace(/\n\n/gim, '</p><p>')
    .replace(/- (.*)/gim, '<li>$1</li>')
    .replace(/<li>/gim, '<ul><li>')
    .replace(/<\/li>/gim, '</li></ul>')
    .replace(/<\/ul><ul>/gim, '')
    .replace(/^/, '<p>')
    .replace(/$/, '</p>');
}
