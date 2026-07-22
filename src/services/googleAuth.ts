import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

export const oauth2Client: OAuth2Client = new google.auth.OAuth2(
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

export { OAuth2Client };
