import OpenAI from 'openai';
import { getElizaConfig } from '../utils/config';
import { createComponentLogger } from '../utils/logger';
import { LLMServiceError } from '../utils/errors';
import { ChatMessage, ChatCompletionRequest, ChatCompletionResponse, StreamingChatResponse } from '../types/chat';
import { MCPTool } from '../types/mcp';

const logger = createComponentLogger('LLMService');

export class LLMService {
    private client: OpenAI;
    private config: ReturnType<typeof getElizaConfig>;

    constructor() {
        this.config = getElizaConfig();
        
        this.client = new OpenAI({
            apiKey: 'dummy-key', // We'll override the auth header
            baseURL: this.config.baseURL,
            defaultHeaders: {
                'Authorization': `OAuth ${this.config.apiKey}`
            },
            fetch: async (url: string | URL | Request, init?: RequestInit) => {
                // Override the authorization header for each request
                const headers = new Headers(init?.headers);
                headers.set('Authorization', `OAuth ${this.config.apiKey}`);
                headers.set('Ya-Pool', 'gravity-ai')
                
                return fetch(url, {
                    ...init,
                    headers,
                });
            }
        });
        
        logger.info('LLM service initialized', {
            baseURL: this.config.baseURL,
            model: this.config.model,
            sslValidation: process.env['NODE_TLS_REJECT_UNAUTHORIZED'] !== '0'
        });
    }

    /**
     * Convert MCP tools to OpenAI function format
     */
    private convertMCPToolsToFunctions(tools: MCPTool[]): OpenAI.Chat.ChatCompletionTool[] {
        const convertedTools = tools.map(tool => {
            // Clean up the input schema - remove MCP-specific fields
            const cleanSchema = {
                type: tool.inputSchema?.type || 'object',
                properties: tool.inputSchema?.properties || {},
                required: tool.inputSchema?.required || []
            };

            const converted = {
                type: 'function' as const,
                function: {
                    name: tool.name,
                    description: tool.description,
                    parameters: cleanSchema,
                },
            };

            logger.debug('Converted MCP tool to OpenAI format', {
                originalTool: {
                    name: tool.name,
                    description: tool.description,
                    inputSchema: tool.inputSchema
                },
                convertedTool: converted
            });

            return converted;
        });

        logger.info('Converted all MCP tools to OpenAI format', {
            toolCount: convertedTools.length,
            toolNames: convertedTools.map(t => t.function.name)
        });

        return convertedTools;
    }

    /**
     * Create chat completion (non-streaming)
     */
    async createChatCompletion(
        request: ChatCompletionRequest,
        availableTools: MCPTool[] = []
    ): Promise<ChatCompletionResponse> {
        try {
            logger.debug('Creating chat completion', {
                messageCount: request.messages.length,
                model: request.model || this.config.model,
                toolsCount: availableTools.length,
            });

            const tools = availableTools.length > 0 
                ? this.convertMCPToolsToFunctions(availableTools)
                : undefined;

            const params: any = {
                model: request.model || this.config.model,
                messages: request.messages as OpenAI.Chat.ChatCompletionMessageParam[],
            };

            if (request.temperature !== undefined) params.temperature = request.temperature;
            if (request.max_tokens !== undefined) params.max_tokens = request.max_tokens;
            if (tools) {
                params.tools = tools;
                params.tool_choice = 'auto';
            }

            const response = await this.client.chat.completions.create(params);

            logger.info('Chat completion created', {
                id: response.id,
                model: response.model,
                usage: response.usage,
                finishReason: response.choices[0]?.finish_reason,
            });

            return response as unknown as ChatCompletionResponse;
        } catch (error) {
            logger.error('Failed to create chat completion', { error });
            throw new LLMServiceError(`Chat completion failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Create streaming chat completion
     */
    async createStreamingChatCompletion(
        request: ChatCompletionRequest,
        availableTools: MCPTool[] = []
    ): Promise<AsyncIterable<StreamingChatResponse>> {
        try {

            const tools = availableTools.length > 0 
                ? this.convertMCPToolsToFunctions(availableTools)
                : undefined;

            const streamParams: any = {
                model: request.model || this.config.model,
                messages: request.messages as OpenAI.Chat.ChatCompletionMessageParam[],
                stream: true,
            };

            if (request.temperature !== undefined) streamParams.temperature = request.temperature;
            if (request.max_tokens !== undefined) streamParams.max_tokens = request.max_tokens;
            if (tools) {
                streamParams.tools = tools;
                streamParams.tool_choice = 'auto';
            }

            console.log('-------'.repeat(10));
            console.log(JSON.stringify(streamParams));

            const stream = await this.client.chat.completions.create(streamParams);

            logger.info('Streaming chat completion started');

            return stream as unknown as AsyncIterable<StreamingChatResponse>;
        } catch (error) {
            logger.error('Failed to create streaming chat completion', { error });
            throw new LLMServiceError(`Streaming chat completion failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Check if the LLM service is available
     */
    async healthCheck(): Promise<{ available: boolean; model: string; error?: string }> {
        try {
            // Simple test request to check if the service is available
            const response = await this.client.chat.completions.create({
                model: this.config.model,
                messages: [{ role: 'user', content: 'ping' }],
                max_tokens: 1,
            });

            return {
                available: true,
                model: response.model,
            };
        } catch (error) {
            logger.warn('LLM health check failed', { error });
            return {
                available: false,
                model: this.config.model,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }

    /**
     * Get model information
     */
    getModelInfo(): { name: string; baseURL: string } {
        return {
            name: this.config.model,
            baseURL: this.config.baseURL,
        };
    }

    /**
     * Validate chat messages format
     */
    validateMessages(messages: any[]): ChatMessage[] {
        if (!Array.isArray(messages)) {
            throw new LLMServiceError('Messages must be an array');
        }

        return messages.map((msg, index) => {
            if (!msg.role || !msg.content) {
                throw new LLMServiceError(`Invalid message at index ${index}: role and content are required`);
            }

            if (!['user', 'assistant', 'system', 'tool'].includes(msg.role)) {
                throw new LLMServiceError(`Invalid role at index ${index}: ${msg.role}`);
            }

            return {
                id: msg.id || `msg_${Date.now()}_${index}`,
                role: msg.role,
                content: msg.content,
                timestamp: msg.timestamp || Date.now(),
                toolCalls: msg.tool_calls,
                toolCallId: msg.tool_call_id,
            };
        });
    }

    /**
     * Extract tool calls from LLM response
     */
    extractToolCalls(response: ChatCompletionResponse): Array<{ id: string; name: string; arguments: any }> {
        const message = response.choices[0]?.message;
        if (!message?.toolCalls) {
            return [];
        }

        return message.toolCalls.map((toolCall: any) => ({
            id: toolCall.id,
            name: toolCall.function.name,
            arguments: JSON.parse(toolCall.function.arguments),
        }));
    }
}

// Singleton instance
let llmServiceInstance: LLMService | null = null;

export function getLLMService(): LLMService {
    if (!llmServiceInstance) {
        llmServiceInstance = new LLMService();
    }
    return llmServiceInstance;
}
