import type {ChatDelta, ChatMessage} from '../types/chat';

export class ChatAPI {
    private static baseUrl = '/api/chat';

    static async sendMessage(
        messages: ChatMessage[],
        onDelta: (delta: ChatDelta) => void,
        onError: (error: Error) => void,
        signal?: AbortSignal,
        context?: string,
    ): Promise<void> {
        try {
            const requestBody = {
                messages: messages.map((msg) => ({
                    role: msg.role,
                    content: msg.content,
                    ...(msg.toolCalls && {tool_calls: msg.toolCalls}),
                    ...(msg.toolCallId && {tool_call_id: msg.toolCallId}),
                })),
                model: 'gpt-4.1',
                ...(context && {context}),
            };

            const response = await fetch(this.baseUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'text/event-stream',
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

            // eslint-disable-next-line no-constant-condition
            while (true) {
                const {done, value} = await reader.read();
                if (done) {
                    break;
                }

                buffer += decoder.decode(value, {stream: true});
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
}
