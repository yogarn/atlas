import express, { Request, Response } from 'express';
import { env } from '../config/env.js';
import { bot } from '../bot/index.js';
import { oauth2Client } from '../services/googleAuth.js';
import { logger } from '../utils/logger.js';

export const app = express();

app.use(express.json());

// Webhook for Telegram
const webhookPath = `/telegraf/${bot.secretPathComponent()}`;
app.use(bot.webhookCallback(webhookPath));

bot.telegram.setWebhook(`${env.PUBLIC_URL}${webhookPath}`)
  .then(() => logger.info(`Webhook set up on ${env.PUBLIC_URL}${webhookPath}`))
  .catch((e: Error) => logger.error('Failed to set webhook', { error: { message: e.message } }));

// Google OAuth Auth Endpoint
app.get('/auth', (_req: Request, res: Response) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/tasks'
    ],
    prompt: 'consent'
  });
  res.redirect(url);
});

// Google OAuth Callback
app.get('/auth/callback', async (req: Request, res: Response) => {
  const { code } = req.query;
  try {
    const { tokens } = await oauth2Client.getToken(code as string);
    oauth2Client.setCredentials(tokens);

    logger.info('OAuth successful. Tokens received.', { refresh_token: tokens.refresh_token });

    res.send(`
      <h1>Authentication Successful!</h1>
      <p>Copy the Refresh Token below and set it as <strong>GOOGLE_REFRESH_TOKEN</strong> in your .env:</p>
      <textarea rows="4" cols="60" readonly>${tokens.refresh_token}</textarea>
      <p>After updating .env, restart the application.</p>
    `);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error('Error retrieving OAuth tokens', { error: message });
    res.status(500).send('Authentication failed.');
  }
});

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).send('OK');
});
