import OpenAI from 'openai';
import { getElizaConfig } from '../utils/config';
import { logger } from '../utils/logger';
import { ChatCompletionRequest, StreamingChatResponse } from '../types/chat';
import { MCPTool } from '../types/mcp';

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

            const stream = await this.client.chat.completions.create(streamParams);

            logger.info('Streaming chat completion started');

            return stream as unknown as AsyncIterable<StreamingChatResponse>;
        } catch (error) {
            logger.error('Failed to create streaming chat completion', { error });
            throw new Error(`Streaming chat completion failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
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
