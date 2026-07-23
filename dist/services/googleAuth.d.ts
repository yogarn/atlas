import { google } from 'googleapis';
type OAuth2ClientType = InstanceType<typeof google.auth.OAuth2>;
export declare const oauth2Client: OAuth2ClientType;
export type { OAuth2ClientType };
