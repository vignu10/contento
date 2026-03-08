/**
 * Content export utilities
 */

export type ExportFormat = 'txt' | 'md' | 'json';

/**
 * Download content as a file
 */
export function downloadFile(content: string, filename: string, format: ExportFormat) {
  const mimeTypes: Record<ExportFormat, string> = {
    txt: 'text/plain',
    md: 'text/markdown',
    json: 'application/json',
  };

  const blob = new Blob([content], { type: mimeTypes[format] });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.${format}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Format content for export based on format type
 */
export function formatContentForExport(data: unknown, format: ExportFormat, contentType: string): string {
  switch (format) {
    case 'json':
      return JSON.stringify(data, null, 2);

    case 'md':
      return formatAsMarkdown(data, contentType);

    case 'txt':
      return formatAsText(data, contentType);

    default:
      return String(data);
  }
}

/**
 * Format as Markdown
 */
function formatAsMarkdown(data: unknown, contentType: string): string {
  switch (contentType) {
    case 'twitter_thread':
      if (Array.isArray(data)) {
        return data.map((tweet) => `**Tweet**\n\n${tweet}\n\n---\n\n`).join('');
      }
      return String(data);

    case 'linkedin_post':
    case 'newsletter':
    case 'seo_summary':
    case 'instagram_caption':
      if (typeof data === 'object' && data !== null && 'text' in data) {
        return `# Content\n\n${(data as { text: string }).text}`;
      }
      if (typeof data === 'object' && data !== null && 'caption' in data) {
        const d = data as { caption: string; hashtags: string[] };
        return `# Caption\n\n${d.caption}\n\n## Hashtags\n\n${d.hashtags.map(h => `- #${h}`).join('\n')}`;
      }
      return String(data);

    case 'tiktok_clip':
      if (Array.isArray(data)) {
        return data.map((clip) => {
          const c = clip as { hook: string; timestamp?: { start: number; end: number }; script: string };
          return `## Clip\n\n**Hook:** ${c.hook}\n\n**Timestamp:** ${c.timestamp?.start}s - ${c.timestamp?.end}s\n\n**Script:**\n${c.script}\n\n---\n\n`;
        }).join('');
      }
      return String(data);

    case 'quote_graphic':
      if (Array.isArray(data)) {
        return data.map((quote) => `> ${quote}\n\n`).join('');
      }
      return String(data);

    default:
      return JSON.stringify(data, null, 2);
  }
}

/**
 * Format as plain text
 */
function formatAsText(data: unknown, contentType: string): string {
  switch (contentType) {
    case 'twitter_thread':
      if (Array.isArray(data)) {
        return data.map((tweet) => `--- Tweet ---\n\n${tweet}\n\n`).join('');
      }
      return String(data);

    case 'linkedin_post':
    case 'newsletter':
    case 'seo_summary':
    case 'instagram_caption':
      if (typeof data === 'object' && data !== null && 'text' in data) {
        return (data as { text: string }).text;
      }
      if (typeof data === 'object' && data !== null && 'caption' in data) {
        const d = data as { caption: string; hashtags: string[] };
        return `${d.caption}\n\nHashtags: ${d.hashtags.map(h => `#${h}`).join(' ')}`;
      }
      return String(data);

    case 'tiktok_clip':
      if (Array.isArray(data)) {
        return data.map((clip) => {
          const c = clip as { hook: string; timestamp?: { start: number; end: number }; script: string };
          return `--- Clip ---\nHook: ${c.hook}\nTimestamp: ${c.timestamp?.start}s - ${c.timestamp?.end}s\n\n${c.script}\n\n`;
        }).join('');
      }
      return String(data);

    case 'quote_graphic':
      if (Array.isArray(data)) {
        return data.map((quote) => `"${quote}"\n\n`).join('');
      }
      return String(data);

    default:
      return JSON.stringify(data, null, 2);
  }
}

/**
 * Generate a filename for export
 */
export function generateExportFilename(contentTitle: string, contentType: string): string {
  const sanitizedTitle = contentTitle
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50);
  const timestamp = new Date().toISOString().slice(0, 10);
  return `${sanitizedTitle}-${contentType}-${timestamp}`;
}
