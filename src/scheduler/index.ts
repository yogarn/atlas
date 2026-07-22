import cron from 'node-cron';
import { aiEngine } from '../ai/index.js';
import { bot } from '../bot/index.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

export function startScheduler() {
  // Morning Briefing at 07:00
  cron.schedule('0 7 * * *', async () => {
    logger.info('Running Morning Briefing job...');
    try {
      // Trigger a system prompt to the AI to generate a briefing
      const prompt = `System Request: Please generate a morning briefing for today. 
Fetch today's calendar events and today's weather, and synthesize them into a friendly morning briefing.`;
      
      const response = await aiEngine.processMessage(prompt);
      
      await bot.telegram.sendMessage(env.TELEGRAM_USER_ID, response, { parse_mode: 'Markdown' });
      logger.info('Morning Briefing sent successfully.');
    } catch (error) {
      logger.error('Failed to send Morning Briefing', { error });
    }
  });

  logger.info('Schedulers started.');
}
