import { Telegraf } from 'telegraf';
import { env } from '../config/env.js';
import { aiEngine } from '../ai/index.js';
import { logger } from '../utils/logger.js';
import { sanitizeForTelegram } from '../utils/sanitize.js';

export const bot = new Telegraf(env.TELEGRAM_BOT_TOKEN);

// Middleware to restrict access
bot.use(async (ctx, next) => {
  if (ctx.from?.id !== env.TELEGRAM_USER_ID) {
    logger.warn(`Unauthorized access attempt from user ${ctx.from?.id}`);
    return;
  }
  await next();
});

bot.start((ctx) => {
  ctx.reply('Hello! I am your Personal AI Assistant. How can I help you today?');
});

bot.on('text', async (ctx) => {
  const userMessage = ctx.message.text;
  
  // Show typing indicator
  await ctx.sendChatAction('typing');
  
  try {
    const response = await aiEngine.processMessage(userMessage);
    await ctx.reply(sanitizeForTelegram(response), { parse_mode: 'HTML' });
  } catch (error) {
    logger.error('Error handling message', { error });
    await ctx.reply('Sorry, I encountered an error.');
  }
});

// Error handling
bot.catch((err, ctx) => {
  logger.error(`Bot Error for ${ctx.updateType}`, { err });
});
