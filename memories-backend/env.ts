import dotenv from 'dotenv';

dotenv.config();

export const env = {
  mongoUri: process.env.MONGODB_URI || process.env.MONGO_URI || '',
  r2BucketName: process.env.R2_BUCKET_NAME || '',
  r2AccessKey: process.env.R2_ACCESS_KEY_ID || '',
  r2Secret: process.env.R2_SECRET_ACCESS_KEY || '',
  port: Number(process.env.PORT) || 3000,
  jwtSecret: process.env.JWT_SECRET || '',
};