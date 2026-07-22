import { app } from './app/index.js';
import { bot } from './bot/index.js';
import { startScheduler } from './scheduler/index.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';

async function bootstrap() {
  // Start the Express server
  app.listen(env.PORT, () => {
    logger.info(`Server listening on port ${env.PORT}`);
  });

  // Start the bot (Polling fallback if not production/no webhook)
  if (env.NODE_ENV !== 'production' && !env.PUBLIC_URL) {
    logger.info('Starting bot in long-polling mode');
    bot.launch();
  }

  // Start the schedulers
  startScheduler();
}

bootstrap().catch((error) => {
  logger.error('Failed to bootstrap application', { error });
  process.exit(1);
});

// Enable graceful stop
process.once('SIGINT', () => {
  bot.stop('SIGINT');
});
process.once('SIGTERM', () => {
  bot.stop('SIGTERM');
});
