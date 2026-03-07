import OpenAI from 'openai';
import { config } from '@/lib/config';
import { readFile } from 'fs/promises';

const openai = new OpenAI({
  apiKey: config.openaiApiKey,
});

export interface TranscriptionResult {
  text: string;
  segments?: Array<{
    start: number;
    end: number;
    text: string;
  }>;
}

export async function transcribeAudio(audioPath: string): Promise<TranscriptionResult> {
  // Read file from local path
  const fileBuffer = await readFile(audioPath);
  const filename = audioPath.split('/').pop() || 'audio.mp3';
  
  return transcribeFromFile(fileBuffer, filename);
}

export async function transcribeFromFile(file: Buffer, filename: string): Promise<TranscriptionResult> {
  const fileObj = new File([new Uint8Array(file)], filename);
  
  const transcription = await openai.audio.transcriptions.create({
    file: fileObj,
    model: 'whisper-1',
    response_format: 'verbose_json',
    timestamp_granularities: ['segment'],
  });

  return {
    text: transcription.text,
    segments: transcription.segments?.map(s => ({
      start: s.start,
      end: s.end,
      text: s.text,
    })),
  };
}
