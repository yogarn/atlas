import { Tool, ToolDefinition } from './types.js';
export declare class ToolRegistry {
    private tools;
    register(tool: Tool): void;
    getTool(name: string): Tool | undefined;
    getAllDefinitions(): ToolDefinition[];
    execute(name: string, args: any): Promise<any>;
}
export declare const toolRegistry: ToolRegistry;
