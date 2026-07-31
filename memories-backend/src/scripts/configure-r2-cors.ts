import { PutBucketCorsCommand } from '@aws-sdk/client-s3';
import { createR2Client, getR2BucketName } from '../config/r2.js';
import { env } from '../config/env.js';

if (env.corsOrigins.length === 0) {
  throw new Error('Set CORS_ORIGINS before configuring R2 CORS. Include localhost and your Cloudflare Pages URL.');
}

await createR2Client().send(
  new PutBucketCorsCommand({
    Bucket: getR2BucketName(),
    CORSConfiguration: {
      CORSRules: [
        {
          AllowedOrigins: env.corsOrigins,
          AllowedMethods: ['GET', 'HEAD', 'PUT'],
          AllowedHeaders: ['*'],
          ExposeHeaders: ['ETag'],
          MaxAgeSeconds: 3600,
        },
      ],
    },
  }),
);

console.info(`Configured R2 CORS for: ${env.corsOrigins.join(', ')}`);
