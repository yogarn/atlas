import { Tool, ToolDefinition } from './types.js';
import { logger } from '../utils/logger.js';

export class ToolRegistry {
  private tools: Map<string, Tool> = new Map();

  register(tool: Tool) {
    if (this.tools.has(tool.definition.name)) {
      throw new Error(`Tool ${tool.definition.name} is already registered`);
    }
    this.tools.set(tool.definition.name, tool);
    logger.info(`Registered tool: ${tool.definition.name}`);
  }

  getTool(name: string): Tool | undefined {
    return this.tools.get(name);
  }

  getAllDefinitions(): ToolDefinition[] {
    return Array.from(this.tools.values()).map(t => t.definition);
  }

  async execute(name: string, args: any): Promise<any> {
    const tool = this.getTool(name);
    if (!tool) {
      throw new Error(`Tool not found: ${name}`);
    }
    logger.info(`Executing tool: ${name}`, { args });
    try {
      const result = await tool.execute(args);
      logger.info(`Tool ${name} executed successfully`);
      return result;
    } catch (error: any) {
      logger.error(`Error executing tool ${name}`, { error: error.message });
      throw error;
    }
  }
}

export const toolRegistry = new ToolRegistry();
