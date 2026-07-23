import { PgBoss } from 'pg-boss';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

export const boss = new PgBoss({
  connectionString: env.DATABASE_URL,
});

boss.on('error', (error: Error) => {
  logger.error('pg-boss error:', { error });
});
