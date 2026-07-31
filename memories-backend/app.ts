import dotenv from 'dotenv';
import express, { type Request, type Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose, { Schema, model } from 'mongoose';
import { env } from './env.js';

dotenv.config();

interface MediaDocument {
  key: string;
  original?: string;
  preview?: string;
  thumbnail?: string;
  metadata?: Record<string, unknown>;
}

interface MemoryDocument {
  title?: string;
  happenedAt?: Date;
  coverMedia?: string;
  media?: string[];
  tags?: string[];
  description?: string;
}

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());

const MediaSchema = new Schema<MediaDocument>({
  key: { type: String, required: true },
  original: String,
  preview: String,
  thumbnail: String,
  metadata: Object,
});

const MemorySchema = new Schema<MemoryDocument>({
  title: String,
  happenedAt: Date,
  coverMedia: String,
  media: [String],
  tags: [String],
  description: String,
});

const Media = model<MediaDocument>('Media', MediaSchema);
const Memory = model<MemoryDocument>('Memory', MemorySchema);

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

app.get('/api/memories', async (_req: Request, res: Response) => {
  const memories = await Memory.find().limit(20);
  res.json(memories);
});

app.post('/api/memories', async (req: Request, res: Response) => {
  const mem = new Memory(req.body as MemoryDocument);
  await mem.save();
  res.status(201).json(mem);
});

mongoose
  .connect(env.mongoUri)
  .then(() => console.log('MongoDB connected'))
  .catch((err: unknown) => console.error('MongoDB connection error:', err));

app.listen(env.port, () => {
  console.log(`Server running on port ${env.port}`);
});

void Media;