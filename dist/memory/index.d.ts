import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
export declare const prisma: PrismaClient<{
    adapter: PrismaPg;
}, never, import("@prisma/client/runtime/client").DefaultArgs>;
export declare class MemoryManager {
    saveMessage(role: string, content: string): Promise<void>;
    getRecentMessages(limit?: number): Promise<{
        id: string;
        conversationId: string;
        role: string;
        content: string;
        timestamp: Date;
    }[]>;
    saveMemorySummary(content: string, type?: string): Promise<void>;
    getMemories(): Promise<{
        id: string;
        type: string;
        content: string;
        createdAt: Date;
    }[]>;
}
export declare const memoryManager: MemoryManager;
