import type {MCPTool} from '../types/mcp';
import {logger} from '../utils/logger';

import {getMCPService} from './mcp';

export class ToolExecutor {
    private mcpService = getMCPService();

    /**
     * Execute all tool calls and add results to conversation history
     */
    async executeToolCalls(
        toolCalls: any[],
        availableTools: (MCPTool & {serverName: string})[],
        conversationHistory: any[],
        onData?: (data: string) => void,
    ): Promise<void> {
        for (const toolCall of toolCalls) {
            await this.executeToolCall(toolCall, availableTools, conversationHistory, onData);
        }
    }

    /**
     * Execute single tool call
     */
    private async executeToolCall(
        toolCall: any,
        availableTools: (MCPTool & {serverName: string})[],
        conversationHistory: any[],
        onData?: (data: string) => void,
    ): Promise<void> {
        const toolWithServer = availableTools.find(
            (t: MCPTool & {serverName: string}) => t.name === toolCall.function.name,
        );
        const serverName = toolWithServer?.serverName || 'ydb-mcp-server';

        try {
            const parsedArguments = this.parseToolArguments(toolCall.function.arguments);

            const result = await this.mcpService.callTool(
                serverName,
                toolCall.function.name,
                parsedArguments,
            );

            const formattedResult = this.formatToolResult(result);

            const toolMessage = {
                role: 'tool',
                content: formattedResult,
                tool_call_id: toolCall.id,
            };

            logger.info('Adding tool result to history', {
                toolCallId: toolCall.id,
                toolName: toolCall.function.name,
                toolMessage: JSON.stringify(toolMessage, null, 2),
            });

            conversationHistory.push(toolMessage);

            // Send tool result to client if onData callback is provided
            if (onData) {
                const toolResultMessage = {
                    id: `tool-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    role: 'tool',
                    content: formattedResult,
                    timestamp: Date.now(),
                    toolCallId: toolCall.id,
                };

                onData(
                    `data: ${JSON.stringify({
                        type: 'tool_result',
                        content: JSON.stringify(toolResultMessage),
                    })}\n\n`,
                );
            }
        } catch (toolError) {
            const errorMessage = toolError instanceof Error ? toolError.message : 'Unknown error';

            const toolMessage = {
                role: 'tool',
                content: JSON.stringify({error: errorMessage}),
                tool_call_id: toolCall.id,
            };

            conversationHistory.push(toolMessage);

            // Send tool error to client if onData callback is provided
            if (onData) {
                const toolResultMessage = {
                    id: `tool-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    role: 'tool',
                    content: JSON.stringify({error: errorMessage}),
                    timestamp: Date.now(),
                    toolCallId: toolCall.id,
                };

                onData(
                    `data: ${JSON.stringify({
                        type: 'tool_result',
                        content: JSON.stringify(toolResultMessage),
                    })}\n\n`,
                );
            }
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
                error: parseError,
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
        } catch {
            return `Tool result: ${JSON.stringify(result)}`;
        }
    }
}
