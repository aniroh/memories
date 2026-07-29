import cors from 'cors';
import express, { type NextFunction, type Request, type Response } from 'express';
import helmet from 'helmet';
import { env } from './config/env.js';
import { memoryRouter, draftRouter } from './modules/memory/memory.routes.js';
import { mediaRouter } from './modules/media/media.routes.js';
import { uploadRouter } from './modules/upload/upload.routes.js';
import { ApiError } from './utils/api-error.js';

export const app = express();

app.disable('x-powered-by');
app.use(helmet());
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || env.corsOrigins.length === 0 || env.corsOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error('This origin is not allowed by CORS.'));
    },
  }),
);
app.use(express.json({ limit: '2mb' }));

app.get('/api/health', (_request: Request, response: Response) => {
  response.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/uploads', uploadRouter);
app.use('/api/media', mediaRouter);
app.use('/api/memories', memoryRouter);
app.use('/api/drafts', draftRouter);

app.use((_request: Request, response: Response) => {
  response.status(404).json({ error: 'Route not found.' });
});

app.use((error: Error, _request: Request, response: Response, _next: NextFunction) => {
  const status = error instanceof ApiError ? error.statusCode : error.message === 'This origin is not allowed by CORS.' ? 403 : 500;

  if (error.name === 'ValidationError' || error.name === 'CastError') {
    response.status(400).json({ error: error.message });
    return;
  }

  if (status === 500) {
    console.error(error);
  }

  response.status(status).json({ error: status === 500 ? 'Internal server error.' : error.message });
});
