import { GoogleGenAI, Content, Part } from '@google/genai';
import { env } from '../config/env.js';
import { toolRegistry } from '../tools/index.js';
import { memoryManager } from '../memory/index.js';
import { logger } from '../utils/logger.js';
import { format, toZonedTime } from 'date-fns-tz';

const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
const modelName = 'gemini-3.5-flash-lite';

function buildSystemInstruction(): string {
  const now = toZonedTime(new Date(), env.TIMEZONE);
  const localTime = format(now, "EEEE, MMMM d yyyy 'at' HH:mm", { timeZone: env.TIMEZONE });
  return `You are Atlas, a helpful, warm, and intelligent personal AI assistant.
You were built for and belong to Nala. Always address the user as "Nala".
Your name is Atlas. If asked about yourself, say you are Atlas.
You communicate via Telegram. You help Nala manage their calendar, tasks, and provide daily briefings.
Nala currently lives in Malang, Indonesia.

User's local timezone: ${env.TIMEZONE}
Current local date and time: ${localTime}

Rules:
- NEVER call any tool unless the user has explicitly asked for something that requires it.
- NEVER proactively fetch calendar events, tasks, or weather unless the user directly requests it.
- For greetings, small talk, or casual messages — respond naturally and conversationally. Do NOT call any tools.
- NEVER guess or assume missing information required to call a tool.
- If a user's request is missing required details (like time, date, or name), ask ONE follow-up question at a time.
- Only call a tool when you have ALL required information for it.
- After calling a tool successfully, confirm the result in a friendly, natural way.
- Format your responses using simple HTML: <b>bold</b>, <i>italic</i>, <code>code</code>. Do NOT use markdown asterisks or underscores.

Calendar Rules:
- When creating a new event, call calendar_create WITHOUT force=true first.
  - If it returns status='conflict', inform the user clearly about the conflicting event(s) and ask: should I create it anyway, reschedule it, or would you like to cancel the existing event?
  - Only set force=true after the user explicitly confirms they want to proceed despite the conflict.
- When the user wants to MODIFY an event (reschedule, shorten, extend, rename): ALWAYS use calendar_update, NEVER calendar_create.
  - First call calendar_list to get the event's ID, then call calendar_update with that ID and only the changed fields.
  - Do NOT create a duplicate event.
- When the user asks to take a break: Do NOT create a new "Break" event. Instead, find the current ongoing event via calendar_list and use calendar_update to push its endTime back to accommodate the break.
- When the user wants to CANCEL or DELETE an event: use calendar_delete.
  - First call calendar_list to find the event ID.
  - If multiple events match the user's description, list them and ask which one to delete.

Tasks Rules:
- When the user wants to MODIFY a task (mark complete, rename, change due date, etc): ALWAYS use tasks_update.
  - First call tasks_list to get the task's ID, then call tasks_update with that ID and only the changed fields.
  - To mark a task as completed, use status="completed".
- When the user wants to DELETE a task: use tasks_delete.
  - First call tasks_list to find the task ID.
  - If multiple tasks match the user's description, list them and ask which one to delete.`;
}

export class AIEngine {
  async processMessage(userMessage: string): Promise<string> {
    await memoryManager.saveMessage('user', userMessage);

    const recentMessages = await memoryManager.getRecentMessages(20);

    // Build chat history (everything except the last message, which we send fresh)
    const historyMessages = recentMessages.slice(0, -1);
    const history: Content[] = historyMessages.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const geminiTools: any[] = [{
      functionDeclarations: toolRegistry.getAllDefinitions().map(def => ({
        name: def.name,
        description: def.description,
        parameters: def.parameters,
      }))
    }];

    try {
      const chat = ai.chats.create({
        model: modelName,
        history,
        config: {
          systemInstruction: buildSystemInstruction(),
          tools: geminiTools,
        }
      });

      // Agentic loop — keep running until Gemini gives a final text response
      let finalResponse = '';
      let currentMessage: string | Part[] = userMessage;
      const MAX_ITERATIONS = 5;

      for (let i = 0; i < MAX_ITERATIONS; i++) {
        logger.info('Sending message to Gemini', { iteration: i, message: typeof currentMessage === 'string' ? currentMessage : '[function results]' });

        const response = await chat.sendMessage({ message: currentMessage });

        const functionCalls = response.functionCalls;

        if (!functionCalls || functionCalls.length === 0) {
          // No tool calls — this is the final text response
          finalResponse = response.text ?? 'I have nothing to say.';
          break;
        }

        // Execute all requested tool calls in parallel
        logger.info(`Gemini requested ${functionCalls.length} tool call(s)`);

        const functionResponseParts: Part[] = await Promise.all(
          functionCalls.map(async (call) => {
            let result: any;
            try {
              result = await toolRegistry.execute(call.name!, call.args ?? {});
            } catch (e: any) {
              logger.error(`Tool ${call.name} failed`, { error: e.message });
              result = { error: e.message };
            }

            // Wrap result in object — Gemini requires response to be a plain object, never an array
            const wrappedResult = Array.isArray(result) ? { items: result } : result;

            return {
              functionResponse: {
                name: call.name!,
                response: wrappedResult,
              },
            } as Part;
          })
        );

        // Feed the function results back to Gemini as the next message
        currentMessage = functionResponseParts;
      }

      if (!finalResponse) {
        finalResponse = 'Done.';
      }

      await memoryManager.saveMessage('assistant', finalResponse);
      return finalResponse;

    } catch (error: any) {
      logger.error('Gemini API Error', { error: error.message ?? JSON.stringify(error) });
      return 'Sorry, I ran into an issue. Please try again.';
    }
  }
}

export const aiEngine = new AIEngine();
