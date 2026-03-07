import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
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

export async function uploadFile(key: string, body: Buffer, contentType: string): Promise<string> {
  if (!s3Client) {
    throw new Error('S3 credentials not configured. Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY.');
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

export async function getFile(key: string): Promise<Buffer> {
  if (!s3Client) {
    throw new Error('S3 credentials not configured. Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY.');
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

export async function deleteFile(key: string): Promise<void> {
  if (!s3Client) {
    throw new Error('S3 credentials not configured. Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY.');
  }
  
  await s3Client.send(
    new DeleteObjectCommand({
      Bucket: BUCKET,
      Key: key,
    })
  );
}

export function getPublicUrl(key: string): string {
  return `https://${BUCKET}.s3.${config.awsRegion}.amazonaws.com/${key}`;
}

export function generateFileKey(userId: string, type: string, filename: string): string {
  // Sanitize filename to prevent path traversal
  const safeFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  return `uploads/${userId}/${type}/${Date.now()}-${safeFilename}`;
}
