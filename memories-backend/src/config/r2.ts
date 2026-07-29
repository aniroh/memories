import { S3Client } from '@aws-sdk/client-s3';
import { env, requireEnvironmentValue } from './env.js';

/**
 * Cloudflare R2 exposes an S3-compatible API. Keep this construction here so
 * upload and media modules never need to know about deployment credentials.
 */
export function createR2Client(): S3Client {
  return new S3Client({
    region: 'auto',
    endpoint: requireEnvironmentValue(env.r2.endpoint, 'R2_ACCOUNT_ID or R2_ENDPOINT'),
    credentials: {
      accessKeyId: requireEnvironmentValue(env.r2.accessKeyId, 'R2_ACCESS_KEY_ID'),
      secretAccessKey: requireEnvironmentValue(env.r2.secretAccessKey, 'R2_SECRET_ACCESS_KEY'),
    },
  });
}

export function getR2BucketName(): string {
  return requireEnvironmentValue(env.r2.bucketName, 'R2_BUCKET_NAME');
}
