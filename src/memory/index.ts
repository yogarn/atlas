import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger.js';

export const prisma = new PrismaClient();

export class MemoryManager {
  async saveMessage(role: string, content: string) {
    try {
      await prisma.message.create({
        data: { role, content },
      });
    } catch (error) {
      logger.error('Failed to save message', { error });
    }
  }

  async getRecentMessages(limit = 20) {
    try {
      const messages = await prisma.message.findMany({
        orderBy: { timestamp: 'desc' },
        take: limit,
      });
      return messages.reverse();
    } catch (error) {
      logger.error('Failed to fetch recent messages', { error });
      return [];
    }
  }

  async saveMemorySummary(content: string, type: string = 'summary') {
    try {
      await prisma.memory.create({
        data: { type, content },
      });
    } catch (error) {
      logger.error('Failed to save memory summary', { error });
    }
  }

  async getMemories() {
    try {
      return await prisma.memory.findMany({
        orderBy: { createdAt: 'asc' },
      });
    } catch (error) {
      logger.error('Failed to fetch memories', { error });
      return [];
    }
  }
}

export const memoryManager = new MemoryManager();
