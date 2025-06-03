import { createComponentLogger } from '../utils/logger';
import { ValidationError } from '../utils/errors';
import { getLLMService } from './llm.service';
import { getMCPService } from './mcp';
import { ChatMessage } from '../types/chat';
import { MCPTool } from '../types/mcp';

const logger = createComponentLogger('ChatService');

export class ChatService {
    private llmService = getLLMService();
    private mcpService = getMCPService();

    constructor() {
        logger.info('Simple stateless chat service initialized');
    }

    /**
     * Process chat messages and stream response (stateless)
     */
    async processChat(
        messages: ChatMessage[],
        onData: (data: string) => void,
        options: { model?: string; temperature?: number; maxTokens?: number } = {}
    ): Promise<void> {
        try {
            // Validate messages
            this.validateMessages(messages);

            const availableTools = this.getAvailableTools();
            
            logger.info('Processing chat request', {
                messageCount: messages.length,
                toolCount: availableTools.length,
            });

            // Format messages for LLM
            const formattedMessages = this.formatMessagesForLLM(messages);

            // Create completion request
            const request = {
                messages: formattedMessages,
                stream: true,
                ...(options.model && { model: options.model }),
                ...(options.temperature !== undefined && { temperature: options.temperature }),
                ...(options.maxTokens !== undefined && { max_tokens: options.maxTokens }),
            };

            // Stream response from LLM
            const stream = await this.llmService.createStreamingChatCompletion(request, availableTools);
            
            let accumulatedContent = '';
            let accumulatedToolCalls: any[] = [];

            for await (const chunk of stream) {
                const delta = chunk.choices[0]?.delta;
                if (!delta) continue;

                // Handle content delta
                if (delta.content) {
                    accumulatedContent += delta.content;
                    onData(`data: ${JSON.stringify({
                        type: 'content',
                        content: delta.content,
                    })}\n\n`);
                }

                // Handle tool calls delta
                if (delta.tool_calls) {
                    for (const toolCall of delta.tool_calls) {
                        if (toolCall.function) {
                            accumulatedToolCalls.push(toolCall);

                            onData(`data: ${JSON.stringify({
                                type: 'tool_call',
                                tool_calls: [toolCall],
                            })}\n\n`);
                        }
                    }
                }
            }

            // Execute tool calls if any
            if (accumulatedToolCalls.length > 0) {
                for (const toolCall of accumulatedToolCalls) {
                    // Find the server that provides this tool
                    const toolWithServer = availableTools.find(t => t.name === toolCall.function.name);
                    const serverName = toolWithServer?.serverName || 'ydb-mcp-server';

                    onData(`data: ${JSON.stringify({
                        type: 'tool_executing',
                        tool_name: toolCall.function.name,
                        tool_id: toolCall.id,
                    })}\n\n`);

                    try {
                        const result = await this.mcpService.callTool(
                            serverName,
                            toolCall.function.name,
                            JSON.parse(toolCall.function.arguments || '{}')
                        );

                        onData(`data: ${JSON.stringify({
                            type: 'tool_result',
                            tool_id: toolCall.id,
                            result,
                        })}\n\n`);
                    } catch (error) {
                        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                        
                        onData(`data: ${JSON.stringify({
                            type: 'tool_error',
                            tool_id: toolCall.id,
                            error: errorMessage,
                        })}\n\n`);
                    }
                }
            }

            // Send completion
            onData(`data: ${JSON.stringify({ type: 'done' })}\n\n`);

        } catch (error) {
            logger.error('Error processing chat', { error });
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            onData(`data: ${JSON.stringify({
                type: 'error',
                error: errorMessage,
            })}\n\n`);
            throw error;
        }
    }

    /**
     * Get available tools from all connected MCP servers
     */
    getAvailableTools(): Array<MCPTool & { serverName: string }> {
        return this.mcpService.getAllTools();
    }

    /**
     * Get health status
     */
    async getHealthStatus(): Promise<{
        chatService: { status: 'healthy' | 'degraded' | 'unhealthy' };
        llmService: { available: boolean; model: string; error?: string };
        mcpService: { [serverName: string]: { status: string; toolCount: number; resourceCount: number } };
    }> {
        const llmHealth = await this.llmService.healthCheck();
        const mcpServers = this.mcpService.getServers();
        const mcpHealth: { [serverName: string]: { status: string; toolCount: number; resourceCount: number } } = {};
        
        mcpServers.forEach(server => {
            mcpHealth[server.name] = {
                status: server.status,
                toolCount: server.toolCount,
                resourceCount: server.resourceCount,
            };
        });

        return {
            chatService: { status: 'healthy' },
            llmService: llmHealth,
            mcpService: mcpHealth,
        };
    }

    /**
     * Validate message data
     */
    private validateMessages(messages: ChatMessage[]): void {
        if (!Array.isArray(messages)) {
            throw new ValidationError('Messages must be an array');
        }

        if (messages.length === 0) {
            throw new ValidationError('Messages array cannot be empty');
        }

        for (const [index, message] of messages.entries()) {
            if (!message.role || !message.content) {
                throw new ValidationError(`Invalid message at index ${index}: role and content are required`);
            }

            if (!['user', 'assistant', 'system', 'tool'].includes(message.role)) {
                throw new ValidationError(`Invalid role at index ${index}: ${message.role}`);
            }

            if (typeof message.content !== 'string') {
                throw new ValidationError(`Message content at index ${index} must be a string`);
            }
        }
    }

    /**
     * Format messages for LLM API
     */
    private formatMessagesForLLM(messages: ChatMessage[]): Array<{
        role: string;
        content: string;
        tool_calls?: any[];
        tool_call_id?: string;
    }> {
        return messages.map(msg => {
            const formatted: any = {
                role: msg.role,
                content: msg.content,
            };

            if (msg.toolCalls) {
                formatted.tool_calls = msg.toolCalls;
            }

            if (msg.toolCallId) {
                formatted.tool_call_id = msg.toolCallId;
            }

            return formatted;
        });
    }
}
