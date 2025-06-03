import { EventEmitter } from 'events';
import { createComponentLogger, logChatInteraction } from '../utils/logger';
import { ValidationError, StreamingError } from '../utils/errors';
import { getLLMService } from './llm.service';
import { getMCPService } from './mcp.service';
import {
    ChatMessage,
    ChatSession,
    ChatCompletionRequest,
    ChatDelta
} from '../types/chat';
import { MCPTool } from '../types/mcp';

const logger = createComponentLogger('ChatService');

export class ChatService extends EventEmitter {
    private sessions: Map<string, ChatSession> = new Map();
    private llmService = getLLMService();
    private mcpService = getMCPService();

    constructor() {
        super();
        logger.info('Chat service initialized');
        
        // Listen to MCP events
        this.mcpService.on('serverConnected', (server) => {
            logger.info('MCP server connected', { serverName: server.name });
            this.emit('mcpServerConnected', server);
        });

        this.mcpService.on('serverDisconnected', (server) => {
            logger.info('MCP server disconnected', { serverName: server.name });
            this.emit('mcpServerDisconnected', server);
        });
    }

    /**
     * Create a new chat session
     */
    createSession(userId?: string): ChatSession {
        const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const session: ChatSession = {
            id: sessionId,
            userId,
            messages: [],
            createdAt: Date.now(),
            updatedAt: Date.now(),
            metadata: {},
        };

        this.sessions.set(sessionId, session);
        
        logger.info('Chat session created', { sessionId, userId });
        logChatInteraction('session_created', { sessionId, userId });
        
        this.emit('sessionCreated', session);
        return session;
    }

    /**
     * Get a chat session by ID
     */
    getSession(sessionId: string): ChatSession | undefined {
        return this.sessions.get(sessionId);
    }

    /**
     * Add a message to a chat session
     */
    addMessage(sessionId: string, messageData: Omit<ChatMessage, 'id' | 'timestamp'>): ChatMessage {
        const session = this.getSession(sessionId);
        if (!session) {
            throw new ValidationError('Session not found');
        }

        const message: ChatMessage = {
            id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: Date.now(),
            ...messageData,
        };

        session.messages.push(message);
        session.updatedAt = Date.now();

        logger.info('Message added to session', { 
            sessionId, 
            messageId: message.id, 
            role: message.role 
        });
        
        logChatInteraction('message_added', {
            sessionId,
            messageId: message.id,
            role: message.role,
            contentLength: message.content.length,
        });

        this.emit('messageAdded', { session, message });
        return message;
    }

    /**
     * Stream chat completion for a session
     */
    async* streamChatCompletion(sessionId: string, options: any = {}): AsyncGenerator<ChatDelta, void, unknown> {
        const session = this.getSession(sessionId);
        if (!session) {
            throw new ValidationError('Session not found');
        }

        try {
            // Get available tools
            const availableTools = this.getAvailableTools();

            // Prepare request for LLM
            const request: ChatCompletionRequest = {
                messages: session.messages,
                ...(options.model && { model: options.model }),
                ...(options.temperature !== undefined && { temperature: options.temperature }),
                ...(options.maxTokens !== undefined && { max_tokens: options.maxTokens }),
            };

            logChatInteraction('request', {
                sessionId,
                messageCount: session.messages.length,
                model: options.model,
                toolsAvailable: availableTools.length,
            });

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
                    yield {
                        type: 'content',
                        content: delta.content,
                    };
                }

                // Handle tool calls delta
                if (delta.tool_calls) {
                    for (const toolCall of delta.tool_calls) {
                        if (toolCall.function) {
                            // Find the server that provides this tool
                            const toolWithServer = availableTools.find(t => t.name === toolCall.function.name);
                            const serverName = toolWithServer?.serverName || 'ydb-mcp-server';

                            accumulatedToolCalls.push({
                                id: toolCall.id,
                                name: toolCall.function.name,
                                arguments: JSON.parse(toolCall.function.arguments || '{}'),
                                serverName,
                            });

                            yield {
                                type: 'tool_call',
                                tool_calls: [toolCall],
                            };
                        }
                    }
                }
            }

