/**
 * Application configuration with required environment variable validation.
 * Fails fast at startup if any required variable is missing.
 */

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function getOptionalEnv(name: string, defaultValue: string): string {
  return process.env[name] || defaultValue;
}

// Build-time config (throws if missing)
export const config = {
  // Authentication
  jwtSecret: getRequiredEnv('JWT_SECRET'),
  
  // OpenAI
  openaiApiKey: getRequiredEnv('OPENAI_API_KEY'),
  
  // Database
  databaseUrl: getRequiredEnv('DATABASE_URL'),
  
  // Redis
  redisUrl: getOptionalEnv('REDIS_URL', 'redis://localhost:6379'),
  
  // AWS S3
  awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
  awsSecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  awsRegion: getOptionalEnv('AWS_REGION', 'us-east-1'),
  s3Bucket: getOptionalEnv('S3_BUCKET', 'content-repurposing'),
  
  // App
  appUrl: getOptionalEnv('NEXT_PUBLIC_APP_URL', 'http://localhost:3000'),
  nodeEnv: getOptionalEnv('NODE_ENV', 'development'),
  
  // Computed
  isProduction: process.env.NODE_ENV === 'production',
};

export type Config = typeof config;
