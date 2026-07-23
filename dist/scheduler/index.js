import cron from 'node-cron';
import { aiEngine } from '../ai/index.js';
import { bot } from '../bot/index.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { sanitizeForTelegram } from '../utils/sanitize.js';
export function startScheduler() {
    // Morning Briefing at 07:00 local time
    cron.schedule('19 7 * * *', async () => {
        logger.info('Running Morning Briefing job...');
        try {
            const prompt = `[SYSTEM SCHEDULER] Generate a morning briefing for today.
        Call the calendar_list tool for today's date, the tasks_list tool for pending tasks, and the weather_today tool for Malang.
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
    logger.info(`Schedulers started. Timezone: ${env.TIMEZONE}`);
}
//# sourceMappingURL=index.js.map