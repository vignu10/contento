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
  data: any;
  editedData?: any;
  isExported: boolean;
  exportedAt?: Date;
}

export interface UserUsage {
  month: number;
  year: number;
  contentsProcessed: number;
  limit: number;
}
