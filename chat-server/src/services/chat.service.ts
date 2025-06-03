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
     * Process chat messages with Agent Loop (stateless)
     */
    async processChat(
        messages: ChatMessage[],
        onData: (data: string) => void,
        options: { 
            model?: string; 
            temperature?: number; 
            maxTokens?: number; 
            maxIterations?: number;
            context?: {
                url?: string;
                pathname?: string;
                search?: string;
                hash?: string;
                params?: Record<string, string>;
                description?: string;
            };
        } = {}
    ): Promise<void> {
        try {
            // Validate messages
            this.validateMessages(messages);

            const availableTools = this.getAvailableTools();
            const maxIterations = options.maxIterations || 5;
            
            logger.info('Starting agent loop', {
                messageCount: messages.length,
                toolCount: availableTools.length,
                maxIterations,
            });

            // Log available tools for debugging
            logger.info('Available tools for LLM', {
                tools: availableTools.map(tool => ({
                    name: tool.name,
                    description: tool.description,
                    inputSchema: tool.inputSchema,
                    required: tool.inputSchema?.required
                }))
            });

            // Format and clean messages for LLM
            const formattedMessages = this.formatMessagesForLLM(messages);
            const cleanedMessages = this.cleanMessagesForLLM(formattedMessages);

            // Build context information
            let contextInfo = '';
            if (options.context) {
                const { description, params } = options.context;
                
                if (description) {
                    contextInfo = `\n\nКОНТЕКСТ ТЕКУЩЕЙ СТРАНИЦЫ:\n${description}`;
                } else {
                    // Fallback to old logic if description is not available
                    const { url, pathname, search, hash } = options.context;
                    contextInfo = `\n\nКОНТЕКСТ ТЕКУЩЕЙ СТРАНИЦЫ:
- URL: ${url || 'неизвестен'}
- Путь: ${pathname || 'неизвестен'}
- Параметры запроса: ${search || 'отсутствуют'}
- Хеш: ${hash || 'отсутствует'}`;

                    if (params && Object.keys(params).length > 0) {
                        contextInfo += `\n- Параметры: ${Object.entries(params).map(([key, value]) => `${key}=${value}`).join(', ')}`;
                    }
                }
            }

            // Add system prompt for agent behavior
            const systemPrompt = {
                role: 'system',
                content: `Ты - помощник для работы с YDB (базой данных).

КРИТИЧЕСКИ ВАЖНО: У тебя есть доступ к инструментам для работы с YDB. Ты ДОЛЖЕН использовать эти инструменты для получения актуальной информации. НЕ придумывай данные - всегда используй доступные инструменты!

ВАЖНЫЕ ПРАВИЛА:
1. ВСЕГДА используй инструменты для получения реальных данных
2. НЕ придумывай информацию - только то что получаешь от инструментов
3. ВНИМАТЕЛЬНО читай схемы инструментов и передавай ВСЕ обязательные параметры из поля "required"
4. ИСПОЛЬЗУЙ результаты предыдущих вызовов для заполнения параметров следующих вызовов
5. НИКОГДА не вызывай инструменты с пустыми аргументами {} если в схеме есть required поля
6. Анализируй результаты инструментов и решай нужны ли дополнительные вызовы
7. В КОНЦЕ дай краткое резюме: какая была задача и что удалось выяснить
8. Используй дружелюбный тон и объясняй техническую информацию простым языком
9. УЧИТЫВАЙ контекст текущей страницы - если пользователь смотрит на конкретный кластер/базу/ноду, фокусируйся на этом объекте

ОБЯЗАТЕЛЬНЫЙ ФОРМАТ ВЫЗОВА ИНСТРУМЕНТОВ:
Когда ты вызываешь инструмент, ВСЕГДА пиши в тексте точное название метода и параметры:
- "🔧 Вызываю ydb-get-clusters"
- "🔧 Вызываю ydb-get-databases с параметрами: cluster_name='ydb_vla_dev02'"
- "🔧 Вызываю ydb-get-nodes с параметрами: cluster_name='prod', type='dynamic'"

ПРОЦЕСС РАБОТЫ:
1. Объясни что ты собираешься сделать
2. Напиши "🔧 Вызываю [название-метода] с параметрами: [параметры]"
3. ИСПОЛЬЗУЙ соответствующий инструмент
4. Дождись результата инструмента
5. Объясни полученные данные пользователю

СТИЛЬ ОБЩЕНИЯ:
- Говори "Сейчас проверю..." и РЕАЛЬНО проверяй через инструменты
- ВСЕГДА показывай какой метод вызываешь и с какими параметрами
- Объясняй результаты на основе РЕАЛЬНЫХ данных от инструментов
- Делай выводы: "Все базы данных работают нормально"
- Если пользователь смотрит на конкретный объект, предлагай действия связанные с ним

У тебя есть доступ к инструментам для работы с YDB - используй их по необходимости.
Отвечай на русском языке.${contextInfo}`
            };

            const conversationHistory = [systemPrompt, ...cleanedMessages];

            // Agent Loop
            for (let iteration = 0; iteration < maxIterations; iteration++) {
                logger.info(`Agent iteration ${iteration + 1}/${maxIterations}`);

                const request = {
                    messages: conversationHistory,
                    stream: true,
                    ...(options.model && { model: options.model }),
                    ...(options.temperature !== undefined && { temperature: options.temperature }),
                    ...(options.maxTokens !== undefined && { max_tokens: options.maxTokens }),
                };



                // Stream response from LLM
                const stream = await this.llmService.createStreamingChatCompletion(request, availableTools);
                
                let accumulatedContent = '';
                const toolCallsMap = new Map<string, any>();

                // Process streaming response
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
                        console.log('🔧 TOOL CALL DELTA:', JSON.stringify(delta.tool_calls, null, 2));
                        
                        for (const toolCall of delta.tool_calls) {
                            // Use index as the key for grouping, fallback to id if no index
                            const toolCallAny = toolCall as any;
                            const key = toolCallAny.index !== undefined ? `index_${toolCallAny.index}` : toolCall.id;
                            
                            if (key && toolCall.function) {
                                // Accumulate tool call data by index/ID
                                const existing = toolCallsMap.get(key) || { 
                                    id: toolCall.id || `generated_${toolCallAny.index}`,
                                    index: toolCallAny.index 
                                };
                                
                                console.log('🔧 EXISTING:', JSON.stringify(existing, null, 2));
                                console.log('🔧 NEW CHUNK:', JSON.stringify(toolCall, null, 2));
                                
                                // Update ID if provided
                                if (toolCall.id) {
                                    existing.id = toolCall.id;
                                }
                                
                                if (toolCall.function.name) {
                                    existing.function = existing.function || {};
                                    existing.function.name = toolCall.function.name;
                                }
                                
                                if (toolCall.function.arguments !== undefined) {
                                    existing.function = existing.function || {};
                                    const oldArgs = existing.function.arguments || '';
                                    existing.function.arguments = oldArgs + toolCall.function.arguments;
                                    
                                    console.log('🔧 ARGS UPDATE:', {
                                        key,
                                        oldArgs,
                                        newChunk: toolCall.function.arguments,
                                        combined: existing.function.arguments
                                    });
                                }
                                
                                toolCallsMap.set(key, existing);
                                
                                console.log('🔧 UPDATED EXISTING:', JSON.stringify(existing, null, 2));

                                // Don't send tool_call events - LLM will explain in text
                            }
                        }
                    }
                }

                // Get complete tool calls
                const completeToolCalls = Array.from(toolCallsMap.values()).filter(
                    toolCall => toolCall.function?.name
                );

                console.log('🎯 FINAL TOOL CALLS:', JSON.stringify(completeToolCalls, null, 2));

                // Add assistant message to conversation history
                conversationHistory.push({
                    role: 'assistant',
                    content: accumulatedContent,
                    ...(completeToolCalls.length > 0 && {
                        tool_calls: completeToolCalls.map(tc => ({
                            id: tc.id,
                            type: 'function',
                            function: {
                                name: tc.function.name,
                                arguments: tc.function.arguments || '{}'
                            }
                        }))
                    })
                });

                // If no tool calls, LLM gave final answer - stop the loop
                if (completeToolCalls.length === 0) {
                    logger.info('Agent loop completed - no more tool calls');
                    break;
                }

                // Execute tool calls
                for (const toolCall of completeToolCalls) {
                    const toolWithServer = availableTools.find(t => t.name === toolCall.function.name);
                    const serverName = toolWithServer?.serverName || 'ydb-mcp-server';

                    // Don't send tool_executing events - LLM will explain in text

                    try {
                        // Parse arguments
                        let parsedArguments = {};
                        const argsString = toolCall.function.arguments || '{}';
                        
                        if (argsString.trim() === '' || argsString.trim() === '""') {
                            parsedArguments = {};
                        } else {
                            try {
                                parsedArguments = JSON.parse(argsString);
                            } catch (parseError) {
                                logger.warn('Failed to parse tool arguments', { 
                                    toolName: toolCall.function.name,
                                    arguments: argsString,
                                    error: parseError 
                                });
                                parsedArguments = {};
                            }
                        }

                        // Execute tool
                        const result = await this.mcpService.callTool(
                            serverName,
                            toolCall.function.name,
                            parsedArguments
                        );

                        // Don't send tool_result events - LLM will explain in text

                        // Add tool result to conversation history - format for better LLM understanding
                        let formattedResult;
                        try {
                            // Try to format the result in a more readable way
                            if (result && typeof result === 'object') {
                                if (result.content && Array.isArray(result.content) && result.content[0]?.text) {
                                    // Extract the actual data from MCP response format
                                    const actualData = JSON.parse(result.content[0].text);
                                    formattedResult = `Tool result: ${JSON.stringify(actualData, null, 2)}`;
                                } else {
                                    formattedResult = `Tool result: ${JSON.stringify(result, null, 2)}`;
                                }
                            } else {
                                formattedResult = `Tool result: ${JSON.stringify(result)}`;
                            }
                        } catch (error) {
                            formattedResult = `Tool result: ${JSON.stringify(result)}`;
                        }

                        conversationHistory.push({
                            role: 'tool',
                            content: formattedResult,
                            tool_call_id: toolCall.id
                        } as any);

                    } catch (error) {
                        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                        
                        // Don't send tool_error events - LLM will explain in text

                        // Add error to conversation history
                        conversationHistory.push({
                            role: 'tool',
                            content: JSON.stringify({ error: errorMessage }),
                            tool_call_id: toolCall.id
                        } as any);
                    }
                }

                // Continue to next iteration - LLM will decide if more tools are needed
            }

            // Send completion
            onData(`data: ${JSON.stringify({ type: 'done' })}\n\n`);

        } catch (error) {
            logger.error('Error in agent loop', { error });
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

    /**
     * Clean messages to ensure proper tool call/tool message pairing for LLM API
     */
    private cleanMessagesForLLM(messages: Array<{
        role: string;
        content: string;
        tool_calls?: any[];
        tool_call_id?: string;
    }>): Array<{
        role: string;
        content: string;
        tool_calls?: any[];
        tool_call_id?: string;
    }> {
        const cleanedMessages: Array<{
            role: string;
            content: string;
            tool_calls?: any[];
            tool_call_id?: string;
        }> = [];

        console.log(messages);

        for (let i = 0; i < messages.length; i++) {
            const message = messages[i];
            if (!message) continue;

            // If this is a tool message, check if it follows an assistant message with tool_calls
            if (message.role === 'tool') {
                // Look for the preceding assistant message with tool_calls
                let hasValidPrecedingToolCall = false;
                for (let j = i - 1; j >= 0; j--) {
                    const prevMessage = messages[j];
                    if (!prevMessage) continue;
                    
                    if (prevMessage.role === 'assistant' && prevMessage.tool_calls) {
                        // Check if this tool message corresponds to one of the tool calls
                        const matchingToolCall = prevMessage.tool_calls.find(
                            tc => tc.id === message.tool_call_id
                        );
                        if (matchingToolCall) {
                            hasValidPrecedingToolCall = true;
                            break;
                        }
                    } else if (prevMessage.role === 'assistant' || prevMessage.role === 'user') {
                        // Stop looking if we hit another assistant or user message without tool_calls
                        break;
                    }
                }

                // Only include tool message if it has a valid preceding tool call
                if (hasValidPrecedingToolCall) {
                    cleanedMessages.push(message);
                } else {
                    logger.warn('Skipping orphaned tool message', {
                        toolCallId: message.tool_call_id,
                        messageIndex: i
                    });
                }
            } else {
                // Include all non-tool messages
                cleanedMessages.push(message);
            }
        }

        logger.info('Cleaned messages for LLM', {
            originalCount: messages.length,
            cleanedCount: cleanedMessages.length,
            removedCount: messages.length - cleanedMessages.length
        });

        return cleanedMessages;
    }
}
