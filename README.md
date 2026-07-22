# Personal AI Assistant

A powerful personal AI assistant that interacts via Telegram, built with Node.js, TypeScript, PostgreSQL, and Google Gemini. The assistant can manage your Google Calendar, Google Tasks, and fetch the weather.

## Prerequisites

- Node.js (v18+)
- pnpm
- Docker & Docker Compose (for PostgreSQL)
- Telegram Bot Token
- Google Cloud Project (with Calendar and Tasks APIs enabled)
- Google Gemini API Key
- OpenWeatherMap API Key

## Setup Instructions

### 1. Clone the repository and install dependencies

```bash
pnpm install
```

### 2. Configure Environment Variables

Create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

#### API Keys & Setup Guide

**Telegram Bot Token:**
1. Open Telegram and search for `@BotFather`.
2. Send `/newbot` and follow the instructions to create a bot.
3. Copy the HTTP API Token and set it as `TELEGRAM_BOT_TOKEN`.
4. To get your `TELEGRAM_USER_ID`, search for `@userinfobot` on Telegram and send a message. Copy the `Id` and paste it into `.env`.

**Google Gemini API Key:**
1. Go to [Google AI Studio](https://aistudio.google.com/).
2. Create an API key and set it as `GEMINI_API_KEY`.

**Google OAuth & Credentials:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project.
3. Go to **APIs & Services > Library** and enable:
   - Google Calendar API
   - Google Tasks API
4. Go to **OAuth consent screen** and configure it (User type: External, add yourself as a Test user).
5. Go to **Credentials > Create Credentials > OAuth client ID**.
   - Application type: Web application
   - Authorized redirect URIs: `http://localhost:3000/auth/callback` (or your domain).
6. Copy the Client ID and Client Secret into `.env`.
7. **Important:** Run the application locally first and visit `http://localhost:3000/auth` to authenticate and get your `GOOGLE_REFRESH_TOKEN`. Copy the token into your `.env` and restart the app.

**OpenWeatherMap API Key:**
1. Go to [OpenWeatherMap](https://openweathermap.org/) and create an account.
2. Generate an API key and set it as `OPENWEATHERMAP_API_KEY`.

### 3. Setup the Database

Start the PostgreSQL container:

```bash
docker-compose up -d
```

Apply the Prisma schema:

```bash
npx prisma db push
```

### 4. Run the Application

**Development (Polling):**
```bash
pnpm dev
```
In this mode, the bot will poll Telegram for updates. This is easier for local testing.

**Production (Webhooks):**
Set `NODE_ENV=production` and `PUBLIC_URL=https://your-domain.com`.
The app will automatically register the webhook endpoint with Telegram.
```bash
pnpm start
```

## Features

- **Conversational Memory**: The assistant remembers context across multiple messages.
- **Calendar Management**: Automatically schedules events on Google Calendar.
- **Task Management**: Adds to-do items to Google Tasks.
- **Weather Briefing**: Fetches current weather.
- **Morning Briefing**: Sends a scheduled summary of the day at 07:00.
# atlas
