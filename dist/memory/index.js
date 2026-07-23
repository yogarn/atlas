import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
// Prisma 7 requires a driver adapter — PrismaPg accepts the connection string directly
const adapter = new PrismaPg({ connectionString: env.DATABASE_URL });
export const prisma = new PrismaClient({ adapter });
export class MemoryManager {
    async saveMessage(role, content) {
        try {
            await prisma.message.create({
                data: { role, content },
            });
        }
        catch (error) {
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
        }
        catch (error) {
            logger.error('Failed to fetch recent messages', { error });
            return [];
        }
    }
    async saveMemorySummary(content, type = 'summary') {
        try {
            await prisma.memory.create({
                data: { type, content },
            });
        }
        catch (error) {
            logger.error('Failed to save memory summary', { error });
        }
    }
    async getMemories() {
        try {
            return await prisma.memory.findMany({
                orderBy: { createdAt: 'asc' },
            });
        }
        catch (error) {
            logger.error('Failed to fetch memories', { error });
            return [];
        }
    }
}
export const memoryManager = new MemoryManager();
//# sourceMappingURL=index.js.map