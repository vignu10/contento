import axios from 'axios';

export interface YouTubeVideoInfo {
  id: string;
  title: string;
  description: string;
  duration: number;
  thumbnailUrl: string;
  channelName: string;
}

export async function getVideoInfo(videoUrl: string): Promise<YouTubeVideoInfo> {
  const videoId = extractVideoId(videoUrl);
  
  if (!videoId) {
    throw new Error('Invalid YouTube URL');
  }

  // Using noembed for basic info (no API key needed)
  const response = await axios.get(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`);
  
  return {
    id: videoId,
    title: response.data.title || 'Untitled',
    description: '',
    duration: 0,
    thumbnailUrl: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
    channelName: response.data.author_name || 'Unknown',
  };
}

export function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/shorts\/([^&\n?#]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }

  return null;
}

export async function getTranscriptFromYoutube(videoId: string): Promise<string> {
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
