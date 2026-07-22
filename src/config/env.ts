import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production']).default('development'),
  PORT: z.string().default('3000'),
  TELEGRAM_BOT_TOKEN: z.string(),
  TELEGRAM_USER_ID: z.string().transform((val) => parseInt(val, 10)),
  GEMINI_API_KEY: z.string(),
  OPENWEATHERMAP_API_KEY: z.string(),
  DATABASE_URL: z.string(),
  GOOGLE_CLIENT_ID: z.string(),
  GOOGLE_CLIENT_SECRET: z.string(),
  GOOGLE_REDIRECT_URI: z.string(),
  GOOGLE_REFRESH_TOKEN: z.string().optional(),
  PUBLIC_URL: z.string().url().describe('The public URL for the webhook (e.g. https://your-domain.com)'),
  TIMEZONE: z.string().default('UTC').describe('IANA timezone name, e.g. Asia/Jakarta'),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error('❌ Invalid environment variables:', _env.error.format());
  process.exit(1);
}

export const env = _env.data;
