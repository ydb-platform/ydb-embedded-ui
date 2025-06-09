import { logger } from '../utils/logger';
import { getMCPService } from './mcp';
import { MCPTool } from '../types/mcp';

export class ToolExecutor {
    private mcpService = getMCPService();

    /**
     * Execute all tool calls and add results to conversation history
     */
    async executeToolCalls(
        toolCalls: any[],
        availableTools: (MCPTool & { serverName: string })[],
        conversationHistory: any[]
    ): Promise<void> {
        for (const toolCall of toolCalls) {
            await this.executeToolCall(toolCall, availableTools, conversationHistory);
        }
    }

    /**
     * Execute single tool call
     */
    private async executeToolCall(
        toolCall: any,
        availableTools: (MCPTool & { serverName: string })[],
        conversationHistory: any[]
    ): Promise<void> {
        const toolWithServer = availableTools.find(
            (t: MCPTool & { serverName: string }) => t.name === toolCall.function.name
        );
        const serverName = toolWithServer?.serverName || 'ydb-mcp-server';

        try {
            const parsedArguments = this.parseToolArguments(toolCall.function.arguments);
            
            const result = await this.mcpService.callTool(
                serverName,
                toolCall.function.name,
                parsedArguments
            );

            const formattedResult = this.formatToolResult(result);
            
            conversationHistory.push({
                role: 'tool',
                content: formattedResult,
                tool_call_id: toolCall.id
            });

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            
            conversationHistory.push({
                role: 'tool',
                content: JSON.stringify({ error: errorMessage }),
                tool_call_id: toolCall.id
            });
        }
    }

    /**
     * Parse tool arguments from string
     */
    private parseToolArguments(argsString: string): any {
        if (!argsString || argsString.trim() === '' || argsString.trim() === '""') {
            return {};
        }

        try {
            return JSON.parse(argsString);
        } catch (parseError) {
            logger.warn('Failed to parse tool arguments', { 
                arguments: argsString,
                error: parseError 
            });
            return {};
        }
    }

    /**
     * Format tool result for better LLM understanding
     */
    private formatToolResult(result: any): string {
        try {
            if (result && typeof result === 'object') {
                if (result.content && Array.isArray(result.content) && result.content[0]?.text) {
                    // Extract the actual data from MCP response format
                    const actualData = JSON.parse(result.content[0].text);
                    return `Tool result: ${JSON.stringify(actualData, null, 2)}`;
                } else {
                    return `Tool result: ${JSON.stringify(result, null, 2)}`;
                }
            } else {
                return `Tool result: ${JSON.stringify(result)}`;
            }
        } catch (error) {
            return `Tool result: ${JSON.stringify(result)}`;
        }
    }
}
