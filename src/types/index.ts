// Type definitions for the content repurposing pipeline

export type SourceType = 'youtube' | 'audio' | 'video' | 'blog' | 'pdf';

export type OutputFormat = 
  | 'twitter_thread'
  | 'linkedin_post'
  | 'newsletter'
  | 'tiktok_clip'
  | 'quote_graphic'
  | 'seo_summary'
  | 'instagram_caption';

export type ProcessingStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface ContentInput {
  sourceType: SourceType;
  sourceUrl?: string;
  file?: File;
}

export interface ProcessingJob {
  contentId: string;
  userId: string;
  sourceType: SourceType;
  sourceUrl?: string;
  sourceFile?: string;
}

export interface TikTokClip {
  id: string;
  hook: string;
  startTime: number;
  endTime: number;
  script: string;
  captions?: string;
}

export interface QuoteGraphic {
  id: string;
  text: string;
  attribution?: string;
  style?: 'minimal' | 'bold' | 'elegant';
}

export interface ContentOutput {
  format: OutputFormat;
  data: OutputData;
  editedData?: OutputData;
  isExported: boolean;
  exportedAt?: Date;
}

// Output data types for each format
export interface TwitterThreadData {
  tweets: string[];
}

export interface TextData {
  text: string;
}

export interface TikTokClipData {
  hook: string;
  timestamp: { start: number; end: number };
  script: string;
}

export interface InstagramCaptionData {
  caption: string;
  hashtags: string[];
}

export type OutputData =
  | TwitterThreadData
  | TextData
  | TikTokClipData[]
  | string[]
  | InstagramCaptionData;

export interface UserUsage {
  month: number;
  year: number;
  contentsProcessed: number;
  limit: number;
}
