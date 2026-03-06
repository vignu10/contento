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

export async function transcribeAudio(audioPath: string): Promise<TranscriptionResult> {
  const transcription = await openai.audio.transcriptions.create({
    file: await fetch(audioPath).then(r => r.blob()) as any,
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
