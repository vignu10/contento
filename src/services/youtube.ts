import axios from 'axios';

export interface YouTubeVideoInfo {
  id: string;
  title: string;
  description: string;
  duration: number;
  thumbnailUrl: string;
  channelName: string;
}

/**
 * Validate and extract YouTube video ID from URL.
 * Returns null if URL is invalid or potentially malicious.
 */
export function validateVideoId(url: string): string | null {
  // Extract potential video ID
  const videoId = extractVideoId(url);
  
  if (!videoId) {
    return null;
  }
  
  // ✅ Strict validation: YouTube video IDs are exactly 11 characters
  // and contain only alphanumeric, underscore, and hyphen
  if (!/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
    return null;
  }
  
  return videoId;
}

/**
 * Extract video ID from various YouTube URL formats.
 * Does NOT validate - use validateVideoId() for that.
 */
export function extractVideoId(url: string): string | null {
  try {
    // Parse URL to prevent injection
    const parsedUrl = new URL(url);
    
    // Only allow youtube.com and youtu.be domains
    const allowedHosts = ['www.youtube.com', 'youtube.com', 'youtu.be', 'm.youtube.com'];
    if (!allowedHosts.includes(parsedUrl.hostname)) {
      return null;
    }
    
    // Extract from various URL formats
    if (parsedUrl.hostname === 'youtu.be') {
      // youtu.be/VIDEO_ID
      return parsedUrl.pathname.slice(1).split(/[?/]/)[0] || null;
    }
    
    if (parsedUrl.pathname.startsWith('/shorts/')) {
      // youtube.com/shorts/VIDEO_ID
      return parsedUrl.pathname.split('/')[2]?.split(/[?/]/)[0] || null;
    }
    
    if (parsedUrl.pathname.startsWith('/embed/')) {
      // youtube.com/embed/VIDEO_ID
      return parsedUrl.pathname.split('/')[2]?.split(/[?/]/)[0] || null;
    }
    
    if (parsedUrl.pathname.startsWith('/watch')) {
      // youtube.com/watch?v=VIDEO_ID
      return parsedUrl.searchParams.get('v');
    }
    
    return null;
  } catch {
    // Invalid URL
    return null;
  }
}

export async function getVideoInfo(videoUrl: string): Promise<YouTubeVideoInfo> {
  const videoId = validateVideoId(videoUrl);
  
  if (!videoId) {
    throw new Error('Invalid YouTube URL');
  }

  // Using noembed for basic info (no API key needed)
  // The videoId is now validated to be safe
  const response = await axios.get(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`, {
    timeout: 5000, // Add timeout to prevent hanging
  });
  
  return {
    id: videoId,
    title: response.data.title || 'Untitled',
    description: '',
    duration: 0,
    thumbnailUrl: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
    channelName: response.data.author_name || 'Unknown',
  };
}

export async function getTranscriptFromYoutube(): Promise<string> {
  // This would typically use youtube-transcript or similar library
  // For now, we'll use Whisper on the audio
  // In production, you might use YouTube's caption API or a third-party service

  throw new Error('Direct YouTube transcript extraction not implemented. Use audio download + Whisper instead.');
}

export function getThumbnailUrls(videoId: string): {
  default: string;
  medium: string;
  high: string;
  maxres: string;
} {
  const base = `https://img.youtube.com/vi/${videoId}`;
  return {
    default: `${base}/default.jpg`,
    medium: `${base}/mqdefault.jpg`,
    high: `${base}/hqdefault.jpg`,
    maxres: `${base}/maxresdefault.jpg`,
  };
}
