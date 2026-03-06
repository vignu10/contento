import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface TranscriptionResult {
  text: string;
  segments?: Array<{
    start: number;
    end: number;
    text: string;
  }>;
}

export async function transcribeAudio(audioBuffer: Buffer, filename: string): Promise<TranscriptionResult> {
  try {
    const file = new File([new Uint8Array(audioBuffer)], filename);
    
    const transcription = await openai.audio.transcriptions.create({
      file,
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
  } catch (error) {
    console.error('Transcription error:', error);
    throw new Error('Failed to transcribe audio. Please check your OpenAI API key.');
  }
}

export async function transcribeFromUrl(url: string): Promise<TranscriptionResult> {
  // For YouTube, we'd need to download audio first
  // This is a placeholder - in production, use yt-dlp or similar
  throw new Error('Direct URL transcription requires audio download. Please upload the file instead.');
}
