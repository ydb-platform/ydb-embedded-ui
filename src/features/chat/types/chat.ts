export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant' | 'system' | 'tool';
    content: string;
    timestamp: number;
    toolCalls?: ToolCall[];
    toolCallId?: string;
    metadata?: {
        model?: string;
        usage?: {
            promptTokens: number;
            completionTokens: number;
            totalTokens: number;
        };
    };
}

export interface ToolCall {
    id: string;
    type: 'function';
    function: {
        name: string;
        arguments: string;
    };
}

export interface ChatDelta {
    type: 'content' | 'done' | 'error' | 'tool_result' | 'tool_calls';
    content?: string;
    error?: string;
    tool_calls?: any[];
}

export interface ChatState {
    messages: ChatMessage[];
    isLoading: boolean;
    isStreaming: boolean;
    error: string | null;
    sessionId: string | null;
    isOpen: boolean;
    needsNewAssistantMessage?: boolean;
    currentStreamingMessageId?: string;
}

export interface ChatRequest {
    messages: Array<{
        role: string;
        content: string;
        tool_calls?: ToolCall[];
        tool_call_id?: string;
    }>;
    context?: string;
    stream: boolean;
    model: string;
}
