import { logger } from '../utils/logger';
import { getLLMService } from './llm.service';
import { getMCPService } from './mcp';
import { StreamProcessor } from './streamProcessor';
import { ToolExecutor } from './toolExecutor';
import { PromptBuilder } from './promptBuilder';

// Simple interface for internal use
interface ChatMessage {
    role: 'user' | 'assistant' | 'system' | 'tool';
    content: string;
    tool_calls?: any[];
    tool_call_id?: string;
}

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
        } = {}
    ): Promise<void> {
        try {
            const availableTools = this.mcpService.getAllTools();
            const maxIterations = options.maxIterations || 5;
    
            // Create system prompt with PromptBuilder
            const systemPrompt = PromptBuilder.createSystemPromptMessage();

            const conversationHistory = [systemPrompt, ...messages];

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
                
                // Process streaming response with StreamProcessor
                const streamProcessor = new StreamProcessor();
                const { accumulatedContent, completeToolCalls } = await streamProcessor.processStream(stream, onData);

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

                // Execute tool calls with ToolExecutor
                const toolExecutor = new ToolExecutor();
                await toolExecutor.executeToolCalls(completeToolCalls, availableTools, conversationHistory);

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
}
