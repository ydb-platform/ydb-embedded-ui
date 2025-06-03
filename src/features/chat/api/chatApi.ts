import { ChatMessage, ChatDelta, MCPTool, ChatRequest } from '../types/chat';

export class ChatAPI {
    private static baseUrl = '/api/chat';

    static async sendMessage(
        messages: ChatMessage[],
        onDelta: (delta: ChatDelta) => void,
        onError: (error: Error) => void,
        signal?: AbortSignal
    ): Promise<void> {
        try {
            const requestBody: ChatRequest = {
                messages: messages.map(msg => ({
                    role: msg.role,
                    content: msg.content,
                    tool_calls: msg.toolCalls,
                    tool_call_id: msg.toolCallId,
                })),
                stream: true,
                model: 'gpt-4o-mini',
            };

            const response = await fetch(this.baseUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'text/event-stream',
                },
                body: JSON.stringify(requestBody),
                signal,
            });

            if (!response.ok) {
                throw new Error(`Chat API error: ${response.statusText}`);
            }

            const reader = response.body?.getReader();
            if (!reader) {
                throw new Error('No response body reader available');
            }

            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6);
                        if (data === '[DONE]') {
                            return;
                        }
                        try {
                            const delta = JSON.parse(data) as ChatDelta;
                            onDelta(delta);
                        } catch (error) {
                            console.warn('Failed to parse SSE data:', error);
                        }
                    }
                }
            }
        } catch (error) {
            if (error instanceof Error) {
                onError(error);
            } else {
                onError(new Error('Unknown error occurred'));
            }
        }
    }

    static async getAvailableTools(): Promise<MCPTool[]> {
        try {
            const response = await fetch(`${this.baseUrl}/tools`);
            if (!response.ok) {
                throw new Error(`Failed to fetch tools: ${response.statusText}`);
            }
            return response.json();
        } catch (error) {
            console.error('Failed to fetch available tools:', error);
            return [];
        }
    }

    static async getHealth(): Promise<{status: string; mcpConnected: boolean; toolsAvailable: number}> {
        try {
            const response = await fetch(`${this.baseUrl}/health`);
            if (!response.ok) {
                throw new Error(`Health check failed: ${response.statusText}`);
            }
            return response.json();
        } catch (error) {
            console.error('Health check failed:', error);
            return { status: 'error', mcpConnected: false, toolsAvailable: 0 };
        }
    }
}