            // Add accumulated message to session
            if (accumulatedContent || accumulatedToolCalls.length > 0) {
                const messageData: any = {
                    role: 'assistant',
                    content: accumulatedContent,
                };
                if (accumulatedToolCalls.length > 0) {
                    messageData.toolCalls = accumulatedToolCalls.map(tc => ({
                        id: tc.id,
                        type: 'function' as const,
                        function: {
                            name: tc.name,
                            arguments: JSON.stringify(tc.arguments),
                        },
                    }));
                }
                this.addMessage(sessionId, messageData);
            }

            // Execute tool calls if any
            if (accumulatedToolCalls.length > 0) {
                for (const toolCall of accumulatedToolCalls) {
                    yield {
                        type: 'tool_executing',
                        tool_name: toolCall.name,
                        tool_id: toolCall.id,
                    };

                    try {
                        const result = await this.mcpService.callTool(
                            toolCall.serverName,
                            toolCall.name,
                            toolCall.arguments
                        );

                        // Add tool result message
                        this.addMessage(sessionId, {
                            role: 'tool',
                            content: JSON.stringify(result),
                            toolCallId: toolCall.id,
                        });

                        yield {
                            type: 'tool_result',
                            tool_id: toolCall.id,
                            result,
                        };
                    } catch (error) {
                        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                        
                        this.addMessage(sessionId, {
                            role: 'tool',
                            content: JSON.stringify({ error: errorMessage }),
                            toolCallId: toolCall.id,
                        });

                        yield {
                            type: 'tool_error',
                            tool_id: toolCall.id,
                            error: errorMessage,
                        };
                    }
                }
            }

