import express from 'express';
import { env } from '../config/env.js';
import { bot } from '../bot/index.js';
import { oauth2Client } from '../services/googleAuth.js';
import { logger } from '../utils/logger.js';

export const app = express();

app.use(express.json());

// Webhook for Telegram
if (env.NODE_ENV === 'production' || env.PUBLIC_URL) {
  const webhookPath = `/telegraf/${bot.secretPathComponent()}`;
  app.use(bot.webhookCallback(webhookPath));
  
  // Set webhook async
  bot.telegram.setWebhook(`${env.PUBLIC_URL}${webhookPath}`)
    .then(() => logger.info(`Webhook set up on ${env.PUBLIC_URL}${webhookPath}`))
    .catch(e => logger.error('Failed to set webhook', { error: e }));
}

// Google OAuth Auth Endpoint
app.get('/auth', (req, res) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/tasks'
    ],
    prompt: 'consent' // Force to get refresh token
  });
  res.redirect(url);
});

// Google OAuth Callback
app.get('/auth/callback', async (req, res) => {
  const { code } = req.query;
  try {
    const { tokens } = await oauth2Client.getToken(code as string);
    oauth2Client.setCredentials(tokens);
    
    logger.info('OAuth successful. Tokens received.', { refresh_token: tokens.refresh_token });
    
    res.send(`
      <h1>Authentication Successful!</h1>
      <p>Please copy the following Refresh Token and add it to your .env file as <strong>GOOGLE_REFRESH_TOKEN</strong>:</p>
      <textarea rows="4" cols="50" readonly>${tokens.refresh_token}</textarea>
      <p>After updating the .env file, restart the application.</p>
    `);
  } catch (error) {
    logger.error('Error retrieving OAuth tokens', { error });
    res.status(500).send('Authentication failed.');
  }
});

// Health check
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});
