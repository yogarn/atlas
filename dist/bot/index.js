import { Telegraf } from 'telegraf';
import { env } from '../config/env.js';
import { aiEngine } from '../ai/index.js';
import { logger } from '../utils/logger.js';
import { sanitizeForTelegram } from '../utils/sanitize.js';
// Cast to Telegraf<any> to avoid @telegraf/types version conflict in pnpm
// (telegraf uses v7.1.0 internally, but pnpm also resolves v9.2.1 as a direct dep)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const bot = new Telegraf(env.TELEGRAM_BOT_TOKEN);
// Middleware to restrict access to owner only
bot.use(async (ctx, next) => {
    if (ctx.from?.id !== env.TELEGRAM_USER_ID) {
        logger.warn(`Unauthorized access attempt from user ${ctx.from?.id}`);
        return;
    }
    await next();
});
bot.start((ctx) => {
    ctx.reply('Hello! I am Atlas, your Personal AI Assistant. How can I help you today?');
});
bot.on('text', async (ctx) => {
    const userMessage = ctx.message.text;
    logger.info('Incoming message', { from: ctx.from.id, message: userMessage });
    await ctx.sendChatAction('typing');
    try {
        const response = await aiEngine.processMessage(userMessage);
        await ctx.reply(sanitizeForTelegram(response), { parse_mode: 'HTML' });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        logger.error('Error handling message', { error: message });
        await ctx.reply('Sorry, I encountered an error. Please try again.');
    }
});
bot.catch((err, ctx) => {
    const message = err instanceof Error ? err.message : String(err);
    logger.error(`Bot Error for ${ctx.updateType}`, { error: message });
});
//# sourceMappingURL=index.js.map