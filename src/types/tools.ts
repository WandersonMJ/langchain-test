/**
 * Tipos compartilhados para as tools
 */

export interface ToolDefinition {
  name: string;
  description: string;
  schema: any;
  func: (input: any) => Promise<string>;
}
