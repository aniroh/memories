import dotenv from 'dotenv';

dotenv.config();

function optionalValue(value: string | undefined): string | undefined {
  const trimmedValue = value?.trim();
  return trimmedValue ? trimmedValue : undefined;
}

function parsePort(value: string | undefined): number {
  const port = Number(value ?? 3000);

  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error('PORT must be an integer between 1 and 65535.');
  }

  return port;
}

const r2AccountId = optionalValue(process.env.R2_ACCOUNT_ID);

export const env = Object.freeze({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: parsePort(process.env.PORT),
  mongoUri: optionalValue(process.env.MONGODB_URI ?? process.env.MONGO_URI),
  corsOrigins: (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  r2: {
    accountId: r2AccountId,
    bucketName: optionalValue(process.env.R2_BUCKET_NAME),
    accessKeyId: optionalValue(process.env.R2_ACCESS_KEY_ID),
    secretAccessKey: optionalValue(process.env.R2_SECRET_ACCESS_KEY),
    endpoint: optionalValue(process.env.R2_ENDPOINT) ??
      (r2AccountId ? `https://${r2AccountId}.r2.cloudflarestorage.com` : undefined),
    publicBaseUrl: optionalValue(process.env.R2_PUBLIC_BASE_URL),
  },
});

export function requireEnvironmentValue(value: string | undefined, variableName: string): string {
  if (!value) {
    throw new Error(`${variableName} is required. Add it to the backend environment before starting the server.`);
  }

  return value;
}
