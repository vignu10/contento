import ytdl from 'youtube-dl-exec';
import { randomUUID } from 'crypto';
import { join } from 'path';
import { promises as fs } from 'fs';

export interface DownloadResult {
  audioPath: string;
  audioFile: string;
  duration: number;
  size: number;
}

/**
 * Download audio from YouTube URL and convert to MP3
 */
export async function downloadYouTubeAudio(
  url: string,
  userId: string
): Promise<DownloadResult> {
  const videoId = extractVideoId(url);

  if (!videoId) {
    throw new Error('Invalid YouTube URL');
  }

  // Create temp directory if it doesn't exist
  const tempDir = join(process.cwd(), 'tmp', 'youtube-audio');
  await fs.mkdir(tempDir, { recursive: true });

  // Generate unique filename
  const filename = `${userId}-${videoId}-${randomUUID()}.mp3`;
  const outputPath = join(tempDir, filename);

  try {
    // Download audio using yt-dlp
    // Options explained:
    // -f "bestaudio": Download best available audio quality
    // --extract-audio: Extract audio from video
    // --audio-format mp3: Convert to MP3 format
    // --audio-quality 128: Target 128kbps for good transcription quality
    // --no-playlist: Only download single video, not entire playlist
    // --max-filesize 100M: Reject files larger than 100MB
    // --no-warnings: Suppress warnings, only show errors
    await ytdl.exec(url, {
      format: 'bestaudio',
      extractAudio: true,
      audioFormat: 'mp3',
      audioQuality: 128,
      noPlaylist: true,
      maxFilesize: '100M',
      noWarnings: true,
      output: outputPath,
    });

    // Get file stats
    const stats = await fs.stat(outputPath);

    // Get duration using ffprobe (part of FFmpeg)
    const duration = await getAudioDuration();

    return {
      audioPath: outputPath,
      audioFile: filename,
      duration,
      size: stats.size,
    };
  } catch (error) {
    // Clean up partial download if it exists
    try {
      await fs.unlink(outputPath);
    } catch {
      // Ignore cleanup errors
    }

    if (error instanceof Error) {
      if (error.message.includes('HTTP Error 404')) {
        throw new Error('Video not found. It may be private or deleted.');
      }
      if (error.message.includes('HTTP Error 403')) {
        throw new Error('Access denied. The video may be age-restricted or region-locked.');
      }
      if (error.message.includes('Sign in to confirm you')) {
        throw new Error('Video requires sign-in and cannot be downloaded automatically.');
      }
      throw new Error(`Failed to download audio: ${error.message}`);
    }
    throw new Error('Failed to download audio from YouTube');
  }
}

/**
 * Get audio duration using ffprobe (part of FFmpeg)
 */
async function getAudioDuration(): Promise<number> {
  // For now, return 0 as a placeholder
  // In production, you'd use ffprobe to get exact duration
  // This requires proper FFmpeg installation
  return 0;
}

/**
 * Extract video ID from YouTube URL (copied from youtube.ts for convenience)
 */
function extractVideoId(url: string): string | null {
  try {
    const parsedUrl = new URL(url);

    const allowedHosts = ['www.youtube.com', 'youtube.com', 'youtu.be', 'm.youtube.com'];
    if (!allowedHosts.includes(parsedUrl.hostname)) {
      return null;
    }

    if (parsedUrl.hostname === 'youtu.be') {
      return parsedUrl.pathname.slice(1).split(/[?/]/)[0] || null;
    }

    if (parsedUrl.pathname.startsWith('/shorts/')) {
      return parsedUrl.pathname.split('/')[2]?.split(/[?/]/)[0] || null;
    }

    if (parsedUrl.pathname.startsWith('/embed/')) {
      return parsedUrl.pathname.split('/')[2]?.split(/[?/]/)[0] || null;
    }

    if (parsedUrl.pathname.startsWith('/watch')) {
      return parsedUrl.searchParams.get('v');
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Clean up temporary audio file
 */
export async function cleanupAudioFile(audioPath: string): Promise<void> {
  try {
    await fs.unlink(audioPath);
  } catch {
    // Ignore cleanup errors
  }
}
