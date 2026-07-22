export interface ToolParameter {
  type: string;
  description: string;
  enum?: string[];
  items?: ToolParameter; // For arrays
  properties?: Record<string, ToolParameter>; // For objects
  required?: string[];
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, ToolParameter>;
    required?: string[];
  };
}

export interface Tool<TArgs = any, TResult = any> {
  definition: ToolDefinition;
  execute: (args: TArgs) => Promise<TResult>;
}
