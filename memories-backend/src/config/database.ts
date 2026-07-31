import mongoose from 'mongoose';
import { env, requireEnvironmentValue } from './env.js';

export async function connectDatabase(): Promise<void> {
  const mongoUri = requireEnvironmentValue(env.mongoUri, 'MONGODB_URI');

  mongoose.set('strictQuery', true);
  await mongoose.connect(mongoUri);
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
}
