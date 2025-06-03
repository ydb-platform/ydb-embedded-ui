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
    type: 'content' | 'tool_call' | 'tool_executing' | 'tool_result' | 'tool_error' | 'done' | 'error';
    content?: string;
    tool_calls?: ToolCall[];
    tool_name?: string;
    tool_id?: string;
    result?: any;
    error?: string;
}

export interface ChatCompletionRequest {
    messages: Array<{
        role: string;
        content: string;
        tool_calls?: ToolCall[];
        tool_call_id?: string;
    }>;
    stream?: boolean;
    model?: string;
    temperature?: number;
    max_tokens?: number;
}

export interface ChatCompletionResponse {
    id: string;
    object: string;
    created: number;
    model: string;
    choices: Array<{
        index: number;
        message: ChatMessage;
        finish_reason: string;
    }>;
    usage?: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
    };
}

export interface StreamingChatResponse {
    id: string;
    object: string;
    created: number;
    model: string;
    choices: Array<{
        index: number;
        delta: {
            role?: string;
            content?: string;
            tool_calls?: ToolCall[];
        };
        finish_reason?: string;
    }>;
}

export interface ChatSession {
    id: string;
    userId?: string | undefined;
    messages: ChatMessage[];
    createdAt: number;
    updatedAt: number;
    metadata: Record<string, any>;
}

export interface ChatCompletionOptions {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    stream?: boolean;
}