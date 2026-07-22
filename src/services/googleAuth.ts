import { google } from 'googleapis';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

// Derive the type from googleapis itself — no need to import google-auth-library directly
type OAuth2ClientType = InstanceType<typeof google.auth.OAuth2>;

export const oauth2Client: OAuth2ClientType = new google.auth.OAuth2(
  env.GOOGLE_CLIENT_ID,
  env.GOOGLE_CLIENT_SECRET,
  env.GOOGLE_REDIRECT_URI
);

if (env.GOOGLE_REFRESH_TOKEN) {
  oauth2Client.setCredentials({
    refresh_token: env.GOOGLE_REFRESH_TOKEN
  });
  logger.info('Google OAuth2 client initialized with refresh token.');
} else {
  logger.warn('Google OAuth2 refresh token is missing. Visit /auth to authenticate.');
}

export type { OAuth2ClientType };
