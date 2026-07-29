import { app } from './app.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { env } from './config/env.js';

async function start(): Promise<void> {
  await connectDatabase();

  const server = app.listen(env.port, () => {
    console.info(`API listening on port ${env.port}`);
  });

  const stop = async (signal: string): Promise<void> => {
    console.info(`${signal} received. Closing API gracefully.`);
    server.close(async () => {
      await disconnectDatabase();
      process.exit(0);
    });
  };

  process.once('SIGINT', () => void stop('SIGINT'));
  process.once('SIGTERM', () => void stop('SIGTERM'));
}

start().catch((error: unknown) => {
  console.error('Unable to start the API.', error);
  process.exit(1);
});
