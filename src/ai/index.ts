import { GoogleGenAI } from '@google/genai';
import { env } from '../config/env.js';
import { toolRegistry } from '../tools/index.js';
import { memoryManager } from '../memory/index.js';
import { logger } from '../utils/logger.js';
import { format } from 'date-fns';

const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
const modelName = 'gemini-3.5-flash-lite';

const systemInstruction = `You are a helpful, professional, and intelligent personal AI assistant.
You communicate via Telegram. You help manage the user's calendar, tasks, and provide briefings.
You must NOT guess information required by tools. Instead, ask follow-up questions to gather the missing information.
Always maintain context and remember what was discussed earlier in the conversation.
Format your responses beautifully in markdown. Keep it concise but natural.

Current local date and time: ${format(new Date(), "yyyy-MM-dd'T'HH:mm:ssXXX")}
`;

export class AIEngine {
  async processMessage(userMessage: string) {
    // Save user message
    await memoryManager.saveMessage('user', userMessage);

    // Fetch history
    const history = await memoryManager.getRecentMessages(15);
    const contents = history.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

    // Add current message (history already includes it since we just saved it,
    // but wait, we need to ensure the order is correct. `getRecentMessages` returns chronological)
    // Actually, `getRecentMessages` includes the message we just saved.

    // Tools schema for Gemini
    const geminiTools = [{
      functionDeclarations: toolRegistry.getAllDefinitions().map(def => ({
        name: def.name,
        description: def.description,
        parameters: def.parameters,
      }))
    }];

    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents,
        config: {
          systemInstruction,
          tools: geminiTools,
        }
      });

      let finalResponse = '';

      if (response.functionCalls && response.functionCalls.length > 0) {
        // Handle function calls
        for (const call of response.functionCalls) {
          const functionName = call.name;
          const args = call.args;

          let toolResult;
          try {
            toolResult = await toolRegistry.execute(functionName, args);
          } catch (e: any) {
            toolResult = { error: e.message };
          }

          // We should ideally send the tool result back to Gemini to get a final response,
          // but for simplicity in this flow we will invoke it again.
          const toolResultContent = {
            role: 'user',
            parts: [{ functionResponse: { name: functionName, response: toolResult } }]
          };

          const secondResponse = await ai.models.generateContent({
            model: modelName,
            contents: [...contents, response.candidates?.[0]?.content as any, toolResultContent],
            config: {
              systemInstruction,
              tools: geminiTools, // allow further tool calls if needed
            }
          });

          if (secondResponse.text) {
             finalResponse += secondResponse.text;
          }
        }
      } else {
        finalResponse = response.text || 'I have nothing to say.';
      }

      await memoryManager.saveMessage('assistant', finalResponse);
      return finalResponse;

    } catch (error: any) {
      logger.error('Gemini API Error', { error: error.message });
      return 'Sorry, I encountered an error while processing your request.';
    }
  }
}

export const aiEngine = new AIEngine();
