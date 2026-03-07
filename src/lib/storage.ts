import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { writeFile, readFile, unlink, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { config } from './config';

// Only create S3 client if credentials are provided
const hasS3Credentials = config.awsAccessKeyId && config.awsSecretAccessKey;

const s3Client = hasS3Credentials
  ? new S3Client({
      region: config.awsRegion,
      credentials: {
        accessKeyId: config.awsAccessKeyId,
        secretAccessKey: config.awsSecretAccessKey,
      },
    })
  : null;

const BUCKET = config.s3Bucket;

// Determine storage mode: 's3' or 'local'
export const STORAGE_MODE = hasS3Credentials ? 's3' : 'local';

if (STORAGE_MODE === 'local') {
  console.warn('⚠️  Using local filesystem storage. Files will be lost on redeploy (ephemeral). Configure AWS credentials for persistent storage.');
}

/**
 * Upload a file to storage (S3 or local filesystem)
 */
export async function uploadFile(key: string, body: Buffer, contentType: string): Promise<string> {
  if (STORAGE_MODE === 's3') {
    return uploadToS3(key, body, contentType);
  } else {
    return uploadToLocal(key, body);
  }
}

/**
 * Get a file from storage (S3 or local filesystem)
 */
export async function getFile(key: string): Promise<Buffer> {
  if (STORAGE_MODE === 's3') {
    return getFileFromS3(key);
  } else {
    return getFileFromLocal(key);
  }
}

/**
 * Delete a file from storage (S3 or local filesystem)
 */
export async function deleteFile(key: string): Promise<void> {
  if (STORAGE_MODE === 's3') {
    return deleteFromS3(key);
  } else {
    return deleteFromLocal(key);
  }
}

/**
 * Get public URL for a file (works for both S3 and local)
 */
export function getPublicUrl(key: string): string {
  if (STORAGE_MODE === 's3') {
    return `https://${BUCKET}.s3.${config.awsRegion}.amazonaws.com/${key}`;
  } else {
    // For local storage, return null or a placeholder
    // Files served through API endpoints
    return null;
  }
}

/**
 * Generate a file key for storage
 */
export function generateFileKey(userId: string, type: string, filename: string): string {
  // Sanitize filename to prevent path traversal
  const safeFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  return `uploads/${userId}/${type}/${Date.now()}-${safeFilename}`;
}

// ==================== S3 Functions ====================

async function uploadToS3(key: string, body: Buffer, contentType: string): Promise<string> {
  if (!s3Client) {
    throw new Error('S3 client not configured');
  }
  
  await s3Client.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );
  return key;
}

async function getFileFromS3(key: string): Promise<Buffer> {
  if (!s3Client) {
    throw new Error('S3 client not configured');
  }
  
  const response = await s3Client.send(
    new GetObjectCommand({
      Bucket: BUCKET,
      Key: key,
    })
  );
  
  const bytes = await response.Body?.transformToByteArray();
  return Buffer.from(bytes || []);
}

async function deleteFromS3(key: string): Promise<void> {
  if (!s3Client) {
    throw new Error('S3 client not configured');
  }
  
  await s3Client.send(
    new DeleteObjectCommand({
      Bucket: BUCKET,
      Key: key,
    })
  );
}

// ==================== Local Filesystem Functions ====================

async function uploadToLocal(key: string, body: Buffer): Promise<string> {
  const filepath = getLocalPath(key);
  
  // Create directory if it doesn't exist
  const dir = path.dirname(filepath);
  if (!existsSync(dir)) {
    await mkdir(dir, { recursive: true });
  }
  
  await writeFile(filepath, body);
  return key;
}

async function getFileFromLocal(key: string): Promise<Buffer> {
  const filepath = getLocalPath(key);
  return readFile(filepath);
}

async function deleteFromLocal(key: string): Promise<void> {
  const filepath = getLocalPath(key);
  await unlink(filepath);
}

function getLocalPath(key: string): string {
  return path.join(process.cwd(), key);
}
