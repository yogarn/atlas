import cron from 'node-cron';
import { aiEngine } from '../ai/index.js';
import { bot } from '../bot/index.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { sanitizeForTelegram } from '../utils/sanitize.js';
export function startScheduler() {
    // Morning Briefing at 07:00 local time
    cron.schedule('0 7 * * *', async () => {
        logger.info('Running Morning Briefing job...');
        try {
            const prompt = `[SYSTEM SCHEDULER] Generate a morning briefing for today.
Call the calendar_list tool for today's date, the tasks_list tool for pending tasks, and the weather_forecast tool for Malang today.
Synthesize them into a warm, concise morning briefing.
Do not ask follow-up questions — just generate the briefing directly.`;
            const response = await aiEngine.processMessage(prompt);
            await bot.telegram.sendMessage(env.TELEGRAM_USER_ID, sanitizeForTelegram(response), { parse_mode: 'HTML' });
            logger.info('Morning Briefing sent successfully.');
        }
        catch (error) {
            logger.error('Failed to send Morning Briefing', { error });
        }
    }, {
        timezone: env.TIMEZONE, // Run in user's local timezone, not server UTC
    });
    // Night Reminder at 21:00 local time
    cron.schedule('0 21 * * *', async () => {
        logger.info('Running Night Reminder job...');
        try {
            const prompt = `[SYSTEM SCHEDULER] Generate a night reminder for tomorrow's agenda.
Call the calendar_list tool for TOMORROW'S date, the tasks_list tool for pending tasks, and the weather_forecast tool for Malang tomorrow.
Synthesize them into a concise night reminder.
End the message exactly with:
"Sweet dreams, Nala.
Per aspera ad astra. Godspeed."
Do not ask follow-up questions — just generate the reminder directly.`;
            const response = await aiEngine.processMessage(prompt);
            await bot.telegram.sendMessage(env.TELEGRAM_USER_ID, sanitizeForTelegram(response), { parse_mode: 'HTML' });
            logger.info('Night Reminder sent successfully.');
        }
        catch (error) {
            logger.error('Failed to send Night Reminder', { error });
        }
    }, {
        timezone: env.TIMEZONE,
    });
    logger.info(`Schedulers started. Timezone: ${env.TIMEZONE}`);
}
//# sourceMappingURL=index.js.map