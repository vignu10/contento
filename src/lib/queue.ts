import Queue from 'bull';
import { RedisOptions } from 'ioredis';
import { config } from './config';

/**
 * Parse Redis URL properly, handling passwords and TLS.
 */
function parseRedisUrl(url: string): RedisOptions {
  try {
    const parsed = new URL(url);
    
    return {
      host: parsed.hostname || 'localhost',
      port: parseInt(parsed.port) || 6379,
      password: parsed.password || undefined,
      username: parsed.username || undefined,
      maxRetriesPerRequest: null,
      // Enable TLS for rediss:// URLs
      tls: parsed.protocol === 'rediss:' ? { rejectUnauthorized: false } : undefined,
    };
  } catch (error) {
    console.warn('Failed to parse Redis URL, using defaults:', error);
    return {
      host: 'localhost',
      port: 6379,
      maxRetriesPerRequest: null,
    };
  }
}

const redisConfig = parseRedisUrl(config.redisUrl);

// Main processing queue
export const contentQueue = new Queue('content-processing', {
  redis: redisConfig,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: 100,
    removeOnFail: 50,
  },
});

export const JOB_TYPES = {
  TRANSCRIBE: 'transcribe',
  GENERATE_OUTPUTS: 'generate-outputs',
  PROCESS_VIDEO: 'process-video',
} as const;
