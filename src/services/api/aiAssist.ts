import type {ChatDelta, ChatMessage, QuotaInfo} from '../../features/chat/types/chat';

import {BaseYdbAPI} from './base';

export class AIAssistAPI extends BaseYdbAPI {
    async sendMessage(
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
                ...(context && {context}),
            };

            const response = await fetch(this.getPath('/api/chat'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'text/event-stream',
                },
                body: JSON.stringify(requestBody),
                signal,
                credentials: this._axios.defaults.withCredentials ? 'include' : 'same-origin',
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

    async getQuota(): Promise<QuotaInfo> {
        return this.get<QuotaInfo>(this.getPath('/api/quota'), {}, {});
    }
}
