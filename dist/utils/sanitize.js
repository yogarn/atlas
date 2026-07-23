/**
 * Sanitizes AI output for Telegram's HTML parse mode.
 *
 * Gemini sometimes ignores the "use HTML only" instruction and produces
 * Markdown. This function converts common Markdown patterns to HTML equivalents
 * and removes anything that could break Telegram's entity parser.
 */
export function sanitizeForTelegram(text) {
    let result = text;
    // Convert **bold** → <b>bold</b>
    result = result.replace(/\*\*(.+?)\*\*/gs, '<b>$1</b>');
    // Convert __bold__ → <b>bold</b>
    result = result.replace(/__(.+?)__/gs, '<b>$1</b>');
    // Convert *italic* → <i>italic</i>  (single asterisk, not already converted)
    result = result.replace(/\*(?!\*)(.+?)(?<!\*)\*/gs, '<i>$1</i>');
    // Convert _italic_ → <i>italic</i>
    result = result.replace(/_(?!_)(.+?)(?<!_)_/gs, '<i>$1</i>');
    // Convert `code` → <code>code</code>
    result = result.replace(/`([^`]+)`/g, '<code>$1</code>');
    // Remove any leftover lone asterisks or underscores that Telegram would trip on
    result = result.replace(/(?<!\w)\*(?!\w)/g, '');
    result = result.replace(/(?<!\w)_(?!\w)/g, '');
    // Escape bare < and > that are NOT part of an HTML tag (to avoid breaking HTML mode)
    // Only escape < / > that don't look like valid HTML tags
    result = result.replace(/<(?!\/?(?:b|i|u|s|code|pre|a|br)\b)[^>]*>/gi, (match) => {
        return match.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    });
    return result.trim();
}
//# sourceMappingURL=sanitize.js.map