            yield { type: 'done' };

        } catch (error) {
            logger.error('Error in streaming chat completion', { sessionId, error });
            yield {
                type: 'error',
                error: error instanceof Error ? error.message : 'Unknown error',
            };
            throw new StreamingError('Failed to stream chat completion');
        }
    }

    /**
     * Stream completion for a chat session (alias for compatibility)
     */
    async* streamCompletion(sessionId: string, options: any = {}): AsyncGenerator<ChatDelta, void, unknown> {
        yield* this.streamChatCompletion(sessionId, options);
    }

    /**
     * Stream chat completion directly with messages (no session required)
     */
    async* streamDirectChatCompletion(messages: ChatMessage[], options: any = {}): AsyncGenerator<ChatDelta, void, unknown> {
        try {
            logger.debug('Starting direct chat completion', {
                messageCount: messages.length,
                options
            });

            // Get available tools
            const availableTools = this.getAvailableTools();

            // Create completion request
            const request: ChatCompletionRequest = {
                messages,
                stream: true,
                ...options
            };

            // Stream the completion
            const stream = await this.llmService.createStreamingChatCompletion(request, availableTools);

            let accumulatedContent = '';
            let accumulatedToolCalls: any[] = [];

            for await (const response of stream) {
                // Convert StreamingChatResponse to ChatDelta
                if (response.choices && response.choices.length > 0) {
                    const choice = response.choices[0];
                    if (choice) {
                        const delta = choice.delta;
                        
                        if (delta.content) {
                            accumulatedContent += delta.content;
                            yield {
                                type: 'content',
                                content: delta.content
                            };
                        }
                        
                        if (delta.tool_calls) {
                            for (const toolCall of delta.tool_calls) {
                                if (toolCall.function) {
                                    // Find the server that provides this tool
                                    const toolWithServer = availableTools.find(t => t.name === toolCall.function.name);
                                    const serverName = toolWithServer?.serverName || 'ydb-mcp-server';

                                    accumulatedToolCalls.push({
                                        id: toolCall.id,
                                        name: toolCall.function.name,
                                        arguments: JSON.parse(toolCall.function.arguments || '{}'),
                                        serverName,
                                    });

                                    yield {
                                        type: 'tool_call',
                                        tool_calls: [toolCall]
                                    };
                                }
                            }
                        }
                        
                        if (choice.finish_reason) {
                            // Execute tool calls if any
                            if (accumulatedToolCalls.length > 0) {
                                for (const toolCall of accumulatedToolCalls) {
                                    yield {
                                        type: 'tool_executing',
                                        tool_name: toolCall.name,
                                        tool_id: toolCall.id,
                                    };

                                    try {
                                        const result = await this.mcpService.callTool(
                                            toolCall.serverName,
                                            toolCall.name,
                                            toolCall.arguments
                                        );

                                        yield {
                                            type: 'tool_result',
                                            tool_id: toolCall.id,
                                            result,
                                        };
                                    } catch (error) {
                                        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                                        
                                        yield {
                                            type: 'tool_error',
                                            tool_id: toolCall.id,
                                            error: errorMessage,
                                        };
                                    }
                                }
                            }

                            yield {
                                type: 'done'
                            };
                        }
                    }
                }
            }

            logger.debug('Direct chat completion finished');

        } catch (error) {
            logger.error('Direct chat completion failed', {
                error: error instanceof Error ? error.message : String(error),
                messageCount: messages.length
            });

            yield {
                type: 'error',
                error: error instanceof Error ? error.message : 'Unknown error',
            };
            throw new StreamingError('Failed to stream direct chat completion');
        }
    }

    /**
     * Get available tools from all connected MCP servers
     */
    getAvailableTools(): Array<MCPTool & { serverName: string }> {
        return this.mcpService.getAllTools();
    }

    /**
     * Get available resources from all connected MCP servers
     */
    getAvailableResources(): Array<{ uri: string; name: string; serverName: string }> {
        return this.mcpService.getAllResources();
    }

    /**
     * Delete a chat session
     */
    deleteSession(sessionId: string): boolean {
        const deleted = this.sessions.delete(sessionId);
        if (deleted) {
            logger.info('Chat session deleted', { sessionId });
            this.emit('sessionDeleted', sessionId);
        }
        return deleted;
    }

    /**
     * Clear old sessions
     */
    clearOldSessions(olderThanDays: number = 30): number {
        const cutoffTime = Date.now() - (olderThanDays * 24 * 60 * 60 * 1000);
        let deletedCount = 0;

        for (const [sessionId, session] of this.sessions) {
            if (session.updatedAt < cutoffTime) {
                this.sessions.delete(sessionId);
                deletedCount++;
            }
        }

        if (deletedCount > 0) {
            logger.info('Old sessions cleared', { deletedCount, olderThanDays });
        }

        return deletedCount;
    }

    /**
     * Get health status of the chat service
     */
    async getHealthStatus(): Promise<{
        chatService: { status: 'healthy' | 'degraded' | 'unhealthy'; sessionsCount: number };
        llmService: { available: boolean; model: string; error?: string };
        mcpService: { [serverName: string]: { status: string; lastHeartbeat: number | null } };
    }> {
        const llmHealth = await this.llmService.healthCheck();
        const mcpHealth = await this.mcpService.healthCheck();

        return {
            chatService: {
                status: 'healthy',
                sessionsCount: this.sessions.size,
            },
            llmService: llmHealth,
            mcpService: mcpHealth,
        };
    }

    /**
     * Get service statistics
     */
    getStatistics(): {
        totalSessions: number;
        activeSessions: number;
        totalMessages: number;
        averageMessagesPerSession: number;
    } {
        const totalSessions = this.sessions.size;
        const recentThreshold = Date.now() - (24 * 60 * 60 * 1000); // 24 hours
        let activeSessions = 0;
        let totalMessages = 0;

        for (const session of this.sessions.values()) {
            if (session.updatedAt > recentThreshold) {
                activeSessions++;
            }
            totalMessages += session.messages.length;
        }

        return {
            totalSessions,
            activeSessions,
            totalMessages,
            averageMessagesPerSession: totalSessions > 0 ? totalMessages / totalSessions : 0,
        };
    }
}