import type {MCPTool} from '../types/mcp';
import {executeWithConcurrency} from '../utils/concurrency';
import {getMCPConfig} from '../utils/config';
import {logger} from '../utils/logger';

import {getMCPService} from './mcp';

export class ToolExecutor {
    private mcpService = getMCPService();

    /**
     * Execute all tool calls in parallel with controlled concurrency
     */
    async executeToolCalls(
        toolCalls: any[],
        availableTools: (MCPTool & {serverName: string})[],
        conversationHistory: any[],
        onData?: (data: string) => void,
    ): Promise<void> {
        if (toolCalls.length === 0) {
            return;
        }

        const config = getMCPConfig();
        const concurrency = config.toolCallConcurrency;

        logger.info('Executing tool calls', {
            totalCalls: toolCalls.length,
            concurrency,
            tools: toolCalls.map((tc) => tc.function.name),
        });

        // Execute tool calls with controlled concurrency
        const results = await executeWithConcurrency(
            toolCalls,
            async (toolCall) => {
                return await this.executeToolCallInternal(toolCall, availableTools, onData);
            },
            concurrency,
        );

        // Add all results to conversation history in original order
        for (let i = 0; i < results.length; i++) {
            const result = results[i];
            const toolCall = toolCalls[i];

            if (result instanceof Error) {
                // Handle error result
                const toolMessage = {
                    role: 'tool',
                    content: JSON.stringify({error: result.message}),
                    tool_call_id: toolCall.id,
                };
                conversationHistory.push(toolMessage);
            } else {
                // Handle successful result
                conversationHistory.push(result);
            }
        }

        logger.info('All tool calls completed', {
            totalCalls: toolCalls.length,
            successCount: results.filter((r) => !(r instanceof Error)).length,
            errorCount: results.filter((r) => r instanceof Error).length,
        });
    }

    /**
     * Execute single tool call for parallel execution (returns tool message)
     */
    private async executeToolCallInternal(
        toolCall: any,
        availableTools: (MCPTool & {serverName: string})[],
        onData?: (data: string) => void,
    ): Promise<any> {
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

            return toolMessage;
        } catch (toolError) {
            const errorMessage = toolError instanceof Error ? toolError.message : 'Unknown error';

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

            // Return error instead of throwing to be handled by concurrency control
            return new Error(errorMessage);
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
