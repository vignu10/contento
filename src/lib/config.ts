/**
 * Application configuration with required environment variable validation.
 * Uses lazy evaluation to avoid accessing env vars during build time.
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

// Runtime-only config with lazy getters
// Accessors only run when values are used, not at module load time
export const config = {
  // Authentication
  get jwtSecret(): string {
    return getRequiredEnv('JWT_SECRET');
  },

  // OpenAI
  get openaiApiKey(): string {
    return getRequiredEnv('OPENAI_API_KEY');
  },

  // Database
  get databaseUrl(): string {
    return getRequiredEnv('DATABASE_URL');
  },

  // Redis
  get redisUrl(): string {
    return getOptionalEnv('REDIS_URL', 'redis://localhost:6379');
  },

  // AWS S3
  get awsAccessKeyId(): string {
    return getOptionalEnv('AWS_ACCESS_KEY_ID', '');
  },
  get awsSecretAccessKey(): string {
    return getOptionalEnv('AWS_SECRET_ACCESS_KEY', '');
  },
  get awsRegion(): string {
    return getOptionalEnv('AWS_REGION', 'us-east-1');
  },
  get s3Bucket(): string {
    return getOptionalEnv('S3_BUCKET', 'content-repurposing');
  },

  // App
  get appUrl(): string {
    return getOptionalEnv('NEXT_PUBLIC_APP_URL', 'http://localhost:3000');
  },
  get nodeEnv(): string {
    return getOptionalEnv('NODE_ENV', 'development');
  },

  // Computed
  get isProduction(): boolean {
    return process.env.NODE_ENV === 'production';
  },
};

export type Config = typeof config;
