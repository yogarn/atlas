/**
 * Sanitizes AI output for Telegram's HTML parse mode.
 *
 * Gemini sometimes ignores the "use HTML only" instruction and produces
 * Markdown. This function converts common Markdown patterns to HTML equivalents
 * and removes anything that could break Telegram's entity parser.
 */
export declare function sanitizeForTelegram(text: string): string;
