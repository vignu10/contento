import Queue from 'bull';
import { RedisOptions } from 'ioredis';

const redisConfig: RedisOptions = {
  host: process.env.REDIS_URL?.split('://')[1]?.split(':')[0] || 'localhost',
  port: parseInt(process.env.REDIS_URL?.split(':')[2] || '6379'),
  maxRetriesPerRequest: null,
};

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
