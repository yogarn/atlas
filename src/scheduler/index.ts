import { aiEngine } from '../ai/index.js';
import { bot } from '../bot/index.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { sanitizeForTelegram } from '../utils/sanitize.js';
import { boss } from './pgboss.js';

export async function startScheduler() {
  await boss.start();

  // Create queues to prevent "Queue does not exist" errors in newer pg-boss versions
  await boss.createQueue('morning-briefing');
  await boss.createQueue('night-reminder');

  // Define workers
  await boss.work('morning-briefing', async () => {
    logger.info('Running Morning Briefing job...');
    try {
      const prompt = `[SYSTEM SCHEDULER] Generate a morning briefing for today.
Call the calendar_list tool for today's date, the tasks_list tool for pending tasks, and the weather_forecast tool for Malang today.
Synthesize them into a warm, concise morning briefing.
Do not ask follow-up questions — just generate the briefing directly.`;

      const response = await aiEngine.processMessage(prompt);

      await bot.telegram.sendMessage(
        env.TELEGRAM_USER_ID,
        sanitizeForTelegram(response),
        { parse_mode: 'HTML' }
      );
      logger.info('Morning Briefing sent successfully.');
    } catch (error) {
      logger.error('Failed to send Morning Briefing', { error });
      throw error; // Let pg-boss retry it
    }
  });

  await boss.work('night-reminder', async () => {
    logger.info('Running Night Reminder job...');
    try {
      const prompt = `[SYSTEM SCHEDULER] Generate a night reminder for tomorrow's agenda.
Call the calendar_list tool for TOMORROW'S date, the tasks_list tool for pending tasks, and the weather_forecast tool for Malang tomorrow.
Synthesize them into a concise night reminder.
End the message exactly with:
"Have a good morning, Nala.
Take things one step at a time.
Godspeed."
Do not ask follow-up questions — just generate the reminder directly.`;

      const response = await aiEngine.processMessage(prompt);

      await bot.telegram.sendMessage(
        env.TELEGRAM_USER_ID,
        sanitizeForTelegram(response),
        { parse_mode: 'HTML' }
      );
      logger.info('Night Reminder sent successfully.');
    } catch (error) {
      logger.error('Failed to send Night Reminder', { error });
      throw error;
    }
  });

  // Schedule cron jobs
  await boss.schedule('morning-briefing', '0 7 * * *', null, { tz: env.TIMEZONE });
  await boss.schedule('night-reminder', '0 21 * * *', null, { tz: env.TIMEZONE });

  logger.info(`Schedulers started using pg-boss. Timezone: ${env.TIMEZONE}`);
}
